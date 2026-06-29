import { describe, test, expect } from 'vitest';
import { Port } from '../../../src/core/domain/port.js';

describe('Port', () => {
  test('accepts valid port number', () => {
    const port = new Port(8080);
    expect(port.toNumber()).toBe(8080);
  });

  test('accepts minimum valid port (1)', () => {
    const port = new Port(1);
    expect(port.toNumber()).toBe(1);
  });

  test('accepts maximum valid port (65535)', () => {
    const port = new Port(65535);
    expect(port.toNumber()).toBe(65535);
  });

  test('rejects port 0', () => {
    expect(() => new Port(0)).toThrow();
  });

  test('rejects port above 65535', () => {
    expect(() => new Port(65536)).toThrow();
  });

  test('rejects negative port', () => {
    expect(() => new Port(-1)).toThrow();
  });

  test('equals returns true for same value', () => {
    const port1 = new Port(8080);
    const port2 = new Port(8080);
    expect(port1.equals(port2)).toBe(true);
  });

  test('equals returns false for different values', () => {
    const port1 = new Port(8080);
    const port2 = new Port(9090);
    expect(port1.equals(port2)).toBe(false);
  });
});
