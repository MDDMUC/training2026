// Update Martin's 2026-09-07 Pull B to match as-done work.
// Safe to re-run: replaces pull-up / curl sets; upserts laterals + forearms.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-07';
const SESSION_ID = 246;

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
          notes = ${
            `**Re-entry · Hypertrophy Base Week 1.** Back joint still being adjusted. Light–moderate loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

**As done 2026-09-07 (Pull B):** Warm-up + intro as prescribed. Pull-ups 10 / 8 / 7 / 5. Bicep curls 6.5 kg × 20 / 14 / 16. Hammer curls 8 kg × 14 / 14 / 12. Shoulder lateral raises 2.5 kg × 20 / 18 / 20. Forearm curls 4 / 5 / 6.5 kg × 20 / 14 / 26. Wrist curls 4 / 5 / 5 kg × 20 / 15 / 13. Bird-dog and mobility not reported.`
          }
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID}
    `;

    // Warm-up already ticked in UI — keep completed
    await tx`
      UPDATE exercise_sets es
      SET completed = true
      FROM exercises e
      WHERE es.exercise_id = e.id
        AND e.session_id = ${SESSION_ID}
        AND e.name = 'Warm-up · conservative'
    `;

    // Pull-ups: 4 sets · 10 / 8 / 7 / 5
    const pulls = await tx<{ id: number }[]>`
      SELECT id FROM exercises
      WHERE session_id = ${SESSION_ID} AND name = 'Pull-ups · bodyweight'
    `;
    if (!pulls[0]) throw new Error('Pull-ups exercise missing');
    const pullId = pulls[0].id;
    await tx`
      UPDATE exercises
      SET athlete_notes = '4 sets BW: 10, 8, 7, 5. As done (more volume than prescribed 3×5 light Pull B).'
      WHERE id = ${pullId}
    `;
    await tx`DELETE FROM exercise_sets WHERE exercise_id = ${pullId}`;
    const pullReps = [10, 8, 7, 5];
    for (let i = 0; i < pullReps.length; i++) {
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, rest_seconds, completed, notes
        ) VALUES (
          ${pullId}, ${i + 1}, 'work',
          ${'Pull-up · BW · set ' + (i + 1)},
          ${pullReps[i]}, 180, true, 'As done.'
        )
      `;
    }

    // Arms: replace Easy curls with bilateral biceps + hammers
    const curls = await tx<{ id: number }[]>`
      SELECT id FROM exercises WHERE session_id = ${SESSION_ID} AND name IN ('Easy curls', 'Curls')
    `;
    if (!curls[0]) throw new Error('Curls exercise missing');
    const curlId = curls[0].id;
    await tx`
      UPDATE exercises
      SET name = 'Curls',
          athlete_notes = ${
            'Bilateral. Biceps 6.5 kg × 20 / 14 / 16. Hammers 8 kg × 14 / 14 / 12. Replaced prescribed easy L/R 8 kg touch.'
          },
          notes = 'As done: full arms block on Pull B (beyond easy-curl touch).'
      WHERE id = ${curlId}
    `;
    await tx`DELETE FROM exercise_sets WHERE exercise_id = ${curlId}`;

    const curlSets: Array<{
      set_num: number;
      label: string;
      reps: number;
      load_kg: number;
    }> = [
      { set_num: 1, label: 'Bicep curl · bilateral · 6.5 kg · set 1', reps: 20, load_kg: 6.5 },
      { set_num: 2, label: 'Bicep curl · bilateral · 6.5 kg · set 2', reps: 14, load_kg: 6.5 },
      { set_num: 3, label: 'Bicep curl · bilateral · 6.5 kg · set 3', reps: 16, load_kg: 6.5 },
      { set_num: 4, label: 'Hammer curl · bilateral · 8 kg · set 1', reps: 14, load_kg: 8 },
      { set_num: 5, label: 'Hammer curl · bilateral · 8 kg · set 2', reps: 14, load_kg: 8 },
      { set_num: 6, label: 'Hammer curl · bilateral · 8 kg · set 3', reps: 12, load_kg: 8 }
    ];
    for (const s of curlSets) {
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, completed, notes
        ) VALUES (
          ${curlId}, ${s.set_num}, 'work', ${s.label}, ${s.reps}, ${s.load_kg}, 60, true, 'Both arms together.'
        )
      `;
    }

    // Ensure bird-dog / mobility sit after new inserts
    await tx`
      UPDATE exercises SET display_order = 6
      WHERE session_id = ${SESSION_ID} AND name = 'Bird-dog'
    `;
    await tx`
      UPDATE exercises SET display_order = 7
      WHERE session_id = ${SESSION_ID} AND name = 'Mobility · 10 min'
    `;

    // Shoulder lateral raises (ad-hoc)
    let laterals = await tx<{ id: number }[]>`
      SELECT id FROM exercises
      WHERE session_id = ${SESSION_ID} AND name = 'Shoulder lateral raise'
    `;
    if (!laterals[0]) {
      const [{ id }] = await tx<{ id: number }[]>`
        INSERT INTO exercises (session_id, name, display_order, notes, athlete_notes)
        VALUES (
          ${SESSION_ID},
          'Shoulder lateral raise',
          4,
          'Side delts. Slight elbow bend, raise to just below shoulder height.',
          '2.5 kg. 20 / 18 / 20. As done on Pull B.'
        )
        RETURNING id
      `;
      laterals = [{ id }];
    } else {
      await tx`
        UPDATE exercises
        SET display_order = 4,
            athlete_notes = '2.5 kg. 20 / 18 / 20. As done on Pull B.',
            notes = 'Side delts. Slight elbow bend, raise to just below shoulder height.'
        WHERE id = ${laterals[0].id}
      `;
      await tx`DELETE FROM exercise_sets WHERE exercise_id = ${laterals[0].id}`;
    }
    const latReps = [20, 18, 20];
    for (let i = 0; i < latReps.length; i++) {
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, completed, notes
        ) VALUES (
          ${laterals[0].id}, ${i + 1}, 'work',
          ${'Lateral raise · 2.5 kg · set ' + (i + 1)},
          ${latReps[i]}, 2.5, 45, true, 'As done.'
        )
      `;
    }

    // Forearms: forearm curls + wrist curls
    let forearms = await tx<{ id: number }[]>`
      SELECT id FROM exercises
      WHERE session_id = ${SESSION_ID} AND name = 'Forearms'
    `;
    if (!forearms[0]) {
      const [{ id }] = await tx<{ id: number }[]>`
        INSERT INTO exercises (session_id, name, display_order, notes, athlete_notes)
        VALUES (
          ${SESSION_ID},
          'Forearms',
          5,
          'Forearm curls + wrist curls as logged.',
          ${
            'Forearm curls 4 / 5 / 6.5 kg × 20 / 14 / 26. Wrist curls 4 / 5 / 5 kg × 20 / 15 / 13.'
          }
        )
        RETURNING id
      `;
      forearms = [{ id }];
    } else {
      await tx`
        UPDATE exercises
        SET display_order = 5,
            athlete_notes = ${
              'Forearm curls 4 / 5 / 6.5 kg × 20 / 14 / 26. Wrist curls 4 / 5 / 5 kg × 20 / 15 / 13.'
            },
            notes = 'Forearm curls + wrist curls as logged.'
        WHERE id = ${forearms[0].id}
      `;
      await tx`DELETE FROM exercise_sets WHERE exercise_id = ${forearms[0].id}`;
    }

    const forearmSets: Array<{
      set_num: number;
      label: string;
      reps: number;
      load_kg: number;
    }> = [
      { set_num: 1, label: 'Forearm curl · 4 kg · set 1', reps: 20, load_kg: 4 },
      { set_num: 2, label: 'Forearm curl · 5 kg · set 2', reps: 14, load_kg: 5 },
      { set_num: 3, label: 'Forearm curl · 6.5 kg · set 3', reps: 26, load_kg: 6.5 },
      { set_num: 4, label: 'Wrist curl · 4 kg · set 1', reps: 20, load_kg: 4 },
      { set_num: 5, label: 'Wrist curl · 5 kg · set 2', reps: 15, load_kg: 5 },
      { set_num: 6, label: 'Wrist curl · 5 kg · set 3', reps: 13, load_kg: 5 }
    ];
    for (const s of forearmSets) {
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, completed, notes
        ) VALUES (
          ${forearms[0].id}, ${s.set_num}, 'work', ${s.label}, ${s.reps}, ${s.load_kg}, 45, true, 'As done.'
        )
      `;
    }

    // Keep curls at order 3; pull-ups 2; warm-up 1
    await tx`
      UPDATE exercises SET display_order = 1
      WHERE session_id = ${SESSION_ID} AND name = 'Warm-up · conservative'
    `;
    await tx`
      UPDATE exercises SET display_order = 2
      WHERE session_id = ${SESSION_ID} AND name = 'Pull-ups · bodyweight'
    `;
    await tx`
      UPDATE exercises SET display_order = 3
      WHERE session_id = ${SESSION_ID} AND id = ${curlId}
    `;
  });

  const check = await sql`
    SELECT s.id, s.date, s.title, s.completed, s.body_weight_kg,
      (SELECT COUNT(*)::int FROM exercises e WHERE e.session_id = s.id) AS exercises,
      (SELECT COUNT(*)::int FROM exercise_sets es
         JOIN exercises e ON e.id = es.exercise_id
         WHERE e.session_id = s.id AND es.completed) AS done_sets,
      (SELECT COUNT(*)::int FROM exercise_sets es
         JOIN exercises e ON e.id = es.exercise_id
         WHERE e.session_id = s.id) AS total_sets
    FROM sessions s WHERE s.id = ${SESSION_ID}
  `;
  const detail = await sql`
    SELECT e.display_order, e.name, es.set_num, es.label, es.reps, es.load_kg, es.completed
    FROM exercises e
    JOIN exercise_sets es ON es.exercise_id = e.id
    WHERE e.session_id = ${SESSION_ID}
    ORDER BY e.display_order, es.set_num
  `;
  console.log(check[0]);
  for (const row of detail) console.log(row);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
