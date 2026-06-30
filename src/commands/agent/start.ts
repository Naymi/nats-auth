import { join } from 'node:path';
import { AGENTS_DIR } from "../../shared/paths.js";
import { Container } from '../../core/container.js';
import { createAgent } from './create.js';

export interface StartAgentOptions {
  name: string;
  debug?: boolean;
  trace?: boolean;
}

export async function startAgent(options: StartAgentOptions): Promise<void> {
  const { name, debug = false, trace = false } = options;

  const container = Container.getInstance();
  let agentDetails = await container.agentRegistry.get(name);

  if (!agentDetails || !agentDetails.hasConfig || !agentDetails.hasCertificate) {
    console.log(`📦 Agent '${name}' not found or incomplete. Creating...\n`);

    await createAgent({
      name,
      port: 4223,
      host: '127.0.0.1'
    });

    console.log('\n✅ Agent initialized successfully!\n');

    // Refresh agent details after creation
    agentDetails = await container.agentRegistry.get(name);

    if (!agentDetails) {
      throw new Error(`Failed to create agent '${name}'`);
    }
  }

  const configPath = join(AGENTS_DIR, name, 'config', `${name}.conf`);

  console.log(`   Port: ${agentDetails.port}`);
  console.log(`   Host: ${agentDetails.host}`);

  await container.processRunner.start({
    configPath,
    entityName: `agent '${name}'`,
    entityType: 'agent',
    debug,
    trace,
  });
}
