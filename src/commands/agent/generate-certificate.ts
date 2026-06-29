import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_CONFIG } from '../../core/config/defaults.js';
import { CertificateAuthority } from '../../core/certificates/authority.js';
import { NodeOpenSSL } from '../../core/certificates/adapters/openssl.js';
import { NodeFileSystem } from '../../core/certificates/adapters/filesystem.js';

export async function generateAgentCertificate(
  rootCertsDir: string,
  agentCertsDir: string,
  name: string = 'agent'
): Promise<void> {
  console.log(`🔐 Generating certificate for agent: ${name}...`);

  const rootKeyPath = path.join(rootCertsDir, 'rootCA.key');
  const rootCertPath = path.join(rootCertsDir, 'rootCA.crt');

  try {
    await access(rootKeyPath, constants.F_OK);
    await access(rootCertPath, constants.F_OK);
  } catch {
    console.error('❌ Error: Root CA not found. Run "gen:main" command first.');
    throw new Error('Root CA not found. Run "gen:main" command first.');
  }

  const { certificate } = DEFAULT_CONFIG;

  const ca = new CertificateAuthority(new NodeOpenSSL(), new NodeFileSystem());
  await ca.issueLeafCert(
    { keyPath: rootKeyPath, certPath: rootCertPath },
    name,
    {
      certsDir: agentCertsDir,
      commonName: name,
      validityDays: certificate.validityDays,
      keySize: certificate.keySize,
      subject: certificate.subject,
    }
  );

  console.log(`✅ Certificate for '${name}' generated`);
}
