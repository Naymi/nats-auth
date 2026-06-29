import { describe, it, expect, beforeEach, vi } from 'vitest';

import { FileSystemAdapter, FileStats } from '../../agent/adapters/filesystem.js';
import { OpenSSLAdapter } from '../adapters/openssl.js';
import { CertificateAuthority } from '../../../src/core/certificates/authority.js';

class MockOpenSSL implements OpenSSLAdapter {
  private commands: Array<{ command: string[]; operation: string }> = [];

  async execute(command: string[], operation: string): Promise<void> {
    this.commands.push({ command, operation });
  }

  async checkAvailable(): Promise<boolean> {
    return true;
  }

  getCommands(): Array<{ command: string[]; operation: string }> {
    return this.commands;
  }

  clear(): void {
    this.commands = [];
  }
}

class MockFileSystem implements FileSystemAdapter {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async readDir(path: string): Promise<string[]> {
    return [];
  }

  async stat(path: string): Promise<FileStats | null> {
    if (this.directories.has(path)) {
      return { isDirectory: true, isFile: false };
    }
    if (this.files.has(path)) {
      return { isDirectory: false, isFile: true };
    }
    return null;
  }

  async exists(path: string): Promise<boolean> {
    return this.directories.has(path) || this.files.has(path);
  }

  async createDir(path: string): Promise<void> {
    this.directories.add(path);
  }

  async removeDir(path: string): Promise<void> {
    this.directories.delete(path);
    const filesToRemove: string[] = [];
    for (const file of this.files.keys()) {
      if (file.startsWith(path + '/') || file === path) {
        filesToRemove.push(file);
      }
    }
    for (const file of filesToRemove) {
      this.files.delete(file);
    }
  }

  async rename(from: string, to: string): Promise<void> {
    // Not used in CA tests
  }

  getFiles(): Map<string, string> {
    return this.files;
  }

  clear(): void {
    this.files.clear();
    this.directories.clear();
  }
}

