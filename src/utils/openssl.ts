import { execSync } from 'node:child_process';

/**
 * Execute OpenSSL command with error handling
 * @param command - OpenSSL command to execute
 * @param operation - Human-readable operation description
 * @throws Error if OpenSSL command fails
 */
export function executeOpenSSL(command: string, operation: string): void {
  try {
    execSync(command, { stdio: 'pipe' });
  } catch (error) {
    console.error(`❌ OpenSSL error during ${operation}:`);
    if (error instanceof Error) {
      const stderr = (error as Error & { stderr?: Buffer }).stderr?.toString() || error.message;

      console.error(stderr);
    }
    throw new Error(`Failed to ${operation}`);
  }
}

/**
 * Check if OpenSSL is available in PATH
 * Exits process if OpenSSL is not found
 */
export function checkOpenSSLAvailable(): void {
  try {
    execSync('openssl version', { stdio: 'pipe' });
  } catch {
    console.error('❌ OpenSSL not found in PATH');
    console.error('Please install OpenSSL and ensure it is in your PATH');
    console.error('');
    console.error('Installation instructions:');
    console.error('  macOS: brew install openssl');
    console.error('  Ubuntu/Debian: sudo apt-get install openssl');
    console.error('  Windows: https://slproweb.com/products/Win32OpenSSL.html');
    throw new Error('OpenSSL is not installed. Please install it first.');
  }
}
