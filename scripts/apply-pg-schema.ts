// Apply src/lib/db/schema.postgres.sql to Supabase.
// Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const schema = readFileSync('src/lib/db/schema.postgres.sql', 'utf8');
const sql = postgres(url, { ssl: 'require', max: 1 });

try {
  await sql.unsafe(schema);
  console.log('Schema applied.');
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  console.log(`public tables (${tables.length}):`, tables.map((t) => t.tablename).join(', '));
} catch (e) {
  console.error('Schema apply failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
