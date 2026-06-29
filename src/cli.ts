#!/usr/bin/env node
import { Command } from 'commander';
import { ZodError } from 'zod';
import { confirm } from '@inquirer/prompts';

import { createAgent } from './features/agent/create-agent.js';
import { editAgentConfig } from './features/agent/edit-agent.js';
import { getAgentInfo } from './features/agent/get-agent-info.js';
import { listAgents } from './features/agent/list-agents.js';
import { startAgent } from './features/agent/start-agent.js';
import { NodeFileSystem } from './features/agent/adapters/filesystem.js';
import { AgentRegistry } from './features/agent/registry.js';
import { CertificateAuthority } from './features/certificate-authority/certificate-authority.js';
import { NodeOpenSSL } from './features/certificate-authority/adapters/openssl.js';
import { generateServerConfig } from './features/server/generate-config.js';
import { startServer } from './features/server/start-server.js';
import { ensureDir, removeDir } from './utils/fs.js';
import { AGENTS_DIR, CERTS_DIR, CONFIG_DIR } from './utils/paths.js';

function handleError(error: unknown): void {
  if (error instanceof ZodError) {
    console.error('❌ Validation error:');
    for (const issue of error.issues) {
      console.error(`   ${issue.message}`);
    }
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
    const openssl = new NodeOpenSSL();
    const available = await openssl.checkAvailable();
    if (!available) {
      console.error('❌ OpenSSL not found in PATH');
      console.error('Please install OpenSSL and ensure it is in your PATH');
      process.exit(1);
    }

    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    console.log('🚀 Starting full setup...\n');

    const ca = new CertificateAuthority(openssl, new NodeFileSystem());
    const rootCA = await ca.issueRootCA({ certsDir: CERTS_DIR });
    await ca.issueServerCert(rootCA, { certsDir: CERTS_DIR });
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
    const openssl = new NodeOpenSSL();
    const available = await openssl.checkAvailable();
    if (!available) {
      console.error('❌ OpenSSL not found in PATH');
      console.error('Please install OpenSSL and ensure it is in your PATH');
      process.exit(1);
    }

    await ensureDir(CERTS_DIR);
    await ensureDir(CONFIG_DIR);

    console.log('🚀 Generating main server components...\n');

    const ca = new CertificateAuthority(openssl, new NodeFileSystem());
    const rootCA = await ca.issueRootCA({ certsDir: CERTS_DIR });
    await ca.issueServerCert(rootCA, { certsDir: CERTS_DIR });
    await generateServerConfig(CERTS_DIR, CONFIG_DIR);

    console.log('\n✨ Main server setup complete!');
  });

program
  .command('server:start')
  .description('Start the main NATS server')
  .option('-D, --debug', 'Enable debug logging', false)
  .option('-V, --trace', 'Enable trace logging', false)
  .action(async (options) => {
    try {
      await startServer({
        debug: options.debug,
        trace: options.trace,
      });
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('agent:init')
  .description('Generate default agent (leaf node) certificate and configuration')
  .action(async () => {
    const openssl = new NodeOpenSSL();
    const available = await openssl.checkAvailable();
    if (!available) {
      console.error('❌ OpenSSL not found in PATH');
      console.error('Please install OpenSSL and ensure it is in your PATH');
      process.exit(1);
    }

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
  .option('-r, --replace', 'Replace existing agent if it exists', false)
  .action(async (name: string, options) => {
    const openssl = new NodeOpenSSL();
    const available = await openssl.checkAvailable();
    if (!available) {
      console.error('❌ OpenSSL not found in PATH');
      console.error('Please install OpenSSL and ensure it is in your PATH');
      process.exit(1);
    }

    try {
      let shouldReplace = options.replace;

      // Check if agent exists and prompt user if --replace flag not provided
      if (!shouldReplace) {
        const registry = new AgentRegistry(new NodeFileSystem());
        const exists = await registry.exists(name);

        if (exists) {
          shouldReplace = await confirm({
            message: `Agent '${name}' already exists. Replace it?`,
            default: false,
          });

          if (!shouldReplace) {
            console.log('❌ Operation cancelled.');
            process.exit(0);
          }
        }
      }

      await createAgent({
        name,
        port: Number.parseInt(options.port, 10),
        host: options.host,
        replace: shouldReplace,
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
    const editOptions: {
      name: string;
      port?: number;
      host?: string;
      remoteUrl?: string;
    } = { name };

    if (options.port) {
      editOptions.port = Number.parseInt(options.port, 10);
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

program
  .command('agent:start <name>')
  .description('Start an agent')
  .option('-D, --debug', 'Enable debug logging', false)
  .option('-V, --trace', 'Enable trace logging', false)
  .action(async (name: string, options) => {
    try {
      await startAgent({
        name,
        debug: options.debug,
        trace: options.trace,
      });
    } catch (error) {
      handleError(error);
    }
  });

program.parse();
