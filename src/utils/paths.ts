import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CERTS_DIR = path.resolve(__dirname, '../../certs');
export const CONFIG_DIR = path.resolve(__dirname, '../../config');
export const AGENTS_DIR = path.resolve(__dirname, '../../agents');
