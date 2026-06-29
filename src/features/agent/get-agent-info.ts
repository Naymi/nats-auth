import { readFile } from 'fs/promises';
import { join } from 'path';
import { AGENTS_DIR } from '../../utils/paths.js';
import { execSync } from 'child_process';

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
  const details: AgentDetails = {
    name,
    hasCertificate: false,
    hasConfig: false,
  };

  const agentDir = join(AGENTS_DIR, name);
  const certPath = join(agentDir, 'certs', `${name}.crt`);
  const keyPath = join(agentDir, 'certs', `${name}.key`);
  const configPath = join(agentDir, 'config', `${name}.conf`);

  details.agentDir = agentDir;

  try {
    await readFile(certPath);
    await readFile(keyPath);
    details.hasCertificate = true;
    details.certPath = certPath;

    try {
      const certText = execSync(`openssl x509 -in ${certPath} -noout -text`, { encoding: 'utf-8' });
      const subjectMatch = certText.match(/Subject: (.+)/);
      const issuerMatch = certText.match(/Issuer: (.+)/);
      const validFromMatch = certText.match(/Not Before: (.+)/);
      const validToMatch = certText.match(/Not After : (.+)/);

      details.certInfo = {
        subject: subjectMatch ? subjectMatch[1].trim() : 'Unknown',
        issuer: issuerMatch ? issuerMatch[1].trim() : 'Unknown',
        validFrom: validFromMatch ? validFromMatch[1].trim() : 'Unknown',
        validTo: validToMatch ? validToMatch[1].trim() : 'Unknown',
      };
    } catch (error) {
      // Certificate info extraction failed
    }
  } catch {
    // Certificate doesn't exist
  }

  try {
    const configContent = await readFile(configPath, 'utf-8');
    details.hasConfig = true;
    details.configPath = configPath;

    const portMatch = configContent.match(/^port:\s*(\d+)/m);
    const hostMatch = configContent.match(/^host:\s*(.+)/m);
    const storeDirMatch = configContent.match(/store_dir:\s*"([^"]+)"/);

    if (portMatch) details.port = parseInt(portMatch[1], 10);
    if (hostMatch) details.host = hostMatch[1].trim();
    if (storeDirMatch) details.storeDir = storeDirMatch[1];
  } catch {
    // Config doesn't exist
  }

  return details;
}