describe('CertificateAuthority', () => {
  let ca: CertificateAuthority;
  let mockOpenSSL: MockOpenSSL;
  let mockFs: MockFileSystem;

  beforeEach(() => {
    mockOpenSSL = new MockOpenSSL();
    mockFs = new MockFileSystem();
    ca = new CertificateAuthority(mockOpenSSL, mockFs);
  });

  describe('issueRootCA', () => {
    it('should generate root CA key and certificate', async () => {
      const result = await ca.issueRootCA({ certsDir: '/test/certs' });

      expect(result.keyPath).toBe('/test/certs/rootCA.key');
      expect(result.certPath).toBe('/test/certs/rootCA.crt');

      const commands = mockOpenSSL.getCommands();
      expect(commands).toHaveLength(2);

      // Check private key generation
      expect(commands[0].command).toContain('genrsa');
      expect(commands[0].command).toContain('-out');
      expect(commands[0].command).toContain('/test/certs/rootCA.key');
      expect(commands[0].command).toContain('4096');
      expect(commands[0].operation).toBe('generate Root CA private key');

      // Check certificate generation
      expect(commands[1].command).toContain('req');
      expect(commands[1].command).toContain('-x509');
      expect(commands[1].command).toContain('-out');
      expect(commands[1].command).toContain('/test/certs/rootCA.crt');
      expect(commands[1].operation).toBe('generate Root CA certificate');
    });

    it('should use correct validity period and key size', async () => {
      await ca.issueRootCA({
        certsDir: '/test/certs',
        validityDays: 365,
        keySize: 2048,
      });

      const commands = mockOpenSSL.getCommands();

      // Check key size
      expect(commands[0].command).toContain('2048');

      // Check validity days
      expect(commands[1].command).toContain('-days');
      expect(commands[1].command).toContain('365');
    });

    it('should set correct subject fields', async () => {
      await ca.issueRootCA({
        certsDir: '/test/certs',
        subject: {
          country: 'DE',
          state: 'Berlin',
          locality: 'Berlin',
          organization: 'TestOrg',
        },
      });

      const commands = mockOpenSSL.getCommands();
      const subjectCmd = commands[1].command.join(' ');

      expect(subjectCmd).toContain('/C=DE');
      expect(subjectCmd).toContain('/ST=Berlin');
      expect(subjectCmd).toContain('/L=Berlin');
      expect(subjectCmd).toContain('/O=TestOrg');
      expect(subjectCmd).toContain('/CN=Root CA');
    });
  });

  describe('issueServerCert', () => {
    const rootCA = {
      keyPath: '/test/certs/rootCA.key',
      certPath: '/test/certs/rootCA.crt',
    };

    it('should generate server certificate signed by CA', async () => {
      await ca.issueServerCert(rootCA, { certsDir: '/test/certs' });

      const commands = mockOpenSSL.getCommands();
      expect(commands.length).toBeGreaterThanOrEqual(3);

      // Should generate private key
      expect(commands[0].command).toContain('genrsa');
      expect(commands[0].command).toContain('/test/certs/main.key');

      // Should generate CSR
      expect(commands[1].command).toContain('req');
      expect(commands[1].command).toContain('-new');
      expect(commands[1].command).toContain('/test/certs/main.csr');

      // Should sign certificate
      expect(commands[2].command).toContain('x509');
      expect(commands[2].command).toContain('-req');
      expect(commands[2].command).toContain('-CA');
      expect(commands[2].command).toContain(rootCA.certPath);
      expect(commands[2].command).toContain('-CAkey');
      expect(commands[2].command).toContain(rootCA.keyPath);
    });

    it('should include SAN extension file', async () => {
      // Intercept writeFile to capture extension content
      let extFileContent: string | undefined;
      const originalWriteFile = mockFs.writeFile.bind(mockFs);
      mockFs.writeFile = async (path: string, content: string) => {
        if (path.endsWith('.ext')) {
          extFileContent = content;
        }
        return originalWriteFile(path, content);
      };

      await ca.issueServerCert(rootCA, { certsDir: '/test/certs' });

      expect(extFileContent).toBeDefined();
      expect(extFileContent).toContain('subjectAltName');
      expect(extFileContent).toContain('DNS.1 = localhost');
      expect(extFileContent).toContain('IP.1 = 127.0.0.1');
      expect(extFileContent).toContain('extendedKeyUsage = serverAuth, clientAuth');
    });

    it('should cleanup CSR and extension files', async () => {
      await ca.issueServerCert(rootCA, { certsDir: '/test/certs' });

      const files = mockFs.getFiles();

      // Extension and CSR files should be removed after generation
      expect(files.has('/test/certs/main.ext')).toBe(false);
      expect(files.has('/test/certs/main.csr')).toBe(false);
    });

    it('should use custom common name', async () => {
      await ca.issueServerCert(rootCA, {
        certsDir: '/test/certs',
        commonName: 'custom-server',
      });

      const commands = mockOpenSSL.getCommands();
      const csrCmd = commands[1].command.join(' ');

      expect(csrCmd).toContain('/CN=custom-server');
    });
  });

  describe('issueLeafCert', () => {
    const rootCA = {
      keyPath: '/test/certs/rootCA.key',
      certPath: '/test/certs/rootCA.crt',
    };

    it('should generate leaf certificate signed by CA', async () => {
      await ca.issueLeafCert(rootCA, 'agent1', { certsDir: '/test/certs' });

      const commands = mockOpenSSL.getCommands();
      expect(commands.length).toBeGreaterThanOrEqual(3);

      // Check file names use custom name
      expect(commands[0].command.join(' ')).toContain('/test/certs/agent1.key');
      expect(commands[1].command.join(' ')).toContain('/test/certs/agent1.csr');
      expect(commands[2].command.join(' ')).toContain('/test/certs/agent1.crt');
    });

    it('should use custom name for cert files', async () => {
      await ca.issueLeafCert(rootCA, 'my-agent', { certsDir: '/test/certs' });

      const commands = mockOpenSSL.getCommands();
      const keyCmd = commands[0].command.join(' ');

      expect(keyCmd).toContain('my-agent.key');
    });

    it('should use name as common name by default', async () => {
      await ca.issueLeafCert(rootCA, 'agent1', { certsDir: '/test/certs' });

      const commands = mockOpenSSL.getCommands();
      const csrCmd = commands[1].command.join(' ');

      expect(csrCmd).toContain('/CN=agent1');
    });

    it('should allow custom common name', async () => {
      await ca.issueLeafCert(rootCA, 'agent1', {
        certsDir: '/test/certs',
        commonName: 'custom-agent',
      });

      const commands = mockOpenSSL.getCommands();
      const csrCmd = commands[1].command.join(' ');

      expect(csrCmd).toContain('/CN=custom-agent');
    });
  });
});
