import { describe, it, expect, beforeEach } from 'vitest';

import { NATSConfigBuilder } from '../nats-config-builder.js';

describe('NATSConfigBuilder', () => {
  let builder: NATSConfigBuilder;

  beforeEach(() => {
    builder = new NATSConfigBuilder();
  });

  describe('serverConfig', () => {
    it('should generate complete server config', () => {
      const config = builder.serverConfig({
        clientPort: 4222,
        leafNodePort: 7422,
        jetstream: {
          storeDir: '/test/jetstream',
          maxMemoryStore: '1GB',
          maxFileStore: '10GB',
        },
        tls: {
          certFile: '/test/certs/main.crt',
          keyFile: '/test/certs/main.key',
          caFile: '/test/certs/rootCA.crt',
          verify: true,
        },
        logging: {
          debug: false,
          trace: false,
          logtime: true,
        },
      });

      expect(config).toContain('port: 4222');
      expect(config).toContain('# Main NATS Server Configuration');
    });

    it('should include JetStream configuration', () => {
      const config = builder.serverConfig({
        clientPort: 4222,
        leafNodePort: 7422,
        jetstream: {
          storeDir: '/custom/jetstream',
          maxMemoryStore: '2GB',
          maxFileStore: '20GB',
        },
        tls: {
          certFile: '/test/main.crt',
          keyFile: '/test/main.key',
          caFile: '/test/rootCA.crt',
          verify: true,
        },
        logging: {
          debug: false,
          trace: false,
          logtime: true,
        },
      });

      expect(config).toContain('jetstream {');
      expect(config).toContain('store_dir: "/custom/jetstream"');
      expect(config).toContain('max_memory_store: 2GB');
      expect(config).toContain('max_file_store: 20GB');
    });

    it('should include leaf node server configuration', () => {
      const config = builder.serverConfig({
        clientPort: 4222,
        leafNodePort: 7422,
        jetstream: {
          storeDir: '/test/jetstream',
          maxMemoryStore: '1GB',
          maxFileStore: '10GB',
        },
        tls: {
          certFile: '/test/main.crt',
          keyFile: '/test/main.key',
          caFile: '/test/rootCA.crt',
          verify: true,
        },
        logging: {
          debug: false,
          trace: false,
          logtime: true,
        },
      });

      expect(config).toContain('leafnodes {');
      expect(config).toContain('port: 7422');
      expect(config).toContain('cert_file: "/test/main.crt"');
      expect(config).toContain('key_file: "/test/main.key"');
      expect(config).toContain('ca_file: "/test/rootCA.crt"');
      expect(config).toContain('verify: true');
    });

    it('should include logging configuration', () => {
      const config = builder.serverConfig({
        clientPort: 4222,
        leafNodePort: 7422,
        jetstream: {
          storeDir: '/test/jetstream',
          maxMemoryStore: '1GB',
          maxFileStore: '10GB',
        },
        tls: {
          certFile: '/test/main.crt',
          keyFile: '/test/main.key',
          caFile: '/test/rootCA.crt',
          verify: true,
        },
        logging: {
          debug: true,
          trace: true,
          logtime: false,
        },
      });

      expect(config).toContain('debug: true');
      expect(config).toContain('trace: true');
      expect(config).toContain('logtime: false');
    });
  });

  describe('leafNodeConfig', () => {
    it('should generate complete leaf node config', () => {
      const config = builder.leafNodeConfig({
        port: 4223,
        host: '127.0.0.1',
        jetstream: {
          storeDir: '/test/agent/jetstream',
          maxMemoryStore: '1GB',
          maxFileStore: '10GB',
        },
        remote: {
          url: 'tls://localhost:7422',
          tls: {
            certFile: '/test/agent.crt',
            keyFile: '/test/agent.key',
            caFile: '/test/rootCA.crt',
            verify: true,
          },
        },
        logging: {
          debug: false,
          trace: false,
          logtime: true,
        },
      });

      expect(config).toContain('port: 4223');
      expect(config).toContain('host: 127.0.0.1');
      expect(config).toContain('# Agent NATS Server Configuration');
    });

    it('should include JetStream configuration', () => {
      const config = builder.leafNodeConfig({
        port: 4223,
        host: '127.0.0.1',
        jetstream: {
          storeDir: '/custom/agent/jetstream',
          maxMemoryStore: '512MB',
          maxFileStore: '5GB',
        },
        remote: {
          url: 'tls://localhost:7422',
          tls: {
            certFile: '/test/agent.crt',
            keyFile: '/test/agent.key',
            caFile: '/test/rootCA.crt',
            verify: true,
          },
        },
        logging: {
          debug: false,
          trace: false,
          logtime: true,
        },
      });

      expect(config).toContain('jetstream {');
      expect(config).toContain('store_dir: "/custom/agent/jetstream"');
      expect(config).toContain('max_memory_store: 512MB');
      expect(config).toContain('max_file_store: 5GB');
    });

    it('should include leaf node client configuration', () => {
      const config = builder.leafNodeConfig({
        port: 4223,
        host: '0.0.0.0',
        jetstream: {
          storeDir: '/test/jetstream',
          maxMemoryStore: '1GB',
          maxFileStore: '10GB',
        },
        remote: {
          url: 'tls://remote-server:7422',
          tls: {
            certFile: '/test/agent.crt',
            keyFile: '/test/agent.key',
            caFile: '/test/rootCA.crt',
            verify: false,
          },
        },
        logging: {
          debug: false,
          trace: false,
          logtime: true,
        },
      });

      expect(config).toContain('leafnodes {');
      expect(config).toContain('remotes = [');
      expect(config).toContain('url: "tls://remote-server:7422"');
      expect(config).toContain('cert_file: "/test/agent.crt"');
      expect(config).toContain('key_file: "/test/agent.key"');
      expect(config).toContain('ca_file: "/test/rootCA.crt"');
      expect(config).toContain('verify: false');
    });

    it('should include logging configuration', () => {
      const config = builder.leafNodeConfig({
        port: 4223,
        host: '127.0.0.1',
        jetstream: {
          storeDir: '/test/jetstream',
          maxMemoryStore: '1GB',
          maxFileStore: '10GB',
        },
        remote: {
          url: 'tls://localhost:7422',
          tls: {
            certFile: '/test/agent.crt',
            keyFile: '/test/agent.key',
            caFile: '/test/rootCA.crt',
            verify: true,
          },
        },
        logging: {
          debug: true,
          trace: false,
          logtime: true,
        },
      });

      expect(config).toContain('debug: true');
      expect(config).toContain('trace: false');
      expect(config).toContain('logtime: true');
    });
  });
});
