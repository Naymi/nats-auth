import { Container } from '../../core/container.js';
import { AgentSummary } from '../../core/agent/registry.js';

export interface AgentInfo {
  name: string;
  hasCertificate: boolean;
  hasConfig: boolean;
  certPath?: string;
  configPath?: string;
  agentDir?: string;
}

export async function listAgents(): Promise<AgentInfo[]> {
  const container = Container.getInstance();
  const agents = await container.agentRegistry.list();

  return agents.map((agent: AgentSummary): AgentInfo => ({
    name: agent.name,
    hasCertificate: agent.hasCertificate,
    hasConfig: agent.hasConfig,
    certPath: agent.certPath,
    configPath: agent.configPath,
    agentDir: agent.agentDir,
  }));
}
