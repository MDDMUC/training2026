// Multi-angle diagnostic — tries session pooler + REST API to localize the failure.
import 'dotenv/config';
import postgres from 'postgres';

const dbUrl = process.env.DATABASE_URL!;
const restUrl = process.env.PUBLIC_SUPABASE_URL!;
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 1) REST API reachability (no DB password involved)
console.log('--- REST API ---');
try {
  const res = await fetch(`${restUrl}/rest/v1/`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
  });
  console.log(`anon ping: ${res.status} ${res.statusText}`);
} catch (e) {
  console.log('anon ping failed:', (e as Error).message);
}
try {
  const res = await fetch(`${restUrl}/rest/v1/`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  console.log(`service ping: ${res.status} ${res.statusText}`);
} catch (e) {
  console.log('service ping failed:', (e as Error).message);
}

// 2) Session pooler (5432) — same creds, different mode
console.log('\n--- Session pooler (port 5432) ---');
const sessionUrl = dbUrl.replace(':6543/', ':5432/');
try {
  const sql = postgres(sessionUrl, { ssl: 'require', max: 1, idle_timeout: 2 });
  const r = await sql`SELECT 1 AS ok`;
  console.log('session pooler OK:', r[0]);
  await sql.end();
} catch (e) {
  console.log('session pooler failed:', (e as Error).message);
}

// 3) Transaction pooler (6543) again with prepare:false
console.log('\n--- Transaction pooler (port 6543) with prepare:false ---');
try {
  const sql = postgres(dbUrl, { ssl: 'require', max: 1, prepare: false, idle_timeout: 2 });
  const r = await sql`SELECT 1 AS ok`;
  console.log('transaction pooler OK:', r[0]);
  await sql.end();
} catch (e) {
  console.log('transaction pooler failed:', (e as Error).message);
}

process.exit(0);
