import { join } from 'node:path';
import { AGENTS_DIR } from "../../shared/paths.js";
import { Container } from '../../core/container.js';

export interface StartAgentOptions {
  name: string;
  debug?: boolean;
  trace?: boolean;
}

export async function startAgent(options: StartAgentOptions): Promise<void> {
  const { name, debug = false, trace = false } = options;

  const container = Container.getInstance();
  const agentDetails = await container.agentRegistry.get(name);

  if (!agentDetails) {
    throw new Error(`Agent '${name}' not found`);
  }

  if (!agentDetails.hasConfig) {
    throw new Error(`Agent '${name}' has no configuration file`);
  }

  if (!agentDetails.hasCertificate) {
    throw new Error(`Agent '${name}' has no certificate`);
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
