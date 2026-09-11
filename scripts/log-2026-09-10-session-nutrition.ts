// Update Martin's 2026-09-10 rest-day session (mobility + pulls + shrugs) and log food.
// Idempotent: replaces named exercises; upserts nutrition by description key;
// sets activity_calories = 924 (run) + 120 (body work) = 1044.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';
import {
  computeDailyTargets,
  sumEntries,
  caloriesHit,
  proteinHit,
  type NutritionProfile
} from '../src/lib/domain/nutrition.ts';

const USER_ID = 'martin';
const DATE = '2026-09-10';
const SESSION_ID = 249;
const RUN_KCAL = 924;
const BODY_KCAL = 120;
const ACTIVITY_KCAL = RUN_KCAL + BODY_KCAL;

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

type Entry = {
  key: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: Array<{
    food: string;
    qty: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
};

// Macro assumptions (manual estimate — no Anthropic):
// - Krapfen with pistachio cream filling: Lidl AT anchor 85 g piece
//   → 375 kcal / 7 P / 38 C / 21 F each (441/8/45/25 per 100 g). Cream fills harder than jam.
// - Cooked white rice: 5 "big spoons" ≈ 5 × ~60 g = ~300 g cooked
//   → per 100 g ~130 / 2.7 / 28 / 0.3 → 390 / 8 / 84 / 1.
// - Minced meat 500 g raw ~20% fat (same as 2026-09-04 beef log):
//   USDA 80/20 ≈ 254 / 17 / 0 / 20 per 100 g → 1270 / 85 / 0 / 100.
// - Eggs: 3 large plain (scaled from 2 = 145/13/1/10) → 220 / 20 / 2 / 15.
const entries: Entry[] = [
  {
    key: '%krapfen%',
    description: '2 Krapfen with pistachio cream filling (before workout)',
    calories: 750,
    protein_g: 14,
    carbs_g: 76,
    fat_g: 42,
    items: [
      {
        food: 'Krapfen · pistachio cream',
        qty: '2 bakery · cream-filled (est. ~85 g each; Lidl AT pistachio-cream anchor)',
        calories: 750,
        protein_g: 14,
        carbs_g: 76,
        fat_g: 42
      }
    ]
  },
  {
    key: '%minced%',
    description: '5 big spoons rice + 500 g minced meat + 3 eggs (post-run)',
    calories: 1880,
    protein_g: 113,
    carbs_g: 86,
    fat_g: 116,
    items: [
      {
        food: 'Cooked white rice',
        qty: '5 big spoons · ~300 g cooked',
        calories: 390,
        protein_g: 8,
        carbs_g: 84,
        fat_g: 1
      },
      {
        food: 'Minced meat',
        qty: '500 g raw, ~20% fat',
        calories: 1270,
        protein_g: 85,
        carbs_g: 0,
        fat_g: 100
      },
      {
        food: 'Eggs',
        qty: '3 large, plain',
        calories: 220,
        protein_g: 20,
        carbs_g: 2,
        fat_g: 15
      }
    ]
  }
];

const sessionNotes = `**Hypertrophy Base Week 1 · scheduled Rest.** Optional easy walk day — instead: strong continuous run + light upper work.

**As done 2026-09-10:**
- Run: 8 km in 48 min (6:00/km). Avg HR 165 bpm. Watch burn 924 kcal. Fastest pace since knee surgery.
- Body work (~120 kcal watch): shoulder mobility + band work; BW pull-ups 8 / 6 (slow); a couple of shoulder shrugs.
- First session after chiro/adjustment yesterday (neck joint pop recently). Suspected driver: incomplete scapular depression on pull-ups — cueing shoulder blades down fully. Kept it slow; felt a lot better. On the path to fixing it.
- Knee and back quiet enough to hold the run pace.`;

async function upsertExercise(
  tx: postgres.TransactionSql,
  name: string,
  order: number,
  notes: string | null,
  athleteNotes: string | null,
  sets: Array<{
    set_num: number;
    kind: string;
    label: string;
    reps: number | null;
    completed: boolean;
    notes: string | null;
  }>
) {
  const existing = await tx<{ id: number }[]>`
    SELECT id FROM exercises WHERE session_id = ${SESSION_ID} AND name = ${name} LIMIT 1
  `;
  let exerciseId: number;
  if (existing[0]) {
    exerciseId = Number(existing[0].id);
    await tx`
      UPDATE exercises
      SET display_order = ${order}, notes = ${notes}, athlete_notes = ${athleteNotes}
      WHERE id = ${exerciseId}
    `;
    await tx`DELETE FROM exercise_sets WHERE exercise_id = ${exerciseId}`;
  } else {
    const [{ id }] = await tx<{ id: number }[]>`
      INSERT INTO exercises (session_id, name, display_order, notes, athlete_notes)
      VALUES (${SESSION_ID}, ${name}, ${order}, ${notes}, ${athleteNotes})
      RETURNING id
    `;
    exerciseId = Number(id);
  }
  for (const s of sets) {
    await tx`
      INSERT INTO exercise_sets
        (exercise_id, set_num, kind, label, reps, load_kg_added, completed, notes)
      VALUES (
        ${exerciseId}, ${s.set_num}, ${s.kind}, ${s.label},
        ${s.reps}, 0, ${s.completed}, ${s.notes}
      )
    `;
  }
  return exerciseId;
}

try {
  const sess = await sql<{ id: number }[]>`
    SELECT id FROM sessions
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
          title = 'Rest · 8 km run + mobility / pulls',
          activity_calories = ${ACTIVITY_KCAL},
          notes = ${sessionNotes},
          updated_at = NOW()
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID}
    `;
    console.log('Updated session', SESSION_ID, 'activity_calories', ACTIVITY_KCAL);

    await upsertExercise(
      tx,
      'Shoulder mobility · bands',
      1,
      'Light band + mobility work. Post-adjustment day — keep slow.',
      'Felt better after yesterday’s adjustment. First workout since realignment.',
      [
        {
          set_num: 1,
          kind: 'checklist',
          label: 'Shoulder mobility + band work',
          reps: null,
          completed: true,
          notes: null
        }
      ]
    );

    await upsertExercise(
      tx,
      'Pull-ups · bodyweight',
      2,
      'Cue: full scapular depression — pull shoulder blades down all the way. Suspect incomplete depression contributed to recent neck joint pop.',
      'Slow. 8 then 6. First pulls after adjustment; felt a lot better. Cueing blades down.',
      [
        {
          set_num: 1,
          kind: 'work',
          label: 'Pull-up · BW · set 1',
          reps: 8,
          completed: true,
          notes: 'Slow; blades down'
        },
        {
          set_num: 2,
          kind: 'work',
          label: 'Pull-up · BW · set 2',
          reps: 6,
          completed: true,
          notes: 'Slow; blades down'
        }
      ]
    );

    await upsertExercise(
      tx,
      'Shoulder shrugs',
      3,
      null,
      'A couple of shrugs after pulls.',
      [
        {
          set_num: 1,
          kind: 'checklist',
          label: 'Shoulder shrugs · a couple',
          reps: null,
          completed: true,
          notes: null
        }
      ]
    );

    for (const e of entries) {
      const existing = await tx<{ id: number }[]>`
        SELECT id FROM nutrition_entries
        WHERE user_id = ${USER_ID} AND date = ${DATE}
          AND description ILIKE ${e.key}
        ORDER BY id LIMIT 1
      `;
      if (existing[0]) {
        await tx`
          UPDATE nutrition_entries
          SET description = ${e.description},
              calories = ${e.calories},
              protein_g = ${e.protein_g},
              carbs_g = ${e.carbs_g},
              fat_g = ${e.fat_g},
              items_json = ${JSON.stringify(e.items)}::jsonb
          WHERE id = ${existing[0].id} AND user_id = ${USER_ID}
        `;
        console.log('Updated nutrition', e.description, 'id', existing[0].id);
      } else {
        const [{ id }] = await tx<{ id: number }[]>`
          INSERT INTO nutrition_entries (
            user_id, date, description, calories, protein_g, carbs_g, fat_g, items_json
          ) VALUES (
            ${USER_ID}, ${DATE}, ${e.description},
            ${e.calories}, ${e.protein_g}, ${e.carbs_g}, ${e.fat_g},
            ${JSON.stringify(e.items)}::jsonb
          )
          RETURNING id
        `;
        console.log('Inserted nutrition', e.description, 'id', id);
      }
    }
  });

  const profileRows = await sql<NutritionProfile[]>`
    SELECT * FROM user_nutrition_profile WHERE user_id = ${USER_ID} LIMIT 1
  `;
  const profile = profileRows[0];
  if (!profile) throw new Error('nutrition profile missing');

  const bwRows = await sql<{ body_weight_kg: number }[]>`
    SELECT body_weight_kg FROM (
      SELECT date, body_weight_kg, id::text AS ordkey FROM sessions
      WHERE user_id = ${USER_ID} AND body_weight_kg IS NOT NULL AND date <= ${DATE}
      UNION ALL
      SELECT date, body_weight_kg, 'c' AS ordkey FROM daily_check_ins
      WHERE user_id = ${USER_ID} AND body_weight_kg IS NOT NULL AND date <= ${DATE}
    ) u
    ORDER BY date DESC, ordkey DESC
    LIMIT 1
  `;
  const bw =
    bwRows[0]?.body_weight_kg != null
      ? Number(bwRows[0].body_weight_kg)
      : profile.default_weight_kg != null
        ? Number(profile.default_weight_kg)
        : 81;

  const dayEntries = await sql<
    { description: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[]
  >`
    SELECT description, calories, protein_g, carbs_g, fat_g
    FROM nutrition_entries
    WHERE user_id = ${USER_ID} AND date = ${DATE}
    ORDER BY id
  `;

  const totals = sumEntries(
    dayEntries.map((e) => ({
      calories: Number(e.calories),
      protein_g: Number(e.protein_g),
      carbs_g: Number(e.carbs_g),
      fat_g: Number(e.fat_g)
    }))
  );

  const targets = computeDailyTargets(
    {
      ...profile,
      baseline_activity_factor: Number(profile.baseline_activity_factor),
      protein_g_per_kg: Number(profile.protein_g_per_kg),
      calorie_tolerance_pct: Number(profile.calorie_tolerance_pct)
    },
    bw,
    ACTIVITY_KCAL
  );

  const exercises = await sql`
    SELECT e.name, e.athlete_notes,
           (SELECT json_agg(json_build_object('set_num', es.set_num, 'reps', es.reps, 'completed', es.completed) ORDER BY es.set_num)
            FROM exercise_sets es WHERE es.exercise_id = e.id) AS sets
    FROM exercises e
    WHERE e.session_id = ${SESSION_ID}
    ORDER BY e.display_order
  `;

  console.log('\n--- Exercises ---');
  console.log(JSON.stringify(exercises, null, 2));
  console.log('\n--- Day entries ---');
  for (const e of dayEntries) console.log(e);
  console.log('\nBW', bw);
  console.log('Activity kcal', ACTIVITY_KCAL, `(run ${RUN_KCAL} + body ${BODY_KCAL})`);
  console.log('Targets', targets);
  console.log('Totals', totals);
  console.log(
    'Calorie band hit (±' + Math.round(Number(profile.calorie_tolerance_pct) * 100) + '%):',
    caloriesHit(totals, targets, Number(profile.calorie_tolerance_pct))
  );
  console.log('Protein hit:', proteinHit(totals, targets));
  console.log('Remaining to goal kcal:', Math.round(targets.goal_kcal - totals.calories));
  console.log('Remaining to protein goal:', Math.round(targets.protein_goal_g - totals.protein_g));
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
