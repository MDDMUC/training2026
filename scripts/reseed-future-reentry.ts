// Reseed Martin's future Re-entry sessions from reentryPlan.ts.
// Keeps any scheduled session that already has completed sets (e.g. Pull A 2026-09-04).
// Keeps ad-hoc (scheduled=false) logs. Does not touch Antonia or archived H2.
//
// Run: npx tsx -r dotenv/config scripts/reseed-future-reentry.ts

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
  const { phases, sessions } = buildReentryPlan();
  if (sessions.length !== 28) {
    console.error(`Builder produced ${sessions.length} sessions, expected 28.`);
    process.exit(1);
  }

  const logged = await sql<{ id: number; date: string; title: string }[]>`
    SELECT s.id, s.date::text AS date, s.title
    FROM sessions s
    WHERE s.user_id = ${USER_ID}
      AND s.cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(s.archived, false) = false
      AND s.scheduled = true
      AND EXISTS (
        SELECT 1
        FROM exercises e
        JOIN exercise_sets es ON es.exercise_id = e.id
        WHERE e.session_id = s.id AND es.completed = true
      )
    ORDER BY s.date
  `;
  const keepIds = new Set(logged.map((r) => Number(r.id)));
  const keepDates = new Set(logged.map((r) => r.date));
  console.log(
    `Preserving ${logged.length} logged scheduled session(s):`,
    logged.map((r) => `${r.date} ${r.title}`).join('; ') || '(none)'
  );

  await sql.begin(async (tx) => {
    const existingPhase = await tx<{ id: number }[]>`
      SELECT id FROM phases
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
      ORDER BY id
      LIMIT 1
    `;
    if (!existingPhase[0]) {
      throw new Error('No current Re-entry phase');
    }
    const phaseId = Number(existingPhase[0].id);
    const p = phases[0];
    await tx`
      UPDATE phases
      SET mesocycle_num = ${p.mesocycle_num},
          name = ${p.name},
          short_name = ${p.short_name},
          start_date = ${p.start_date},
          end_date = ${p.end_date},
          description = ${p.description}
      WHERE id = ${phaseId}
    `;

    // Delete scheduled sessions that have no completed sets
    const doomed = await tx<{ id: number; date: string }[]>`
      SELECT s.id, s.date::text AS date
      FROM sessions s
      WHERE s.user_id = ${USER_ID}
        AND s.cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(s.archived, false) = false
        AND s.scheduled = true
        AND NOT EXISTS (
          SELECT 1
          FROM exercises e
          JOIN exercise_sets es ON es.exercise_id = e.id
          WHERE e.session_id = s.id AND es.completed = true
        )
    `;
    for (const row of doomed) {
      await tx`DELETE FROM sessions WHERE id = ${row.id} AND user_id = ${USER_ID}`;
    }
    console.log(`Deleted ${doomed.length} unlogged scheduled session(s)`);

    await tx`
      UPDATE sessions
      SET phase_id = ${phaseId}
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
        AND scheduled = false
    `;

    let inserted = 0;
    for (const row of sessions) {
      if (keepDates.has(row.date)) {
        console.log(`  skip ${row.date} (logged)`);
        continue;
      }
      const existing = await tx<{ id: number }[]>`
        SELECT id FROM sessions
        WHERE user_id = ${USER_ID}
          AND date = ${row.date}
          AND cycle_name = ${REENTRY_CYCLE_NAME}
          AND COALESCE(archived, false) = false
      `;
      if (existing.length) {
        console.log(`  skip ${row.date} (still present id=${existing[0].id})`);
        continue;
      }

      const spec = row.spec;
      const [{ id: sessionId }] = await tx<{ id: number }[]>`
        INSERT INTO sessions (
          user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
        )
        VALUES (
          ${USER_ID}, ${row.date}, ${phaseId}, ${spec.type}, ${spec.title},
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
      inserted++;
    }
    console.log(`Inserted ${inserted} sessions`);
    void keepIds;
  });

  const after = await sql<{ date: string; type: string; title: string }[]>`
    SELECT date::text AS date, type, title FROM sessions
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
      AND scheduled = true
    ORDER BY date ASC
  `;
  const pushA = await sql<{ name: string; label: string; load_kg: number | null; reps: number | null }[]>`
    SELECT e.name, es.label, es.load_kg, es.reps
    FROM sessions s
    JOIN exercises e ON e.session_id = s.id
    JOIN exercise_sets es ON es.exercise_id = e.id
    WHERE s.user_id = ${USER_ID}
      AND s.date = '2026-09-05'
      AND COALESCE(s.archived, false) = false
    ORDER BY e.display_order, es.set_num
  `;

  console.log(`Scheduled now: ${after.length}. ${REENTRY_START} → ${REENTRY_END}`);
  console.log('Week 1:');
  for (const s of after.slice(0, 7)) {
    console.log(`  ${s.date}  ${s.type.padEnd(13)}  ${s.title}`);
  }
  console.log('Sat 5 Sep Push A sample:');
  for (const r of pushA.slice(0, 20)) {
    console.log(`  ${r.name} | ${r.label} ${r.reps ?? ''} @ ${r.load_kg ?? '—'}`);
  }
  const ohp = pushA.filter((r) => /OHP|overhead/i.test(r.label + r.name));
  if (ohp.length) {
    console.error('OHP still present on Push A');
    process.exit(1);
  }
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
