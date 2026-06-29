import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function generateAgentConfig(certsDir: string, configDir: string): Promise<void> {
  console.log('📝 Generating Agent configuration...');

  const leafKeyPath = join(certsDir, 'leaf.key');
  const leafCertPath = join(certsDir, 'leaf.crt');
  const rootCertPath = join(certsDir, 'rootCA.crt');

  const config = `
# Agent NATS Server Configuration (Leaf Node)
port: 4223

# JetStream configuration
jetstream {
  store_dir: "./jetstream-agent"
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

  const configPath = join(configDir, 'agent.conf');
  await writeFile(configPath, config);

  console.log('✅ Agent configuration saved to:', configPath);
}
