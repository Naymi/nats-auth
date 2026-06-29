import { Container } from '../../core/container.js';
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
  const container = Container.getInstance();
  const details = await container.agentRegistry.get(name);

  if (!details) {
    return {
      name,
      hasCertificate: false,
      hasConfig: false,
    };
  }

  return details;
}
