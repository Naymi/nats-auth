import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NATSProcessRunner, type SpawnFunction } from '../../../src/core/process/runner.js';
import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';

describe('NATSProcessRunner', () => {
  let mockSpawn: SpawnFunction;
  let mockProcess: ChildProcess & EventEmitter;

  beforeEach(() => {
    mockProcess = new EventEmitter() as ChildProcess & EventEmitter;
    mockProcess.kill = vi.fn();

    mockSpawn = vi.fn(() => mockProcess);
  });

  test('spawns nats-server with config path', async () => {
    const runner = new NATSProcessRunner(mockSpawn);

    const startPromise = runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(mockSpawn).toHaveBeenCalledWith(
      'nats-server',
      ['-c', '/path/to/config.conf'],
      { stdio: 'inherit', shell: false }
    );

    mockProcess.emit('exit', 0, null);
  });

  test('includes debug flag when debug is true', async () => {
    const runner = new NATSProcessRunner(mockSpawn);

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
      debug: true,
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(mockSpawn).toHaveBeenCalledWith(
      'nats-server',
      ['-c', '/path/to/config.conf', '-D'],
      { stdio: 'inherit', shell: false }
    );

    mockProcess.emit('exit', 0, null);
  });

  test('includes trace flag when trace is true', async () => {
    const runner = new NATSProcessRunner(mockSpawn);

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
      trace: true,
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(mockSpawn).toHaveBeenCalledWith(
      'nats-server',
      ['-c', '/path/to/config.conf', '-V'],
      { stdio: 'inherit', shell: false }
    );

    mockProcess.emit('exit', 0, null);
  });

  test('includes both debug and trace flags', async () => {
    const runner = new NATSProcessRunner(mockSpawn);

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
      debug: true,
      trace: true,
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(mockSpawn).toHaveBeenCalledWith(
      'nats-server',
      ['-c', '/path/to/config.conf', '-D', '-V'],
      { stdio: 'inherit', shell: false }
    );

    mockProcess.emit('exit', 0, null);
  });

  test('exits cleanly on code 0', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));
    mockProcess.emit('exit', 0, null);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('stopped gracefully'));

    consoleSpy.mockRestore();
  });

  test('handles ENOENT error when nats-server not found', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));

    const error = new Error('spawn nats-server ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockProcess.emit('error', error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ nats-server not found in PATH');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  test('handles non-zero exit code', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));
    mockProcess.emit('exit', 1, null);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('exited with code: 1'));
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  test('handles exit by signal', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));
    mockProcess.emit('exit', null, 'SIGTERM');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('stopped by signal: SIGTERM'));

    consoleSpy.mockRestore();
  });

  test('sets up SIGINT handler', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    const processOnSpy = vi.spyOn(process, 'on');

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

    mockProcess.emit('exit', 0, null);
    processOnSpy.mockRestore();
  });

  test('sets up SIGTERM handler', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    const processOnSpy = vi.spyOn(process, 'on');

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

    mockProcess.emit('exit', 0, null);
    processOnSpy.mockRestore();
  });

  test('kills process on SIGINT', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    let sigintHandler: (() => void) | undefined;

    vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT') {
        sigintHandler = handler as () => void;
      }
      return process;
    });

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(sigintHandler).toBeDefined();
    sigintHandler!();

    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

    mockProcess.emit('exit', 0, null);
  });

  test('kills process on SIGTERM', async () => {
    const runner = new NATSProcessRunner(mockSpawn);
    let sigtermHandler: (() => void) | undefined;

    vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGTERM') {
        sigtermHandler = handler as () => void;
      }
      return process;
    });

    runner.start({
      configPath: '/path/to/config.conf',
      entityName: 'test-server',
      entityType: 'server',
    });

    await new Promise(resolve => setImmediate(resolve));

    expect(sigtermHandler).toBeDefined();
    sigtermHandler!();

    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

    mockProcess.emit('exit', 0, null);
  });
});
