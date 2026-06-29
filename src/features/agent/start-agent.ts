import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { AGENTS_DIR } from '../../utils/paths.js';
import { AgentRegistry } from './registry.js';
import { NodeFileSystem } from './adapters/filesystem.js';

export interface StartAgentOptions {
  name: string;
  debug?: boolean;
  trace?: boolean;
}

export async function startAgent(options: StartAgentOptions): Promise<void> {
  const { name, debug = false, trace = false } = options;

  // Verify agent exists
  const registry = new AgentRegistry(new NodeFileSystem());
  const agentDetails = await registry.get(name);

  if (!agentDetails) {
    throw new Error(`Agent '${name}' not found`);
  }

  if (!agentDetails.hasConfig) {
    throw new Error(`Agent '${name}' has no configuration file`);
  }

  if (!agentDetails.hasCertificate) {
    throw new Error(`Agent '${name}' has no certificate`);
  }

  const configPath = join(AGENTS_DIR, name, 'config', `${name}.conf`);

  console.log(`🚀 Starting agent '${name}'...`);
  console.log(`   Config: ${configPath}`);
  console.log(`   Port: ${agentDetails.port}`);
  console.log(`   Host: ${agentDetails.host}`);
  console.log();

  // Build nats-server command arguments
  const args = ['-c', configPath];

  if (debug) {
    args.push('-D');
  }

  if (trace) {
    args.push('-V');
  }

  // Spawn nats-server process
  const natsServer = spawn('nats-server', args, {
    stdio: 'inherit',
    shell: false,
  });

  // Handle process events
  natsServer.on('error', (error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('❌ nats-server not found in PATH');
      console.error('Please install NATS server: https://docs.nats.io/running-a-nats-service/introduction/installation');
      process.exit(1);
    } else {
      console.error(`❌ Error starting agent: ${error.message}`);
      process.exit(1);
    }
  });

  natsServer.on('exit', (code, signal) => {
    if (signal) {
      console.log(`\n⚠️  Agent '${name}' stopped by signal: ${signal}`);
    } else if (code !== 0) {
      console.log(`\n❌ Agent '${name}' exited with code: ${code}`);
      process.exit(code || 1);
    } else {
      console.log(`\n✅ Agent '${name}' stopped gracefully`);
    }
  });

  // Handle termination signals
  const cleanup = () => {
    console.log(`\n⏹️  Stopping agent '${name}'...`);
    natsServer.kill('SIGTERM');
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log(`✅ Agent '${name}' is running. Press Ctrl+C to stop.\n`);
}
