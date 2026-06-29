import { writeFile } from 'fs/promises';
import { join } from 'path';

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

  const leafKeyPath = join(agentCertsDir, `${name}.key`);
  const leafCertPath = join(agentCertsDir, `${name}.crt`);
  const rootCertPath = join(rootCertsDir, 'rootCA.crt');

  const config = `
# Agent NATS Server Configuration (Leaf Node)
# Agent name: ${name}
port: ${port}
host: ${host}

# JetStream configuration
jetstream {
  store_dir: "${agentJetStreamDir}"
  max_memory_store: 1GB
  max_file_store: 10GB
}

leafnodes {
  remotes = [
    {
      url: "tls://localhost:7422"
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
debug: false
trace: false
logtime: true
`;

  const configPath = join(agentConfigDir, `${name}.conf`);
  await writeFile(configPath, config);

  console.log(`✅ Configuration for '${name}' saved to: ${configPath}`);
}
