import { rm, rename } from 'fs/promises';
import { ensureDir } from '../../utils/fs.js';

/**
 * Transaction class for atomic agent creation
 * Creates agent in temporary directory, then atomically moves to target
 */
export class AgentTransaction {
  private tempDir: string | null = null;
  private targetDir: string | null = null;
  private committed = false;

  /**
   * Begin transaction by creating temporary directory
   * @param targetDir - Final target directory for the agent
   * @returns Temporary directory path
   */
  async begin(targetDir: string): Promise<string> {
    this.targetDir = targetDir;
    this.tempDir = `${targetDir}.tmp-${Date.now()}`;
    await ensureDir(this.tempDir);
    return this.tempDir;
  }

  /**
   * Commit transaction by atomically renaming temp directory to target
   */
  async commit(): Promise<void> {
    if (!this.tempDir || !this.targetDir) {
      throw new Error('Transaction not started');
    }

    // Atomic rename operation
    await rename(this.tempDir, this.targetDir);
    this.committed = true;
  }

  /**
   * Rollback transaction by removing temporary directory
   */
  async rollback(): Promise<void> {
    if (!this.tempDir) return;

    try {
      await rm(this.tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors during rollback
    }
  }

  /**
   * Cleanup - rollback if not committed
   * Call this in finally block
   */
  async cleanup(): Promise<void> {
    if (!this.committed) {
      await this.rollback();
    }
  }
}
