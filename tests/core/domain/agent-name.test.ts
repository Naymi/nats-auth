import { describe, test, expect } from 'vitest';
import { AgentName } from '../../../src/core/domain/agent-name.js';

describe('AgentName', () => {
  test('accepts valid agent name with letters and numbers', () => {
    const name = new AgentName('agent123');
    expect(name.toString()).toBe('agent123');
  });

  test('accepts valid agent name with hyphens', () => {
    const name = new AgentName('my-agent');
    expect(name.toString()).toBe('my-agent');
  });

  test('accepts valid agent name with underscores', () => {
    const name = new AgentName('my_agent');
    expect(name.toString()).toBe('my_agent');
  });

  test('rejects agent name with invalid characters', () => {
    expect(() => new AgentName('agent@invalid')).toThrow();
  });

  test('rejects empty agent name', () => {
    expect(() => new AgentName('')).toThrow();
  });

  test('equals returns true for same value', () => {
    const name1 = new AgentName('agent1');
    const name2 = new AgentName('agent1');
    expect(name1.equals(name2)).toBe(true);
  });

  test('equals returns false for different values', () => {
    const name1 = new AgentName('agent1');
    const name2 = new AgentName('agent2');
    expect(name1.equals(name2)).toBe(false);
  });
});