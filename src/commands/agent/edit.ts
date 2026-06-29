import { EditAgentOptionsSchema } from '../../core/validation/schemas.js';

import { NodeFileSystem } from '../../core/certificates/adapters/filesystem.js';
import { AgentRegistry } from '../../core/agent/registry.js';

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

  const registry = new AgentRegistry(new NodeFileSystem());
  await registry.update(name, { port, host, remoteUrl });
}
