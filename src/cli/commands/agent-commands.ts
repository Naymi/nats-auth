import type { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import { Container } from '../../core/container.js';
import { createAgent } from '../../commands/agent/create.js';
import { deleteAgent } from '../../commands/agent/delete.js';
import { editAgentConfig } from '../../commands/agent/edit.js';
import { getAgentInfo } from '../../commands/agent/info.js';
import { listAgents } from '../../commands/agent/list.js';
import { startAgent } from '../../commands/agent/start.js';

export function registerAgentCommands(program: Command): void {
  program
    .command('agent:init')
    .description('Generate default agent (leaf node) certificate and configuration')
    .option('-d, --domain <domain>', 'JetStream domain')
    .action(async (options: { domain?: string }) => {
      const container = Container.getInstance();
      const available = await container.openssl.checkAvailable();
      if (!available) {
        console.error('❌ OpenSSL not found in PATH');
        console.error('Please install OpenSSL and ensure it is in your PATH');
        process.exit(1);
      }

      console.log('🚀 Generating default agent...\n');

      await createAgent({ name: 'agent', port: 4223, host: '127.0.0.1', domain: options.domain });

      console.log('\n✨ Agent setup complete!');
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
        console.log(`   Certificate: ${agent.hasCertificate ? '✓' : '✗'}`);
        console.log(`   Config: ${agent.hasConfig ? '✓' : '✗'}`);
        if (agent.agentDir) {
          console.log(`   Directory: ${agent.agentDir}`);
        }
        console.log();
      }
    });

  program
    .command('agent:info <name>')
    .description('Get detailed information about an agent')
    .action(async (name: string) => {
      console.log(`📊 Agent information: ${name}\n`);

      const details = await getAgentInfo(name);

      if (!details.hasCertificate && !details.hasConfig) {
        console.log(`❌ Agent '${name}' not found`);
        return;
      }

      console.log(`Name: ${details.name}`);
      console.log(`Certificate: ${details.hasCertificate ? '✓' : '✗'}`);
      console.log(`Config: ${details.hasConfig ? '✓' : '✗'}`);

      if (details.port) console.log(`Port: ${details.port}`);
      if (details.host) console.log(`Host: ${details.host}`);
      if (details.storeDir) console.log(`Store Directory: ${details.storeDir}`);
      if (details.certPath) console.log(`Certificate Path: ${details.certPath}`);
      if (details.configPath) console.log(`Config Path: ${details.configPath}`);

      if (details.certInfo) {
        console.log('\nCertificate Details:');
        console.log(`  Subject: ${details.certInfo.subject}`);
        console.log(`  Issuer: ${details.certInfo.issuer}`);
        console.log(`  Valid From: ${details.certInfo.validFrom}`);
        console.log(`  Valid To: ${details.certInfo.validTo}`);
      }
    });

  program
    .command('agent:create <name>')
    .description('Create a new agent with certificate and configuration')
    .option('-p, --port <port>', 'Agent port', '4223')
    .option('-h, --host <host>', 'Agent host', '127.0.0.1')
    .option('-d, --domain <domain>', 'JetStream domain')
    .option('-r, --replace', 'Replace existing agent if it exists', false)
    .action(async (name: string, options) => {
      const container = Container.getInstance();
      const available = await container.openssl.checkAvailable();
      if (!available) {
        console.error('❌ OpenSSL not found in PATH');
        console.error('Please install OpenSSL and ensure it is in your PATH');
        process.exit(1);
      }

      try {
        let shouldReplace = options.replace;

        if (!shouldReplace) {
          const exists = await container.agentRegistry.exists(name);

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
          port: parseInt(options.port),
          host: options.host,
          domain: options.domain,
          replace: shouldReplace,
        });
      } catch (error) {
        throw error;
      }
    });

  program
    .command('agent:edit <name>')
    .description('Edit agent configuration')
    .option('-p, --port <port>', 'New port number')
    .option('-h, --host <host>', 'New host address')
    .option('-r, --remote-url <url>', 'New remote URL')
    .action(async (name: string, options: { port?: string; host?: string; remoteUrl?: string }) => {
      await editAgentConfig({
        name,
        port: options.port ? parseInt(options.port) : undefined,
        host: options.host,
        remoteUrl: options.remoteUrl,
      });
    });

  program
    .command('agent:start <name>')
    .description('Start an agent')
    .option('-D, --debug', 'Enable debug logging', false)
    .option('-V, --trace', 'Enable trace logging', false)
    .action(async (name: string, options: { debug?: boolean; trace?: boolean }) => {
      await startAgent({ name, ...options });
    });

  program
    .command('agent:delete <name>')
    .description('Delete an agent and all its files')
    .option('-y, --yes', 'Skip confirmation prompt', false)
    .action(async (name: string, options: { yes?: boolean }) => {
      const container = Container.getInstance();
      const exists = await container.agentRegistry.exists(name);

      if (!exists) {
        console.log(`❌ Agent '${name}' does not exist`);
        process.exit(1);
      }

      let shouldDelete = options.yes;

      if (!shouldDelete) {
        shouldDelete = await confirm({
          message: `Are you sure you want to delete agent '${name}'? This will remove all certificates, configuration, and data.`,
          default: false,
        });

        if (!shouldDelete) {
          console.log('❌ Operation cancelled.');
          process.exit(0);
        }
      }

      await deleteAgent({ name });
    });
}
