// Log Martin's minced-beef meal for 2026-09-04 (no Anthropic).
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-04';

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

// Assumptions:
// - 400 g mince = raw pack weight, ~20% fat (USDA 80/20 raw ≈ 254 kcal / 17 g P / 20 g F per 100 g)
// - 2 large eggs, plain
// - 5 tiny WW slices ≈ 55 kcal each (same scale as earlier "tiny" bread log)
const items = [
  {
    food: 'Minced beef',
    qty: '400 g raw, ~20% fat',
    calories: 1015,
    protein_g: 69,
    carbs_g: 0,
    fat_g: 80
  },
  {
    food: 'Eggs',
    qty: '2 large',
    calories: 145,
    protein_g: 13,
    carbs_g: 1,
    fat_g: 10
  },
  {
    food: 'Whole wheat bread',
    qty: '5 tiny slices',
    calories: 275,
    protein_g: 10,
    carbs_g: 50,
    fat_g: 3
  }
];

const calories = 1435;
const protein_g = 92;
const carbs_g = 51;
const fat_g = 93;
const description = '400 g minced beef, 2 eggs, 5 tiny bread slices';

try {
  await sql.begin(async (tx) => {
    const existing = await tx<{ id: number }[]>`
      SELECT id FROM nutrition_entries
      WHERE user_id = ${USER_ID} AND date = ${DATE}
        AND description ILIKE '%minced beef%'
      ORDER BY id LIMIT 1
    `;
    if (existing[0]) {
      await tx`
        UPDATE nutrition_entries
        SET description = ${description},
            calories = ${calories},
            protein_g = ${protein_g},
            carbs_g = ${carbs_g},
            fat_g = ${fat_g},
            items_json = ${JSON.stringify(items)}::jsonb
        WHERE id = ${existing[0].id} AND user_id = ${USER_ID}
      `;
      console.log('Updated entry', existing[0].id);
    } else {
      const [{ id }] = await tx<{ id: number }[]>`
        INSERT INTO nutrition_entries (
          user_id, date, description, calories, protein_g, carbs_g, fat_g, items_json
        ) VALUES (
          ${USER_ID}, ${DATE}, ${description},
          ${calories}, ${protein_g}, ${carbs_g}, ${fat_g}, ${JSON.stringify(items)}::jsonb
        )
        RETURNING id
      `;
      console.log('Inserted entry', id);
    }

    const day = await tx`
      SELECT id, description, calories, protein_g, carbs_g, fat_g
      FROM nutrition_entries
      WHERE user_id = ${USER_ID} AND date = ${DATE}
      ORDER BY id
    `;
    const tot = day.reduce(
      (a, r) => ({
        calories: a.calories + Number(r.calories),
        protein_g: a.protein_g + Number(r.protein_g),
        carbs_g: a.carbs_g + Number(r.carbs_g),
        fat_g: a.fat_g + Number(r.fat_g)
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );
    console.log('Day entries:', day);
    console.log('Day food total:', tot);
  });
} finally {
  await sql.end();
}
