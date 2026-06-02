// Migrate every row from local db/training.db into Supabase Postgres,
// tagging each row with user_id='martin'. IDs are preserved via OVERRIDING
// SYSTEM VALUE; identity sequences are bumped past max(id) at the end.
//
// Re-runnable: truncates Martin-owned data in Supabase first (in FK order).
// Antonia's rows are untouched.

import 'dotenv/config';
import Database from 'better-sqlite3';
import postgres from 'postgres';

const url = process.env.DATABASE_URL!;
const sqliteDb = new Database('db/training.db', { readonly: true });
const pg = postgres(url, { ssl: 'require', max: 1 });

const USER_ID = 'martin';

// SQLite stores booleans as 0/1; Postgres expects true/false. Helper:
const toBool = (n: number | null | undefined): boolean => n === 1;
const orNull = <T>(v: T | undefined | null): T | null => (v === undefined ? null : v);

interface SqlitePhase { id: number; mesocycle_num: number; name: string; short_name: string; start_date: string; end_date: string; description: string | null; created_at: string; }
interface SqliteSession { id: number; date: string; phase_id: number | null; type: string; title: string | null; scheduled: number; completed: number; duration_min: number | null; rpe: number | null; body_weight_kg: number | null; sleep_hours: number | null; readiness: number | null; notes: string | null; created_at: string; updated_at: string; }
interface SqliteExercise { id: number; session_id: number; name: string; display_order: number; notes: string | null; athlete_notes: string | null; }
interface SqliteExerciseSet { id: number; exercise_id: number; set_num: number; kind: string; label: string | null; reps: number | null; load_kg: number | null; load_kg_added: number | null; hold_seconds: number | null; rest_seconds: number | null; rpe: number | null; completed: number; notes: string | null; }
interface SqliteTindeq { id: number; session_id: number | null; date: string; hand: 'L' | 'R'; edge_mm: number; grip_position: string; peak_force_kg: number; body_weight_kg: number | null; notes: string | null; created_at: string; }
interface SqlitePullup { id: number; session_id: number | null; date: string; body_weight_kg: number; top_load_added_kg: number; top_reps: number; estimated_1rm_added_kg: number; notes: string | null; created_at: string; }
interface SqliteClimb { id: number; session_id: number; route_name: string | null; grade: string; style: string; notes: string | null; created_at: string; }
interface SqliteRun { id: number; session_id: number | null; date: string; distance_km: number; duration_min: number; pace_min_per_km: number | null; surface: string | null; notes: string | null; created_at: string; }

