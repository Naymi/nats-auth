import { describe, it, expect, beforeEach, vi } from 'vitest';

import { FileSystemAdapter, FileStats } from '../../../src/core/certificates/adapters/filesystem.js';
import { AgentRegistry } from '../../../src/core/agent/registry.js';

// Mock the paths module to use test paths
vi.mock('../../../src/core/agent/paths.js', () => {
  const testAgentsDir = '/test/agents';
  return {
    getAgentDir: (name: string) => `${testAgentsDir}/${name}`,
    getAgentCertsDir: (name: string) => `${testAgentsDir}/${name}/certs`,
    getAgentConfigDir: (name: string) => `${testAgentsDir}/${name}/config`,
    getAgentJetStreamDir: (name: string) => `${testAgentsDir}/${name}/jetstream`,
  };
});

// Mock CERTS_DIR
vi.mock('../../../src/shared/paths.js', () => ({
  CERTS_DIR: '/test/certs',
  CONFIG_DIR: '/test/config',
  AGENTS_DIR: '/test/agents',
}));

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
    if (!this.directories.has(path)) {
      throw new Error(`ENOENT: no such file or directory, scandir '${path}'`);
    }

    const entries: string[] = [];
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

    for (const dir of this.directories) {
      if (dir.startsWith(normalizedPath + '/') && dir !== normalizedPath) {
        const relative = dir.slice(normalizedPath.length + 1);
        const firstSegment = relative.split('/')[0];
        if (firstSegment && !entries.includes(firstSegment)) {
          entries.push(firstSegment);
        }
      }
    }

    for (const file of this.files.keys()) {
      if (file.startsWith(normalizedPath + '/')) {
        const relative = file.slice(normalizedPath.length + 1);
        const firstSegment = relative.split('/')[0];
        if (firstSegment && !entries.includes(firstSegment)) {
          entries.push(firstSegment);
        }
      }
    }

    return entries;
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

    // Remove all subdirectories
    const dirsToRemove: string[] = [];
    for (const dir of this.directories) {
      if (dir.startsWith(path + '/')) {
        dirsToRemove.push(dir);
      }
    }
    for (const dir of dirsToRemove) {
      this.directories.delete(dir);
    }

    // Remove all files in the directory
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
    // Move directory
    if (this.directories.has(from)) {
      this.directories.delete(from);
      this.directories.add(to);

      // Move all subdirectories
      const dirsToMove: Array<[string, string]> = [];
      for (const dir of this.directories) {
        if (dir.startsWith(from + '/')) {
          const newPath = to + dir.slice(from.length);
          dirsToMove.push([dir, newPath]);
        }
      }
      for (const [oldPath, newPath] of dirsToMove) {
        this.directories.delete(oldPath);
        this.directories.add(newPath);
      }

      // Move all files in the directory
      const filesToMove: Array<[string, string]> = [];
      for (const [filePath, content] of this.files.entries()) {
        if (filePath.startsWith(from + '/')) {
          const newPath = to + filePath.slice(from.length);
          filesToMove.push([filePath, newPath]);
        }
      }
      for (const [oldPath, newPath] of filesToMove) {
        const content = this.files.get(oldPath);
        if (content !== undefined) {
          this.files.delete(oldPath);
          this.files.set(newPath, content);
        }
      }
    }
  }

  // Test helpers
  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  setDirectory(path: string): void {
    this.directories.add(path);
  }

  clear(): void {
    this.files.clear();
    this.directories.clear();
  }
}

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let mockFs: MockFileSystem;

  beforeEach(() => {
    mockFs = new MockFileSystem();
    registry = new AgentRegistry(mockFs);

    // Set up base directories
    mockFs.setDirectory('/test/agents');
    mockFs.setDirectory('/test/certs');
    mockFs.setFile('/test/certs/rootCA.crt', 'root ca cert');
    mockFs.setFile('/test/certs/rootCA.key', 'root ca key');
  });

  describe('list', () => {
    it('should return empty array when no agents exist', async () => {
      const agents = await registry.list();
      expect(agents).toEqual([]);
    });

    it('should list agents with certificate and config status', async () => {
      // Create agent1 with both cert and config
      mockFs.setDirectory('/test/agents/agent1');
      mockFs.setDirectory('/test/agents/agent1/certs');
      mockFs.setDirectory('/test/agents/agent1/config');
      mockFs.setFile('/test/agents/agent1/certs/agent1.crt', 'cert');
      mockFs.setFile('/test/agents/agent1/certs/agent1.key', 'key');
      mockFs.setFile('/test/agents/agent1/config/agent1.conf', 'config');

      // Create agent2 with only cert
      mockFs.setDirectory('/test/agents/agent2');
      mockFs.setDirectory('/test/agents/agent2/certs');
      mockFs.setFile('/test/agents/agent2/certs/agent2.crt', 'cert');
      mockFs.setFile('/test/agents/agent2/certs/agent2.key', 'key');

      const agents = await registry.list();

      expect(agents).toHaveLength(2);
      expect(agents[0].name).toBe('agent1');
      expect(agents[0].hasCertificate).toBe(true);
      expect(agents[0].hasConfig).toBe(true);
      expect(agents[1].name).toBe('agent2');
      expect(agents[1].hasCertificate).toBe(true);
      expect(agents[1].hasConfig).toBe(false);
    });

    it('should handle agents with missing certificates', async () => {
      mockFs.setDirectory('/test/agents/agent1');
      mockFs.setDirectory('/test/agents/agent1/config');
      mockFs.setFile('/test/agents/agent1/config/agent1.conf', 'config');

      const agents = await registry.list();

      expect(agents).toHaveLength(1);
      expect(agents[0].hasCertificate).toBe(false);
      expect(agents[0].hasConfig).toBe(true);
    });

    it('should sort agents by name', async () => {
      mockFs.setDirectory('/test/agents/zebra');
      mockFs.setDirectory('/test/agents/alpha');
      mockFs.setDirectory('/test/agents/beta');

      const agents = await registry.list();

      expect(agents.map((a) => a.name)).toEqual(['alpha', 'beta', 'zebra']);
    });
  });

  describe('get', () => {
    it('should return null for non-existent agent', async () => {
      const details = await registry.get('non-existent');
      expect(details).toBeNull();
    });

    it('should parse config and extract port/host/storeDir', async () => {
      mockFs.setDirectory('/test/agents/agent1');
      mockFs.setDirectory('/test/agents/agent1/config');
      mockFs.setFile(
        '/test/agents/agent1/config/agent1.conf',
        `port: 4223
host: 127.0.0.1
jetstream {
  store_dir: "/test/jetstream"
}`
      );

      const details = await registry.get('agent1');

      expect(details).not.toBeNull();
      expect(details?.port).toBe(4223);
      expect(details?.host).toBe('127.0.0.1');
      expect(details?.storeDir).toBe('/test/jetstream');
    });

    it('should return agent details with certificates', async () => {
      mockFs.setDirectory('/test/agents/agent1');
      mockFs.setDirectory('/test/agents/agent1/certs');
      mockFs.setFile('/test/agents/agent1/certs/agent1.crt', 'cert content');
      mockFs.setFile('/test/agents/agent1/certs/agent1.key', 'key content');

      const details = await registry.get('agent1');

      expect(details).not.toBeNull();
      expect(details?.hasCertificate).toBe(true);
      expect(details?.certPath).toContain('agent1.crt');
    });
  });

  describe('exists', () => {
    it('should return false for non-existent agent', async () => {
      const exists = await registry.exists('non-existent');
      expect(exists).toBe(false);
    });

    it('should return true for existing agent', async () => {
      mockFs.setDirectory('/test/agents/agent1');

      const exists = await registry.exists('agent1');
      expect(exists).toBe(true);
    });
  });

  describe('checkPortConflict', () => {
    beforeEach(() => {
      // Set up agent1 with port 4223
      mockFs.setDirectory('/test/agents/agent1');
      mockFs.setDirectory('/test/agents/agent1/config');
      mockFs.setFile('/test/agents/agent1/config/agent1.conf', 'port: 4223\nhost: 127.0.0.1');
    });

    it('should throw when port is already in use', async () => {
      await expect(registry.checkPortConflict(4223)).rejects.toThrow(
        "Port 4223 is already used by agent 'agent1'"
      );
    });

    it('should allow port when not in use', async () => {
      await expect(registry.checkPortConflict(5000)).resolves.not.toThrow();
    });

    it('should exclude specified agent from check', async () => {
      await expect(registry.checkPortConflict(4223, 'agent1')).resolves.not.toThrow();
    });

    it('should check multiple agents', async () => {
      // Set up agent2 with port 4224
      mockFs.setDirectory('/test/agents/agent2');
      mockFs.setDirectory('/test/agents/agent2/config');
      mockFs.setFile('/test/agents/agent2/config/agent2.conf', 'port: 4224\nhost: 127.0.0.1');

      await expect(registry.checkPortConflict(4223)).rejects.toThrow();
      await expect(registry.checkPortConflict(4224)).rejects.toThrow();
      await expect(registry.checkPortConflict(5000)).resolves.not.toThrow();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockFs.setDirectory('/test/agents/agent1');
      mockFs.setDirectory('/test/agents/agent1/config');
      mockFs.setFile(
        '/test/agents/agent1/config/agent1.conf',
        'port: 4223\nhost: 127.0.0.1\nleafnodes {\n  remotes = [\n    {\n      url: "tls://localhost:7422"\n    }\n  ]\n}'
      );
    });

    it('should throw if agent config does not exist', async () => {
      await expect(registry.update('non-existent', { port: 5000 })).rejects.toThrow(
        "Configuration for agent 'non-existent' not found"
      );
    });

    it('should update port in config', async () => {
      await registry.update('agent1', { port: 5000 });

      const config = await mockFs.readFile('/test/agents/agent1/config/agent1.conf');
      expect(config).toContain('port: 5000');
      expect(config).not.toContain('port: 4223');
    });

    it('should update host in config', async () => {
      await registry.update('agent1', { host: '0.0.0.0' });

      const config = await mockFs.readFile('/test/agents/agent1/config/agent1.conf');
      expect(config).toContain('host: 0.0.0.0');
      expect(config).not.toContain('host: 127.0.0.1');
    });

    it('should update remote URL in config', async () => {
      await registry.update('agent1', { remoteUrl: 'tls://remote:7422' });

      const config = await mockFs.readFile('/test/agents/agent1/config/agent1.conf');
      expect(config).toContain('url: "tls://remote:7422"');
      expect(config).not.toContain('url: "tls://localhost:7422"');
    });

    it('should detect port conflicts when changing port', async () => {
      // Set up agent2 with port 4224
      mockFs.setDirectory('/test/agents/agent2');
      mockFs.setDirectory('/test/agents/agent2/config');
      mockFs.setFile('/test/agents/agent2/config/agent2.conf', 'port: 4224\nhost: 127.0.0.1');

      await expect(registry.update('agent1', { port: 4224 })).rejects.toThrow(
        "Port 4224 is already used by agent 'agent2'"
      );
    });

    it('should preserve other config values', async () => {
      const originalConfig = await mockFs.readFile('/test/agents/agent1/config/agent1.conf');

      await registry.update('agent1', { port: 5000 });

      const updatedConfig = await mockFs.readFile('/test/agents/agent1/config/agent1.conf');
      expect(updatedConfig).toContain('port: 5000');
      expect(updatedConfig).toContain('leafnodes');
      expect(updatedConfig).toContain('tls://localhost:7422');
    });
  });

  describe('delete', () => {
    it('should remove agent directory', async () => {
      mockFs.setDirectory('/test/agents/agent1');
      mockFs.setFile('/test/agents/agent1/config/agent1.conf', 'config');

      await registry.delete('agent1');

      const exists = await mockFs.exists('/test/agents/agent1');
      expect(exists).toBe(false);
    });
  });
});
