export interface JetStreamOptions {
  storeDir: string;
  maxMemoryStore: string;
  maxFileStore: string;
}

export interface TLSOptions {
  certFile: string;
  keyFile: string;
  caFile: string;
  verify: boolean;
}

export interface LoggingOptions {
  debug: boolean;
  trace: boolean;
  logtime: boolean;
}

export interface ServerConfigOptions {
  clientPort: number;
  leafNodePort: number;
  jetstream: JetStreamOptions;
  tls: TLSOptions;
  logging: LoggingOptions;
}

export interface LeafNodeRemoteOptions {
  url: string;
  tls: TLSOptions;
}

export interface LeafNodeConfigOptions {
  port: number;
  host: string;
  jetstream: JetStreamOptions;
  remote: LeafNodeRemoteOptions;
  logging: LoggingOptions;
}

export class NATSConfigBuilder {
  serverConfig(options: ServerConfigOptions): string {
    const sections = [
      '# Main NATS Server Configuration',
      '# Client connections without TLS',
      `port: ${options.clientPort}`,
      '',
      this.renderJetStream(options.jetstream),
      '',
      this.renderLeafNodeServer(options.leafNodePort, options.tls),
      '',
      this.renderLogging(options.logging),
    ];

    return sections.join('\n');
  }

  leafNodeConfig(options: LeafNodeConfigOptions): string {
    const sections = [
      '# Agent NATS Server Configuration (Leaf Node)',
      `# Agent name: ${options.host}`,
      `port: ${options.port}`,
      `host: ${options.host}`,
      '',
      this.renderJetStream(options.jetstream),
      '',
      this.renderLeafNodeClient(options.remote),
      '',
      this.renderLogging(options.logging),
    ];

    return sections.join('\n');
  }

  private renderJetStream(options: JetStreamOptions): string {
    return `# JetStream configuration
jetstream {
  store_dir: "${options.storeDir}"
  max_memory_store: ${options.maxMemoryStore}
  max_file_store: ${options.maxFileStore}
}`;
  }

  private renderTLS(options: TLSOptions): string {
    return `  tls {
    cert_file: "${options.certFile}"
    key_file: "${options.keyFile}"
    ca_file: "${options.caFile}"
    verify: ${options.verify}
  }`;
  }

  private renderLeafNodeServer(port: number, tls: TLSOptions): string {
    return `# Leaf node connections with TLS authentication
leafnodes {
  port: ${port}
${this.renderTLS(tls)}
}`;
  }

  private renderLeafNodeClient(remote: LeafNodeRemoteOptions): string {
    return `leafnodes {
  remotes = [
    {
      url: "${remote.url}"
${this.renderTLS(remote.tls)}
    }
  ]
}`;
  }

  private renderLogging(options: LoggingOptions): string {
    return `# Logging
debug: ${options.debug}
trace: ${options.trace}
logtime: ${options.logtime}`;
  }
}
