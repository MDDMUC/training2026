// Initializes the SQLite database: creates the file, applies the schema,
// seeds phases and the 12-week session schedule, and records the baseline
// Tindeq test (2026-05-28). Idempotent: safe to run multiple times.

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHASES, buildFullSchedule } from '../src/lib/domain/schedule.js';
import { buildPrescription, buildRunwayCalibration, RUNWAY_SPECS, type RunwayDay } from '../src/lib/domain/prescriptions.js';
import type { SessionType } from '../src/lib/domain/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DB_DIR = join(PROJECT_ROOT, 'db');
const DB_PATH = join(DB_DIR, 'training.db');
const SCHEMA_PATH = join(PROJECT_ROOT, 'src', 'lib', 'db', 'schema.sql');

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`Database: ${DB_PATH}`);

// 1. Schema
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);
console.log('Schema applied.');

// 1b. Idempotent column migrations — CREATE TABLE IF NOT EXISTS does not
//     add new columns to an existing table, so we add them explicitly.
function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare<[], { name: string }>(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    console.log(`Migration: added ${table}.${column}`);
  }
}
ensureColumn('sessions', 'sleep_hours', 'REAL');
ensureColumn('sessions', 'readiness', 'INTEGER');
ensureColumn('exercises', 'athlete_notes', 'TEXT');

// 2. Phases (idempotent)
const insertPhase = db.prepare(`
  INSERT INTO phases (mesocycle_num, name, short_name, start_date, end_date, description)
  SELECT ?, ?, ?, ?, ?, ?
  WHERE NOT EXISTS (SELECT 1 FROM phases WHERE mesocycle_num = ?)
`);

let phasesInserted = 0;
for (const p of PHASES) {
  const result = insertPhase.run(
    p.mesocycle_num, p.name, p.short_name, p.start_date, p.end_date, p.description,
    p.mesocycle_num
  );
  if (result.changes) phasesInserted++;
}
console.log(`Phases: ${phasesInserted} inserted (${PHASES.length} total).`);

// Map mesocycle_num -> phase_id
const phaseRows = db
  .prepare<[], { id: number; mesocycle_num: number }>(
    'SELECT id, mesocycle_num FROM phases'
  )
  .all();
const phaseIdByMeso = new Map<number, number>();
for (const r of phaseRows) phaseIdByMeso.set(r.mesocycle_num, r.id);

// 3. Sessions (idempotent: only insert if no scheduled session for that date)
const sessions = buildFullSchedule();

const checkScheduled = db.prepare<[string], { count: number }>(
  'SELECT COUNT(*) AS count FROM sessions WHERE date = ? AND scheduled = 1'
);
const insertSession = db.prepare(`
  INSERT INTO sessions (date, phase_id, type, title, scheduled, completed)
  VALUES (?, ?, ?, ?, 1, 0)
`);

const txn = db.transaction((items: typeof sessions) => {
  let inserted = 0;
  for (const s of items) {
    const exists = checkScheduled.get(s.date);
    if (exists && exists.count > 0) continue;
    const phaseId = phaseIdByMeso.get(s.mesocycle_num) ?? null;
    insertSession.run(s.date, phaseId, s.type, s.title);
    inserted++;
  }
  return inserted;
});

const sessionsInserted = txn(sessions);
console.log(`Sessions: ${sessionsInserted} inserted (${sessions.length} total scheduled).`);

