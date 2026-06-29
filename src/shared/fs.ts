import { constants } from 'node:fs';
import { access, mkdir, rm } from 'node:fs/promises';

export async function ensureDir(dir: string): Promise<void> {
  try {
    await access(dir, constants.F_OK);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

export async function removeDir(dir: string): Promise<void> {
  try {
    await access(dir, constants.F_OK);
    await rm(dir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, nothing to remove
  }
}
