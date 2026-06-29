import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { spawn as nodeSpawn } from 'node:child_process';

export interface ProcessConfig {
  configPath: string;
  entityName: string;
  entityType: 'server' | 'agent';
  debug?: boolean;
  trace?: boolean;
}

export type SpawnFunction = (
  command: string,
  args: string[],
  options: SpawnOptions
) => ChildProcess;

const defaultSpawn: SpawnFunction = (command, args, options) => {
  return nodeSpawn(command, args, options);
};

export class NATSProcessRunner {
  constructor(private readonly spawnFn: SpawnFunction = defaultSpawn) {}

  async start(config: ProcessConfig): Promise<void> {
    const { configPath, entityName, entityType, debug = false, trace = false } = config;

    console.log(`🚀 Starting ${entityName}...`);
    console.log(`   Config: ${configPath}`);
    console.log();

    const args = ['-c', configPath];

    if (debug) {
      args.push('-D');
    }

    if (trace) {
      args.push('-V');
    }

    const natsServer = this.spawnFn('nats-server', args, {
      stdio: 'inherit',
      shell: false,
    });

    natsServer.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error('❌ nats-server not found in PATH');
        console.error('Please install NATS server: https://docs.nats.io/running-a-nats-service/introduction/installation');
        process.exit(1);
      } else {
        console.error(`❌ Error starting ${entityType}: ${error.message}`);
        process.exit(1);
      }
    });

    natsServer.on('exit', (code, signal) => {
      if (signal) {
        console.log(`\n⚠️  ${this.capitalizeFirst(entityName)} stopped by signal: ${signal}`);
      } else if (code !== 0) {
        console.log(`\n❌ ${this.capitalizeFirst(entityName)} exited with code: ${code}`);
        process.exit(code || 1);
      } else {
        console.log(`\n✅ ${this.capitalizeFirst(entityName)} stopped gracefully`);
      }
    });

    const cleanup = () => {
      console.log(`\n⏹️  Stopping ${entityName}...`);
      natsServer.kill('SIGTERM');
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    console.log(`✅ ${this.capitalizeFirst(entityName)} is running. Press Ctrl+C to stop.\n`);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
