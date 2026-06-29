import path from 'node:path';

import { AGENTS_DIR } from '../../utils/paths.js';

export function getAgentDir(agentName: string): string {
  return path.join(AGENTS_DIR, agentName);
}

export function getAgentCertsDir(agentName: string): string {
  return path.join(AGENTS_DIR, agentName, 'certs');
}

export function getAgentConfigDir(agentName: string): string {
  return path.join(AGENTS_DIR, agentName, 'config');
}

export function getAgentJetStreamDir(agentName: string): string {
  return path.join(AGENTS_DIR, agentName, 'jetstream');
}
