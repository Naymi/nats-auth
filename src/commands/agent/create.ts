import { CreateAgentOptionsSchema } from '../../core/validation/schemas.js';
import { Container } from '../../core/container.js';

export interface CreateAgentOptions {
  name: string;
  port?: number;
  host?: string;
  domain?: string;
  replace?: boolean;
}

export async function createAgent(options: CreateAgentOptions): Promise<void> {
  const validated = CreateAgentOptionsSchema.parse(options);
  const container = Container.getInstance();
  await container.agentRegistry.create(validated);
}
