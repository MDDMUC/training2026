// Update Martin's 2026-09-11 Pull A to match as-done work.
// Idempotent: replaces pull / curl / forearm sets; removes skipped fly.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-11';
const SESSION_ID = 250;

const NOTES = `**Hypertrophy Base Week 2 · Pull A.** Back joint still being adjusted. 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

**As done 2026-09-11:** Pull-ups BW 8 / 7 / 6 / 6 (4 sets). Bicep curls bilateral 10 kg × 8 / 8. Hammer curls bilateral 8 kg × 14, then 10 kg × 12 / 12. Wrist curls 5 kg × 22 × 3. Wrist extensors 5 kg × 14 × 3. Bent-arm floor fly skipped. Mobility not reported.`;

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
  const sess = await sql<{ id: number; title: string }[]>`
    SELECT id, title FROM sessions
    WHERE id = ${SESSION_ID} AND user_id = ${USER_ID} AND date = ${DATE}
  `;
  if (sess.length !== 1) {
    console.error('Expected session', SESSION_ID, 'on', DATE, '— found', sess);
    process.exit(1);
  }

  await sql.begin(async (tx) => {
    await tx`
      UPDATE sessions
      SET completed = true,
          title = 'Pull A — pulls, biceps, forearms',
          notes = ${NOTES},
          updated_at = NOW()
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID}
    `;

    await tx`
      UPDATE exercise_sets es
      SET completed = true
      FROM exercises e
      WHERE es.exercise_id = e.id
        AND e.session_id = ${SESSION_ID}
        AND e.name = 'Warm-up · conservative'
    `;

    // Pull-ups: 4 sets · 8 / 7 / 6 / 6
    const pulls = await tx<{ id: number }[]>`
      SELECT id FROM exercises
      WHERE session_id = ${SESSION_ID} AND name = 'Pull-ups · bodyweight'
    `;
    if (!pulls[0]) throw new Error('Pull-ups exercise missing');
    const pullId = pulls[0].id;
    await tx`
      UPDATE exercises
      SET athlete_notes = '4 sets BW: 8, 7, 6, 6. As done (dropped the 5th prescribed set).',
          display_order = 2
      WHERE id = ${pullId}
    `;
    await tx`DELETE FROM exercise_sets WHERE exercise_id = ${pullId}`;
    const pullReps = [8, 7, 6, 6];
    for (let i = 0; i < pullReps.length; i++) {
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg_added, rest_seconds, rpe, completed, notes
        ) VALUES (
          ${pullId}, ${i + 1}, 'work',
          ${'Pull-up · BW · set ' + (i + 1)},
          ${pullReps[i]}, 0, 180, 6, true, 'As done.'
        )
      `;
    }

    // Curls: bilateral biceps 2×8 @ 10 + hammers 14/12/12 @ 8/10/10
    const curls = await tx<{ id: number }[]>`
      SELECT id FROM exercises WHERE session_id = ${SESSION_ID} AND name = 'Curls'
    `;
    if (!curls[0]) throw new Error('Curls exercise missing');
    const curlId = curls[0].id;
    await tx`
      UPDATE exercises
      SET display_order = 3,
          athlete_notes = ${
            'Bilateral. Biceps 10 kg × 8 / 8. Hammers 8 kg × 14, then 10 kg × 12 / 12.'
          },
          notes = 'As done: bilateral DB curls (not single-arm L/R prescription).'
      WHERE id = ${curlId}
    `;
    await tx`DELETE FROM exercise_sets WHERE exercise_id = ${curlId}`;

    const curlSets: Array<{ label: string; reps: number; load_kg: number }> = [
      { label: 'Bicep curl · bilateral · 10 kg · set 1', reps: 8, load_kg: 10 },
      { label: 'Bicep curl · bilateral · 10 kg · set 2', reps: 8, load_kg: 10 },
      { label: 'Hammer curl · bilateral · 8 kg · set 1', reps: 14, load_kg: 8 },
      { label: 'Hammer curl · bilateral · 10 kg · set 2', reps: 12, load_kg: 10 },
      { label: 'Hammer curl · bilateral · 10 kg · set 3', reps: 12, load_kg: 10 }
    ];
    for (let i = 0; i < curlSets.length; i++) {
      const s = curlSets[i];
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, rpe, completed, notes
        ) VALUES (
          ${curlId}, ${i + 1}, 'work', ${s.label},
          ${s.reps}, ${s.load_kg}, 60, 6, true, 'Both arms together.'
        )
      `;
    }

    // Skip bent-arm floor fly
    await tx`
      DELETE FROM exercises
      WHERE session_id = ${SESSION_ID} AND name = 'Bent-arm floor fly'
    `;

    // Forearms: wrist curl 3×22 @ 5 + extensor 3×14 @ 5
    const forearms = await tx<{ id: number }[]>`
      SELECT id FROM exercises WHERE session_id = ${SESSION_ID} AND name = 'Forearms'
    `;
    if (!forearms[0]) throw new Error('Forearms exercise missing');
    const forearmId = forearms[0].id;
    await tx`
      UPDATE exercises
      SET display_order = 4,
          athlete_notes = 'Wrist curls 5 kg × 22 × 3. Wrist extensors 5 kg × 14 × 3.',
          notes = 'As done forearms.'
      WHERE id = ${forearmId}
    `;
    await tx`DELETE FROM exercise_sets WHERE exercise_id = ${forearmId}`;

    const forearmSets: Array<{ label: string; reps: number; load_kg: number }> = [
      { label: 'Wrist curl · 5 kg · set 1', reps: 22, load_kg: 5 },
      { label: 'Wrist curl · 5 kg · set 2', reps: 22, load_kg: 5 },
      { label: 'Wrist curl · 5 kg · set 3', reps: 22, load_kg: 5 },
      { label: 'Wrist extensor · 5 kg · set 1', reps: 14, load_kg: 5 },
      { label: 'Wrist extensor · 5 kg · set 2', reps: 14, load_kg: 5 },
      { label: 'Wrist extensor · 5 kg · set 3', reps: 14, load_kg: 5 }
    ];
    for (let i = 0; i < forearmSets.length; i++) {
      const s = forearmSets[i];
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, rpe, completed, notes
        ) VALUES (
          ${forearmId}, ${i + 1}, 'work', ${s.label},
          ${s.reps}, ${s.load_kg}, 60, 6, true, 'As done.'
        )
      `;
    }

    await tx`
      UPDATE exercises
      SET display_order = 5
      WHERE session_id = ${SESSION_ID} AND name = 'Mobility · 10 min'
    `;
  });

  const check = await sql`
    SELECT e.display_order, e.name,
           (SELECT COUNT(*)::int FROM exercise_sets es WHERE es.exercise_id = e.id) AS sets,
           (SELECT COUNT(*)::int FROM exercise_sets es WHERE es.exercise_id = e.id AND es.completed) AS done
    FROM exercises e
    WHERE e.session_id = ${SESSION_ID}
    ORDER BY e.display_order, e.id
  `;
  const session = await sql`
    SELECT id, title, completed FROM sessions WHERE id = ${SESSION_ID}
  `;
  console.log('Session', session[0]);
  console.log('Exercises', check);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
