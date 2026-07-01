export interface AccountUser {
  user: string;
  password?: string;
}

export interface Account {
  name: string;
  users: AccountUser[];
  exports?: AccountExport[];
}

export interface AccountExport {
  service?: string;
  stream?: string;
}

export interface LeafNodeAuthEntry {
  user: string;
  account: string;
}

export interface JetStreamOptions {
  storeDir: string;
  maxMemoryStore: string;
  maxFileStore: string;
  domain?: string;
}

export interface TLSOptions {
  certFile: string;
  keyFile: string;
  caFile: string;
  verify: boolean;
  verifyAndMap?: boolean;
}

export interface LoggingOptions {
  debug: boolean;
  trace: boolean;
  logtime: boolean;
}

export interface ServerConfigOptions {
  clientPort: number;
  leafNodePort: number;
  serverName?: string;
  jetstream: JetStreamOptions;
  tls: TLSOptions;
  logging: LoggingOptions;
  accounts?: Account[];
  leafNodeAuth?: LeafNodeAuthEntry[];
  systemAccount?: string;
  noAuthUser?: string;
}

export interface LeafNodeRemoteOptions {
  url: string;
  tls: TLSOptions;
}

export interface LeafNodeConfigOptions {
  port: number;
  host: string;
  serverName?: string;
  jetstream: JetStreamOptions;
  remote: LeafNodeRemoteOptions;
  logging: LoggingOptions;
  systemAccount?: string;
  noAuthUser?: string;
  accounts?: Account[];
}

export class NATSConfigBuilder {
  serverConfig(options: ServerConfigOptions): string {
    const sections = [
      '# Main NATS Server Configuration',
      '# Client connections without TLS',
      `port: ${options.clientPort}`,
    ];

    if (options.serverName) {
      sections.push(`server_name: "${options.serverName}"`);
    }

    sections.push('', this.renderJetStream(options.jetstream));

    // Add system account and no_auth_user if provided
    if (options.systemAccount && options.noAuthUser) {
      sections.push('', `# System account for client connections`);
      sections.push(`system_account: "${options.systemAccount}"`);
      sections.push(`no_auth_user: ${options.noAuthUser}`);
    }

    // Add accounts section if provided
    if (options.accounts && options.accounts.length > 0) {
      sections.push('', this.renderAccounts(options.accounts));
    }

    sections.push(
      '',
      this.renderLeafNodeServer(options.leafNodePort, options.tls, options.leafNodeAuth),
      '',
      this.renderLogging(options.logging),
    );

    return sections.join('\n');
  }

  leafNodeConfig(options: LeafNodeConfigOptions): string {
    const sections = [
      '# Agent NATS Server Configuration (Leaf Node)',
      `# Agent name: ${options.host}`,
      `port: ${options.port}`,
      `host: ${options.host}`,
    ];

    if (options.serverName) {
      sections.push(`server_name: "${options.serverName}"`);
    }

    sections.push('', this.renderJetStream(options.jetstream));

    // Add system account and no_auth_user if provided
    if (options.systemAccount && options.noAuthUser) {
      sections.push('', `# System account for client connections`);
      sections.push(`system_account: "${options.systemAccount}"`);
      sections.push(`no_auth_user: ${options.noAuthUser}`);
    }

    // Add accounts section if provided
    if (options.accounts && options.accounts.length > 0) {
      sections.push('', this.renderAccounts(options.accounts));
    }

    sections.push(
      '',
      this.renderLeafNodeClient(options.remote),
      '',
      this.renderLogging(options.logging),
    );

    return sections.join('\n');
  }

  private renderJetStream(options: JetStreamOptions): string {
    const lines = [
      '# JetStream configuration',
      'jetstream {',
      `  store_dir: "${options.storeDir}"`,
      `  max_memory_store: ${options.maxMemoryStore}`,
      `  max_file_store: ${options.maxFileStore}`,
    ];

    if (options.domain) {
      lines.push(`  domain: ${options.domain}`);
    }

    lines.push('}');

    return lines.join('\n');
  }

  private renderTLS(options: TLSOptions): string {
    const lines = [
      '  tls {',
      `    cert_file: "${options.certFile}"`,
      `    key_file: "${options.keyFile}"`,
      `    ca_file: "${options.caFile}"`,
      `    verify: ${options.verify}`,
    ];

    if (options.verifyAndMap) {
      lines.push(`    verify_and_map: ${options.verifyAndMap}`);
    }

    lines.push('  }');

    return lines.join('\n');
  }

  private renderLeafNodeServer(port: number, tls: TLSOptions, auth?: LeafNodeAuthEntry[]): string {
    const lines = [
      '# Leaf node connections with TLS authentication',
      'leafnodes {',
      `  port: ${port}`,
      this.renderTLS(tls),
    ];

    // Add authorization section if provided
    if (auth && auth.length > 0) {
      lines.push(this.renderLeafNodeAuthorization(auth));
    }

    lines.push('}');

    return lines.join('\n');
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

  private renderAccounts(accounts: Account[]): string {
    const lines = ['# Account definitions', 'accounts {'];

    accounts.forEach((account) => {
      lines.push(`  ${account.name} {`);

      // Only render users section if there are users
      if (account.users.length > 0) {
        lines.push('    users = [');
        account.users.forEach((user) => {
          if (user.password !== undefined) {
            lines.push(`      { user: "${user.user}", password: "${user.password}" }`);
          } else {
            lines.push(`      { user: "${user.user}" }`);
          }
        });
        lines.push('    ]');
      }

      // Add exports if present
      if (account.exports && account.exports.length > 0) {
        lines.push('    exports = [');
        account.exports.forEach((exp) => {
          if (exp.service) {
            lines.push(`      { service: "${exp.service}" }`);
          }
          if (exp.stream) {
            lines.push(`      { stream: "${exp.stream}" }`);
          }
        });
        lines.push('    ]');
      }

      lines.push('  }');
    });

    lines.push('}');

    return lines.join('\n');
  }

  private renderLeafNodeAuthorization(auth: LeafNodeAuthEntry[]): string {
    const lines = ['  authorization {', '    users = ['];

    auth.forEach((entry) => {
      lines.push(`      { user: "${entry.user}", account: "${entry.account}" }`);
    });

    lines.push('    ]');
    lines.push('  }');

    return lines.join('\n');
  }

  private renderLogging(options: LoggingOptions): string {
    return `# Logging
debug: ${options.debug}
trace: ${options.trace}
logtime: ${options.logtime}`;
  }
}
