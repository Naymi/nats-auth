import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { AGENTS_DIR } from '../../utils/paths.js';

export interface EditAgentOptions {
  name: string;
  port?: number;
  host?: string;
  remoteUrl?: string;
}

export async function editAgentConfig(options: EditAgentOptions): Promise<void> {
  const { name, port, host, remoteUrl } = options;
  const configPath = join(AGENTS_DIR, name, 'config', `${name}.conf`);

  console.log(`✏️  Editing configuration for agent: ${name}...`);

  let configContent: string;
  try {
    configContent = await readFile(configPath, 'utf-8');
  } catch {
    console.error(`❌ Error: Configuration for agent '${name}' not found.`);
    process.exit(1);
  }

  if (port !== undefined) {
    configContent = configContent.replace(/^port:\s*\d+/m, `port: ${port}`);
    console.log(`   Updated port: ${port}`);
  }

  if (host !== undefined) {
    if (configContent.match(/^host:/m)) {
      configContent = configContent.replace(/^host:\s*.+/m, `host: ${host}`);
    } else {
      configContent = configContent.replace(/^port:(.+)/m, `port:$1\nhost: ${host}`);
    }
    console.log(`   Updated host: ${host}`);
  }

  if (remoteUrl !== undefined) {
    configContent = configContent.replace(
      /url:\s*"[^"]+"/,
      `url: "${remoteUrl}"`
    );
    console.log(`   Updated remote URL: ${remoteUrl}`);
  }

  await writeFile(configPath, configContent);

  console.log(`\n✨ Agent '${name}' configuration updated successfully!`);
  console.log(`   Config: ${configPath}`);
}
