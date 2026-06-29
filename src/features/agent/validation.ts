import { readdir } from 'fs/promises';
import { join } from 'path';
import { AGENTS_DIR } from '../../utils/paths.js';

/**
 * Check if a port is already in use by another agent
 * @param port - Port number to check
 * @param excludeAgent - Agent name to exclude from the check (for editing existing agents)
 * @throws Error if port is already in use
 */
export async function checkPortConflict(port: number, excludeAgent?: string): Promise<void> {
  try {
    const agentDirs = await readdir(AGENTS_DIR);

    for (const agentName of agentDirs) {
      if (excludeAgent && agentName === excludeAgent) {
        continue;
      }

      const configPath = join(AGENTS_DIR, agentName, 'config', `${agentName}.conf`);

      try {
        const fs = await import('fs/promises');
        const configContent = await fs.readFile(configPath, 'utf-8');
        const portMatch = configContent.match(/^port:\s*(\d+)/m);

        if (portMatch) {
          const existingPort = parseInt(portMatch[1], 10);
          if (existingPort === port) {
            throw new Error(
              `Port ${port} is already used by agent '${agentName}'. Please choose a different port.`
            );
          }
        }
      } catch (error) {
        // Config doesn't exist or can't be read, skip this agent
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
    }
  } catch (error) {
    // AGENTS_DIR doesn't exist yet, no conflicts
    if ((error as any).code !== 'ENOENT') {
      throw error;
    }
  }
}
