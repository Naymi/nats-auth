import path from 'node:path';
import { existsSync } from 'node:fs';
import { Container } from '../../core/container.js';
import { CERTS_DIR, CONFIG_DIR } from '../../shared/paths.js';

export async function createServerContext(): Promise<void> {
  const container = Container.getInstance();

  // Check if server config exists
  const configPath = path.join(CONFIG_DIR, 'main.conf');
  if (!existsSync(configPath)) {
    throw new Error('Main server not initialized. Run server:init first.');
  }

  // Check if server certificates exist
  const certPath = path.join(CERTS_DIR, 'main.crt');
  const keyPath = path.join(CERTS_DIR, 'main.key');
  const caPath = path.join(CERTS_DIR, 'rootCA.crt');

  if (!existsSync(certPath) || !existsSync(keyPath) || !existsSync(caPath)) {
    throw new Error('Server certificates not found. Run server:init first.');
  }

  // Check if NATS CLI is available
  const available = await container.contextManager.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  const contextName = 'nats-auth-server';
  const url = 'nats://127.0.0.1:4222';

  console.log('🔧 Creating NATS context for main server');
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
    description: 'Context for main NATS server',
  });

  console.log(`✨ Context '${contextName}' created successfully!`);
  console.log(`\nUse it with: nats --context ${contextName} <command>`);
  console.log(`Or select it as default: yarn cli context:select ${contextName}`);
}
