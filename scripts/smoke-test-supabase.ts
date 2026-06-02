// Quick connection smoke test. Confirms we can reach Supabase Postgres
// and read server-side metadata. Run with: npx tsx scripts/smoke-test-supabase.ts

import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing in .env.local');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1 });

try {
  const [{ version, now }] = await sql`SELECT version(), NOW() AS now`;
  console.log('Connected OK.');
  console.log('Postgres:', version.split(',')[0]);
  console.log('Server time:', now.toISOString());

  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  console.log(`public tables: ${tables.length}`, tables.map((t) => t.tablename).join(', ') || '(none yet)');
} catch (err) {
  console.error('Connection failed:', err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
