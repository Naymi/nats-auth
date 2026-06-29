import { access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { generateCertificateFromCA } from '../../utils/certificate.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

export async function generateAgentCertificate(
  rootCertsDir: string,
  agentCertsDir: string,
  name: string = 'agent'
): Promise<void> {
  console.log(`🔐 Generating certificate for agent: ${name}...`);

  const rootKeyPath = join(rootCertsDir, 'rootCA.key');
  const rootCertPath = join(rootCertsDir, 'rootCA.crt');

  try {
    await access(rootKeyPath, constants.F_OK);
    await access(rootCertPath, constants.F_OK);
  } catch {
    console.error('❌ Error: Root CA not found. Run "gen:main" command first.');
    process.exit(1);
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
