import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { AGENTS_DIR } from '../../utils/paths.js';
import { EditAgentOptionsSchema } from '../../utils/validation.js';

import { checkPortConflict } from './validation.js';

export interface EditAgentOptions {
  name: string;
  port?: number;
  host?: string;
  remoteUrl?: string;
}

export async function editAgentConfig(options: EditAgentOptions): Promise<void> {
  // Validate input options
  const validated = EditAgentOptionsSchema.parse(options);
  const { name, port, host, remoteUrl } = validated;

  const configPath = path.join(AGENTS_DIR, name, 'config', `${name}.conf`);

  console.log(`✏️  Editing configuration for agent: ${name}...`);

  let configContent: string;

  try {
    configContent = await readFile(configPath, 'utf8');
  } catch {
    console.error(`❌ Error: Configuration for agent '${name}' not found.`);
    throw new Error(`Configuration for agent '${name}' not found.`);
  }

  // Check for port conflicts if port is being changed
  if (port !== undefined) {
    await checkPortConflict(port, name);
    configContent = configContent.replace(/^port:\s*\d+/m, `port: ${port}`);
    console.log(`   Updated port: ${port}`);
  }

  if (host !== undefined) {
    configContent = /^host:/m.test(configContent)
      ? configContent.replace(/^host:\s*.+/m, `host: ${host}`)
      : configContent.replace(/^port:(.+)/m, `port:$1\nhost: ${host}`);
    console.log(`   Updated host: ${host}`);
  }

  if (remoteUrl !== undefined) {
    configContent = configContent.replace(/url:\s*"[^"]+"/, `url: "${remoteUrl}"`);
    console.log(`   Updated remote URL: ${remoteUrl}`);
  }

  await writeFile(configPath, configContent);

  console.log(`\n✨ Agent '${name}' configuration updated successfully!`);
  console.log(`   Config: ${configPath}`);
}
