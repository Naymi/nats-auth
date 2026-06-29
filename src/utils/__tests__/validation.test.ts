import { describe, expect, it } from 'vitest';

import {
  AgentNameSchema,
  CreateAgentOptionsSchema,
  HostSchema,
  PortSchema,
} from '../validation.js';

describe('AgentNameSchema', () => {
  it('should accept valid agent names', () => {
    expect(() => AgentNameSchema.parse('agent')).not.toThrow();
    expect(() => AgentNameSchema.parse('agent-1')).not.toThrow();
    expect(() => AgentNameSchema.parse('my_agent')).not.toThrow();
    expect(() => AgentNameSchema.parse('Agent123')).not.toThrow();
  });

  it('should reject empty names', () => {
    expect(() => AgentNameSchema.parse('')).toThrow('Agent name cannot be empty');
  });

  it('should reject names that are too long', () => {
    const longName = 'a'.repeat(64);

    expect(() => AgentNameSchema.parse(longName)).toThrow('Agent name too long');
  });

  it('should reject names with invalid characters', () => {
    expect(() => AgentNameSchema.parse('agent@host')).toThrow(
      'Agent name can only contain letters, numbers, hyphens, and underscores'
    );
    expect(() => AgentNameSchema.parse('agent.name')).toThrow();
    expect(() => AgentNameSchema.parse('agent/name')).toThrow();
    expect(() => AgentNameSchema.parse('agent name')).toThrow();
  });
});

describe('PortSchema', () => {
  it('should accept valid ports', () => {
    expect(() => PortSchema.parse(1)).not.toThrow();
    expect(() => PortSchema.parse(4223)).not.toThrow();
    expect(() => PortSchema.parse(65535)).not.toThrow();
  });

  it('should reject ports below 1', () => {
    expect(() => PortSchema.parse(0)).toThrow('Port must be >= 1');
    expect(() => PortSchema.parse(-1)).toThrow();
  });

  it('should reject ports above 65535', () => {
    expect(() => PortSchema.parse(65536)).toThrow('Port must be <= 65535');
    expect(() => PortSchema.parse(99999)).toThrow();
  });

  it('should reject non-integer ports', () => {
    expect(() => PortSchema.parse(4223.5)).toThrow('Port must be an integer');
  });
});

describe('HostSchema', () => {
  it('should accept valid IPv4 addresses', () => {
    expect(() => HostSchema.parse('127.0.0.1')).not.toThrow();
    expect(() => HostSchema.parse('192.168.1.1')).not.toThrow();
    expect(() => HostSchema.parse('0.0.0.0')).not.toThrow();
  });

  it('should accept valid hostnames', () => {
    expect(() => HostSchema.parse('localhost')).not.toThrow();
    expect(() => HostSchema.parse('example.com')).not.toThrow();
    expect(() => HostSchema.parse('my-server')).not.toThrow();
    expect(() => HostSchema.parse('api.example.com')).not.toThrow();
  });

  it('should reject empty hosts', () => {
    expect(() => HostSchema.parse('')).toThrow('Host cannot be empty');
  });

  it('should reject invalid formats', () => {
    expect(() => HostSchema.parse('invalid@host')).toThrow('Invalid host format');
    expect(() => HostSchema.parse('host with spaces')).toThrow();
  });
});

describe('CreateAgentOptionsSchema', () => {
  it('should accept valid options', () => {
    const result = CreateAgentOptionsSchema.parse({
      name: 'agent',
      port: 4223,
      host: '127.0.0.1',
    });

    expect(result.name).toBe('agent');
    expect(result.port).toBe(4223);
    expect(result.host).toBe('127.0.0.1');
  });

  it('should apply default values', () => {
    const result = CreateAgentOptionsSchema.parse({
      name: 'agent',
    });

    expect(result.name).toBe('agent');
    expect(result.port).toBe(4223);
    expect(result.host).toBe('127.0.0.1');
  });

  it('should validate all fields', () => {
    expect(() =>
      CreateAgentOptionsSchema.parse({
        name: 'invalid@name',
        port: 4223,
        host: '127.0.0.1',
      })
    ).toThrow();

    expect(() =>
      CreateAgentOptionsSchema.parse({
        name: 'agent',
        port: 99999,
        host: '127.0.0.1',
      })
    ).toThrow();

    expect(() =>
      CreateAgentOptionsSchema.parse({
        name: 'agent',
        port: 4223,
        host: 'invalid@host',
      })
    ).toThrow();
  });
});
