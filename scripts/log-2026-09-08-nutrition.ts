// Log Martin's 2026-09-08 food (manual estimate — no Anthropic).
// Safe to re-run: upserts by description match.
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
const DATE = '2026-09-08';
const SESSION_ID = 247;
const ACTIVITY_KCAL = 600;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(url, {
  ssl: 'require',
  max: 1,
  prepare: false,
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

// Assumptions (stated in chat / session log):
// - Mozzarella: 2 fresh cow-milk balls ≈ 100 g each (common EU single-serve;
//   packs are often 2×125 g — scale +25% if that). Per 100 g ≈ 250 kcal /
//   18 P / 1.5 C / 19 F (supermarket fresh mozzarella).
// - Olive oil: 1 tablespoon (~15 ml / 13.5 g). A teaspoon would be ~1/3.
// - WW bun: same as 2026-09-07 ≈ 50 g → 135 / 5 / 24 / 2
// Mozz: 200 g × (250/100) = 500 kcal; 36 P; 3 C; 38 F
// Oil: 119 / 0 / 0 / 14 (tbsp rounded)
// Bun: 135 / 5 / 24 / 2
// Sum: 754 / 41 / 27 / 55
// - Soft pretzel (Laugenbrezel-style): ~100 g ≈ USDA soft 338/100 → 340 / 8 / 69 / 3
//   (medium bakery ~115–120 g would be ~+15–20%)
// - Salami: 50 g Italian-style dry ≈ 400 kcal / 22 P / 1 C / 34 F per 100 g
//   → 200 / 11 / 1 / 17
const entries: Entry[] = [
  {
    key: '%mozzarella%',
    description: '2 mozzarella balls + olive oil + whole wheat bun',
    calories: 754,
    protein_g: 41,
    carbs_g: 27,
    fat_g: 55,
    items: [
      {
        food: 'Fresh mozzarella',
        qty: '2 balls · ~100 g each',
        calories: 500,
        protein_g: 36,
        carbs_g: 3,
        fat_g: 38
      },
      {
        food: 'Olive oil',
        qty: '1 tbsp (~15 ml)',
        calories: 119,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 14
      },
      {
        food: 'Whole wheat bun',
        qty: '1 × ~50 g',
        calories: 135,
        protein_g: 5,
        carbs_g: 24,
        fat_g: 2
      }
    ]
  },
  {
    key: '%pretzel%',
    description: 'Soft pretzel + 50 g salami',
    calories: 540,
    protein_g: 19,
    carbs_g: 70,
    fat_g: 20,
    items: [
      {
        food: 'Soft pretzel',
        qty: '~100 g (medium bakery)',
        calories: 340,
        protein_g: 8,
        carbs_g: 69,
        fat_g: 3
      },
      {
        food: 'Salami',
        qty: '50 g (Italian-style dry)',
        calories: 200,
        protein_g: 11,
        carbs_g: 1,
        fat_g: 17
      }
    ]
  }
];

try {
  await sql.begin(async (tx) => {
    await tx`
      UPDATE sessions
      SET activity_calories = ${ACTIVITY_KCAL}
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID} AND date = ${DATE}
    `;
    console.log('Set activity_calories', ACTIVITY_KCAL, 'on session', SESSION_ID);

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
        console.log('Updated', e.description, 'id', existing[0].id);
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
        console.log('Inserted', e.description, 'id', id);
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

  const activityKcal = ACTIVITY_KCAL;

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
  console.log('Activity kcal', activityKcal);
  console.log('Targets', targets);
  console.log('Totals', totals);
  console.log(
    'Calorie band hit (±' + Math.round(Number(profile.calorie_tolerance_pct) * 100) + '%):',
    caloriesHit(totals, targets, Number(profile.calorie_tolerance_pct))
  );
  console.log('Protein hit:', proteinHit(totals, targets));
  console.log('Remaining to goal kcal:', targets.goal_kcal - totals.calories);
  console.log('Remaining to protein goal:', targets.protein_goal_g - totals.protein_g);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
