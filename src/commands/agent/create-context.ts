import path from 'node:path';
import { Container } from '../../core/container.js';
import { getAgentCertsDir } from '../../core/agent/paths.js';
import { CERTS_DIR } from '../../shared/paths.js';

export interface CreateAgentContextOptions {
  name: string;
}

export async function createAgentContext(options: CreateAgentContextOptions): Promise<void> {
  const { name } = options;
  const container = Container.getInstance();

  // Check if agent exists
  const agentDetails = await container.agentRegistry.get(name);
  if (!agentDetails || !agentDetails.hasCertificate || !agentDetails.hasConfig) {
    throw new Error(`Agent '${name}' not found or incomplete. Create it first with: agent:create ${name}`);
  }

  // Check if NATS CLI is available
  const available = await container.contextManager.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  const contextName = `nats-auth-agent-${name}`;
  const url = `nats://${agentDetails.host || '127.0.0.1'}:${agentDetails.port || 4223}`;

  const certPath = path.join(getAgentCertsDir(name), `${name}.crt`);
  const keyPath = path.join(getAgentCertsDir(name), `${name}.key`);
  const caPath = path.join(CERTS_DIR, 'rootCA.crt');

  console.log(`🔧 Creating NATS context for agent: ${name}`);
  console.log(`   Context name: ${contextName}`);
  console.log(`   URL: ${url}`);
  console.log(`   Certificate: ${certPath}`);
  console.log(`   Key: ${keyPath}`);
  console.log(`   CA: ${caPath}`);
  console.log();

  await container.contextManager.createContext({
    name: contextName,
    url,
    tlsCert: certPath,
    tlsKey: keyPath,
    tlsCA: caPath,
    description: `Context for agent ${name}`,
  });

  console.log(`✨ Context '${contextName}' created successfully!`);
  console.log(`\nUse it with: nats --context ${contextName} <command>`);
  console.log(`Or select it as default: yarn cli context:select ${contextName}`);
}
