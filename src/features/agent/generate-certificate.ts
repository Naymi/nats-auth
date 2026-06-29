import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_CONFIG } from '../../config/defaults.js';
import { generateCertificateFromCA } from '../../utils/certificate.js';

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

  await generateCertificateFromCA({
    name,
    commonName: name,
    certsDir: agentCertsDir,
    caKeyPath: rootKeyPath,
    caCertPath: rootCertPath,
    validityDays: certificate.validityDays,
    keySize: certificate.keySize,
    subject: certificate.subject,
  });

  console.log(`✅ Certificate for '${name}' generated`);
}
