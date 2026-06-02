// One-off: reshape the runway week around the climbing festival (Wed Jun 3 → Sun Jun 7).
// Bouldering comp = Sat Jun 6. Travel Wed afternoon.
//
// Final shape:
//   Tue Jun 2 — mobility (NEW): light mobility + optional Tindeq recruitment
//   Wed Jun 3 — keep No-hangs 3/4 (session note added: pre-travel + ~72 h pre-comp prep)
//   Thu Jun 4 — rest (NEW): travel + festival arrival
//   Fri Jun 5 — REPLACE 4/4: festival scout + warm-up (no max)
//   Sat Jun 6 — climb-outdoor (NEW): bouldering competition
//   Sun Jun 7 — rest (NEW): recovery
//
// Idempotent enough: existing sessions on these dates are updated in place; new ones are
// only inserted if no session for that date exists yet.

import Database from 'better-sqlite3';

const db = new Database('db/training.db');
db.pragma('foreign_keys = ON');

interface SessionInsert {
  date: string;
  type: string;
  title: string;
  notes: string;
}

interface ExerciseInsert {
  name: string;
  notes: string;
  sets: Array<{
    set_num: number;
    kind: string;
    label: string;
    reps?: number;
    hold_seconds?: number;
    rest_seconds?: number;
  }>;
}

const findSession = db.prepare<string>(`SELECT id FROM sessions WHERE date = ?`);
const insertSession = db.prepare(`
  INSERT INTO sessions (date, type, title, scheduled, notes)
  VALUES (@date, @type, @title, 1, @notes)
`);
const updateSession = db.prepare(`
  UPDATE sessions SET type = @type, title = @title, notes = @notes WHERE id = @id
`);
const updateSessionNotesOnly = db.prepare(`
  UPDATE sessions SET notes = @notes WHERE id = @id
`);
const deleteExercisesForSession = db.prepare(`DELETE FROM exercises WHERE session_id = ?`);
const insertExercise = db.prepare(`
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (?, ?, ?, ?)
`);
const insertSet = db.prepare(`
  INSERT INTO exercise_sets (exercise_id, set_num, kind, label, reps, hold_seconds, rest_seconds)
  VALUES (@exercise_id, @set_num, @kind, @label, @reps, @hold_seconds, @rest_seconds)
`);

function upsertSession(session: SessionInsert, replaceExercises: boolean, exercises: ExerciseInsert[]): number {
  const existing = findSession.get(session.date) as { id: number } | undefined;
  let sessionId: number;
  if (existing) {
    updateSession.run({ id: existing.id, type: session.type, title: session.title, notes: session.notes });
    sessionId = existing.id;
    if (replaceExercises) deleteExercisesForSession.run(sessionId);
  } else {
    const info = insertSession.run(session);
    sessionId = Number(info.lastInsertRowid);
  }
  if (exercises.length > 0 && (replaceExercises || !existing)) {
    exercises.forEach((ex, idx) => {
      const exInfo = insertExercise.run(sessionId, ex.name, idx + 1, ex.notes);
      const exerciseId = Number(exInfo.lastInsertRowid);
      for (const s of ex.sets) {
        insertSet.run({
          exercise_id: exerciseId,
          set_num: s.set_num,
          kind: s.kind,
          label: s.label,
          reps: s.reps ?? null,
          hold_seconds: s.hold_seconds ?? null,
          rest_seconds: s.rest_seconds ?? null
        });
      }
    });
  }
  return sessionId;
}

