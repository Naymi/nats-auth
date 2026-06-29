import { describe, test, expect } from 'vitest';
import { Host } from '../../../src/core/domain/host.js';

describe('Host', () => {
  test('accepts valid IPv4 address', () => {
    const host = new Host('127.0.0.1');
    expect(host.toString()).toBe('127.0.0.1');
  });

  test('accepts valid hostname', () => {
    const host = new Host('localhost');
    expect(host.toString()).toBe('localhost');
  });

  test('accepts valid FQDN', () => {
    const host = new Host('example.com');
    expect(host.toString()).toBe('example.com');
  });

  test('accepts 0.0.0.0 (bind all interfaces)', () => {
    const host = new Host('0.0.0.0');
    expect(host.toString()).toBe('0.0.0.0');
  });

  test('rejects invalid host format', () => {
    expect(() => new Host('invalid@host')).toThrow();
  });

  test('rejects empty host', () => {
    expect(() => new Host('')).toThrow();
  });

  test('equals returns true for same value', () => {
    const host1 = new Host('localhost');
    const host2 = new Host('localhost');
    expect(host1.equals(host2)).toBe(true);
  });

  test('equals returns false for different values', () => {
    const host1 = new Host('localhost');
    const host2 = new Host('0.0.0.0');
    expect(host1.equals(host2)).toBe(false);
  });
});
