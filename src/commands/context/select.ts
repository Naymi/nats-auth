import { Container } from '../../core/container.js';

export interface SelectContextOptions {
  name: string;
}

export async function selectContext(options: SelectContextOptions): Promise<void> {
  const { name } = options;
  const container = Container.getInstance();

  const available = await container.contextManager.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  // Check if context exists
  const contextExists = await container.contextManager.contextExists(name);
  if (!contextExists) {
    throw new Error(`Context '${name}' does not exist. List available contexts with: yarn cli context:list`);
  }

  console.log(`🔧 Selecting context: ${name}...`);

  await container.contextManager.selectContext(name);

  console.log(`✨ Context '${name}' selected as default!`);
}
