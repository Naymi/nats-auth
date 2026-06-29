import { execSync } from 'node:child_process';

export interface OpenSSLAdapter {
  execute(command: string[], operation: string): Promise<void>;
  checkAvailable(): Promise<boolean>;
}

export class NodeOpenSSL implements OpenSSLAdapter {
  async execute(command: string[], operation: string): Promise<void> {
    try {
      const fullCommand = ['openssl', ...command].join(' ');
      execSync(fullCommand, { stdio: 'pipe' });
    } catch (error) {
      console.error(`❌ OpenSSL error during ${operation}:`);
      if (error instanceof Error) {
        const stderr = (error as Error & { stderr?: Buffer }).stderr?.toString() || error.message;
        console.error(stderr);
      }
      throw new Error(`Failed to ${operation}`);
    }
  }

  async checkAvailable(): Promise<boolean> {
    try {
      execSync('openssl version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}
