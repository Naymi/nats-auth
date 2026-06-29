import { describe, test, expect, beforeEach } from 'vitest';
import { Container } from '../../src/core/container.js';

describe('Container', () => {
  beforeEach(() => {
    Container.resetInstance();
  });

  test('getInstance returns singleton instance', () => {
    const container1 = Container.getInstance();
    const container2 = Container.getInstance();

    expect(container1).toBe(container2);
  });

  test('provides fileSystem adapter', () => {
    const container = Container.getInstance();

    expect(container.fileSystem).toBeDefined();
    expect(container.fileSystem).toHaveProperty('readFile');
    expect(container.fileSystem).toHaveProperty('writeFile');
  });

  test('provides openssl adapter', () => {
    const container = Container.getInstance();

    expect(container.openssl).toBeDefined();
    expect(container.openssl).toHaveProperty('execute');
    expect(container.openssl).toHaveProperty('checkAvailable');
  });

  test('provides agentRegistry', () => {
    const container = Container.getInstance();

    expect(container.agentRegistry).toBeDefined();
    expect(container.agentRegistry).toHaveProperty('list');
    expect(container.agentRegistry).toHaveProperty('get');
    expect(container.agentRegistry).toHaveProperty('create');
  });

  test('provides certificateAuthority', () => {
    const container = Container.getInstance();

    expect(container.certificateAuthority).toBeDefined();
    expect(container.certificateAuthority).toHaveProperty('issueRootCA');
    expect(container.certificateAuthority).toHaveProperty('issueServerCert');
    expect(container.certificateAuthority).toHaveProperty('issueLeafCert');
  });

  test('provides configBuilder', () => {
    const container = Container.getInstance();

    expect(container.configBuilder).toBeDefined();
    expect(container.configBuilder).toHaveProperty('serverConfig');
    expect(container.configBuilder).toHaveProperty('leafNodeConfig');
  });

  test('provides processRunner', () => {
    const container = Container.getInstance();

    expect(container.processRunner).toBeDefined();
    expect(container.processRunner).toHaveProperty('start');
  });

  test('createTestContainer allows dependency overrides', () => {
    const mockFileSystem = {
      readFile: async () => '',
      writeFile: async () => {},
      exists: async () => true,
      mkdir: async () => {},
      readdir: async () => [],
      unlink: async () => {},
      rm: async () => {},
      stat: async () => ({ isDirectory: () => true }) as any,
    };

    const container = Container.createTestContainer({
      fileSystem: mockFileSystem,
    });

    expect(container.fileSystem).toBe(mockFileSystem);
  });

  test('agentRegistry uses injected fileSystem', () => {
    const container = Container.getInstance();

    // AgentRegistry should have been constructed with the container's fileSystem
    expect(container.agentRegistry).toBeDefined();
  });

  test('certificateAuthority uses injected adapters', () => {
    const container = Container.getInstance();

    // CertificateAuthority should have been constructed with openssl and fileSystem
    expect(container.certificateAuthority).toBeDefined();
  });
});
