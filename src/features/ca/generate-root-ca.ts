import { join } from 'path';
import { executeOpenSSL } from '../../utils/openssl.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

export function generateRootCA(certsDir: string): void {
  console.log('🔐 Generating Root CA...');

  const rootKeyPath = join(certsDir, 'rootCA.key');
  const rootCertPath = join(certsDir, 'rootCA.crt');

  const { rootCA, subject } = DEFAULT_CONFIG.certificate;

  executeOpenSSL(
    `openssl genrsa -out ${rootKeyPath} ${rootCA.keySize}`,
    'generate Root CA private key'
  );

  executeOpenSSL(
    `openssl req -x509 -new -nodes -key ${rootKeyPath} -sha256 -days ${rootCA.validityDays} ` +
      `-out ${rootCertPath} -subj "/C=${subject.country}/ST=${subject.state}/L=${subject.locality}/O=${subject.organization}/CN=Root CA"`,
    'generate Root CA certificate'
  );

  console.log('✅ Root CA generated');
}
