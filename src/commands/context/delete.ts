import { Container } from '../../core/container.js';

export interface DeleteContextOptions {
  name: string;
}

export async function deleteContext(options: DeleteContextOptions): Promise<void> {
  const { name } = options;
  const container = Container.getInstance();

  const available = await container.contextManager.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  // Check if context exists
  const contextExists = await container.contextManager.contextExists(name);
  if (!contextExists) {
    throw new Error(`Context '${name}' does not exist`);
  }

  console.log(`🗑️  Deleting context: ${name}...`);

  await container.contextManager.deleteContext(name);

  console.log(`✨ Context '${name}' deleted successfully!`);
}
