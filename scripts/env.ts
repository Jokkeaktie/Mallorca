import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';

const root = join(__dirname, '..');
const envLocal = join(root, '.env.local');
const envDefault = join(root, '.env');

if (existsSync(envLocal)) {
  config({ path: envLocal });
} else if (existsSync(envDefault)) {
  config({ path: envDefault });
}
