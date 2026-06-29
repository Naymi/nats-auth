import { execSync } from 'child_process';
import { join } from 'path';

export function generateRootCA(certsDir: string): void {
  console.log('🔐 Generating Root CA...');

  const rootKeyPath = join(certsDir, 'rootCA.key');
  const rootCertPath = join(certsDir, 'rootCA.crt');

  execSync(`openssl genrsa -out ${rootKeyPath} 4096`, { stdio: 'inherit' });
  execSync(
    `openssl req -x509 -new -nodes -key ${rootKeyPath} -sha256 -days 3650 ` +
    `-out ${rootCertPath} -subj "/C=US/ST=State/L=City/O=Organization/CN=Root CA"`,
    { stdio: 'inherit' }
  );

  console.log('✅ Root CA generated');
}
