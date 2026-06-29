import { describe, expect, it, vi } from 'vitest';

import { checkOpenSSLAvailable, executeOpenSSL } from '../openssl.js';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('openssl utilities', () => {
  describe('executeOpenSSL', () => {
    it('should execute command successfully', async () => {
      const { execSync } = await import('node:child_process');

      vi.mocked(execSync).mockReturnValue(Buffer.from('success'));

      expect(() => executeOpenSSL('openssl version', 'test operation')).not.toThrow();
      expect(execSync).toHaveBeenCalledWith('openssl version', { stdio: 'pipe' });
    });

    it('should throw with descriptive error message on failure', async () => {
      const { execSync } = await import('node:child_process');
      const mockError = new Error('Command failed') as Error & { stderr: Buffer };

      mockError.stderr = Buffer.from('OpenSSL error details');
      vi.mocked(execSync).mockImplementation(() => {
        throw mockError;
      });

      expect(() => executeOpenSSL('openssl invalid', 'test operation')).toThrow(
        'Failed to test operation'
      );
    });
  });

  describe('checkOpenSSLAvailable', () => {
    it('should not throw if OpenSSL is available', async () => {
      const { execSync } = await import('node:child_process');

      vi.mocked(execSync).mockReturnValue(Buffer.from('OpenSSL 3.0.0'));

      expect(() => checkOpenSSLAvailable()).not.toThrow();
      expect(execSync).toHaveBeenCalledWith('openssl version', { stdio: 'pipe' });
    });

    it('should throw error if OpenSSL is not available', async () => {
      const { execSync } = await import('node:child_process');

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found');
      });

      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => checkOpenSSLAvailable()).toThrow('OpenSSL is not installed');
      expect(mockConsoleError).toHaveBeenCalledWith('❌ OpenSSL not found in PATH');

      mockConsoleError.mockRestore();
    });
  });
});
