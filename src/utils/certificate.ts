import { writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { hostname } from 'os';
import { executeOpenSSL } from './openssl.js';

export interface CertificateOptions {
  name: string;
  commonName: string;
  certsDir: string;
  caKeyPath: string;
  caCertPath: string;
  validityDays?: number;
  keySize?: number;
  subject?: {
    country?: string;
    state?: string;
    locality?: string;
    organization?: string;
  };
}

/**
 * Generate a certificate signed by a CA
 * @param options - Certificate generation options
 */
export async function generateCertificateFromCA(options: CertificateOptions): Promise<void> {
  const {
    name,
    commonName,
    certsDir,
    caKeyPath,
    caCertPath,
    validityDays = 825,
    keySize = 4096,
    subject = {
      country: 'US',
      state: 'State',
      locality: 'City',
      organization: 'Organization',
    },
  } = options;

  const keyPath = join(certsDir, `${name}.key`);
  const csrPath = join(certsDir, `${name}.csr`);
  const certPath = join(certsDir, `${name}.crt`);
  const extFilePath = join(certsDir, `${name}.ext`);

  try {
    // Generate SAN extension file
    const hostName = hostname();
    const extContent = `
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = ${hostName}
IP.1 = 127.0.0.1
`;

    await writeFile(extFilePath, extContent);

    // Generate private key
    executeOpenSSL(
      `openssl genrsa -out ${keyPath} ${keySize}`,
      `generate private key for ${name}`
    );

    // Generate CSR
    const subjectString = `/C=${subject.country}/ST=${subject.state}/L=${subject.locality}/O=${subject.organization}/CN=${commonName}`;
    executeOpenSSL(
      `openssl req -new -key ${keyPath} -out ${csrPath} -subj "${subjectString}"`,
      `generate CSR for ${name}`
    );

    // Sign certificate
    executeOpenSSL(
      `openssl x509 -req -in ${csrPath} -CA ${caCertPath} -CAkey ${caKeyPath} ` +
      `-CAcreateserial -out ${certPath} -days ${validityDays} -sha256 -extfile ${extFilePath}`,
      `sign certificate for ${name}`
    );

    console.log(`✅ Certificate for '${name}' generated`);
  } finally {
    // Cleanup temporary files
    try {
      await rm(csrPath);
      await rm(extFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
