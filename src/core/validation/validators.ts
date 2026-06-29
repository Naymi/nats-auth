import { createConnection } from 'node:net';

// Re-export schemas for backward compatibility
export {
  AgentNameSchema,
  PortSchema,
  HostSchema,
  CreateAgentOptionsSchema,
  EditAgentOptionsSchema,
} from '../validation/schemas.js';

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

