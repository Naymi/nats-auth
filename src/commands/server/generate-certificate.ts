import path from 'node:path';

import { DEFAULT_CONFIG } from '../../core/config/defaults.js';
import { CertificateAuthority } from '../../core/certificates/authority.js';
import { NodeOpenSSL } from '../../core/certificates/adapters/openssl.js';
import { NodeFileSystem } from '../../core/certificates/adapters/filesystem.js';

export async function generateServerCertificate(certsDir: string): Promise<void> {
  console.log('🔐 Generating Main Server certificate...');

  const rootKeyPath = path.join(certsDir, 'rootCA.key');
  const rootCertPath = path.join(certsDir, 'rootCA.crt');

  const { certificate } = DEFAULT_CONFIG;

  const ca = new CertificateAuthority(new NodeOpenSSL(), new NodeFileSystem());
  await ca.issueServerCert(
    { keyPath: rootKeyPath, certPath: rootCertPath },
    {
      certsDir,
      commonName: 'main-server',
      validityDays: certificate.validityDays,
      keySize: certificate.keySize,
      subject: certificate.subject,
    }
  );

  console.log('✅ Main Server certificate generated');
}
