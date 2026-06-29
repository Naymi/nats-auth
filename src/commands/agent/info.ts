import { NodeFileSystem } from '../../core/certificates/adapters/filesystem.js';
import { AgentRegistry } from '../../core/agent/registry.js';

export interface AgentDetails {
  name: string;
  port?: number;
  host?: string;
  storeDir?: string;
  hasCertificate: boolean;
  hasConfig: boolean;
  certPath?: string;
  configPath?: string;
  agentDir?: string;
  certInfo?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
  };
}

export async function getAgentInfo(name: string): Promise<AgentDetails> {
  const registry = new AgentRegistry(new NodeFileSystem());
  const details = await registry.get(name);

  if (!details) {
    return {
      name,
      hasCertificate: false,
      hasConfig: false,
    };
  }

  return details;
}
