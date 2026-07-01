import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_CONFIG } from "../../core/config/defaults.js";
import { NATSConfigBuilder } from "../../core/config/builder.js";

export async function generateAgentConfig(
  rootCertsDir: string,
  agentCertsDir: string,
  agentConfigDir: string,
  agentJetStreamDir: string,
  name: string = 'agent',
  port: number = 4223,
  host: string = '127.0.0.1',
  domain?: string
): Promise<void> {
  console.log(`📝 Generating configuration for agent: ${name}...`);

  const leafKeyPath = path.join(agentCertsDir, `${name}.key`);
  const leafCertPath = path.join(agentCertsDir, `${name}.crt`);
  const rootCertPath = path.join(rootCertsDir, 'rootCA.crt');

  const { agent } = DEFAULT_CONFIG;

  const builder = new NATSConfigBuilder();
  const config = builder.leafNodeConfig({
    port,
    host,
    serverName: name,
    jetstream: {
      storeDir: agentJetStreamDir,
      maxMemoryStore: agent.jetstream.maxMemoryStore,
      maxFileStore: agent.jetstream.maxFileStore,
      domain: domain || agent.jetstream.domain,
    },
    remote: {
      url: agent.remoteUrl,
      tls: {
        certFile: leafCertPath,
        keyFile: leafKeyPath,
        caFile: rootCertPath,
        verify: true,
      },
    },
    logging: agent.logging,
    systemAccount: DEFAULT_CONFIG.account.systemAccount,
    noAuthUser: DEFAULT_CONFIG.account.systemUser,
    accounts: [
      {
        name: DEFAULT_CONFIG.account.systemAccount,
        users: [{ user: DEFAULT_CONFIG.account.systemUser, password: '' }],
        exports: [
          { service: '$SYS.REQ.SERVER.>' },
          { service: '$SYS.REQ.ACCOUNT.>.CLAIMS.LOOKUP' },
          { service: '$SYS.REQ.ACCOUNT.>.CLAIMS.UPDATE' },
          { service: '$SYS.REQ.ACCOUNT.>.CLAIMS.DELETE' },
          { service: '$SYS.REQ.USER.INFO' },
        ],
      },
    ],
  });

  const configPath = path.join(agentConfigDir, `${name}.conf`);

  await writeFile(configPath, config);

  console.log(`✅ Configuration for '${name}' saved to: ${configPath}`);
}
