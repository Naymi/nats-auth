import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from '../../../src/commands/server/start.js';
import { Container } from '../../../src/core/container.js';
import { CONFIG_DIR, CERTS_DIR } from '../../../src/shared/paths.js';
import * as fs from '../../../src/shared/fs.js';
import * as generateConfig from '../../../src/commands/server/generate-config.js';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

vi.mock('../../../src/shared/fs.js', () => ({
  ensureDir: vi.fn(),
  removeDir: vi.fn(),
}));

vi.mock('../../../src/commands/server/generate-config.js', () => ({
  generateServerConfig: vi.fn(),
}));

vi.mock('../../../src/core/process/runner.js', () => ({
  NATSProcessRunner: class {
    start = vi.fn();
  },
}));

describe('startServer', () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockEnsureDir = vi.mocked(fs.ensureDir);
  const mockGenerateServerConfig = vi.mocked(generateConfig.generateServerConfig);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should auto-initialize server when config is missing', async () => {
    mockExistsSync.mockReturnValue(false);

    const container = Container.getInstance();
    const mockIssueRootCA = vi.spyOn(container.certificateAuthority, 'issueRootCA').mockResolvedValue({
      keyPath: '/test/rootCA.key',
      certPath: '/test/rootCA.crt',
    });
    const mockIssueServerCert = vi.spyOn(container.certificateAuthority, 'issueServerCert').mockResolvedValue({
      keyPath: '/test/main.key',
      certPath: '/test/main.crt',
    });
    const mockCheckAvailable = vi.spyOn(container.openssl, 'checkAvailable').mockResolvedValue(true);

    await startServer({ debug: false, trace: false });

    expect(mockCheckAvailable).toHaveBeenCalled();
    expect(mockEnsureDir).toHaveBeenCalledWith(CERTS_DIR);
    expect(mockEnsureDir).toHaveBeenCalledWith(CONFIG_DIR);
    expect(mockIssueRootCA).toHaveBeenCalledWith({ certsDir: CERTS_DIR });
    expect(mockIssueServerCert).toHaveBeenCalled();
    expect(mockGenerateServerConfig).toHaveBeenCalledWith(CERTS_DIR, CONFIG_DIR);
  });

  it('should throw error when OpenSSL not available during auto-init', async () => {
    mockExistsSync.mockReturnValue(false);

    const container = Container.getInstance();
    const mockCheckAvailable = vi.spyOn(container.openssl, 'checkAvailable').mockResolvedValue(false);

    await expect(startServer()).rejects.toThrow('OpenSSL not found in PATH');
    expect(mockCheckAvailable).toHaveBeenCalled();
  });

  it('should not auto-initialize when config exists', async () => {
    mockExistsSync.mockReturnValue(true);

    const container = Container.getInstance();
    const mockIssueRootCA = vi.spyOn(container.certificateAuthority, 'issueRootCA');

    await startServer({ debug: false, trace: false });

    expect(mockIssueRootCA).not.toHaveBeenCalled();
    expect(mockEnsureDir).not.toHaveBeenCalled();
  });
});
