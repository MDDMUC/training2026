// Remove OHP from Martin's remaining Re-entry Push A sessions.
// Safe with logged Pull A: only mutates Push A vertical-press exercises.
// Idempotent: re-run skips sessions that already have no OHP sets.
//
// Run: npx tsx -r dotenv/config scripts/remove-ohp-from-reentry-push-a.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import { REENTRY_CYCLE_NAME } from '../src/lib/domain/reentryPlan';

const USER_ID = 'martin';
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
  const sessions = await sql<{ id: number; date: string; title: string }[]>`
    SELECT id, date::text AS date, title
    FROM sessions
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
      AND type = 'push'
      AND title LIKE 'Push A%'
    ORDER BY date
  `;

  console.log(`Found ${sessions.length} Push A sessions`);

  await sql.begin(async (tx) => {
    for (const s of sessions) {
      await tx`
        UPDATE sessions
        SET title = 'Push A — dips, chest, delts, split squat'
        WHERE id = ${s.id} AND user_id = ${USER_ID}
      `;

      const exercises = await tx<{ id: number; name: string }[]>`
        SELECT id, name FROM exercises
        WHERE session_id = ${s.id}
          AND (
            name = 'Superset A · Vertical (Dips + OHP)'
            OR name = 'Dips'
          )
        ORDER BY display_order, id
      `;

      for (const ex of exercises) {
        const deleted = await tx`
          DELETE FROM exercise_sets
          WHERE exercise_id = ${ex.id}
            AND (label ILIKE '%OHP%' OR label ILIKE '%overhead%')
          RETURNING id
        `;

        const remaining = await tx<{ id: number; label: string | null }[]>`
          SELECT id, label FROM exercise_sets
          WHERE exercise_id = ${ex.id}
          ORDER BY set_num, id
        `;

        let setNum = 1;
        for (const row of remaining) {
          await tx`
            UPDATE exercise_sets
            SET set_num = ${setNum},
                rest_seconds = 120,
                label = COALESCE(
                  CASE
                    WHEN label ILIKE '%Dips%' THEN label
                    ELSE label
                  END,
                  label
                )
            WHERE id = ${row.id}
          `;
          setNum += 1;
        }

        await tx`
          UPDATE exercises
          SET name = 'Dips',
              notes = '3–4 RIR. Bodyweight only. No OHP this block — overhead pressing paused while the joint settles. Full rest between sets.'
          WHERE id = ${ex.id}
        `;

        console.log(
          `${s.date} session ${s.id}: removed ${deleted.length} OHP set(s), kept ${remaining.length} dip set(s), renamed → Dips`
        );
      }

      // Horizontal block: drop the "Superset A/B" pairing language if still present
      await tx`
        UPDATE exercises
        SET name = 'Superset · Horizontal (Row + Bench)'
        WHERE session_id = ${s.id}
          AND name = 'Superset B · Horizontal (Row + Bench)'
      `;
    }
  });

  // Verify no OHP labels left on Push A
  const leftover = await sql<{ date: string; label: string }[]>`
    SELECT s.date::text AS date, es.label
    FROM sessions s
    JOIN exercises e ON e.session_id = s.id
    JOIN exercise_sets es ON es.exercise_id = e.id
    WHERE s.user_id = ${USER_ID}
      AND s.cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(s.archived, false) = false
      AND s.title LIKE 'Push A%'
      AND es.label ILIKE '%OHP%'
  `;
  if (leftover.length) {
    console.error('OHP still present:', leftover);
    process.exit(1);
  }
  console.log('OK — no OHP labels remain on Push A');
} finally {
  await sql.end();
}
