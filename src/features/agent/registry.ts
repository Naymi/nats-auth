import { execSync } from 'node:child_process';
import path from 'node:path';

import { DEFAULT_CONFIG } from '../../config/defaults.js';
import { CERTS_DIR } from '../../utils/paths.js';
import { CertificateAuthority } from '../certificate-authority/certificate-authority.js';
import { NodeOpenSSL } from '../certificate-authority/adapters/openssl.js';

import { FileSystemAdapter } from './adapters/filesystem.js';
import { generateAgentConfig } from './generate-config.js';
import {
  getAgentCertsDir,
  getAgentConfigDir,
  getAgentDir,
  getAgentJetStreamDir,
} from './paths.js';

export interface AgentSummary {
  name: string;
  hasCertificate: boolean;
  hasConfig: boolean;
  certPath?: string;
  configPath?: string;
  agentDir: string;
}

export interface CertInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
}

export interface AgentDetails extends AgentSummary {
  port?: number;
  host?: string;
  storeDir?: string;
  certInfo?: CertInfo;
}

export interface CreateAgentSpec {
  name: string;
  port: number;
  host: string;
}

export interface AgentChanges {
  port?: number;
  host?: string;
  remoteUrl?: string;
}

interface ParsedConfig {
  port?: number;
  host?: string;
  storeDir?: string;
  remoteUrl?: string;
  fullContent: string;
}

export class AgentRegistry {
  constructor(private fs: FileSystemAdapter) {}

  async list(): Promise<AgentSummary[]> {
    const agents: AgentSummary[] = [];

    const agentsDir = path.dirname(getAgentDir('dummy')); // Get AGENTS_DIR

    const dirExists = await this.fs.exists(agentsDir);
    if (!dirExists) {
      return agents;
    }

    let agentDirs: string[];
    try {
      agentDirs = await this.fs.readDir(agentsDir);
    } catch {
      return agents;
    }

    for (const name of agentDirs) {
      const agentDir = getAgentDir(name);
      const agentStat = await this.fs.stat(agentDir);

      if (!agentStat || !agentStat.isDirectory) {
        continue;
      }

      const certPath = path.join(getAgentCertsDir(name), `${name}.crt`);
      const keyPath = path.join(getAgentCertsDir(name), `${name}.key`);
      const configPath = path.join(getAgentConfigDir(name), `${name}.conf`);

      const certStat = await this.fs.stat(certPath);
      const keyStat = await this.fs.stat(keyPath);
      const configStat = await this.fs.stat(configPath);

      agents.push({
        name,
        hasCertificate: !!(certStat && keyStat),
        hasConfig: !!configStat,
        certPath: certStat ? certPath : undefined,
        configPath: configStat ? configPath : undefined,
        agentDir,
      });
    }

    return agents.sort((a, b) => a.name.localeCompare(b.name));
  }

  async get(name: string): Promise<AgentDetails | null> {
    const agentDir = getAgentDir(name);
    const certPath = path.join(getAgentCertsDir(name), `${name}.crt`);
    const keyPath = path.join(getAgentCertsDir(name), `${name}.key`);
    const configPath = path.join(getAgentConfigDir(name), `${name}.conf`);

    const agentDirExists = await this.fs.exists(agentDir);
    if (!agentDirExists) {
      return null;
    }

    const details: AgentDetails = {
      name,
      hasCertificate: false,
      hasConfig: false,
      agentDir,
    };

    // Check certificate
    const certExists = await this.fs.exists(certPath);
    const keyExists = await this.fs.exists(keyPath);

    if (certExists && keyExists) {
      details.hasCertificate = true;
      details.certPath = certPath;
      details.certInfo = await this.extractCertInfo(certPath);
    }

    // Check config
    const configExists = await this.fs.exists(configPath);
    if (configExists) {
      details.hasConfig = true;
      details.configPath = configPath;

      const configContent = await this.fs.readFile(configPath);
      const parsed = this.parseConfig(configContent);
      details.port = parsed.port;
      details.host = parsed.host;
      details.storeDir = parsed.storeDir;
    }

    return details;
  }

  async exists(name: string): Promise<boolean> {
    const agentDir = getAgentDir(name);
    return this.fs.exists(agentDir);
  }

  async create(spec: CreateAgentSpec): Promise<void> {
    const { name, port, host } = spec;

    // Check if Root CA exists
    const rootCAExists = await this.fs.exists(path.join(CERTS_DIR, 'rootCA.crt'));
    if (!rootCAExists) {
      throw new Error('Root CA not found. Generate it first with "gen:main" or "setup" command.');
    }

    // Check for port conflicts
    await this.checkPortConflict(port);

    const agentDir = getAgentDir(name);

    // Create agent atomically using transaction
    await this.withTransaction(agentDir, async (tempDir) => {
      const tempCertsDir = path.join(tempDir, 'certs');
      const tempConfigDir = path.join(tempDir, 'config');
      const tempJetStreamDir = path.join(tempDir, 'jetstream');

      await this.fs.createDir(tempCertsDir);
      await this.fs.createDir(tempConfigDir);

      console.log(`🔧 Creating agent: ${name}`);
      console.log(`   Directory: ${agentDir}`);
      console.log(`   Port: ${port}`);
      console.log(`   Host: ${host}\n`);

      // Generate certificates using CA module
      const ca = new CertificateAuthority(new NodeOpenSSL(), this.fs);
      const rootCA = {
        keyPath: path.join(CERTS_DIR, 'rootCA.key'),
        certPath: path.join(CERTS_DIR, 'rootCA.crt'),
      };
      await ca.issueLeafCert(rootCA, name, { certsDir: tempCertsDir });

      // Generate config with final paths (not temp paths)
      const finalCertsDir = getAgentCertsDir(name);
      const finalConfigDir = getAgentConfigDir(name);
      const finalJetStreamDir = getAgentJetStreamDir(name);
      await generateAgentConfig(CERTS_DIR, finalCertsDir, tempConfigDir, finalJetStreamDir, name, port, host);

      console.log(`\n✨ Agent '${name}' created successfully!`);
      console.log(`   Directory: ${agentDir}`);
      console.log(`   Certificate: ${getAgentCertsDir(name)}/${name}.crt`);
      console.log(`   Config: ${getAgentConfigDir(name)}/${name}.conf`);
      console.log(`\nStart with: nats-server -c ${getAgentConfigDir(name)}/${name}.conf`);
    });
  }

