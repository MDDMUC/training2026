// Log Martin's evening 3 eggs for 2026-09-04 (no Anthropic).
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

const items = [
  {
    food: 'Eggs',
    qty: '3 large',
    calories: 215,
    protein_g: 19,
    carbs_g: 1,
    fat_g: 15
  }
];

const description = '3 large eggs';
const calories = 215;
const protein_g = 19;
const carbs_g = 1;
const fat_g = 15;

try {
  await sql.begin(async (tx) => {
    const existing = await tx<{ id: number }[]>`
      SELECT id FROM nutrition_entries
      WHERE user_id = ${USER_ID} AND date = ${DATE}
        AND description = ${description}
      ORDER BY id LIMIT 1
    `;
    if (existing[0]) {
      await tx`
        UPDATE nutrition_entries
        SET calories = ${calories},
            protein_g = ${protein_g},
            carbs_g = ${carbs_g},
            fat_g = ${fat_g},
            items_json = ${JSON.stringify(items)}::jsonb
        WHERE id = ${existing[0].id} AND user_id = ${USER_ID}
      `;
      console.log('Updated', existing[0].id);
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
      console.log('Inserted', id);
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
    console.log('Vs target (goal 3155 / P 162): kcal', tot.calories, 'P', tot.protein_g);
  });
} finally {
  await sql.end();
}
