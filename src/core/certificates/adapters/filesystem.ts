import { constants } from 'node:fs';
import { access, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';

export interface FileStats {
  isDirectory: boolean;
  isFile: boolean;
}

export interface FileSystemAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readDir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStats | null>;
  exists(path: string): Promise<boolean>;
  createDir(path: string): Promise<void>;
  removeDir(path: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
}

export class NodeFileSystem implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    return readFile(path, 'utf8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    await writeFile(path, content, 'utf8');
  }

  async readDir(path: string): Promise<string[]> {
    return readdir(path);
  }

  async stat(path: string): Promise<FileStats | null> {
    try {
      const stats = await stat(path);
      return {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch {
      return null;
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async createDir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  async removeDir(path: string): Promise<void> {
    await rm(path, { recursive: true, force: true });
  }

  async rename(from: string, to: string): Promise<void> {
    await rename(from, to);
  }
}
