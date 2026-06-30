import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_CONFIG } from '../../core/config/defaults.js';
import { NATSConfigBuilder } from '../../core/config/builder.js';

export async function generateServerConfig(
  certsDir: string,
  configDir: string,
  serverName?: string,
  domain?: string
): Promise<void> {
  console.log('📝 Generating Main Server configuration...');

  const mainKeyPath = path.join(certsDir, 'main.key');
  const mainCertPath = path.join(certsDir, 'main.crt');
  const rootCertPath = path.join(certsDir, 'rootCA.crt');

  const { server } = DEFAULT_CONFIG;

  // Use absolute path for JetStream store
  const jetStreamStoreDir = path.resolve(server.jetstream.storeDir);

  const builder = new NATSConfigBuilder();
  const config = builder.serverConfig({
    clientPort: server.clientPort,
    leafNodePort: server.leafNodePort,
    serverName: serverName || server.serverName,
    jetstream: {
      storeDir: jetStreamStoreDir,
      maxMemoryStore: server.jetstream.maxMemoryStore,
      maxFileStore: server.jetstream.maxFileStore,
      domain: domain || server.jetstream.domain,
    },
    tls: {
      certFile: mainCertPath,
      keyFile: mainKeyPath,
      caFile: rootCertPath,
      verify: true,
    },
    logging: server.logging,
  });

  const configPath = path.join(configDir, 'main.conf');

  await writeFile(configPath, config);

  console.log('✅ Main Server configuration saved to:', configPath);
}
