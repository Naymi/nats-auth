import { writeFile, access, rm } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { hostname } from 'os';
import { executeOpenSSL } from '../../utils/openssl.js';

export async function generateLeafCertificate(
  rootCertsDir: string,
  agentCertsDir: string,
  name: string = 'leaf'
): Promise<void> {
  console.log(`🔐 Generating certificate for agent: ${name}...`);

  const leafKeyPath = join(agentCertsDir, `${name}.key`);
  const leafCsrPath = join(agentCertsDir, `${name}.csr`);
  const leafCertPath = join(agentCertsDir, `${name}.crt`);
  const rootKeyPath = join(rootCertsDir, 'rootCA.key');
  const rootCertPath = join(rootCertsDir, 'rootCA.crt');
  const extFilePath = join(agentCertsDir, `${name}.ext`);

  try {
    await access(rootKeyPath, constants.F_OK);
    await access(rootCertPath, constants.F_OK);
  } catch {
    console.error('❌ Error: Root CA not found. Run "gen:main" command first.');
    process.exit(1);
  }

  try {
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

    executeOpenSSL(
      `openssl genrsa -out ${leafKeyPath} 4096`,
      `generate private key for agent ${name}`
    );

    executeOpenSSL(
      `openssl req -new -key ${leafKeyPath} -out ${leafCsrPath} ` +
      `-subj "/C=US/ST=State/L=City/O=Organization/CN=${name}"`,
      `generate CSR for agent ${name}`
    );

    executeOpenSSL(
      `openssl x509 -req -in ${leafCsrPath} -CA ${rootCertPath} -CAkey ${rootKeyPath} ` +
      `-CAcreateserial -out ${leafCertPath} -days 825 -sha256 -extfile ${extFilePath}`,
      `sign certificate for agent ${name}`
    );

    console.log(`✅ Certificate for '${name}' generated`);
  } finally {
    // Cleanup temporary files
    try {
      await rm(leafCsrPath);
      await rm(extFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
