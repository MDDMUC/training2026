// Replace Martin's current Re-entry cycle from src/lib/domain/reentryPlan.ts.
// Does not touch Antonia or archived H2. Aborts if any re-entry set was logged.
//
// Run: npx tsx -r dotenv/config scripts/rebuild-reentry.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import {
  buildReentryPlan,
  REENTRY_CYCLE_NAME,
  REENTRY_END,
  REENTRY_START
} from '../src/lib/domain/reentryPlan';

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
  const [{ n }] = await sql<{ n: string }[]>`
    SELECT COUNT(*)::text AS n FROM sessions
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
  `;
  if (Number(n) === 0) {
    console.error('No current Re-entry sessions. Aborting.');
    process.exit(1);
  }

  const [{ done }] = await sql<{ done: string }[]>`
    SELECT COUNT(es.id)::text AS done
    FROM sessions s
    JOIN exercises e ON e.session_id = s.id
    JOIN exercise_sets es ON es.exercise_id = e.id
    WHERE s.user_id = ${USER_ID}
      AND s.cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(s.archived, false) = false
      AND es.completed = true
  `;
  if (Number(done) > 0) {
    console.error(`Aborting: ${done} completed re-entry sets exist. Do not wipe a logged cycle.`);
    process.exit(1);
  }

  const { phases, sessions } = buildReentryPlan();
  if (sessions.length !== 28) {
    console.error(`Builder produced ${sessions.length} sessions, expected 28.`);
    process.exit(1);
  }

  await sql.begin(async (tx) => {
    await tx`
      DELETE FROM sessions
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
    `;
    await tx`
      DELETE FROM phases
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
    `;

    const phaseIds: Record<number, number> = {};
    for (const p of phases) {
      const [{ id }] = await tx<{ id: number }[]>`
        INSERT INTO phases (
          user_id, mesocycle_num, name, short_name, start_date, end_date, description, archived, cycle_name
        )
        VALUES (
          ${USER_ID}, ${p.mesocycle_num}, ${p.name}, ${p.short_name},
          ${p.start_date}, ${p.end_date}, ${p.description}, false, ${REENTRY_CYCLE_NAME}
        )
        RETURNING id
      `;
      phaseIds[p.mesocycle_num] = Number(id);
    }

    for (const row of sessions) {
      const spec = row.spec;
      const [{ id: sessionId }] = await tx<{ id: number }[]>`
        INSERT INTO sessions (
          user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
        )
        VALUES (
          ${USER_ID}, ${row.date}, ${phaseIds[row.mesocycle_num]}, ${spec.type}, ${spec.title},
          true, false, ${spec.notes}, false, ${REENTRY_CYCLE_NAME}
        )
        RETURNING id
      `;
      let order = 1;
      for (const ex of spec.exercises) {
        const [{ id: exerciseId }] = await tx<{ id: number }[]>`
          INSERT INTO exercises (session_id, name, display_order, notes)
          VALUES (${sessionId}, ${ex.name}, ${order}, ${ex.notes})
          RETURNING id
        `;
        let setNum = 1;
        for (const s of ex.sets) {
          await tx`
            INSERT INTO exercise_sets (
              exercise_id, set_num, kind, label, reps, load_kg, load_kg_added,
              hold_seconds, rest_seconds, rpe, notes
            ) VALUES (
              ${exerciseId}, ${setNum}, ${s.kind}, ${s.label},
              ${s.reps ?? null}, ${s.load_kg ?? null}, ${s.load_kg_added ?? null},
              ${s.hold_seconds ?? null}, ${s.rest_seconds ?? null}, ${s.rpe ?? null},
              ${s.notes ?? null}
            )
          `;
          setNum++;
        }
        order++;
      }
    }
  });

  const after = await sql<{ date: string; type: string; title: string }[]>`
    SELECT date, type, title FROM sessions
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
    ORDER BY date ASC
  `;
  const looks = await sql<{ name: string; n: number }[]>`
    SELECT e.name, COUNT(*)::int AS n
    FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE s.user_id = ${USER_ID}
      AND s.cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(s.archived, false) = false
      AND e.name IN ('Seated DB lateral raise', 'DB fly', 'Incline DB press')
    GROUP BY e.name
    ORDER BY e.name
  `;

  console.log(`Rebuilt ${after.length} sessions. ${REENTRY_START} → ${REENTRY_END}`);
  console.log(`First: ${after[0].date} ${after[0].title}`);
  console.log(`Last:  ${after[after.length - 1].date} ${after[after.length - 1].title}`);
  console.log('Week 1:');
  for (const s of after.slice(0, 7)) {
    console.log(`  ${s.date}  ${s.type.padEnd(13)}  ${s.title}`);
  }
  console.log('Looks exercises:', looks);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
