import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_CONFIG } from '../../config/defaults.js';

export async function generateAgentConfig(
  rootCertsDir: string,
  agentCertsDir: string,
  agentConfigDir: string,
  agentJetStreamDir: string,
  name: string = 'agent',
  port: number = 4223,
  host: string = '127.0.0.1'
): Promise<void> {
  console.log(`📝 Generating configuration for agent: ${name}...`);

  const leafKeyPath = path.join(agentCertsDir, `${name}.key`);
  const leafCertPath = path.join(agentCertsDir, `${name}.crt`);
  const rootCertPath = path.join(rootCertsDir, 'rootCA.crt');

  const { agent } = DEFAULT_CONFIG;

  const config = `
# Agent NATS Server Configuration (Leaf Node)
# Agent name: ${name}
port: ${port}
host: ${host}

# JetStream configuration
jetstream {
  store_dir: "${agentJetStreamDir}"
  max_memory_store: ${agent.jetstream.maxMemoryStore}
  max_file_store: ${agent.jetstream.maxFileStore}
}

leafnodes {
  remotes = [
    {
      url: "${agent.remoteUrl}"
      tls {
        cert_file: "${leafCertPath}"
        key_file: "${leafKeyPath}"
        ca_file: "${rootCertPath}"
        verify: true
      }
    }
  ]
}

# Logging
debug: ${agent.logging.debug}
trace: ${agent.logging.trace}
logtime: ${agent.logging.logtime}
`;

  const configPath = path.join(agentConfigDir, `${name}.conf`);

  await writeFile(configPath, config);

  console.log(`✅ Configuration for '${name}' saved to: ${configPath}`);
}
