import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { AGENTS_DIR } from '../../utils/paths.js';

export interface AgentInfo {
  name: string;
  hasCertificate: boolean;
  hasConfig: boolean;
  certPath?: string;
  configPath?: string;
  agentDir?: string;
}

export async function listAgents(): Promise<AgentInfo[]> {
  const agents: AgentInfo[] = [];

  try {
    const agentDirs = await readdir(AGENTS_DIR);

    for (const name of agentDirs) {
      const agentDir = join(AGENTS_DIR, name);
      const agentStat = await stat(agentDir).catch(() => null);

      if (!agentStat || !agentStat.isDirectory()) {
        continue;
      }

      const certPath = join(agentDir, 'certs', `${name}.crt`);
      const keyPath = join(agentDir, 'certs', `${name}.key`);
      const configPath = join(agentDir, 'config', `${name}.conf`);

      const certStat = await stat(certPath).catch(() => null);
      const keyStat = await stat(keyPath).catch(() => null);
      const configStat = await stat(configPath).catch(() => null);

      agents.push({
        name,
        hasCertificate: !!(certStat && keyStat),
        hasConfig: !!configStat,
        certPath: certStat ? certPath : undefined,
        configPath: configStat ? configPath : undefined,
        agentDir,
      });
    }
  } catch (error) {
    // AGENTS_DIR doesn't exist or is empty
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}
