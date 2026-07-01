import path from 'node:path';
import { existsSync } from 'node:fs';
import { Container } from '../../core/container.js';
import { CONFIG_DIR } from '../../shared/paths.js';

export interface ServerNatsOptions {
  args: string[];
}

export async function executeServerNats(options: ServerNatsOptions): Promise<void> {
  const { args } = options;
  const container = Container.getInstance();

  // Check if server config exists
  const configPath = path.join(CONFIG_DIR, 'main.conf');
  if (!existsSync(configPath)) {
    throw new Error('Main server not initialized. Run server:init first.');
  }

  // Check if NATS CLI is available
  const available = await container.cliProxy.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  // Main server uses port 4222 without TLS for client connections
  const url = 'nats://127.0.0.1:4222';

  // Execute without TLS credentials (server doesn't require them for client port)
  await container.cliProxy.executeCommand(args, {
    server: url,
  });
}
