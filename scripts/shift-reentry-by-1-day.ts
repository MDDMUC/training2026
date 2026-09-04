// Shift Martin's live Re-entry cycle forward by exactly 1 day.
// Idempotent: only runs if the current REENTRY phase still starts on 2026-08-31.
// Does not touch Antonia, archived H2, check-ins, nutrition, or test logs.
//
// Run: npx tsx -r dotenv/config scripts/shift-reentry-by-1-day.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import { REENTRY_CYCLE_NAME, REENTRY_END, REENTRY_START } from '../src/lib/domain/reentryPlan';

const USER_ID = 'martin';
const OLD_START = '2026-08-31';
const SHIFT_DAYS = 1;

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
  const phase = await sql<{ id: string; start_date: string; end_date: string }[]>`
    SELECT id, start_date, end_date FROM phases
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
  `;

  if (phase.length === 0) {
    console.error('No current Re-entry phase for martin. Aborting.');
    process.exit(1);
  }
  if (phase.length > 1) {
    console.error(`Expected 1 Re-entry phase, found ${phase.length}. Aborting.`);
    process.exit(1);
  }

  const current = phase[0];
  if (current.start_date === REENTRY_START && current.end_date === REENTRY_END) {
    console.log(`Already shifted: Re-entry is ${REENTRY_START} → ${REENTRY_END}. No-op.`);
    process.exit(0);
  }
  if (current.start_date !== OLD_START) {
    console.error(
      `Unexpected Re-entry start ${current.start_date} (wanted ${OLD_START} or ${REENTRY_START}). Aborting.`
    );
    process.exit(1);
  }

  const [{ n }] = await sql<{ n: string }[]>`
    SELECT COUNT(*)::text AS n FROM sessions
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
  `;
  if (Number(n) !== 28) {
    console.error(`Expected 28 Re-entry sessions, found ${n}. Aborting.`);
    process.exit(1);
  }

  await sql.begin(async (tx) => {
    const movedSessions = await tx`
      UPDATE sessions
      SET date = date + ${SHIFT_DAYS}::int
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
      RETURNING id, date, title
    `;
    const movedPhases = await tx`
      UPDATE phases
      SET start_date = start_date + ${SHIFT_DAYS}::int,
          end_date   = end_date   + ${SHIFT_DAYS}::int
      WHERE id = ${current.id}
      RETURNING id, start_date, end_date
    `;
    console.log(
      `Shifted ${movedSessions.length} sessions and ${movedPhases.length} phase by ${SHIFT_DAYS} day.`
    );
  });

  const after = await sql<{ date: string; type: string; title: string }[]>`
    SELECT date, type, title FROM sessions
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
    ORDER BY date ASC
  `;
  const phaseAfter = await sql<{ start_date: string; end_date: string }[]>`
    SELECT start_date, end_date FROM phases WHERE id = ${current.id}
  `;
  console.log(`Phase now ${phaseAfter[0].start_date} → ${phaseAfter[0].end_date}`);
  console.log(`First: ${after[0].date} ${after[0].title}`);
  console.log(`Last:  ${after[after.length - 1].date} ${after[after.length - 1].title}`);
  console.log('Week 1:');
  for (const s of after.slice(0, 7)) {
    console.log(`  ${s.date}  ${s.type.padEnd(13)}  ${s.title}`);
  }
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
