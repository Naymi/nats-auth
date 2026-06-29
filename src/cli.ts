#!/usr/bin/env node
import { Command } from 'commander';
import { generateRootCA } from './features/ca/generate-root-ca.js';
import { generateServerCertificate } from './features/server/generate-certificate.js';
import { generateServerConfig } from './features/server/generate-config.js';
import { generateLeafCertificate } from './features/agent/generate-certificate.js';
import { generateAgentConfig } from './features/agent/generate-config.js';
import { listAgents } from './features/agent/list-agents.js';
import { createAgent } from './features/agent/create-agent.js';
import { getAgentInfo } from './features/agent/get-agent-info.js';
import { editAgentConfig } from './features/agent/edit-agent.js';
import { ensureDir, removeDir } from './utils/fs.js';
import { CERTS_DIR, CONFIG_DIR, AGENTS_DIR } from './utils/paths.js';
import { checkOpenSSLAvailable } from './utils/openssl.js';
import { ZodError } from 'zod';

function handleError(error: unknown): void {
  if (error instanceof ZodError) {
    console.error('❌ Validation error:');
    error.issues.forEach((issue) => {
      console.error(`   ${issue.message}`);
    });
    process.exit(1);
  } else if (error instanceof Error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
  throw error;
}

const program = new Command();

program
  .name('nats-auth')
  .description('NATS TLS certificate and configuration generator')
  .version('1.0.0');

program
  .command('init')
  .description('Generate all certificates and configurations (main + default agent)')
  .action(async () => {
    checkOpenSSLAvailable();

    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    console.log('🚀 Starting full setup...\n');

    generateRootCA(CERTS_DIR);
    await generateServerCertificate(CERTS_DIR);
    await generateServerConfig(CERTS_DIR, CONFIG_DIR);

    // Create default agent using new structure
    await createAgent({ name: 'agent', port: 4223, host: '127.0.0.1' });

    console.log('\n✨ Setup complete! You can now start the servers:');
    console.log('  Main server: nats-server -c config/main.conf');
    console.log('  Default agent: nats-server -c agents/agent/config/agent.conf');
  });

program
  .command('server:init')
  .description('Generate Root CA, main server certificate and configuration')
  .action(async () => {
    checkOpenSSLAvailable();

    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    console.log('🚀 Generating main server components...\n');

    generateRootCA(CERTS_DIR);
    await generateServerCertificate(CERTS_DIR);
    await generateServerConfig(CERTS_DIR, CONFIG_DIR);

    console.log('\n✨ Main server setup complete!');
  });

program
  .command('agent:init')
  .description('Generate default agent (leaf node) certificate and configuration')
  .action(async () => {
    checkOpenSSLAvailable();

    console.log('🚀 Generating default agent...\n');

    await createAgent({ name: 'agent', port: 4223, host: '127.0.0.1' });

    console.log('\n✨ Agent setup complete!');
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

program
  .command('agent:list')
  .description('List all agents')
  .action(async () => {
    console.log('📋 Listing agents...\n');

    const agents = await listAgents();

    if (agents.length === 0) {
      console.log('No agents found. Create one with: nats-auth agent:create <name>');
      return;
    }

    console.log(`Found ${agents.length} agent(s):\n`);

    for (const agent of agents) {
      const status = agent.hasCertificate && agent.hasConfig ? '✅' : '⚠️';
      console.log(`${status} ${agent.name}`);
      console.log(`   Directory: ${agent.agentDir}`);
      console.log(`   Certificate: ${agent.hasCertificate ? '✓' : '✗'}`);
      console.log(`   Config: ${agent.hasConfig ? '✓' : '✗'}`);
      console.log();
    }
  });

program
  .command('agent:create <name>')
  .description('Create a new agent with certificate and configuration')
  .option('-p, --port <port>', 'Agent port', '4223')
  .option('-h, --host <host>', 'Agent host', '127.0.0.1')
  .action(async (name: string, options) => {
    checkOpenSSLAvailable();

    try {
      await createAgent({
        name,
        port: parseInt(options.port, 10),
        host: options.host,
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('agent:info <name>')
  .description('Get detailed information about an agent')
  .action(async (name: string) => {
    console.log(`📊 Agent information: ${name}\n`);

    const info = await getAgentInfo(name);

    if (!info.hasCertificate && !info.hasConfig) {
      console.log(`❌ Agent '${name}' not found.`);
      return;
    }

    console.log(`Name: ${info.name}`);
    console.log(`Directory: ${info.agentDir}`);
    console.log(`Certificate: ${info.hasCertificate ? '✅' : '❌'}`);
    console.log(`Config: ${info.hasConfig ? '✅' : '❌'}`);

    if (info.port !== undefined) {
      console.log(`Port: ${info.port}`);
    }

    if (info.host !== undefined) {
      console.log(`Host: ${info.host}`);
    }

    if (info.storeDir !== undefined) {
      console.log(`JetStream Store: ${info.storeDir}`);
    }

    if (info.certInfo) {
      console.log(`\nCertificate Details:`);
      console.log(`  Subject: ${info.certInfo.subject}`);
      console.log(`  Issuer: ${info.certInfo.issuer}`);
      console.log(`  Valid From: ${info.certInfo.validFrom}`);
      console.log(`  Valid To: ${info.certInfo.validTo}`);
    }

    if (info.certPath) {
      console.log(`\nCertificate Path: ${info.certPath}`);
    }

    if (info.configPath) {
      console.log(`Config Path: ${info.configPath}`);
    }
  });

program
  .command('agent:edit <name>')
  .description('Edit agent configuration')
  .option('-p, --port <port>', 'Update agent port')
  .option('-h, --host <host>', 'Update agent host')
  .option('-r, --remote-url <url>', 'Update remote server URL')
  .action(async (name: string, options) => {
    const editOptions: any = { name };

    if (options.port) {
      editOptions.port = parseInt(options.port, 10);
    }

    if (options.host) {
      editOptions.host = options.host;
    }

    if (options.remoteUrl) {
      editOptions.remoteUrl = options.remoteUrl;
    }

    if (!options.port && !options.host && !options.remoteUrl) {
      console.log('❌ No options provided. Use --port, --host, or --remote-url');
      process.exit(1);
    }

    try {
      await editAgentConfig(editOptions);
    } catch (error) {
      handleError(error);
    }
  });

program.parse();
