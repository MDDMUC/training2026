// Log Martin's 2026-09-11 meal (manual estimate — no Anthropic).
// Idempotent: upserts by description key.
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
const DATE = '2026-09-11';
const SESSION_ID = 250;

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

// Macro assumptions (manual estimate):
// - Chicken breast 500 g raw, skinless: ~120 kcal / 22.5 P / 0 C / 2.6 F per 100 g
//   → 600 / 113 / 0 / 13
// - Cooked white rice 250 g: same anchor as 2026-09-10 (~130 / 2.7 / 28 / 0.3 per 100 g)
//   → 325 / 7 / 70 / 1
// - Kidney beans: ½ small can drained ≈ 110 g cooked/canned drained
//   (~127 / 8.7 / 22.8 / 0.5 per 100 g) → 140 / 10 / 25 / 1
// Meal total: 1065 / 130 / 95 / 15
const entries: Entry[] = [
  {
    key: '%chicken breast%',
    description: '500 g chicken breast + 250 g rice + ½ small can kidney beans',
    calories: 1065,
    protein_g: 130,
    carbs_g: 95,
    fat_g: 15,
    items: [
      {
        food: 'Chicken breast',
        qty: '500 g raw, skinless',
        calories: 600,
        protein_g: 113,
        carbs_g: 0,
        fat_g: 13
      },
      {
        food: 'Cooked white rice',
        qty: '~250 g cooked',
        calories: 325,
        protein_g: 7,
        carbs_g: 70,
        fat_g: 1
      },
      {
        food: 'Kidney beans',
        qty: '½ small can drained · ~110 g',
        calories: 140,
        protein_g: 10,
        carbs_g: 25,
        fat_g: 1
      }
    ]
  }
];

try {
  const sess = await sql<{ id: number; activity_calories: number | null }[]>`
    SELECT id, activity_calories FROM sessions
    WHERE id = ${SESSION_ID} AND user_id = ${USER_ID} AND date = ${DATE}
  `;
  if (sess.length !== 1) {
    console.error('Expected session', SESSION_ID, 'on', DATE, '— found', sess);
    process.exit(1);
  }
  const activityKcal = sess[0].activity_calories != null ? Number(sess[0].activity_calories) : 0;

  await sql.begin(async (tx) => {
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
    activityKcal
  );

  console.log('\n--- Day entries ---');
  for (const e of dayEntries) console.log(e);
  console.log('\nBW', bw);
  console.log('Activity kcal', activityKcal, '(Pull A — no watch burn logged yet)');
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
