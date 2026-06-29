import type { Command } from 'commander';
import { Container } from '../../core/container.js';
import { createAgent } from '../../commands/agent/create.js';
import { generateServerConfig } from '../../commands/server/generate-config.js';
import { ensureDir, removeDir } from '../../shared/fs.js';
import { AGENTS_DIR, CERTS_DIR, CONFIG_DIR } from '../../shared/paths.js';

export function registerInitCommands(program: Command): void {
  program
    .command('init')
    .description('Generate all certificates and configurations (main + default agent)')
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

      console.log('🚀 Starting full setup...\n');

      const rootCA = await container.certificateAuthority.issueRootCA({ certsDir: CERTS_DIR });
      await container.certificateAuthority.issueServerCert(rootCA, { certsDir: CERTS_DIR });
      await generateServerConfig(CERTS_DIR, CONFIG_DIR);

      await createAgent({ name: 'agent', port: 4223, host: '127.0.0.1' });

      console.log('\n✨ Setup complete! You can now start the servers:');
      console.log('  Main server: nats-server -c config/main.conf');
      console.log('  Default agent: nats-server -c agents/agent/config/agent.conf');
    });

  program
    .command('clean')
    .alias('clear')
    .description('Remove all generated certificates, configurations and agents')
    .action(async () => {
      await removeDir(CERTS_DIR);
      console.log('🗑️  Removed certs directory');

      await removeDir(CONFIG_DIR);
      console.log('🗑️  Removed config directory');

      await removeDir(AGENTS_DIR);
      console.log('🗑️  Removed agents directory');

      console.log('✨ Cleanup complete!');
    });
}
