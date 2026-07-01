import { hostname } from 'node:os';
import path from 'node:path';

import { FileSystemAdapter } from './adapters/filesystem.js';

import { OpenSSLAdapter } from './adapters/openssl.js';

export interface Subject {
  country?: string;
  state?: string;
  locality?: string;
  organization?: string;
}

export interface CAReference {
  keyPath: string;
  certPath: string;
}

export interface RootCAOptions {
  certsDir: string;
  validityDays?: number;
  keySize?: number;
  subject?: Subject;
}

export interface ServerCertOptions {
  certsDir: string;
  commonName?: string;
  validityDays?: number;
  keySize?: number;
  subject?: Subject;
}

export interface LeafCertOptions {
  certsDir: string;
  commonName?: string;
  validityDays?: number;
  keySize?: number;
  subject?: Subject;
  email?: string;
}

export class CertificateAuthority {
  constructor(
    private openssl: OpenSSLAdapter,
    private fs: FileSystemAdapter
  ) {}

  async issueRootCA(options: RootCAOptions): Promise<CAReference> {
    const {
      certsDir,
      validityDays = 3650,
      keySize = 4096,
      subject = {
        country: 'US',
        state: 'State',
        locality: 'City',
        organization: 'Organization',
      },
    } = options;

    console.log('🔐 Generating Root CA...');

    const rootKeyPath = path.join(certsDir, 'rootCA.key');
    const rootCertPath = path.join(certsDir, 'rootCA.crt');

    // Generate private key
    await this.openssl.execute(
      ['genrsa', '-out', rootKeyPath, keySize.toString()],
      'generate Root CA private key'
    );

    // Generate self-signed certificate
    const subjectString = `/C=${subject.country}/ST=${subject.state}/L=${subject.locality}/O=${subject.organization}/CN=Root CA`;

    await this.openssl.execute(
      [
        'req',
        '-x509',
        '-new',
        '-nodes',
        '-key',
        rootKeyPath,
        '-sha256',
        '-days',
        validityDays.toString(),
        '-out',
        rootCertPath,
        '-subj',
        `"${subjectString}"`,
      ],
      'generate Root CA certificate'
    );

    console.log('✅ Root CA generated');

    return {
      keyPath: rootKeyPath,
      certPath: rootCertPath,
    };
  }

  async issueServerCert(ca: CAReference, options: ServerCertOptions): Promise<void> {
    const {
      certsDir,
      commonName = 'main-server',
      validityDays = 825,
      keySize = 4096,
      subject = {
        country: 'US',
        state: 'State',
        locality: 'City',
        organization: 'Organization',
      },
    } = options;

    console.log('🔐 Generating Main Server certificate...');

    await this.generateCertificateFromCA({
      name: 'main',
      commonName,
      certsDir,
      caKeyPath: ca.keyPath,
      caCertPath: ca.certPath,
      validityDays,
      keySize,
      subject,
    });

    console.log('✅ Main Server certificate generated');
  }

  async issueLeafCert(ca: CAReference, name: string, options: LeafCertOptions): Promise<void> {
    const {
      certsDir,
      commonName = name,
      validityDays = 825,
      keySize = 4096,
      subject = {
        country: 'US',
        state: 'State',
        locality: 'City',
        organization: 'Organization',
      },
      email,
    } = options;

    console.log(`🔐 Generating certificate for agent: ${name}...`);

    await this.generateCertificateFromCA({
      name,
      commonName,
      certsDir,
      caKeyPath: ca.keyPath,
      caCertPath: ca.certPath,
      validityDays,
      keySize,
      subject,
      email,
    });

    console.log(`✅ Certificate for '${name}' generated`);
  }

  private async generateCertificateFromCA(options: {
    name: string;
    commonName: string;
    certsDir: string;
    caKeyPath: string;
    caCertPath: string;
    validityDays: number;
    keySize: number;
    subject: Subject;
    email?: string;
  }): Promise<void> {
    const { name, commonName, certsDir, caKeyPath, caCertPath, validityDays, keySize, subject, email } =
      options;

    const keyPath = path.join(certsDir, `${name}.key`);
    const csrPath = path.join(certsDir, `${name}.csr`);
    const certPath = path.join(certsDir, `${name}.crt`);
    const extFilePath = path.join(certsDir, `${name}.ext`);

    try {
      // Generate SAN extension file with optional email
      const extContent = this.buildSANExtension(email);
      await this.fs.writeFile(extFilePath, extContent);

      // Generate private key
      await this.openssl.execute(
        ['genrsa', '-out', keyPath, keySize.toString()],
        `generate private key for ${name}`
      );

      // Generate CSR
      const subjectString = `/C=${subject.country}/ST=${subject.state}/L=${subject.locality}/O=${subject.organization}/CN=${commonName}`;

      await this.openssl.execute(
        ['req', '-new', '-key', keyPath, '-out', csrPath, '-subj', `\"${subjectString}\"`],
        `generate CSR for ${name}`
      );

      // Sign certificate
      await this.openssl.execute(
        [
          'x509',
          '-req',
          '-in',
          csrPath,
          '-CA',
          caCertPath,
          '-CAkey',
          caKeyPath,
          '-CAcreateserial',
          '-out',
          certPath,
          '-days',
          validityDays.toString(),
          '-sha256',
          '-extfile',
          extFilePath,
        ],
        `sign certificate for ${name}`
      );

      console.log(`✅ Certificate for '${name}' generated`);
    } finally {
      // Cleanup temporary files
      await this.cleanup([csrPath, extFilePath]);
    }
  }

  private buildSANExtension(email?: string): string {
    const hostName = hostname();
    const altNames = [
      'DNS.1 = localhost',
      `DNS.2 = ${hostName}`,
      'IP.1 = 127.0.0.1',
    ];

    if (email) {
      altNames.push(`email.1 = ${email}`);
    }

    return `
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
${altNames.join('\n')}
`;
  }

  private async cleanup(paths: string[]): Promise<void> {
    for (const filePath of paths) {
      try {
        await this.fs.removeDir(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
