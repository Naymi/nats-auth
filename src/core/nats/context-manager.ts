import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

const execAsync = promisify(exec);

export interface NATSContextConfig {
  name: string;
  url: string;
  tlsCert?: string;
  tlsKey?: string;
  tlsCA?: string;
  description?: string;
}

export interface NATSContext {
  name: string;
  url: string;
  description?: string;
  selected: boolean;
}

export class NATSContextManager {
  async checkAvailable(): Promise<boolean> {
    try {
      await execAsync('nats --version');
      return true;
    } catch {
      return false;
    }
  }

  async createContext(config: NATSContextConfig): Promise<void> {
    const available = await this.checkAvailable();
    if (!available) {
      throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
    }

    const args = [
      'context',
      'add',
      config.name,
      '--server',
      config.url,
    ];

    if (config.tlsCert) {
      args.push('--tlscert', config.tlsCert);
    }

    if (config.tlsKey) {
      args.push('--tlskey', config.tlsKey);
    }

    if (config.tlsCA) {
      args.push('--tlsca', config.tlsCA);
    }

    if (config.description) {
      args.push('--description', config.description);
    }

    return new Promise((resolve, reject) => {
      const natsProcess = spawn('nats', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      let stderr = '';

      natsProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      natsProcess.on('error', (error) => {
        reject(new Error(`Failed to create context: ${error.message}`));
      });

      natsProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create context: ${stderr || `exit code ${code}`}`));
        }
      });
    });
  }

  async selectContext(name: string): Promise<void> {
    const available = await this.checkAvailable();
    if (!available) {
      throw new Error('NATS CLI not found in PATH');
    }

    return new Promise((resolve, reject) => {
      const natsProcess = spawn('nats', ['context', 'select', name], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      let stderr = '';

      natsProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      natsProcess.on('error', (error) => {
        reject(new Error(`Failed to select context: ${error.message}`));
      });

      natsProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to select context: ${stderr || `exit code ${code}`}`));
        }
      });
    });
  }

  async listContexts(): Promise<NATSContext[]> {
    const available = await this.checkAvailable();
    if (!available) {
      throw new Error('NATS CLI not found in PATH');
    }

    try {
      const { stdout } = await execAsync('nats context ls --json');
      const contexts = JSON.parse(stdout);

      if (!Array.isArray(contexts)) {
        return [];
      }

      return contexts.map((ctx: any) => ({
        name: ctx.name || '',
        url: ctx.url || '',
        description: ctx.description,
        selected: ctx.selected || false,
      }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('no contexts defined')) {
        return [];
      }
      throw error;
    }
  }

  async deleteContext(name: string): Promise<void> {
    const available = await this.checkAvailable();
    if (!available) {
      throw new Error('NATS CLI not found in PATH');
    }

    return new Promise((resolve, reject) => {
      const natsProcess = spawn('nats', ['context', 'rm', name, '--force'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      let stderr = '';

      natsProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      natsProcess.on('error', (error) => {
        reject(new Error(`Failed to delete context: ${error.message}`));
      });

      natsProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to delete context: ${stderr || `exit code ${code}`}`));
        }
      });
    });
  }

  async getContext(name: string): Promise<NATSContext | null> {
    const contexts = await this.listContexts();
    return contexts.find(ctx => ctx.name === name) || null;
  }

  async contextExists(name: string): Promise<boolean> {
    const context = await this.getContext(name);
    return context !== null;
  }
}
