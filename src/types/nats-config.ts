/**
 * TypeScript interfaces for NATS configuration structures
 */

export interface JetStreamConfig {
  store_dir: string;
  max_memory_store: string;
  max_file_store: string;
}

export interface TLSConfig {
  cert_file: string;
  key_file: string;
  ca_file: string;
  verify: boolean;
}

export interface LeafNodeRemote {
  url: string;
  tls: TLSConfig;
}

export interface ServerConfig {
  port: number;
  jetstream: JetStreamConfig;
  leafnodes?: {
    port: number;
    tls: TLSConfig;
  };
  debug: boolean;
  trace: boolean;
  logtime: boolean;
}

export interface AgentConfig {
  port: number;
  host: string;
  jetstream: JetStreamConfig;
  leafnodes: {
    remotes: LeafNodeRemote[];
  };
  debug: boolean;
  trace: boolean;
  logtime: boolean;
}
