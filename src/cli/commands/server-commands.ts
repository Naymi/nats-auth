import type { Command } from 'commander';
import { Container } from '../../core/container.js';
import { generateServerConfig } from '../../commands/server/generate-config.js';
import { startServer } from '../../commands/server/start.js';
import { ensureDir } from '../../shared/fs.js';
import { CERTS_DIR, CONFIG_DIR } from '../../shared/paths.js';

export function registerServerCommands(program: Command): void {
  program
    .command('server:init')
    .description('Generate Root CA, main server certificate and configuration')
    .action(async () => {
      const container = Container.getInstance();
      const available = await container.openssl.checkAvailable();
      if (!available) {
        console.error('❌ OpenSSL not found in PATH');
        console.error('Please install OpenSSL and ensure it is in your PATH');
        process.exit(1);
      }

      await ensureDir(CERTS_DIR);
      await ensureDir(CONFIG_DIR);

      console.log('🚀 Generating main server components...\n');

      const rootCA = await container.certificateAuthority.issueRootCA({ certsDir: CERTS_DIR });
      await container.certificateAuthority.issueServerCert(rootCA, { certsDir: CERTS_DIR });
      await generateServerConfig(CERTS_DIR, CONFIG_DIR);

      console.log('\n✨ Main server setup complete!');
    });

  program
    .command('server:start')
    .description('Start the main NATS server')
    .option('-D, --debug', 'Enable debug logging', false)
    .option('-V, --trace', 'Enable trace logging', false)
    .action(async (options: { debug?: boolean; trace?: boolean }) => {
      await startServer(options);
    });
}