// 3b. Prescriptions — for every scheduled session that has no exercises yet,
//     generate exercises + sets from the prescription dispatch.
const getSessionForDate = db.prepare<[string], { id: number; type: string; phase_meso: number }>(`
  SELECT s.id, s.type, p.mesocycle_num AS phase_meso
  FROM sessions s
  LEFT JOIN phases p ON p.id = s.phase_id
  WHERE s.date = ? AND s.scheduled = 1
`);
const countExercises = db.prepare<[number], { count: number }>(
  'SELECT COUNT(*) AS count FROM exercises WHERE session_id = ?'
);
const insertExercise = db.prepare(
  'INSERT INTO exercises (session_id, name, display_order, notes) VALUES (?, ?, ?, ?)'
);
const insertSet = db.prepare(`
  INSERT INTO exercise_sets
    (exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function weekInPhase(sessionDate: string, phaseStart: string): 1 | 2 | 3 | 4 {
  const d1 = new Date(sessionDate + 'T00:00:00').getTime();
  const d0 = new Date(phaseStart + 'T00:00:00').getTime();
  const diffDays = Math.floor((d1 - d0) / (1000 * 60 * 60 * 24));
  const w = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(4, w)) as 1 | 2 | 3 | 4;
}

const phaseStartByMeso = new Map<number, string>();
for (const p of PHASES) phaseStartByMeso.set(p.mesocycle_num, p.start_date);

const listExercisesForSession = db.prepare<[number], { id: number; name: string; display_order: number }>(
  'SELECT id, name, display_order FROM exercises WHERE session_id = ?'
);

const prescribeTxn = db.transaction((items: typeof sessions) => {
  let exCount = 0;
  let setCount = 0;
  for (const s of items) {
    const row = getSessionForDate.get(s.date);
    if (!row) continue;
    const phaseStart = phaseStartByMeso.get(row.phase_meso) ?? s.date;
    const w = weekInPhase(s.date, phaseStart);
    const prescription = buildPrescription({
      type: row.type as SessionType,
      mesocycle_num: row.phase_meso,
      week_in_phase: w
    });

    // Two paths:
    // 1) Session has no exercises yet → insert the full prescription
    // 2) Session already has exercises → only inject prescription exercises whose names
    //    don't exist yet. Preserves athlete edits + completed sets + notes.
    const existing = listExercisesForSession.all(row.id);
    const existingNames = new Set(existing.map((e) => e.name));
    const isFirstSeed = existing.length === 0;
    const maxOrder = existing.reduce((m, e) => Math.max(m, e.display_order), 0);
    let appendOrder = maxOrder;

    for (const ex of prescription.exercises) {
      // Skip exercises that already exist on this session — they may have
      // user-entered athlete notes, completed sets, etc.
      if (!isFirstSeed && existingNames.has(ex.name)) continue;

      const order = isFirstSeed ? ex.display_order : ++appendOrder;
      const info = insertExercise.run(row.id, ex.name, order, ex.notes ?? null);
      const exId = info.lastInsertRowid as number;
      exCount++;
      for (const st of ex.sets) {
        insertSet.run(
          exId,
          st.set_num,
          st.kind,
          st.label ?? null,
          st.reps ?? null,
          st.load_kg ?? null,
          st.load_kg_added ?? null,
          st.hold_seconds ?? null,
          st.rest_seconds ?? null,
          st.notes ?? null
        );
        setCount++;
      }
    }
  }
  return { exCount, setCount };
});

const prescribed = prescribeTxn(sessions);
console.log(`Prescriptions: ${prescribed.exCount} exercises, ${prescribed.setCount} sets generated.`);

// 3c. Runway calibration — 4 ad-hoc no-hangs sessions before Phase 1 begins.
//     Seeded with phase_id=null (they precede Phase 1). Idempotent.
const runwayDays: RunwayDay[] = [1, 2, 3, 4];
const insertRunwaySession = db.prepare(`
  INSERT INTO sessions (date, phase_id, type, title, scheduled, completed)
  VALUES (?, NULL, 'mobility', ?, 1, 0)
`);

const runwayTxn = db.transaction(() => {
  let sessionsAdded = 0;
  let exAdded = 0;
  let setsAdded = 0;
  for (const day of runwayDays) {
    const spec = RUNWAY_SPECS[day];
    const title = `Runway · No-hangs Calibration ${day}/4`;

    const existsScheduled = checkScheduled.get(spec.date);
    if (!existsScheduled || existsScheduled.count === 0) {
      insertRunwaySession.run(spec.date, title);
      sessionsAdded++;
    }

    const row = getSessionForDate.get(spec.date);
    if (!row) continue;

    const existing = listExercisesForSession.all(row.id);
    const existingNames = new Set(existing.map((e) => e.name));
    const isFirstSeed = existing.length === 0;
    const maxOrder = existing.reduce((m, e) => Math.max(m, e.display_order), 0);
    let appendOrder = maxOrder;

    const prescription = buildRunwayCalibration(day);
    for (const ex of prescription.exercises) {
      if (!isFirstSeed && existingNames.has(ex.name)) continue;
      const order = isFirstSeed ? ex.display_order : ++appendOrder;
      const info = insertExercise.run(row.id, ex.name, order, ex.notes ?? null);
      const exId = info.lastInsertRowid as number;
      exAdded++;
      for (const st of ex.sets) {
        insertSet.run(
          exId, st.set_num, st.kind, st.label ?? null, st.reps ?? null,
          st.load_kg ?? null, st.load_kg_added ?? null,
          st.hold_seconds ?? null, st.rest_seconds ?? null, st.notes ?? null
        );
        setsAdded++;
      }
    }
  }
  return { sessionsAdded, exAdded, setsAdded };
});

const runwayResult = runwayTxn();
console.log(
  `Runway: ${runwayResult.sessionsAdded} sessions, ${runwayResult.exAdded} exercises, ${runwayResult.setsAdded} sets inserted.`
);

// 4. Baseline Tindeq test (2026-05-28) — only if no Tindeq tests yet
const tindeqCount = db
  .prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM tindeq_tests')
  .get();

if (!tindeqCount || tindeqCount.count === 0) {
  const insertT = db.prepare(`
    INSERT INTO tindeq_tests (date, hand, edge_mm, grip_position, peak_force_kg, body_weight_kg, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertT.run('2026-05-28', 'R', 20, 'half-crimp', 55.0, 82.0, 'Baseline test before Phase 1');
  insertT.run('2026-05-28', 'L', 20, 'half-crimp', 52.0, 82.0, 'Baseline test before Phase 1');
  console.log('Baseline Tindeq tests inserted (R 55, L 52).');
}

// 5. Baseline pull-up test
const pullupCount = db
  .prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM pullup_tests')
  .get();

if (!pullupCount || pullupCount.count === 0) {
  const insertP = db.prepare(`
    INSERT INTO pullup_tests
      (date, body_weight_kg, top_load_added_kg, top_reps, estimated_1rm_added_kg, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // 82 + 18 = 100 kg total × (1 + 5/30) = 116.67 kg → +34.7 added
  insertP.run('2026-05-28', 82.0, 18.0, 5, 34.7, 'Baseline — +18 kg × 5 clean reps');
  console.log('Baseline pull-up test inserted (+18 × 5 → est 1RM +34.7 kg).');
}

db.close();
console.log('Done.');
