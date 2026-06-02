// Deletes the database file. Use carefully — destroys all logged data.
import { unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db', 'training.db');

if (existsSync(DB_PATH)) {
  unlinkSync(DB_PATH);
  console.log(`Deleted: ${DB_PATH}`);
} else {
  console.log('No database file to delete.');
}
