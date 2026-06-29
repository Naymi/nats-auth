import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { CONFIG_DIR } from '../../shared/paths.js';
import { NATSProcessRunner } from '../../core/process/runner.js';

export interface StartServerOptions {
  debug?: boolean;
  trace?: boolean;
}

export async function startServer(options: StartServerOptions = {}): Promise<void> {
  const configPath = join(CONFIG_DIR, 'main.conf');

  if (!existsSync(configPath)) {
    throw new Error(
      'Main server configuration not found. Run "nats-auth server:init" or "nats-auth init" first.'
    );
  }

  const runner = new NATSProcessRunner();
  await runner.start({
    configPath,
    entityName: 'main server',
    entityType: 'server',
    debug: options.debug,
    trace: options.trace,
  });
}
