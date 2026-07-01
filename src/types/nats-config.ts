/**
 * TypeScript interfaces for NATS configuration structures
 */

export interface NATSAccount {
  name: string;
  users: Array<{ user: string }>;
}

export interface NATSLeafNodeAuth {
  user: string;
  account: string;
}

export interface JetStreamConfig {
  store_dir: string;
  max_memory_store: string;
  max_file_store: string;
  domain?: string;
}

export interface TLSConfig {
  cert_file: string;
  key_file: string;
  ca_file: string;
  verify: boolean;
  verify_and_map?: boolean;
}

export interface LeafNodeRemote {
  url: string;
  tls: TLSConfig;
}

export interface ServerConfig {
  port: number;
  server_name?: string;
  accounts?: NATSAccount[];
  jetstream: JetStreamConfig;
  leafnodes?: {
    port: number;
    tls: TLSConfig;
    authorization?: {
      users: NATSLeafNodeAuth[];
    };
  };
  debug: boolean;
  trace: boolean;
  logtime: boolean;
}

export interface AgentConfig {
  port: number;
  host: string;
  server_name?: string;
  jetstream: JetStreamConfig;
  leafnodes: {
    remotes: LeafNodeRemote[];
  };
  debug: boolean;
  trace: boolean;
  logtime: boolean;
}
