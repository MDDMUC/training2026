// Log Martin's 2026-09-10 rest-day run: 8 km / 48 min / 6:00/km, 924 kcal, avg HR 165.
// Idempotent: skips if a matching running_log already exists for this session/date.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-10';
const SESSION_ID = 249;
const DISTANCE_KM = 8;
const DURATION_MIN = 48;
const PACE = Math.round((DURATION_MIN / DISTANCE_KM) * 100) / 100; // 6.00
const ACTIVITY_KCAL = 924;
const NOTES =
  'Fastest since knee surgery (ACL+meniscus R, Jan 2024). Avg HR 165 bpm. Watch calories 924. Reported avg pace 6:00/km.';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(url, {
  ssl: 'require',
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 15,
  types: {
    date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamp: { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
  }
});

try {
  const sess = await sql<{ id: number; title: string; type: string }[]>`
    SELECT id, title, type FROM sessions
    WHERE id = ${SESSION_ID} AND user_id = ${USER_ID} AND date = ${DATE}
  `;
  if (sess.length !== 1) {
    console.error('Expected session', SESSION_ID, 'on', DATE, '— found', sess);
    process.exit(1);
  }

  const existing = await sql<{ id: number }[]>`
    SELECT id FROM running_logs
    WHERE user_id = ${USER_ID}
      AND session_id = ${SESSION_ID}
      AND date = ${DATE}
      AND distance_km = ${DISTANCE_KM}
      AND duration_min = ${DURATION_MIN}
  `;
  if (existing.length > 0) {
    console.log('Already logged as running_log', existing[0].id, '— no-op.');
    process.exit(0);
  }

  const sessionNotes = `**Hypertrophy Base Week 1 · scheduled Rest.** Optional easy walk day — instead: strong continuous run.

**As done 2026-09-10:** 8 km in 48 min (6:00/km). Avg HR 165 bpm. Watch burn 924 kcal. Fastest pace since knee surgery. Knee and back quiet enough to hold the pace.`;

  await sql.begin(async (tx) => {
    await tx`
      UPDATE sessions
      SET completed = true,
          title = 'Rest · 8 km run',
          activity_calories = ${ACTIVITY_KCAL},
          notes = ${sessionNotes},
          updated_at = NOW()
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID}
    `;

    const inserted = await tx<{ id: number }[]>`
      INSERT INTO running_logs
        (user_id, session_id, date, distance_km, duration_min, pace_min_per_km, surface, notes)
      VALUES (
        ${USER_ID}, ${SESSION_ID}, ${DATE}, ${DISTANCE_KM}, ${DURATION_MIN},
        ${PACE}, NULL, ${NOTES}
      )
      RETURNING id
    `;
    console.log('Inserted running_log', inserted[0].id);
  });

  const check = await sql`
    SELECT s.id, s.date::text AS date, s.title, s.completed, s.activity_calories,
           r.id AS run_id, r.distance_km, r.duration_min, r.pace_min_per_km, r.notes
    FROM sessions s
    LEFT JOIN running_logs r ON r.session_id = s.id AND r.user_id = s.user_id
    WHERE s.id = ${SESSION_ID} AND s.user_id = ${USER_ID}
  `;
  console.log('Logged', check[0]);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
