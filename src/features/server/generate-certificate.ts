import { execSync } from 'child_process';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { hostname } from 'os';

export async function generateServerCertificate(certsDir: string): Promise<void> {
  console.log('🔐 Generating Main Server certificate...');

  const mainKeyPath = join(certsDir, 'main.key');
  const mainCsrPath = join(certsDir, 'main.csr');
  const mainCertPath = join(certsDir, 'main.crt');
  const rootKeyPath = join(certsDir, 'rootCA.key');
  const rootCertPath = join(certsDir, 'rootCA.crt');
  const extFilePath = join(certsDir, 'main.ext');

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

  execSync(`openssl genrsa -out ${mainKeyPath} 4096`, { stdio: 'inherit' });
  execSync(
    `openssl req -new -key ${mainKeyPath} -out ${mainCsrPath} ` +
    `-subj "/C=US/ST=State/L=City/O=Organization/CN=main-server"`,
    { stdio: 'inherit' }
  );
  execSync(
    `openssl x509 -req -in ${mainCsrPath} -CA ${rootCertPath} -CAkey ${rootKeyPath} ` +
    `-CAcreateserial -out ${mainCertPath} -days 825 -sha256 -extfile ${extFilePath}`,
    { stdio: 'inherit' }
  );

  console.log('✅ Main Server certificate generated');
}
