import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_CONFIG } from '../../config/defaults.js';

export async function generateServerConfig(certsDir: string, configDir: string): Promise<void> {
  console.log('📝 Generating Main Server configuration...');

  const mainKeyPath = path.join(certsDir, 'main.key');
  const mainCertPath = path.join(certsDir, 'main.crt');
  const rootCertPath = path.join(certsDir, 'rootCA.crt');

  const { server } = DEFAULT_CONFIG;

  // Use absolute path for JetStream store
  const jetStreamStoreDir = path.resolve(server.jetstream.storeDir);

  const config = `
# Main NATS Server Configuration
# Client connections without TLS
port: ${server.clientPort}

# JetStream configuration
jetstream {
  store_dir: "${jetStreamStoreDir}"
  max_memory_store: ${server.jetstream.maxMemoryStore}
  max_file_store: ${server.jetstream.maxFileStore}
}

# Leaf node connections with TLS authentication
leafnodes {
  port: ${server.leafNodePort}
  tls {
    cert_file: "${mainCertPath}"
    key_file: "${mainKeyPath}"
    ca_file: "${rootCertPath}"
    verify: true
  }
}

# Logging
debug: ${server.logging.debug}
trace: ${server.logging.trace}
logtime: ${server.logging.logtime}
`;

  const configPath = path.join(configDir, 'main.conf');

  await writeFile(configPath, config);

  console.log('✅ Main Server configuration saved to:', configPath);
}
