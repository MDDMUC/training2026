// One-off: insert the interim ad-hoc session for Fri 2026-05-29.
// Pre-plan maintenance/light-gain day. Easy outdoor climbing planned Sat + Sun,
// so loads are deliberately sub-limit. Idempotent: re-running is a no-op.

import Database from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db', 'training.db');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const DATE = '2026-05-29';

const existing = db
  .prepare<[string], { id: number }>('SELECT id FROM sessions WHERE date = ? LIMIT 1')
  .get(DATE);

if (existing) {
  console.log(`Session for ${DATE} already exists (id ${existing.id}). Nothing to do.`);
  db.close();
  process.exit(0);
}

const insertSession = db.prepare(`
  INSERT INTO sessions (date, phase_id, type, title, scheduled, completed, notes)
  VALUES (?, NULL, 'pull-light', ?, 0, 0, ?)
`);

const insertExercise = db.prepare(`
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (?, ?, ?, ?)
`);

const insertSet = db.prepare(`
  INSERT INTO exercise_sets
    (exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const txn = db.transaction(() => {
  const sessionInfo = insertSession.run(
    DATE,
    'Interim — Pre-plan Pull + Light Fingers',
    'Ad-hoc pre-plan session. Main focus: weighted pull-ups at RPE 7 for a maintain/slight-gain stimulus. ' +
      'Fingers stay sub-max (3×2×15s @ 70% MVC) because Sat + Sun are outdoor climbing. ' +
      'No push session, no run today — those slots stay for the real plan starting Jun 8.'
  );
  const sessionId = Number(sessionInfo.lastInsertRowid);

  // 1. Warm-up — Hooper 3-step
  {
    const exId = Number(
      insertExercise.run(
        sessionId,
        'Warm-up · Hooper 3-step',
        1,
        '**Hooper 3-step, ~15 min.**\n\n' +
          '- Tendon glides — 5 patterns × 10 reps (fist → hook → straight → table-top → full fist)\n' +
          '- Band external rotations + scapular retractions — 2 × 12\n' +
          '- Tindeq recruitment pulls on 20 mm: 5 ascending sets at 30/50/70/85/95% effort, 90 s rest. ' +
          '**L hand first.** Doubles as primer for the finger work.'
      ).lastInsertRowid
    );
    insertSet.run(exId, 1, 'checklist', 'Hooper 3-step warm-up complete', null, null, null, null, null, null);
  }

  // 2. Fingers — Tindeq Asymmetry Isos, sub-max
  {
    const exId = Number(
      insertExercise.run(
        sessionId,
        'Tindeq Asymmetry Isos · 20 mm',
        2,
        '**Sub-max only — 70% MVC.** L hand first, fully rested.\n\n' +
          'L target: **36 kg** (70% of 52 kg MVC). R target: **38 kg** (70% of 55 kg MVC).\n' +
          '3 sets per hand × 2 reps × 15 s hold, 15 s rest within set, 2 min between sets.\n\n' +
          '**24-hour pain rule** on the left middle finger PIP. If anything aggravates, stop.'
      ).lastInsertRowid
    );
    let n = 0;
    for (let i = 0; i < 3; i++) {
      n++;
      insertSet.run(exId, n, 'work', 'L · half-crimp', 2, 36, null, 15, 120, null);
    }
    for (let i = 0; i < 3; i++) {
      n++;
      insertSet.run(exId, n, 'work', 'R · half-crimp', 2, 38, null, 15, 120, null);
    }
  }

  // 3. Weighted Pull-ups — main focus
  {
    const exId = Number(
      insertExercise.run(
        sessionId,
        'Weighted Pull-ups',
        3,
        '**Main focus today.** Cap at **RPE 7** — leave 3 reps in reserve. ' +
          'This is enough stimulus for a maintain/gain at sub-max without burning the pulling chain for tomorrow outdoors.\n\n' +
          '4 warm-up sets pyramid → 3 working sets @ +18 kg × 5 → 1 backoff @ +10 × 6–8.\n' +
          '3–4 min rest between working sets.'
      ).lastInsertRowid
    );
    // Pyramid warm-up
    insertSet.run(exId, 1, 'warmup', 'BW', 5, null, 0, null, 120, null);
    insertSet.run(exId, 2, 'warmup', '+5 kg', 5, null, 5, null, 120, null);
    insertSet.run(exId, 3, 'warmup', '+10 kg', 5, null, 10, null, 120, null);
    insertSet.run(exId, 4, 'warmup', '+15 kg', 3, null, 15, null, 180, null);
    // Working
    insertSet.run(exId, 5, 'work', '+18 kg · RPE 7', 5, null, 18, null, 210, null);
    insertSet.run(exId, 6, 'work', '+18 kg · RPE 7', 5, null, 18, null, 210, null);
    insertSet.run(exId, 7, 'work', '+18 kg · RPE 7', 5, null, 18, null, 210, null);
    // Backoff
    insertSet.run(exId, 8, 'backoff', '+10 kg · back-off', 7, null, 10, null, null, null);
  }

  // 4. Bicep Curls
  {
    const exId = Number(
      insertExercise.run(
        sessionId,
        'Bicep Curls · 16 kg',
        4,
        '2 sets × 12 reps per arm. Controlled tempo, no swing.'
      ).lastInsertRowid
    );
    insertSet.run(exId, 1, 'work', 'L arm', 12, null, 16, null, 60, null);
    insertSet.run(exId, 2, 'work', 'L arm', 12, null, 16, null, 60, null);
    insertSet.run(exId, 3, 'work', 'R arm', 12, null, 16, null, 60, null);
    insertSet.run(exId, 4, 'work', 'R arm', 12, null, 16, null, 60, null);
  }

  // 5. Hammer Curls
  {
    const exId = Number(
      insertExercise.run(
        sessionId,
        'Hammer Curls · 9 kg',
        5,
        '2 sets × 12 reps per arm. Neutral grip — brachialis + brachioradialis bias.'
      ).lastInsertRowid
    );
    insertSet.run(exId, 1, 'work', 'L arm', 12, null, 9, null, 60, null);
    insertSet.run(exId, 2, 'work', 'L arm', 12, null, 9, null, 60, null);
    insertSet.run(exId, 3, 'work', 'R arm', 12, null, 9, null, 60, null);
    insertSet.run(exId, 4, 'work', 'R arm', 12, null, 9, null, 60, null);
  }

  // 6. Face Pulls — light antagonist work
  {
    const exId = Number(
      insertExercise.run(
        sessionId,
        'Face Pulls',
        6,
        '2 × 15 with a band or cable. Posterior delt + lower trap. ' +
          'Keep it light — pull-ups already did the heavy posterior work.'
      ).lastInsertRowid
    );
    insertSet.run(exId, 1, 'work', 'band/cable', 15, null, null, null, 60, null);
    insertSet.run(exId, 2, 'work', 'band/cable', 15, null, null, null, 60, null);
  }

  // 7. Mobility cooldown
  {
    const exId = Number(
      insertExercise.run(
        sessionId,
        'Mobility · 10 min',
        7,
        'Hip 90/90, hamstring active straight-leg, ankle wall test, brief deep-squat hold (30–60 s).'
      ).lastInsertRowid
    );
    insertSet.run(exId, 1, 'checklist', 'Mobility complete', null, null, null, null, null, null);
  }

  return sessionId;
});

const newSessionId = txn();
console.log(`Inserted ad-hoc session for ${DATE}, id ${newSessionId}.`);

db.close();
