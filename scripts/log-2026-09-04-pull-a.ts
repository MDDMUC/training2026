// Update Martin's 2026-09-04 Pull A to match as-done work.
// Safe to re-run: replaces curl sets, upserts front raises, patches pull-ups + BW.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-04';
const SESSION_ID = 216;

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
      SET body_weight_kg = 81,
          completed = true,
          notes = ${
            `**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.

**As done 2026-09-04:** BW 81 kg. Pull-ups 4×6 (set 4 last rep a bit hard, overall easy). Curls bilateral (not L/R): biceps 4 kg / 6.5 kg / 6.5 kg × 14; hammers 3×14 @ 6.5 kg. Front raises 3×20 @ 2.5 kg/hand.`
          }
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID}
    `;

    // Pull-ups: 4 × 6
    const pulls = await tx<{ id: number }[]>`
      SELECT id FROM exercises
      WHERE session_id = ${SESSION_ID} AND name = 'Pull-ups · bodyweight'
    `;
    if (pulls[0]) {
      await tx`
        UPDATE exercises
        SET athlete_notes = ${
          '4 × 6 BW. Felt mostly easy; last rep of set 4 a little struggle, not bad.'
        }
        WHERE id = ${pulls[0].id}
      `;
      await tx`
        UPDATE exercise_sets es
        SET reps = 6,
            completed = true,
            notes = CASE
              WHEN es.set_num = 4 THEN 'Last rep a little struggle; overall still okay.'
              ELSE 'Felt easy.'
            END
        FROM exercises e
        WHERE es.exercise_id = e.id
          AND e.id = ${pulls[0].id}
          AND e.session_id = ${SESSION_ID}
      `;
    }

    // Curls: replace L/R prescription with bilateral as-done
    const curls = await tx<{ id: number }[]>`
      SELECT id FROM exercises WHERE session_id = ${SESSION_ID} AND name = 'Curls'
    `;
    if (!curls[0]) throw new Error('Curls exercise missing');
    const curlId = curls[0].id;
    await tx`
      UPDATE exercises
      SET athlete_notes = ${
        'Bilateral (both arms together), not L/R. Biceps: 4 kg × 14, then 6.5 kg × 14, then 6.5 kg × 14. Hammers: 3 × 14 @ 6.5 kg bilateral. Set-3 biceps / hammer kg assumed 6.5 if not stated otherwise.'
      },
          notes = 'As done: bilateral DB curls (not single-arm). Prescribed L/R 12 kg / 8 kg not used.'
      WHERE id = ${curlId}
    `;
    await tx`DELETE FROM exercise_sets WHERE exercise_id = ${curlId}`;

    const curlSets: Array<{
      set_num: number;
      label: string;
      reps: number;
      load_kg: number;
      notes: string;
    }> = [
      {
        set_num: 1,
        label: 'Bicep curl · bilateral · 4 kg · set 1',
        reps: 14,
        load_kg: 4,
        notes: 'Both arms together.'
      },
      {
        set_num: 2,
        label: 'Bicep curl · bilateral · 6.5 kg · set 2',
        reps: 14,
        load_kg: 6.5,
        notes: 'Both arms together.'
      },
      {
        set_num: 3,
        label: 'Bicep curl · bilateral · 6.5 kg · set 3',
        reps: 14,
        load_kg: 6.5,
        notes: 'Both arms together. Weight assumed same as set 2.'
      },
      {
        set_num: 4,
        label: 'Hammer curl · bilateral · 6.5 kg · set 1',
        reps: 14,
        load_kg: 6.5,
        notes: 'Both arms together. Same weight across hammer sets.'
      },
      {
        set_num: 5,
        label: 'Hammer curl · bilateral · 6.5 kg · set 2',
        reps: 14,
        load_kg: 6.5,
        notes: 'Both arms together.'
      },
      {
        set_num: 6,
        label: 'Hammer curl · bilateral · 6.5 kg · set 3',
        reps: 14,
        load_kg: 6.5,
        notes: 'Both arms together.'
      }
    ];
    for (const s of curlSets) {
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, completed, notes
        ) VALUES (
          ${curlId}, ${s.set_num}, 'work', ${s.label}, ${s.reps}, ${s.load_kg}, 60, true, ${s.notes}
        )
      `;
    }

    // Front raises (added ad-hoc)
    let front = await tx<{ id: number }[]>`
      SELECT id FROM exercises
      WHERE session_id = ${SESSION_ID} AND name = 'DB front raise'
    `;
    if (!front[0]) {
      // Insert before mobility (display_order 4); bump mobility to 5
      await tx`
        UPDATE exercises SET display_order = 5
        WHERE session_id = ${SESSION_ID} AND name = 'Mobility · 10 min'
      `;
      const [{ id }] = await tx<{ id: number }[]>`
        INSERT INTO exercises (session_id, name, display_order, notes, athlete_notes)
        VALUES (
          ${SESSION_ID},
          'DB front raise',
          4,
          'Arms extended, raise straight in front of the body (front delts).',
          '2.5 kg each hand. 3 × 20. As done on Day 1 Pull A.'
        )
        RETURNING id
      `;
      front = [{ id }];
    } else {
      await tx`
        UPDATE exercises
        SET athlete_notes = '2.5 kg each hand. 3 × 20. As done on Day 1 Pull A.',
            notes = 'Arms extended, raise straight in front of the body (front delts).'
        WHERE id = ${front[0].id}
      `;
      await tx`DELETE FROM exercise_sets WHERE exercise_id = ${front[0].id}`;
    }
    for (let i = 1; i <= 3; i++) {
      await tx`
        INSERT INTO exercise_sets (
          exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, completed, notes
        ) VALUES (
          ${front[0].id}, ${i}, 'work',
          ${'Front raise · 2.5 kg/hand · set ' + i},
          20, 2.5, 45, true, 'Straight arms, raise in front of body.'
        )
      `;
    }

    // Keep warm-up + mobility completed
    await tx`
      UPDATE exercise_sets es
      SET completed = true
      FROM exercises e
      WHERE es.exercise_id = e.id
        AND e.session_id = ${SESSION_ID}
        AND e.name IN ('Warm-up · conservative', 'Mobility · 10 min')
    `;

    // Mirror BW onto daily check-in if present / upsert weight
    await tx`
      INSERT INTO daily_check_ins (user_id, date, body_weight_kg)
      VALUES (${USER_ID}, ${DATE}, 81)
      ON CONFLICT (user_id, date)
      DO UPDATE SET body_weight_kg = EXCLUDED.body_weight_kg
    `;
  });

  const check = await sql`
    SELECT s.id, s.date, s.title, s.completed, s.body_weight_kg,
      (SELECT COUNT(*)::int FROM exercises e WHERE e.session_id = s.id) AS exercises,
      (SELECT COUNT(*)::int FROM exercise_sets es
         JOIN exercises e ON e.id = es.exercise_id
         WHERE e.session_id = s.id AND es.completed) AS done_sets
    FROM sessions s WHERE s.id = ${SESSION_ID}
  `;
  const detail = await sql`
    SELECT e.name, es.set_num, es.label, es.reps, es.load_kg, es.completed, es.notes
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
