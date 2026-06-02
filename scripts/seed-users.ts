// Seed Martin + Antonia in the users table.
// Both passwords are 'apple' for now — change after first login.
// Idempotent: ON CONFLICT DO UPDATE so re-runs refresh email/name/hash without dupes.

import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1 });

const users = [
  { id: 'martin', email: 'hello@martindrexler.com', display_name: 'Martin' },
  { id: 'antonia', email: 'antonia+placeholder@example.com', display_name: 'Antonia' }
];

const PASSWORD = 'apple';

try {
  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const u of users) {
    await sql`
      INSERT INTO users (id, email, display_name, password_hash)
      VALUES (${u.id}, ${u.email}, ${u.display_name}, ${hash})
      ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            password_hash = EXCLUDED.password_hash
    `;
    console.log(`Upserted user: ${u.id} (${u.email})`);
  }
  const rows = await sql`SELECT id, email, display_name FROM users ORDER BY id`;
  console.log('\nUsers in DB:');
  for (const r of rows) console.log(`  ${r.id} · ${r.display_name} · ${r.email}`);
} catch (e) {
  console.error('Seed failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