try {
  // 1) Clear Martin's existing data (FK-safe order — children first)
  console.log('Clearing existing martin data in Supabase...');
  await pg`DELETE FROM exercise_sets WHERE exercise_id IN (SELECT e.id FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE s.user_id = ${USER_ID})`;
  await pg`DELETE FROM exercises WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ${USER_ID})`;
  await pg`DELETE FROM climbing_attempts WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ${USER_ID})`;
  await pg`DELETE FROM running_logs WHERE user_id = ${USER_ID}`;
  await pg`DELETE FROM tindeq_tests WHERE user_id = ${USER_ID}`;
  await pg`DELETE FROM pullup_tests WHERE user_id = ${USER_ID}`;
  await pg`DELETE FROM sessions WHERE user_id = ${USER_ID}`;
  await pg`DELETE FROM phases WHERE user_id = ${USER_ID}`;

  // 2) Phases
  const phases = sqliteDb.prepare(`SELECT * FROM phases ORDER BY id`).all() as SqlitePhase[];
  for (const p of phases) {
    await pg`
      INSERT INTO phases (id, user_id, mesocycle_num, name, short_name, start_date, end_date, description, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES (${p.id}, ${USER_ID}, ${p.mesocycle_num}, ${p.name}, ${p.short_name}, ${p.start_date}, ${p.end_date}, ${orNull(p.description)}, ${p.created_at})
    `;
  }
  console.log(`Phases: ${phases.length}`);

  // 3) Sessions
  const sessions = sqliteDb.prepare(`SELECT * FROM sessions ORDER BY id`).all() as SqliteSession[];
  for (const s of sessions) {
    await pg`
      INSERT INTO sessions (id, user_id, date, phase_id, type, title, scheduled, completed, duration_min, rpe, body_weight_kg, sleep_hours, readiness, notes, created_at, updated_at)
      OVERRIDING SYSTEM VALUE
      VALUES (${s.id}, ${USER_ID}, ${s.date}, ${s.phase_id}, ${s.type}, ${s.title}, ${toBool(s.scheduled)}, ${toBool(s.completed)}, ${s.duration_min}, ${s.rpe}, ${s.body_weight_kg}, ${s.sleep_hours}, ${s.readiness}, ${s.notes}, ${s.created_at}, ${s.updated_at})
    `;
  }
  console.log(`Sessions: ${sessions.length}`);

  // 4) Exercises
  const exercises = sqliteDb.prepare(`SELECT * FROM exercises ORDER BY id`).all() as SqliteExercise[];
  for (const e of exercises) {
    await pg`
      INSERT INTO exercises (id, session_id, name, display_order, notes, athlete_notes)
      OVERRIDING SYSTEM VALUE
      VALUES (${e.id}, ${e.session_id}, ${e.name}, ${e.display_order}, ${e.notes}, ${e.athlete_notes})
    `;
  }
  console.log(`Exercises: ${exercises.length}`);

  // 5) Exercise sets
  const sets = sqliteDb.prepare(`SELECT * FROM exercise_sets ORDER BY id`).all() as SqliteExerciseSet[];
  for (const s of sets) {
    await pg`
      INSERT INTO exercise_sets (id, exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, completed, notes)
      OVERRIDING SYSTEM VALUE
      VALUES (${s.id}, ${s.exercise_id}, ${s.set_num}, ${s.kind}, ${s.label}, ${s.reps}, ${s.load_kg}, ${s.load_kg_added}, ${s.hold_seconds}, ${s.rest_seconds}, ${s.rpe}, ${toBool(s.completed)}, ${s.notes})
    `;
  }
  console.log(`Exercise sets: ${sets.length}`);

  // 6) Tindeq
  const tindeqs = sqliteDb.prepare(`SELECT * FROM tindeq_tests ORDER BY id`).all() as SqliteTindeq[];
  for (const t of tindeqs) {
    await pg`
      INSERT INTO tindeq_tests (id, user_id, session_id, date, hand, edge_mm, grip_position, peak_force_kg, body_weight_kg, notes, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES (${t.id}, ${USER_ID}, ${t.session_id}, ${t.date}, ${t.hand}, ${t.edge_mm}, ${t.grip_position}, ${t.peak_force_kg}, ${t.body_weight_kg}, ${t.notes}, ${t.created_at})
    `;
  }
  console.log(`Tindeq tests: ${tindeqs.length}`);

  // 7) Pull-up
  const pullups = sqliteDb.prepare(`SELECT * FROM pullup_tests ORDER BY id`).all() as SqlitePullup[];
  for (const p of pullups) {
    await pg`
      INSERT INTO pullup_tests (id, user_id, session_id, date, body_weight_kg, top_load_added_kg, top_reps, estimated_1rm_added_kg, notes, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES (${p.id}, ${USER_ID}, ${p.session_id}, ${p.date}, ${p.body_weight_kg}, ${p.top_load_added_kg}, ${p.top_reps}, ${p.estimated_1rm_added_kg}, ${p.notes}, ${p.created_at})
    `;
  }
  console.log(`Pull-up tests: ${pullups.length}`);

  // 8) Climbing attempts
  const climbs = sqliteDb.prepare(`SELECT * FROM climbing_attempts ORDER BY id`).all() as SqliteClimb[];
  for (const c of climbs) {
    await pg`
      INSERT INTO climbing_attempts (id, session_id, route_name, grade, style, notes, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES (${c.id}, ${c.session_id}, ${c.route_name}, ${c.grade}, ${c.style}, ${c.notes}, ${c.created_at})
    `;
  }
  console.log(`Climbing attempts: ${climbs.length}`);

  // 9) Running logs
  const runs = sqliteDb.prepare(`SELECT * FROM running_logs ORDER BY id`).all() as SqliteRun[];
  for (const r of runs) {
    await pg`
      INSERT INTO running_logs (id, user_id, session_id, date, distance_km, duration_min, pace_min_per_km, surface, notes, created_at)
      OVERRIDING SYSTEM VALUE
      VALUES (${r.id}, ${USER_ID}, ${r.session_id}, ${r.date}, ${r.distance_km}, ${r.duration_min}, ${r.pace_min_per_km}, ${r.surface}, ${r.notes}, ${r.created_at})
    `;
  }
  console.log(`Running logs: ${runs.length}`);

  // 10) Bump identity sequences past the imported max(id) for each table
  const seqTables = ['phases', 'sessions', 'exercises', 'exercise_sets', 'tindeq_tests', 'pullup_tests', 'climbing_attempts', 'running_logs'];
  for (const t of seqTables) {
    await pg.unsafe(
      `SELECT setval(pg_get_serial_sequence('${t}','id'), GREATEST((SELECT COALESCE(MAX(id),0) FROM ${t}), 1))`
    );
  }
  console.log('Identity sequences advanced past imported max(id).');

  // 11) Verify counts
  console.log('\n--- Verification (Postgres counts for user_id=martin) ---');
  const checks = [
    { table: 'phases', filter: pg`user_id = ${USER_ID}` },
    { table: 'sessions', filter: pg`user_id = ${USER_ID}` },
    { table: 'exercises', filter: pg`session_id IN (SELECT id FROM sessions WHERE user_id = ${USER_ID})` },
    { table: 'exercise_sets', filter: pg`exercise_id IN (SELECT e.id FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE s.user_id = ${USER_ID})` },
    { table: 'tindeq_tests', filter: pg`user_id = ${USER_ID}` },
    { table: 'pullup_tests', filter: pg`user_id = ${USER_ID}` },
    { table: 'climbing_attempts', filter: pg`session_id IN (SELECT id FROM sessions WHERE user_id = ${USER_ID})` },
    { table: 'running_logs', filter: pg`user_id = ${USER_ID}` }
  ];
  for (const c of checks) {
    const [{ count }] = await pg`SELECT COUNT(*)::int AS count FROM ${pg(c.table)} WHERE ${c.filter}`;
    console.log(`  ${c.table.padEnd(20)} ${count}`);
  }
} catch (e) {
  console.error('Migration failed:', e);
  process.exitCode = 1;
} finally {
  sqliteDb.close();
  await pg.end();
}
