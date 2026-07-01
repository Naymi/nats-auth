import { spawn } from 'node:child_process';

export interface NATSCLIOptions {
  context?: string;
  server?: string;
  tlsCert?: string;
  tlsKey?: string;
  tlsCA?: string;
}

export class NATSCLIProxy {
  async checkAvailable(): Promise<boolean> {
    try {
      const natsProcess = spawn('nats', ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      return new Promise((resolve) => {
        natsProcess.on('error', () => resolve(false));
        natsProcess.on('exit', (code) => resolve(code === 0));
      });
    } catch {
      return false;
    }
  }

  async executeCommand(args: string[], options: NATSCLIOptions = {}): Promise<void> {
    const available = await this.checkAvailable();
    if (!available) {
      throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
    }

    const finalArgs = [...args];

    // Context mode (for context:* commands)
    if (options.context) {
      finalArgs.unshift('--context', options.context);
    }

    // Direct credentials mode (for agent:nats / server:nats)
    // Add flags at the beginning, before the command
    const flags: string[] = [];

    if (options.tlsCA) {
      flags.push('--tlsca', options.tlsCA);
    }
    if (options.tlsKey) {
      flags.push('--tlskey', options.tlsKey);
    }
    if (options.tlsCert) {
      flags.push('--tlscert', options.tlsCert);
    }
    if (options.server) {
      flags.push('--server', options.server);
    }

    // Prepend flags to the beginning
    finalArgs.unshift(...flags);

    return new Promise((resolve, reject) => {
      const natsProcess = spawn('nats', finalArgs, {
        stdio: 'inherit',
        shell: false,
      });

      natsProcess.on('error', (error) => {
        reject(new Error(`Failed to execute nats command: ${error.message}`));
      });

      natsProcess.on('exit', (code, signal) => {
        if (signal) {
          reject(new Error(`NATS CLI stopped by signal: ${signal}`));
        } else if (code !== 0) {
          reject(new Error(`NATS CLI exited with code: ${code}`));
        } else {
          resolve();
        }
      });
    });
  }
}
