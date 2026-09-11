// Log Martin's 2026-09-11 dinner (manual estimate — no Anthropic).
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

// Assumptions (stated for audit):
// - 2 burger patties: beef, ~100 g raw each, ~15–20% fat (supermarket-style).
//   Per 100 g ≈ 250 / 17 / 0 / 20 (same 80/20-ish anchor as minced logs) → 2×100 g
//   = 500 / 34 / 0 / 40
// - Rice "normal serving": ~180 g cooked white (between plan lunch 150 g and earlier 250 g)
//   @ 130 / 2.7 / 28 / 0.3 per 100 g → 234 / 5 / 50 / 1
// - Onion: 1 medium ~120 g raw → ~48 / 1 / 11 / 0
// - Small tomato: ~90 g → ~16 / 1 / 3 / 0
// - Garlic: "some" ≈ 3 cloves ~9 g → ~13 / 1 / 3 / 0
// - Cheddar: ½ slice ≈ 10 g → ~40 / 2.5 / 0.3 / 3.3 → 40 / 3 / 0 / 3
// Dinner total: 851 / 45 / 67 / 44
const entries: Entry[] = [
  {
    key: '%burger patties%',
    description:
      'Dinner: 2 burger patties + rice + onion + small tomato + garlic + ½ slice cheddar',
    calories: 851,
    protein_g: 45,
    carbs_g: 67,
    fat_g: 44,
    items: [
      {
        food: 'Beef burger patties',
        qty: '2 × ~100 g raw · ~15–20% fat',
        calories: 500,
        protein_g: 34,
        carbs_g: 0,
        fat_g: 40
      },
      {
        food: 'Cooked white rice',
        qty: 'normal serving · ~180 g cooked',
        calories: 234,
        protein_g: 5,
        carbs_g: 50,
        fat_g: 1
      },
      {
        food: 'Onion',
        qty: '1 medium · ~120 g',
        calories: 48,
        protein_g: 1,
        carbs_g: 11,
        fat_g: 0
      },
      {
        food: 'Tomato',
        qty: '1 small · ~90 g',
        calories: 16,
        protein_g: 1,
        carbs_g: 3,
        fat_g: 0
      },
      {
        food: 'Garlic',
        qty: '~3 cloves · ~9 g',
        calories: 13,
        protein_g: 1,
        carbs_g: 3,
        fat_g: 0
      },
      {
        food: 'Cheddar',
        qty: '½ slice · ~10 g',
        calories: 40,
        protein_g: 3,
        carbs_g: 0,
        fat_g: 3
      }
    ]
  }
];

try {
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
  const bw = bwRows[0]?.body_weight_kg != null ? Number(bwRows[0].body_weight_kg) : 82.7;

  const activityRows = await sql<{ activity_calories: number | null }[]>`
    SELECT activity_calories FROM sessions
    WHERE user_id = ${USER_ID} AND date = ${DATE} AND COALESCE(archived, false) = false
    ORDER BY id DESC LIMIT 1
  `;
  const activityKcal =
    activityRows[0]?.activity_calories != null ? Number(activityRows[0].activity_calories) : 0;

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
  console.log('\nBW', bw, '| activity', activityKcal);
  console.log('Targets', targets);
  console.log('Totals', totals);
  console.log(
    'Calorie band hit (±' + Math.round(Number(profile.calorie_tolerance_pct) * 100) + '%):',
    caloriesHit(totals, targets, Number(profile.calorie_tolerance_pct))
  );
  console.log('Protein hit:', proteinHit(totals, targets));
  console.log('Remaining kcal:', Math.round(targets.goal_kcal - totals.calories));
  console.log('Remaining protein:', Math.round(targets.protein_goal_g - totals.protein_g));
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
