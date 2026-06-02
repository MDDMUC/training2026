// Split Tue Jun 2 mobility session into discrete drills with form notes.
// Replaces the single "Mobility + optional Tindeq recruitment" exercise with:
//   1. Short Mobility Flow — 4 drills (90/90 hip switch, hamstring, ankle, cat-cow), each as its own set with form notes
//   2. Tindeq Recruitment Ladder — 4 ramping pulls, capped at 85%

import Database from 'better-sqlite3';

const db = new Database('db/training.db');
db.pragma('foreign_keys = ON');

const SESSION_DATE = '2026-06-02';

const session = db.prepare(`SELECT id FROM sessions WHERE date = ?`).get(SESSION_DATE) as
  | { id: number }
  | undefined;
if (!session) {
  console.error(`No session found for ${SESSION_DATE}`);
  process.exit(1);
}

const tx = db.transaction(() => {
  db.prepare(`DELETE FROM exercises WHERE session_id = ?`).run(session.id);

  const insertExercise = db.prepare(`
    INSERT INTO exercises (session_id, name, display_order, notes)
    VALUES (?, ?, ?, ?)
  `);
  const insertSet = db.prepare(`
    INSERT INTO exercise_sets (exercise_id, set_num, kind, label, reps, hold_seconds, rest_seconds, notes)
    VALUES (@exercise_id, @set_num, @kind, @label, @reps, @hold_seconds, @rest_seconds, @notes)
  `);

  // 1) Short Mobility Flow — 4 drills
  const mob = insertExercise.run(
    session.id,
    'Short Mobility Flow',
    1,
    '**~10 min total.** Move slow, breathe through each drill. Do the sequence in order — the earlier drills warm tissue for the later ones.'
  );
  const mobId = Number(mob.lastInsertRowid);

  const mobSets = [
    {
      set_num: 1,
      kind: 'checklist',
      label: '90/90 Hip Switch · 1 min/side',
      reps: null,
      hold_seconds: null,
      rest_seconds: null,
      notes:
        'Sit on floor. Front leg bent 90° in front (thigh perpendicular to torso, shin perpendicular to thigh). Rear leg bent 90° to the side, mirror shape. Spine tall, chest over front knee. Switch sides by sweeping both knees through the middle without using your hands if you can. Slow, controlled. Trains hip internal + external rotation under load.'
    },
    {
      set_num: 2,
      kind: 'checklist',
      label: 'Active Straight-Leg Hamstring · 10/leg',
      reps: 10,
      hold_seconds: null,
      rest_seconds: null,
      notes:
        'Lie on back, one leg straight on the floor, the other lifted as high as possible **with the knee locked straight**. Pulse to max range, hold 2 s at top, controlled return. No bending the knee to cheat range. Trains active hamstring length, not passive — the point is the contraction at top range.'
    },
    {
      set_num: 3,
      kind: 'checklist',
      label: 'Ankle Wall Test + Calf Rock · 1 min/ankle',
      reps: null,
      hold_seconds: null,
      rest_seconds: null,
      notes:
        'Face wall, big toe ~10 cm from wall. Drive front knee forward toward the wall **without lifting heel**. If knee touches, scoot foot back 1 cm and retry. Find the threshold position, then rock the knee toward and away from the wall, slow tempo, for 1 min each ankle. Critical for deep-squat depth.'
    },
    {
      set_num: 4,
      kind: 'checklist',
      label: 'Cat-Cow / Thoracic Flow · 2 min',
      reps: null,
      hold_seconds: null,
      rest_seconds: null,
      notes:
        'All fours, hands under shoulders, knees under hips. **Inhale**: drop belly, look up gently, draw shoulder blades together (cow). **Exhale**: round spine, tuck chin, push floor away (cat). Breath-driven, no rushing. Move segment by segment — feel each vertebra. Spinal mobility, especially thoracic.'
    }
  ];
  for (const s of mobSets) insertSet.run({ exercise_id: mobId, ...s });

  // 2) Tindeq Recruitment Ladder
  const rec = insertExercise.run(
    session.id,
    'Tindeq Recruitment Ladder (optional)',
    2,
    '**Optional. ~15 min total.** 20 mm half-crimp, two-hand, feet on floor. 5-s pulls ramping 30 → 50 → 70 → 85% effort, 90 s rest between sets. **Stop at 85% — no max work today.** Wakes neural drive without inducing fatigue. Skip if Tindeq is already packed for travel.'
  );
  const recId = Number(rec.lastInsertRowid);
  const recSets = [
    { set_num: 1, kind: 'work', label: '30% effort', reps: null, hold_seconds: 5, rest_seconds: 90, notes: null },
    { set_num: 2, kind: 'work', label: '50% effort', reps: null, hold_seconds: 5, rest_seconds: 90, notes: null },
    { set_num: 3, kind: 'work', label: '70% effort', reps: null, hold_seconds: 5, rest_seconds: 90, notes: null },
    { set_num: 4, kind: 'work', label: '85% effort · stop here', reps: null, hold_seconds: 5, rest_seconds: 90, notes: null }
  ];
  for (const s of recSets) insertSet.run({ exercise_id: recId, ...s });
});

tx();

const rows = db
  .prepare(
    `SELECT e.display_order, e.name,
            (SELECT COUNT(*) FROM exercise_sets WHERE exercise_id = e.id) AS sets
     FROM exercises e
     WHERE e.session_id = ?
     ORDER BY e.display_order`
  )
  .all(session.id);
console.log(`Tue Jun 2 session restructured:`);
for (const r of rows) console.log(JSON.stringify(r));

db.close();
