import { generateAgentCertificate } from './generate-certificate.js';
import { generateAgentConfig } from './generate-config.js';
import { ensureDir } from '../../utils/fs.js';
import { CERTS_DIR, getAgentDir, getAgentCertsDir, getAgentConfigDir, getAgentJetStreamDir } from '../../utils/paths.js';
import { CreateAgentOptionsSchema, checkPortConflict } from '../../utils/validation.js';
import { AgentTransaction } from '../../utils/transaction.js';
import { access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

export interface CreateAgentOptions {
  name: string;
  port?: number;
  host?: string;
}

export async function createAgent(options: CreateAgentOptions): Promise<void> {
  // Validate input options
  const validated = CreateAgentOptionsSchema.parse(options);
  const { name, port, host } = validated;

  // Check if Root CA exists
  try {
    await access(`${CERTS_DIR}/rootCA.crt`, constants.F_OK);
  } catch {
    console.error('❌ Error: Root CA not found. Generate it first with "gen:main" or "setup" command.');
    process.exit(1);
  }

  // Check for port conflicts with existing agents
  await checkPortConflict(port);

  const agentDir = getAgentDir(name);
  const transaction = new AgentTransaction();

  try {
    // Begin transaction - create temporary directory
    const tempDir = await transaction.begin(agentDir);
    const tempCertsDir = join(tempDir, 'certs');
    const tempConfigDir = join(tempDir, 'config');
    const tempJetStreamDir = join(tempDir, 'jetstream');

    await ensureDir(tempCertsDir);
    await ensureDir(tempConfigDir);

    console.log(`🔧 Creating agent: ${name}`);
    console.log(`   Directory: ${agentDir}`);
    console.log(`   Port: ${port}`);
    console.log(`   Host: ${host}\n`);

    // Generate certificates and config in temporary directory
    await generateAgentCertificate(CERTS_DIR, tempCertsDir, name);
    await generateAgentConfig(CERTS_DIR, tempCertsDir, tempConfigDir, tempJetStreamDir, name, port, host);

    // Commit transaction - atomically move to target directory
    await transaction.commit();

    console.log(`\n✨ Agent '${name}' created successfully!`);
    console.log(`   Directory: ${agentDir}`);
    console.log(`   Certificate: ${getAgentCertsDir(name)}/${name}.crt`);
    console.log(`   Config: ${getAgentConfigDir(name)}/${name}.conf`);
    console.log(`\nStart with: nats-server -c ${getAgentConfigDir(name)}/${name}.conf`);
  } catch (error) {
    // Rollback on any error
    await transaction.cleanup();
    throw error;
  }
}
