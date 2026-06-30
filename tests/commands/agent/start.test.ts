import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startAgent } from '../../../src/commands/agent/start.js';
import { Container } from '../../../src/core/container.js';
import * as createAgentModule from '../../../src/commands/agent/create.js';

vi.mock('../../../src/commands/agent/create.js', () => ({
  createAgent: vi.fn(),
}));

vi.mock('../../../src/core/process/runner.js', () => ({
  NATSProcessRunner: class {
    start = vi.fn();
  },
}));

describe('startAgent', () => {
  const mockCreateAgent = vi.mocked(createAgentModule.createAgent);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should auto-initialize agent when not found', async () => {
    const container = Container.getInstance();
    const mockGet = vi.spyOn(container.agentRegistry, 'get')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        name: 'test-agent',
        port: 4223,
        host: '127.0.0.1',
        remoteUrl: 'tls://localhost:7422',
        hasCertificate: true,
        hasConfig: true,
        certificatePath: '/test/cert',
        configPath: '/test/config',
        jetStreamDir: '/test/jetstream',
      });

    await startAgent({ name: 'test-agent', debug: false, trace: false });

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockCreateAgent).toHaveBeenCalledWith({
      name: 'test-agent',
      port: 4223,
      host: '127.0.0.1',
    });
  });

  it('should auto-initialize agent when missing config', async () => {
    const container = Container.getInstance();
    const mockGet = vi.spyOn(container.agentRegistry, 'get')
      .mockResolvedValueOnce({
        name: 'test-agent',
        port: 4223,
        host: '127.0.0.1',
        remoteUrl: 'tls://localhost:7422',
        hasCertificate: true,
        hasConfig: false,
        certificatePath: '/test/cert',
        configPath: '/test/config',
        jetStreamDir: '/test/jetstream',
      })
      .mockResolvedValueOnce({
        name: 'test-agent',
        port: 4223,
        host: '127.0.0.1',
        remoteUrl: 'tls://localhost:7422',
        hasCertificate: true,
        hasConfig: true,
        certificatePath: '/test/cert',
        configPath: '/test/config',
        jetStreamDir: '/test/jetstream',
      });

    await startAgent({ name: 'test-agent', debug: false, trace: false });

    expect(mockCreateAgent).toHaveBeenCalled();
  });

  it('should auto-initialize agent when missing certificate', async () => {
    const container = Container.getInstance();
    const mockGet = vi.spyOn(container.agentRegistry, 'get')
      .mockResolvedValueOnce({
        name: 'test-agent',
        port: 4223,
        host: '127.0.0.1',
        remoteUrl: 'tls://localhost:7422',
        hasCertificate: false,
        hasConfig: true,
        certificatePath: '/test/cert',
        configPath: '/test/config',
        jetStreamDir: '/test/jetstream',
      })
      .mockResolvedValueOnce({
        name: 'test-agent',
        port: 4223,
        host: '127.0.0.1',
        remoteUrl: 'tls://localhost:7422',
        hasCertificate: true,
        hasConfig: true,
        certificatePath: '/test/cert',
        configPath: '/test/config',
        jetStreamDir: '/test/jetstream',
      });

    await startAgent({ name: 'test-agent', debug: false, trace: false });

    expect(mockCreateAgent).toHaveBeenCalled();
  });

  it('should throw error if agent creation fails', async () => {
    const container = Container.getInstance();
    const mockGet = vi.spyOn(container.agentRegistry, 'get')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(
      startAgent({ name: 'test-agent', debug: false, trace: false })
    ).rejects.toThrow("Failed to create agent 'test-agent'");
  });

  it('should not auto-initialize when agent is complete', async () => {
    const container = Container.getInstance();
    const mockGet = vi.spyOn(container.agentRegistry, 'get').mockResolvedValue({
      name: 'test-agent',
      port: 4223,
      host: '127.0.0.1',
      remoteUrl: 'tls://localhost:7422',
      hasCertificate: true,
      hasConfig: true,
      certificatePath: '/test/cert',
      configPath: '/test/config',
      jetStreamDir: '/test/jetstream',
    });

    await startAgent({ name: 'test-agent', debug: false, trace: false });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });
});
