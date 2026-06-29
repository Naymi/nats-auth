import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ensureDir, removeDir } from '../fs.js';
import { access, stat } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

describe('fs utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await mkdtemp(join(tmpdir(), 'nats-auth-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('ensureDir', () => {
    it('should create a directory if it does not exist', async () => {
      const newDir = join(testDir, 'new-directory');

      await ensureDir(newDir);

      const dirStat = await stat(newDir);
      expect(dirStat.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const existingDir = join(testDir, 'existing-directory');

      await ensureDir(existingDir);
      await expect(ensureDir(existingDir)).resolves.not.toThrow();

      const dirStat = await stat(existingDir);
      expect(dirStat.isDirectory()).toBe(true);
    });

    it('should create nested directories', async () => {
      const nestedDir = join(testDir, 'level1', 'level2', 'level3');

      await ensureDir(nestedDir);

      const dirStat = await stat(nestedDir);
      expect(dirStat.isDirectory()).toBe(true);
    });
  });

  describe('removeDir', () => {
    it('should remove an existing directory', async () => {
      const dirToRemove = join(testDir, 'to-remove');
      await ensureDir(dirToRemove);

      await removeDir(dirToRemove);

      await expect(access(dirToRemove, constants.F_OK)).rejects.toThrow();
    });

    it('should not throw if directory does not exist', async () => {
      const nonExistentDir = join(testDir, 'non-existent');

      await expect(removeDir(nonExistentDir)).resolves.not.toThrow();
    });

    it('should remove directory with contents', async () => {
      const dirWithFiles = join(testDir, 'with-files');
      await ensureDir(dirWithFiles);

      const { writeFile } = await import('fs/promises');
      await writeFile(join(dirWithFiles, 'file.txt'), 'test content');

      await removeDir(dirWithFiles);

      await expect(access(dirWithFiles, constants.F_OK)).rejects.toThrow();
    });
  });
});
