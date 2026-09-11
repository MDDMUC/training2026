// Replace long-lever DB fly with bent-arm floor fly on Martin's future Push A.
// Does not touch logged completed sets. Idempotent.
//
// Run: npx tsx -r dotenv/config scripts/replace-db-fly-with-bent-arm-floor-fly.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import { REENTRY_CYCLE_NAME } from '../src/lib/domain/reentryPlan';

const USER_ID = 'martin';
const NOTES =
  'Therapist-friendly pec work. Lie on the floor. Elbows locked ~90°, forearms vertical. Keep elbow angle fixed — only upper arms move. Floor stops the open (no long lever). 3–4 RIR. Skip if the chest knob speaks.';

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
  const targets = await sql<
    { id: number; date: string; title: string; ex_id: number; name: string }[]
  >`
    SELECT s.id, s.date::text AS date, s.title, e.id AS ex_id, e.name
    FROM sessions s
    JOIN exercises e ON e.session_id = s.id
    WHERE s.user_id = ${USER_ID}
      AND s.cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(s.archived, false) = false
      AND s.date >= '2026-09-11'
      AND e.name = 'DB fly'
    ORDER BY s.date
  `;

  console.log(`Found ${targets.length} DB fly exercise(s) to replace`);

  await sql.begin(async (tx) => {
    for (const t of targets) {
      const done = await tx<{ n: number }[]>`
        SELECT COUNT(*)::int AS n
        FROM exercise_sets
        WHERE exercise_id = ${t.ex_id} AND completed = true
      `;
      if (done[0].n > 0) {
        console.log(`${t.date} session ${t.id}: skip — already has completed sets`);
        continue;
      }

      await tx`
        UPDATE exercises
        SET name = 'Bent-arm floor fly',
            notes = ${NOTES}
        WHERE id = ${t.ex_id}
      `;

      const sets = await tx<{ id: number; label: string | null }[]>`
        SELECT id, label FROM exercise_sets
        WHERE exercise_id = ${t.ex_id}
        ORDER BY set_num, id
      `;

      for (const set of sets) {
        const next = (set.label ?? '').replace(/DB fly/gi, 'Bent-arm floor fly');
        if (next !== set.label) {
          await tx`UPDATE exercise_sets SET label = ${next} WHERE id = ${set.id}`;
        }
      }

      console.log(
        `${t.date} session ${t.id}: renamed exercise ${t.ex_id} DB fly → Bent-arm floor fly (${sets.length} sets)`
      );
    }
  });

  const leftover = await sql`
    SELECT s.date::text AS date, e.name
    FROM sessions s
    JOIN exercises e ON e.session_id = s.id
    WHERE s.user_id = ${USER_ID}
      AND COALESCE(s.archived, false) = false
      AND s.date >= '2026-09-11'
      AND e.name = 'DB fly'
  `;
  console.log('Remaining DB fly from today onward:', leftover);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
