import { join } from 'path';
import { executeOpenSSL } from '../../utils/openssl.js';

export function generateRootCA(certsDir: string): void {
  console.log('🔐 Generating Root CA...');

  const rootKeyPath = join(certsDir, 'rootCA.key');
  const rootCertPath = join(certsDir, 'rootCA.crt');

  executeOpenSSL(
    `openssl genrsa -out ${rootKeyPath} 4096`,
    'generate Root CA private key'
  );

  executeOpenSSL(
    `openssl req -x509 -new -nodes -key ${rootKeyPath} -sha256 -days 3650 ` +
    `-out ${rootCertPath} -subj "/C=US/ST=State/L=City/O=Organization/CN=Root CA"`,
    'generate Root CA certificate'
  );

  console.log('✅ Root CA generated');
}
