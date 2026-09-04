// Correct + extend Martin's 2026-09-04 nutrition / burn (no Anthropic).
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

// 1 small cheesecake slice (~80 g) ≈ 280 kcal + 2 small black coffees ≈ 5
const snackItems = [
  {
    food: 'Cheesecake',
    qty: '1 small slice (~80 g)',
    calories: 280,
    protein_g: 5,
    carbs_g: 22,
    fat_g: 18
  },
  {
    food: 'Coffee',
    qty: '2 small, black',
    calories: 5,
    protein_g: 0,
    carbs_g: 1,
    fat_g: 0
  }
];

// 5 large eggs (boiled/poached baseline) + 4 tiny WW slices (~55 kcal each)
const mealItems = [
  {
    food: 'Eggs',
    qty: '5 large (plain / little added fat)',
    calories: 360,
    protein_g: 32,
    carbs_g: 2,
    fat_g: 25
  },
  {
    food: 'Whole wheat bread',
    qty: '4 tiny slices',
    calories: 220,
    protein_g: 8,
    carbs_g: 40,
    fat_g: 3
  }
];

try {
  await sql.begin(async (tx) => {
    const cake = await tx<{ id: number }[]>`
      SELECT id FROM nutrition_entries
      WHERE user_id = ${USER_ID} AND date = ${DATE}
        AND description ILIKE '%cheesecake%'
      ORDER BY id LIMIT 1
    `;
    if (!cake[0]) throw new Error('Cheesecake entry not found');

    await tx`
      UPDATE nutrition_entries
      SET description = ${'1 small slice of cheesecake and two small coffees'},
          calories = 285,
          protein_g = 5,
          carbs_g = 23,
          fat_g = 18,
          items_json = ${JSON.stringify(snackItems)}::jsonb
      WHERE id = ${cake[0].id} AND user_id = ${USER_ID}
    `;

    const eggs = await tx<{ id: number }[]>`
      SELECT id FROM nutrition_entries
      WHERE user_id = ${USER_ID} AND date = ${DATE}
        AND description ILIKE '%egg%'
      ORDER BY id LIMIT 1
    `;
    if (eggs[0]) {
      await tx`
        UPDATE nutrition_entries
        SET description = ${'5 eggs with 4 tiny slices of whole wheat bread'},
            calories = 580,
            protein_g = 40,
            carbs_g = 42,
            fat_g = 28,
            items_json = ${JSON.stringify(mealItems)}::jsonb
        WHERE id = ${eggs[0].id} AND user_id = ${USER_ID}
      `;
    } else {
      await tx`
        INSERT INTO nutrition_entries (
          user_id, date, description, calories, protein_g, carbs_g, fat_g, items_json
        ) VALUES (
          ${USER_ID}, ${DATE}, ${'5 eggs with 4 tiny slices of whole wheat bread'},
          580, 40, 42, 28, ${JSON.stringify(mealItems)}::jsonb
        )
      `;
    }

    // Watch estimate for today's Pull A burn
    const sess = await tx`
      UPDATE sessions
      SET activity_calories = 600, updated_at = NOW()
      WHERE user_id = ${USER_ID}
        AND date = ${DATE}
        AND COALESCE(archived, false) = false
        AND title ILIKE 'Pull A%'
      RETURNING id, title, activity_calories
    `;
    if (!sess[0]) throw new Error('Pull A session not found for activity calories');
    console.log('Burn', sess[0]);
  });

  const rows = await sql`
    SELECT id, description, calories, protein_g, carbs_g, fat_g
    FROM nutrition_entries
    WHERE user_id = ${USER_ID} AND date = ${DATE}
    ORDER BY id
  `;
  const totals = rows.reduce(
    (a, r) => ({
      calories: a.calories + Number(r.calories),
      protein_g: a.protein_g + Number(r.protein_g),
      carbs_g: a.carbs_g + Number(r.carbs_g),
      fat_g: a.fat_g + Number(r.fat_g)
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
  console.log('Entries', rows);
  console.log('Day totals', totals);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
