import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { CONFIG_DIR } from '../../utils/paths.js';

export interface StartServerOptions {
  debug?: boolean;
  trace?: boolean;
}

export async function startServer(options: StartServerOptions = {}): Promise<void> {
  const { debug = false, trace = false } = options;

  const configPath = join(CONFIG_DIR, 'main.conf');

  // Verify config exists
  if (!existsSync(configPath)) {
    throw new Error(
      'Main server configuration not found. Run "nats-auth server:init" or "nats-auth init" first.'
    );
  }

  console.log('🚀 Starting main NATS server...');
  console.log(`   Config: ${configPath}`);
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
      console.error(`❌ Error starting server: ${error.message}`);
      process.exit(1);
    }
  });

  natsServer.on('exit', (code, signal) => {
    if (signal) {
      console.log(`\n⚠️  Main server stopped by signal: ${signal}`);
    } else if (code !== 0) {
      console.log(`\n❌ Main server exited with code: ${code}`);
      process.exit(code || 1);
    } else {
      console.log('\n✅ Main server stopped gracefully');
    }
  });

  // Handle termination signals
  const cleanup = () => {
    console.log('\n⏹️  Stopping main server...');
    natsServer.kill('SIGTERM');
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('✅ Main server is running. Press Ctrl+C to stop.\n');
}
