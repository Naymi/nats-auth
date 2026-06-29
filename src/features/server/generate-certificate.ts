import path from 'node:path';

import { DEFAULT_CONFIG } from '../../config/defaults.js';
import { generateCertificateFromCA } from '../../utils/certificate.js';

export async function generateServerCertificate(certsDir: string): Promise<void> {
  console.log('🔐 Generating Main Server certificate...');

  const rootKeyPath = path.join(certsDir, 'rootCA.key');
  const rootCertPath = path.join(certsDir, 'rootCA.crt');

  const { certificate } = DEFAULT_CONFIG;

  await generateCertificateFromCA({
    name: 'main',
    commonName: 'main-server',
    certsDir,
    caKeyPath: rootKeyPath,
    caCertPath: rootCertPath,
    validityDays: certificate.validityDays,
    keySize: certificate.keySize,
    subject: certificate.subject,
  });

  console.log('✅ Main Server certificate generated');
}
