import { execSync } from 'child_process';
import { writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { hostname } from 'os';

export async function generateLeafCertificate(certsDir: string): Promise<void> {
  console.log('🔐 Generating Leaf Node certificate...');

  const leafKeyPath = join(certsDir, 'leaf.key');
  const leafCsrPath = join(certsDir, 'leaf.csr');
  const leafCertPath = join(certsDir, 'leaf.crt');
  const rootKeyPath = join(certsDir, 'rootCA.key');
  const rootCertPath = join(certsDir, 'rootCA.crt');
  const extFilePath = join(certsDir, 'leaf.ext');

  try {
    await access(rootKeyPath, constants.F_OK);
    await access(rootCertPath, constants.F_OK);
  } catch {
    console.error('❌ Error: Root CA not found. Run "gen:main" command first.');
    process.exit(1);
  }

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

  execSync(`openssl genrsa -out ${leafKeyPath} 4096`, { stdio: 'inherit' });
  execSync(
    `openssl req -new -key ${leafKeyPath} -out ${leafCsrPath} ` +
    `-subj "/C=US/ST=State/L=City/O=Organization/CN=leaf-node"`,
    { stdio: 'inherit' }
  );
  execSync(
    `openssl x509 -req -in ${leafCsrPath} -CA ${rootCertPath} -CAkey ${rootKeyPath} ` +
    `-CAcreateserial -out ${leafCertPath} -days 825 -sha256 -extfile ${extFilePath}`,
    { stdio: 'inherit' }
  );

  console.log('✅ Leaf Node certificate generated');
}
