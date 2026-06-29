import { CreateAgentOptionsSchema } from '../../types/schemas.js';

import { NodeFileSystem } from './adapters/filesystem.js';
import { AgentRegistry } from './registry.js';

export interface CreateAgentOptions {
  name: string;
  port?: number;
  host?: string;
  replace?: boolean;
}

export async function createAgent(options: CreateAgentOptions): Promise<void> {
  // Validate input options
  const validated = CreateAgentOptionsSchema.parse(options);
  const { name, port, host, replace } = validated;

  const registry = new AgentRegistry(new NodeFileSystem());
  await registry.create({ name, port, host, replace });
}
