import { EditAgentOptionsSchema } from '../../core/validation/schemas.js';
import { Container } from '../../core/container.js';

export interface EditAgentOptions {
  name: string;
  port?: number;
  host?: string;
  remoteUrl?: string;
}

export async function editAgentConfig(options: EditAgentOptions): Promise<void> {
  const validated = EditAgentOptionsSchema.parse(options);
  const { name, ...changes } = validated;

  const container = Container.getInstance();
  await container.agentRegistry.update(name, changes);
}
