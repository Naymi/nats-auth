import { generateLeafCertificate } from './generate-certificate.js';
import { generateAgentConfig } from './generate-config.js';
import { ensureDir } from '../../utils/fs.js';
import { CERTS_DIR, getAgentDir, getAgentCertsDir, getAgentConfigDir, getAgentJetStreamDir } from '../../utils/paths.js';
import { access } from 'fs/promises';
import { constants } from 'fs';

export interface CreateAgentOptions {
  name: string;
  port?: number;
  host?: string;
}

export async function createAgent(options: CreateAgentOptions): Promise<void> {
  const { name, port = 4223, host = '127.0.0.1' } = options;

  // Check if Root CA exists
  try {
    await access(`${CERTS_DIR}/rootCA.crt`, constants.F_OK);
  } catch {
    console.error('❌ Error: Root CA not found. Generate it first with "gen:main" or "setup" command.');
    process.exit(1);
  }

  const agentDir = getAgentDir(name);
  const agentCertsDir = getAgentCertsDir(name);
  const agentConfigDir = getAgentConfigDir(name);
  const agentJetStreamDir = getAgentJetStreamDir(name);

  await ensureDir(agentDir);
  await ensureDir(agentCertsDir);
  await ensureDir(agentConfigDir);

  console.log(`🔧 Creating agent: ${name}`);
  console.log(`   Directory: ${agentDir}`);
  console.log(`   Port: ${port}`);
  console.log(`   Host: ${host}\n`);

  await generateLeafCertificate(CERTS_DIR, agentCertsDir, name);
  await generateAgentConfig(CERTS_DIR, agentCertsDir, agentConfigDir, agentJetStreamDir, name, port, host);

  console.log(`\n✨ Agent '${name}' created successfully!`);
  console.log(`   Directory: ${agentDir}`);
  console.log(`   Certificate: ${agentCertsDir}/${name}.crt`);
  console.log(`   Config: ${agentConfigDir}/${name}.conf`);
  console.log(`\nStart with: nats-server -c ${agentConfigDir}/${name}.conf`);
}
