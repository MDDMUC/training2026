// Archive Martin's current cycle (H2 2026, or HOLD if that was seeded) and
// seed the 4-week conservative re-entry starting Fri 2026-09-04.
// Does not touch Antonia. Does not delete H2 / Reset rows.
//
// Idempotent: if a complete Re-entry cycle is already active, skip.
// Incomplete Re-entry (failed mid-seed) is replaced.
//
// Run: npx tsx -r dotenv/config scripts/archive-h2-and-seed-reentry.ts
// SQL fallback (this machine cannot reach the pooler): paste
//   scripts/archive-h2-and-seed-reentry.sql
// in the Supabase SQL editor. Regenerate with: npx tsx scripts/emit-reentry-sql.ts

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import {
  buildReentryPlan,
  H2_CYCLE_NAME,
  REENTRY_CYCLE_NAME,
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
  connect_timeout: 15
});

try {
  await sql`
    ALTER TABLE phases ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE
  `;
  await sql`ALTER TABLE phases ADD COLUMN IF NOT EXISTS cycle_name TEXT`;
  await sql`
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE
  `;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cycle_name TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_phases_user_archived ON phases(user_id, archived)`;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_archived ON sessions(user_id, archived, date)
  `;

  const existing = await sql<{ id: number }[]>`
    SELECT id FROM phases
    WHERE user_id = ${USER_ID}
      AND cycle_name = ${REENTRY_CYCLE_NAME}
      AND COALESCE(archived, false) = false
  `;
  if (existing.length > 0) {
    const [{ n }] = await sql<{ n: string }[]>`
      SELECT COUNT(*)::text AS n FROM sessions
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
    `;
    if (Number(n) === 28) {
      console.log('Re-entry cycle already active (28 sessions). No changes.');
      process.exit(0);
    }
    console.log(`Incomplete Re-entry (${n} sessions). Replacing that cycle only.`);
    await sql`
      DELETE FROM sessions
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
    `;
    await sql`
      DELETE FROM phases
      WHERE user_id = ${USER_ID}
        AND cycle_name = ${REENTRY_CYCLE_NAME}
        AND COALESCE(archived, false) = false
    `;
  }

  const archivedPhases = await sql`
    UPDATE phases
    SET archived = true,
        cycle_name = COALESCE(cycle_name, ${H2_CYCLE_NAME})
    WHERE user_id = ${USER_ID}
      AND COALESCE(archived, false) = false
    RETURNING id, short_name
  `;
  const archivedSessions = await sql`
    UPDATE sessions
    SET archived = true,
        cycle_name = COALESCE(cycle_name, ${H2_CYCLE_NAME})
    WHERE user_id = ${USER_ID}
      AND COALESCE(archived, false) = false
    RETURNING id
  `;
  console.log(
    `Archived ${archivedPhases.length} phases, ${archivedSessions.length} sessions (H2 / previous current).`
  );

  const { phases, sessions } = buildReentryPlan();
  console.log(
    `Seeding ${REENTRY_CYCLE_NAME} ${REENTRY_START} → ${sessions[sessions.length - 1].date} (${sessions.length} days).`
  );

  const phaseIds: Record<number, number> = {};
  for (const p of phases) {
    const [{ id }] = await sql<{ id: number }[]>`
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
    console.log(`  phase ${p.short_name} ${p.start_date} → ${p.end_date} id=${id}`);
  }

  let inserted = 0;
  for (const row of sessions) {
    const spec = row.spec;
    const [{ id: sessionId }] = await sql<{ id: number }[]>`
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
      const [{ id: exerciseId }] = await sql<{ id: number }[]>`
        INSERT INTO exercises (session_id, name, display_order, notes)
        VALUES (${sessionId}, ${ex.name}, ${order}, ${ex.notes})
        RETURNING id
      `;
      let setNum = 1;
      for (const s of ex.sets) {
        await sql`
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

  console.log(
    `Inserted ${inserted} re-entry sessions. Old workouts remain under Log → Previous.`
  );
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
