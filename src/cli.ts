#!/usr/bin/env node
import { Command } from 'commander';
import { generateRootCA } from './features/ca/generate-root-ca.js';
import { generateServerCertificate } from './features/server/generate-certificate.js';
import { generateServerConfig } from './features/server/generate-config.js';
import { generateLeafCertificate } from './features/agent/generate-certificate.js';
import { generateAgentConfig } from './features/agent/generate-config.js';
import { ensureDir, removeDir } from './utils/fs.js';
import { CERTS_DIR, CONFIG_DIR } from './utils/paths.js';

const program = new Command();

program
  .name('nats-auth')
  .description('NATS TLS certificate and configuration generator')
  .version('1.0.0');

program
  .command('setup')
  .description('Generate all certificates and configurations (main + agent)')
  .action(async () => {
    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    console.log('🚀 Starting full setup...\n');

    generateRootCA(CERTS_DIR);
    await generateServerCertificate(CERTS_DIR);
    await generateServerConfig(CERTS_DIR, CONFIG_DIR);
    await generateLeafCertificate(CERTS_DIR);
    await generateAgentConfig(CERTS_DIR, CONFIG_DIR);

    console.log('\n✨ Setup complete! You can now start the servers:');
    console.log('  yarn start:main');
    console.log('  yarn start:agent');
  });

program
  .command('gen:main')
  .description('Generate Root CA, main server certificate and configuration')
  .action(async () => {
    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    console.log('🚀 Generating main server components...\n');

    generateRootCA(CERTS_DIR);
    await generateServerCertificate(CERTS_DIR);
    await generateServerConfig(CERTS_DIR, CONFIG_DIR);

    console.log('\n✨ Main server setup complete!');
  });

program
  .command('gen:agent')
  .description('Generate leaf node certificate and agent configuration')
  .action(async () => {
    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    console.log('🚀 Generating agent components...\n');

    await generateLeafCertificate(CERTS_DIR);
    await generateAgentConfig(CERTS_DIR, CONFIG_DIR);

    console.log('\n✨ Agent setup complete!');
  });

program
  .command('clean')
  .description('Remove all generated certificates and configurations')
  .action(async () => {
    await removeDir(CERTS_DIR);
    console.log('🗑️  Removed certs directory');

    await removeDir(CONFIG_DIR);
    console.log('🗑️  Removed config directory');

    console.log('✨ Cleanup complete!');
  });

program.parse();
