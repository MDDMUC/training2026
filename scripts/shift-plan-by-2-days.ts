// Shift every plan session and phase forward by exactly 2 days.
// Idempotent: only runs if the earliest plan session is still on 2026-06-08.
// Affects all users (martin + antonia) since both have plans on the same axis.
//
// Why an explicit guard rather than "only sessions on/after 2026-06-08"?
// Because once the shift runs, the earliest session is 2026-06-10 — running
// again would shift it to 2026-06-12. The guard prevents that footgun.

import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

const sql = postgres(url, {
  ssl: 'require',
  max: 1,
  types: {
    date:        { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamp:   { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
  }
});

const OLD_START = '2026-06-08';
const NEW_START = '2026-06-10';
const SHIFT_DAYS = 2;

try {
  const probe = await sql<{ count: string }[]>`
    SELECT COUNT(*) AS count FROM sessions
    WHERE scheduled = TRUE AND date = ${OLD_START}
  `;
  if (Number(probe[0].count) === 0) {
    const already = await sql<{ count: string }[]>`
      SELECT COUNT(*) AS count FROM sessions
      WHERE scheduled = TRUE AND date = ${NEW_START}
    `;
    if (Number(already[0].count) > 0) {
      console.log(`Already shifted: scheduled sessions start on ${NEW_START}. No-op.`);
      process.exit(0);
    }
    console.log(`Neither ${OLD_START} nor ${NEW_START} has scheduled sessions. Aborting — unexpected state.`);
    process.exit(1);
  }

  await sql.begin(async (tx) => {
    const movedSessions = await tx`
      UPDATE sessions
      SET date = date + ${SHIFT_DAYS}::int
      WHERE scheduled = TRUE AND date >= ${OLD_START}
      RETURNING id
    `;
    const movedPhases = await tx`
      UPDATE phases
      SET start_date = start_date + ${SHIFT_DAYS}::int,
          end_date   = end_date   + ${SHIFT_DAYS}::int
      WHERE start_date >= ${OLD_START}
      RETURNING id
    `;
    console.log(`Shifted ${movedSessions.length} sessions and ${movedPhases.length} phases by ${SHIFT_DAYS}::int days.`);
  });

  const first = await sql`
    SELECT date, type FROM sessions
    WHERE scheduled = TRUE
    ORDER BY date ASC, id ASC LIMIT 1
  `;
  const last = await sql`
    SELECT date FROM sessions
    WHERE scheduled = TRUE
    ORDER BY date DESC, id DESC LIMIT 1
  `;
  console.log(`First scheduled session is now: ${first[0]?.date} (${first[0]?.type})`);
  console.log(`Last  scheduled session is now: ${last[0]?.date}`);
} finally {
  await sql.end();
}
