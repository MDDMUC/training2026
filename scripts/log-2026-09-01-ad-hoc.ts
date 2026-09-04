// Log Martin's 2026-09-01 ad-hoc: 3×6 mixed-grip pull-ups, 3.5 km easy run, upper-body stretch.
// Idempotent: skips if a matching unscheduled session already exists that day.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import { REENTRY_CYCLE_NAME } from '../src/lib/domain/reentryPlan';

const USER_ID = 'martin';
const DATE = '2026-09-01';
const TITLE = 'Ad-hoc — mixed-grip pull-ups + easy run';

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
  const existing = await sql<{ id: string; title: string | null; archived: boolean }[]>`
    SELECT id, title, archived FROM sessions
    WHERE user_id = ${USER_ID} AND date = ${DATE}
    ORDER BY id
  `;
  console.log('Existing sessions on', DATE, existing);

  const already = existing.find(
    (s) => s.title === TITLE && s.archived === false
  );
  if (already) {
    console.log('Already logged as session', already.id, '— no-op.');
    process.exit(0);
  }

  const notes = `Unplanned. 3 × 6 pull-ups, mixed grips, slippery bar — felt hard, did not grind. Easy run 3.5 km in 30 min. Light upper-body stretching. Joint okay. Scale Pull A tomorrow.`;

  const [{ id: sessionId }] = await sql<{ id: number }[]>`
    INSERT INTO sessions (
      user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
    )
    VALUES (
      ${USER_ID}, ${DATE}, NULL, 'pull-heavy', ${TITLE},
      false, false, ${notes}, false, ${REENTRY_CYCLE_NAME}
    )
    RETURNING id
  `;
  console.log('Inserted session', sessionId);

  const [{ id: pullId }] = await sql<{ id: number }[]>`
    INSERT INTO exercises (session_id, name, display_order, notes)
    VALUES (
      ${sessionId},
      'Pull-ups · mixed grip',
      1,
      'Three grip types. Slippery bar. Bodyweight. Stopped short of a grind. Joint okay.'
    )
    RETURNING id
  `;
  for (let i = 1; i <= 3; i++) {
    await sql`
      INSERT INTO exercise_sets (exercise_id, set_num, kind, label, reps, load_kg_added, completed, notes)
      VALUES (
        ${pullId}, ${i}, 'work', ${'Pull-up · mixed grip · set ' + i},
        6, 0, true, 'Different grip from the other sets. Slippery bar.'
      )
    `;
  }

  const [{ id: stretchId }] = await sql<{ id: number }[]>`
    INSERT INTO exercises (session_id, name, display_order, notes)
    VALUES (
      ${sessionId},
      'Upper-body stretching',
      2,
      'Light. Not a full mobility block.'
    )
    RETURNING id
  `;
  await sql`
    INSERT INTO exercise_sets (exercise_id, set_num, kind, label, completed)
    VALUES (${stretchId}, 1, 'checklist', 'Light upper-body stretch', true)
  `;

  const pace = Math.round((30 / 3.5) * 100) / 100;
  await sql`
    INSERT INTO running_logs (user_id, session_id, date, distance_km, duration_min, pace_min_per_km, notes)
    VALUES (
      ${USER_ID}, ${sessionId}, ${DATE}, 3.5, 30, ${pace},
      'Very slow / easy. Walk-break pace is fine.'
    )
  `;

  await sql`
    UPDATE sessions SET completed = true WHERE id = ${sessionId} AND user_id = ${USER_ID}
  `;

  const check = await sql`
    SELECT s.id, s.date, s.title, s.completed, s.scheduled,
           (SELECT COUNT(*) FROM exercises e WHERE e.session_id = s.id) AS exercises,
           (SELECT COUNT(*) FROM exercise_sets es JOIN exercises e ON e.id = es.exercise_id WHERE e.session_id = s.id AND es.completed) AS done_sets
    FROM sessions s WHERE s.id = ${sessionId}
  `;
  const run = await sql`
    SELECT distance_km, duration_min, pace_min_per_km FROM running_logs WHERE session_id = ${sessionId}
  `;
  console.log('Session', check[0]);
  console.log('Run', run[0]);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
