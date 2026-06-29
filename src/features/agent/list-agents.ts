import { NodeFileSystem } from './adapters/filesystem.js';
import { AgentRegistry, AgentSummary } from './registry.js';

export interface AgentInfo {
  name: string;
  hasCertificate: boolean;
  hasConfig: boolean;
  certPath?: string;
  configPath?: string;
  agentDir?: string;
}

export async function listAgents(): Promise<AgentInfo[]> {
  const registry = new AgentRegistry(new NodeFileSystem());
  const agents = await registry.list();

  return agents.map((agent: AgentSummary): AgentInfo => ({
    name: agent.name,
    hasCertificate: agent.hasCertificate,
    hasConfig: agent.hasConfig,
    certPath: agent.certPath,
    configPath: agent.configPath,
    agentDir: agent.agentDir,
  }));
}