const tx = db.transaction(() => {
  // -- Tue Jun 2 — NEW: light mobility + optional Tindeq recruitment --
  upsertSession(
    {
      date: '2026-06-02',
      type: 'mobility',
      title: 'Pre-festival · Light Mobility + Optional Recruitment',
      notes:
        '**Festival travel tomorrow (Wed) lunchtime. Bouldering comp Sat Jun 6.** Today is intentionally light — protect freshness for the comp. No strength, no run.'
    },
    true,
    [
      {
        name: 'Mobility + optional Tindeq recruitment',
        notes:
          '**Pick one or both — keep total under 30 min.**\n\n- **Short mobility flow (10 min):** 90/90 hip switch, active straight-leg hamstring, ankle wall test, cat-cow.\n- **Optional Tindeq recruitment ladder (15 min):** 20 mm half-crimp, two-hand. 5 pulls each at 30 / 50 / 70 / 85% effort, 90 s rest between sets. **Stop at 85% — no max work today.** Wakes neural drive without fatigue.\n\nIf you feel like the body is asking for rest, take it.',
        sets: [
          { set_num: 1, kind: 'checklist', label: 'Short mobility flow · 10 min' },
          { set_num: 2, kind: 'checklist', label: 'Recruitment ladder · 30% effort' },
          { set_num: 3, kind: 'checklist', label: 'Recruitment ladder · 50% effort' },
          { set_num: 4, kind: 'checklist', label: 'Recruitment ladder · 70% effort' },
          { set_num: 5, kind: 'checklist', label: 'Recruitment ladder · 85% effort' }
        ]
      }
    ]
  );

  // -- Wed Jun 3 — KEEP existing No-hangs 3/4; just append session-level context --
  const existingWed = findSession.get('2026-06-03') as { id: number } | undefined;
  if (existingWed) {
    updateSessionNotesOnly.run({
      id: existingWed.id,
      notes:
        '**Do this AM before traveling at lunchtime.** Bouldering comp Sat Jun 6 — this sub-max stimulus ~72 h out actually primes tendon stiffness. **Skip entirely if L A2 / middle PIP feels anything off** — comp readiness > calibration day.'
    });
  }

  // -- Thu Jun 4 — NEW: travel + festival arrival, rest --
  upsertSession(
    {
      date: '2026-06-04',
      type: 'rest',
      title: 'Travel + Festival Arrival · Rest',
      notes:
        '**Comp is in 2 days.** No climbing today. Walk around the venue, scout boulders if accessible, eat well, sleep early.'
    },
    true,
    [
      {
        name: 'Rest + scout',
        notes:
          '- Travel.\n- Walk the festival, look at competition wall if open.\n- 10 min mobility before bed.\n- Hydrate, eat well, sleep ≥ 7.5 h.',
        sets: [
          { set_num: 1, kind: 'checklist', label: 'Hydration + nutrition' },
          { set_num: 2, kind: 'checklist', label: 'Scout comp wall if accessible' },
          { set_num: 3, kind: 'checklist', label: 'Short mobility before bed · 10 min' }
        ]
      }
    ]
  );

  // -- Fri Jun 5 — REPLACE 4/4 with scout + warm-up day --
  upsertSession(
    {
      date: '2026-06-05',
      type: 'climb-outdoor',
      title: 'Festival · Scout + Warm-up (no max)',
      notes:
        '**Day before comp.** Goal: prime the system, not deplete it. **No max attempts, no projecting.** Scout problems, learn the holds, climb jugs and easy lines only. If unsure between two efforts, pick the easier one.'
    },
    true,
    [
      {
        name: 'Tindeq recruitment ladder (AM)',
        notes:
          '**If you have the Tindeq with you.** 20 mm half-crimp, two-hand. 5 pulls each at 30 / 50 / 70 / 85% effort, 90 s rest. **Stop at 85%.** ~10 min total. Neural priming without fatigue.',
        sets: [
          { set_num: 1, kind: 'work', label: '30% effort', hold_seconds: 5, rest_seconds: 90 },
          { set_num: 2, kind: 'work', label: '50% effort', hold_seconds: 5, rest_seconds: 90 },
          { set_num: 3, kind: 'work', label: '70% effort', hold_seconds: 5, rest_seconds: 90 },
          { set_num: 4, kind: 'work', label: '85% effort', hold_seconds: 5, rest_seconds: 90 }
        ]
      },
      {
        name: 'Festival warm-up + scouting',
        notes:
          '**Hooper 3-step warm-up before pulling on anything.** Tendon glides → band ER + scap retract → 3 easy laps on jugs.\n\nThen: 30–45 min of easy climbing — moderate problems well below your max, focus on movement quality, foot precision. Walk the comp wall, watch others on it, build a mental model of what tomorrow looks like. **Stop while you still feel fresh.**',
        sets: [
          { set_num: 1, kind: 'checklist', label: 'Hooper 3-step warm-up' },
          { set_num: 2, kind: 'checklist', label: 'Easy climbing · 30–45 min · jugs + tech' },
          { set_num: 3, kind: 'checklist', label: 'Scout comp wall + watch others' },
          { set_num: 4, kind: 'checklist', label: 'Cool-down: tendon glides + stretch' }
        ]
      }
    ]
  );

  // -- Sat Jun 6 — NEW: comp --
  upsertSession(
    {
      date: '2026-06-06',
      type: 'climb-outdoor',
      title: 'BOULDERING COMPETITION',
      notes:
        '**Send day.** Full Hooper 3-step warm-up before climbing. Eat 90 min before. Hydrate. Be patient between burns — full rest beats stacking attempts. Log results in the climbing log.'
    },
    true,
    [
      {
        name: 'Pre-comp warm-up',
        notes:
          '**Mandatory.** Tendon glides → band ER + scap retract → recruitment pulls on warm-up hangboard or easiest available holds (30/50/70/85%). Then 3–5 easy boulders, building from jugs to vertical crimps. **No max efforts in warm-up — leave it for the comp.**',
        sets: [
          { set_num: 1, kind: 'checklist', label: 'Tendon glides · both hands' },
          { set_num: 2, kind: 'checklist', label: 'Band ER + scap retract' },
          { set_num: 3, kind: 'checklist', label: 'Recruitment ladder to 85%' },
          { set_num: 4, kind: 'checklist', label: '3–5 easy boulders, escalating' }
        ]
      },
      {
        name: 'Competition',
        notes:
          '**Full-go.** Log each attempted problem in the climbing log (grade, style: flash/redpoint/attempt). Rest fully between burns — comp scoring rewards quality over volume on most formats.',
        sets: [{ set_num: 1, kind: 'checklist', label: 'Compete' }]
      }
    ]
  );

  // -- Sun Jun 7 — NEW: recovery --
  upsertSession(
    {
      date: '2026-06-07',
      type: 'rest',
      title: 'Recovery + Festival Wind-down',
      notes:
        '**Recovery day.** Easy climbing only if it sounds fun — jugs, social laps, no hard pulls. Long mobility flow, eat well. **Decide tonight whether Mon Jun 8 Phase 1 Week 1 pull-heavy goes as written or gets softened / shifted to Tue.**'
    },
    true,
    [
      {
        name: 'Recovery',
        notes:
          '- Long mobility flow (30 min) if comp left you stiff.\n- Optional very easy climbing — jugs only, social.\n- Hydrate, nap if needed.\n- **Tonight: gut-check Mon Jun 8.** If forearms / fingers feel hammered, drop a hangboard set and 5 kg off pull-up working load, or push Mon → Tue.',
        sets: [
          { set_num: 1, kind: 'checklist', label: 'Long mobility flow · 30 min' },
          { set_num: 2, kind: 'checklist', label: 'Mon Jun 8 gut-check' }
        ]
      }
    ]
  );
});

tx();

console.log('Festival week reshape complete. Final shape:');
const rows = db
  .prepare(
    `SELECT s.date, s.type, s.title,
            (SELECT COUNT(*) FROM exercises WHERE session_id = s.id) AS ex_count
     FROM sessions s
     WHERE s.date BETWEEN '2026-06-02' AND '2026-06-07'
     ORDER BY s.date`
  )
  .all();
for (const r of rows) console.log(JSON.stringify(r));

db.close();
