// One-shot: create the daily_check_ins table.
// Sessionless per-day capture of body weight, sleep, and readiness so the
// Today page can be the daily logging surface independent of whether a
// session is scheduled.
//
// Idempotent. Safe to re-run.

import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS daily_check_ins (
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date           DATE NOT NULL,
      body_weight_kg DOUBLE PRECISION,
      sleep_hours    DOUBLE PRECISION,
      readiness      INTEGER CHECK (readiness IS NULL OR (readiness >= 1 AND readiness <= 10)),
      note           TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, date)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_check_ins(user_id, date)`;

  const count = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM daily_check_ins`;
  console.log(`daily_check_ins ready · rows = ${count[0].n}`);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
