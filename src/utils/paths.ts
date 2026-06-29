import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const CERTS_DIR = resolve(__dirname, '../../certs');
export const CONFIG_DIR = resolve(__dirname, '../../config');
export const AGENTS_DIR = resolve(__dirname, '../../agents');








