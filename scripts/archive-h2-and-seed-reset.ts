// Archive Martin's H2 2026 plan (keep every session/set) and seed the spine-reset plan.
// Does not touch Antonia. Does not delete rows.
//
// Idempotent: if HOLD is already the active cycle, skip.
// Run: npx tsx -r dotenv/config scripts/archive-h2-and-seed-reset.ts
//      (use DOTENV_CONFIG_PATH=.env.local if DATABASE_URL is only in .env.local)

import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import { format } from 'date-fns';
import { buildResetPlan, H2_CYCLE_NAME, RESET_CYCLE_NAME } from '../src/lib/domain/resetPlan';

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
  connect_timeout: 10
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
      AND short_name = 'HOLD'
      AND COALESCE(archived, false) = false
  `;
  if (existing.length > 0) {
    console.log('Reset plan already active (HOLD). No changes.');
    process.exit(0);
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
    `Archived ${archivedPhases.length} phases, ${archivedSessions.length} sessions as ${H2_CYCLE_NAME}.`
  );

  const startISO = format(new Date(), 'yyyy-MM-dd');
  const { phases, sessions } = buildResetPlan(startISO);
  console.log(`Seeding ${RESET_CYCLE_NAME} from ${startISO} (${sessions.length} days).`);

  const phaseIds: Record<number, number> = {};
  for (const p of phases) {
    const [{ id }] = await sql<{ id: number }[]>`
      INSERT INTO phases (
        user_id, mesocycle_num, name, short_name, start_date, end_date, description, archived, cycle_name
      )
      VALUES (
        ${USER_ID}, ${p.mesocycle_num}, ${p.name}, ${p.short_name},
        ${p.start_date}, ${p.end_date}, ${p.description}, false, ${RESET_CYCLE_NAME}
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
        true, false, ${spec.notes}, false, ${RESET_CYCLE_NAME}
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
          INSERT INTO exercise_sets (exercise_id, set_num, kind, label)
          VALUES (${exerciseId}, ${setNum}, ${s.kind}, ${s.label})
        `;
        setNum++;
      }
      order++;
    }
    inserted++;
  }

  console.log(`Inserted ${inserted} reset sessions. Old workouts remain under cycle_name='${H2_CYCLE_NAME}'.`);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
