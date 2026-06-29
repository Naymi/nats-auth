import { describe, it, expect, vi } from 'vitest';
import { executeOpenSSL, checkOpenSSLAvailable } from '../openssl.js';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('openssl utilities', () => {
  describe('executeOpenSSL', () => {
    it('should execute command successfully', async () => {
      const { execSync } = await import('child_process');
      vi.mocked(execSync).mockReturnValue(Buffer.from('success'));

      expect(() => executeOpenSSL('openssl version', 'test operation')).not.toThrow();
      expect(execSync).toHaveBeenCalledWith('openssl version', { stdio: 'pipe' });
    });

    it('should throw with descriptive error message on failure', async () => {
      const { execSync } = await import('child_process');
      const mockError = new Error('Command failed');
      (mockError as any).stderr = Buffer.from('OpenSSL error details');
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
      const { execSync } = await import('child_process');
      vi.mocked(execSync).mockReturnValue(Buffer.from('OpenSSL 3.0.0'));

      expect(() => checkOpenSSLAvailable()).not.toThrow();
      expect(execSync).toHaveBeenCalledWith('openssl version', { stdio: 'pipe' });
    });

    it('should exit process if OpenSSL is not available', async () => {
      const { execSync } = await import('child_process');
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found');
      });

      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      checkOpenSSLAvailable();

      expect(mockConsoleError).toHaveBeenCalledWith('❌ OpenSSL not found in PATH');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});
