import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function generateServerConfig(certsDir: string, configDir: string): Promise<void> {
  console.log('📝 Generating Main Server configuration...');

  const mainKeyPath = join(certsDir, 'main.key');
  const mainCertPath = join(certsDir, 'main.crt');
  const rootCertPath = join(certsDir, 'rootCA.crt');

  const config = `
# Main NATS Server Configuration
# Client connections without TLS
port: 4222

# JetStream configuration
jetstream {
  store_dir: "./jetstream"
  max_memory_store: 1GB
  max_file_store: 10GB
}

# Leaf node connections with TLS authentication
leafnodes {
  port: 7422
  tls {
    cert_file: "${mainCertPath}"
    key_file: "${mainKeyPath}"
    ca_file: "${rootCertPath}"
    verify: true
  }
}

# Logging
debug: false
trace: false
logtime: true
`;

  const configPath = join(configDir, 'main.conf');
  await writeFile(configPath, config);

  console.log('✅ Main Server configuration saved to:', configPath);
}