  async update(name: string, changes: AgentChanges): Promise<void> {
    const configPath = path.join(getAgentConfigDir(name), `${name}.conf`);

    const configExists = await this.fs.exists(configPath);
    if (!configExists) {
      throw new Error(`Configuration for agent '${name}' not found.`);
    }

    console.log(`✏️  Editing configuration for agent: ${name}...`);

    let configContent = await this.fs.readFile(configPath);

    // Check for port conflicts if port is being changed
    if (changes.port !== undefined) {
      await this.checkPortConflict(changes.port, name);
      configContent = configContent.replace(/^port:\s*\d+/m, `port: ${changes.port}`);
      console.log(`   Updated port: ${changes.port}`);
    }

    if (changes.host !== undefined) {
      configContent = /^host:/m.test(configContent)
        ? configContent.replace(/^host:\s*.+/m, `host: ${changes.host}`)
        : configContent.replace(/^port:(.+)/m, `port:$1\nhost: ${changes.host}`);
      console.log(`   Updated host: ${changes.host}`);
    }

    if (changes.remoteUrl !== undefined) {
      configContent = configContent.replace(/url:\s*"[^"]+"/, `url: "${changes.remoteUrl}"`);
      console.log(`   Updated remote URL: ${changes.remoteUrl}`);
    }

    await this.fs.writeFile(configPath, configContent);

    console.log(`\n✨ Agent '${name}' configuration updated successfully!`);
    console.log(`   Config: ${configPath}`);
  }

  async delete(name: string): Promise<void> {
    const agentDir = getAgentDir(name);
    await this.fs.removeDir(agentDir);
  }

  async checkPortConflict(port: number, excludeName?: string): Promise<void> {
    const agents = await this.list();

    for (const agent of agents) {
      if (excludeName && agent.name === excludeName) {
        continue;
      }

      if (!agent.hasConfig) {
        continue;
      }

      const details = await this.get(agent.name);
      if (details && details.port === port) {
        throw new Error(
          `Port ${port} is already used by agent '${agent.name}'. Please choose a different port.`
        );
      }
    }
  }

  private parseConfig(content: string): ParsedConfig {
    const portMatch = content.match(/^port:\s*(\d+)/m);
    const hostMatch = content.match(/^host:\s*(.+)/m);
    const storeDirMatch = content.match(/store_dir:\s*"([^"]+)"/);
    const remoteUrlMatch = content.match(/url:\s*"([^"]+)"/);

    return {
      port: portMatch ? Number.parseInt(portMatch[1], 10) : undefined,
      host: hostMatch ? hostMatch[1].trim() : undefined,
      storeDir: storeDirMatch ? storeDirMatch[1] : undefined,
      remoteUrl: remoteUrlMatch ? remoteUrlMatch[1] : undefined,
      fullContent: content,
    };
  }

  private async extractCertInfo(certPath: string): Promise<CertInfo | undefined> {
    try {
      const certText = execSync(`openssl x509 -in ${certPath} -noout -text`, { encoding: 'utf8' });
      const subjectMatch = certText.match(/Subject: (.+)/);
      const issuerMatch = certText.match(/Issuer: (.+)/);
      const validFromMatch = certText.match(/Not Before: (.+)/);
      const validToMatch = certText.match(/Not After : (.+)/);

      return {
        subject: subjectMatch ? subjectMatch[1].trim() : 'Unknown',
        issuer: issuerMatch ? issuerMatch[1].trim() : 'Unknown',
        validFrom: validFromMatch ? validFromMatch[1].trim() : 'Unknown',
        validTo: validToMatch ? validToMatch[1].trim() : 'Unknown',
      };
    } catch {
      return undefined;
    }
  }

  private async withTransaction<T>(
    targetDir: string,
    fn: (tempDir: string) => Promise<T>
  ): Promise<T> {
    const tempDir = `${targetDir}.tmp-${Date.now()}`;
    let committed = false;

    try {
      // Begin transaction - create temporary directory
      await this.fs.createDir(tempDir);

      // Execute operation
      const result = await fn(tempDir);

      // Commit transaction - atomically rename temp to target
      await this.fs.rename(tempDir, targetDir);
      committed = true;

      return result;
    } catch (error) {
      // Rollback on error
      if (!committed) {
        try {
          await this.fs.removeDir(tempDir);
        } catch {
          // Ignore cleanup errors during rollback
        }
      }
      throw error;
    }
  }
}
