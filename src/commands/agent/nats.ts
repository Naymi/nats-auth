import { Container } from '../../core/container.js';

export interface AgentNatsOptions {
  name: string;
  args: string[];
}

export async function executeAgentNats(options: AgentNatsOptions): Promise<void> {
  const { name, args } = options;
  const container = Container.getInstance();

  // Check if agent exists
  const agentDetails = await container.agentRegistry.get(name);
  if (!agentDetails) {
    throw new Error(`Agent '${name}' not found. Create it first with: agent:create ${name}`);
  }

  // Check if NATS CLI is available
  const available = await container.cliProxy.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  // Build connection URL - agents listen on their port without TLS for client connections
  const url = `nats://${agentDetails.host || '127.0.0.1'}:${agentDetails.port || 4223}`;

  // Execute without TLS credentials (agent doesn't require them for client port)
  await container.cliProxy.executeCommand(args, {
    server: url,
  });
}
