import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { CONFIG_DIR, CERTS_DIR } from '../../shared/paths.js';
import { NATSProcessRunner } from '../../core/process/runner.js';
import { Container } from '../../core/container.js';
import { generateServerConfig } from './generate-config.js';
import { ensureDir } from '../../shared/fs.js';

export interface StartServerOptions {
  debug?: boolean;
  trace?: boolean;
}

export async function startServer(options: StartServerOptions = {}): Promise<void> {
  const configPath = join(CONFIG_DIR, 'main.conf');

  if (!existsSync(configPath)) {
    console.log('📦 Server not initialized. Running server:init...\n');

    const container = Container.getInstance();
    const available = await container.openssl.checkAvailable();
    if (!available) {
      throw new Error('OpenSSL not found in PATH. Please install OpenSSL.');
    }

    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    const rootCA = await container.certificateAuthority.issueRootCA({ certsDir: CERTS_DIR });
    await container.certificateAuthority.issueServerCert(rootCA, { certsDir: CERTS_DIR });
    await generateServerConfig(CERTS_DIR, CONFIG_DIR);

    console.log('\n✅ Server initialized successfully!\n');
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
