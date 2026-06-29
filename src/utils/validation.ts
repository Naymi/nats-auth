import { z } from 'zod';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { AGENTS_DIR } from './paths.js';
import { createConnection } from 'net';

/**
 * Validate agent name (only letters, numbers, hyphens, and underscores)
 */
export const AgentNameSchema = z
  .string()
  .min(1, 'Agent name cannot be empty')
  .max(63, 'Agent name too long (max 63 characters)')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Agent name can only contain letters, numbers, hyphens, and underscores'
  );

/**
 * Validate port number (1-65535)
 */
export const PortSchema = z
  .number()
  .int('Port must be an integer')
  .min(1, 'Port must be >= 1')
  .max(65535, 'Port must be <= 65535');

/**
 * Validate host (IP address or hostname)
 */
export const HostSchema = z
  .string()
  .min(1, 'Host cannot be empty')
  .refine(
    (host) => {
      // Check IPv4 address or hostname
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      const hostnamePattern = /^[a-zA-Z0-9.-]+$/;
      return ipv4Pattern.test(host) || hostnamePattern.test(host);
    },
    { message: 'Invalid host format (must be IPv4 address or hostname)' }
  );

/**
 * Schema for creating an agent
 */
export const CreateAgentOptionsSchema = z.object({
  name: AgentNameSchema,
  port: PortSchema.default(4223),
  host: HostSchema.default('127.0.0.1'),
});

/**
 * Schema for editing agent configuration
 */
export const EditAgentOptionsSchema = z.object({
  name: AgentNameSchema,
  port: PortSchema.optional(),
  host: HostSchema.optional(),
  remoteUrl: z.string().url('Invalid remote URL').optional(),
});

/**
 * Check if a port is in use
 * @param port - Port number to check
 * @returns Promise<boolean> - true if port is in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Check if port conflicts with existing agents
 * @param port - Port number to check
 * @param excludeAgent - Agent name to exclude from check (for editing)
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
