import { Container } from '../../core/container.js';
import { DeleteAgentOptionsSchema } from '../../core/validation/schemas.js';

export interface DeleteAgentOptions {
  name: string;
}

export async function deleteAgent(options: DeleteAgentOptions): Promise<void> {
  const validated = DeleteAgentOptionsSchema.parse(options);
  const container = Container.getInstance();

  const exists = await container.agentRegistry.exists(validated.name);
  if (!exists) {
    throw new Error(`Agent '${validated.name}' does not exist`);
  }

  await container.agentRegistry.delete(validated.name);
  console.log(`✅ Agent '${validated.name}' deleted successfully`);
}
