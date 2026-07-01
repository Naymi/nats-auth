import { NodeFileSystem } from './certificates/adapters/filesystem.js';
import { NodeOpenSSL } from './certificates/adapters/openssl.js';
import { AgentRegistry } from './agent/registry.js';
import { CertificateAuthority } from './certificates/authority.js';
import { NATSConfigBuilder } from './config/builder.js';
import { NATSProcessRunner } from './process/runner.js';
import { NATSContextManager } from './nats/context-manager.js';
import { NATSCLIProxy } from './nats/cli-proxy.js';
import type { FileSystemAdapter } from './certificates/adapters/filesystem.js';
import type { OpenSSLAdapter } from './certificates/adapters/openssl.js';

export class Container {
  private static instance: Container | null = null;

  readonly fileSystem: FileSystemAdapter;
  readonly openssl: OpenSSLAdapter;
  readonly agentRegistry: AgentRegistry;
  readonly certificateAuthority: CertificateAuthority;
  readonly configBuilder: NATSConfigBuilder;
  readonly processRunner: NATSProcessRunner;
  readonly contextManager: NATSContextManager;
  readonly cliProxy: NATSCLIProxy;

  private constructor() {
    this.fileSystem = new NodeFileSystem();
    this.openssl = new NodeOpenSSL();
    this.agentRegistry = new AgentRegistry(this.fileSystem);
    this.certificateAuthority = new CertificateAuthority(this.openssl, this.fileSystem);
    this.configBuilder = new NATSConfigBuilder();
    this.processRunner = new NATSProcessRunner();
    this.contextManager = new NATSContextManager();
    this.cliProxy = new NATSCLIProxy();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  static createTestContainer(overrides: Partial<Container> = {}): Container {
    const container = new Container();
    Object.assign(container, overrides);
    return container;
  }

  static resetInstance(): void {
    Container.instance = null;
  }
}
