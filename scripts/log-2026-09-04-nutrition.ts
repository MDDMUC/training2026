// Log / refresh Martin's 2026-09-04 nutrition (manual estimate — no Anthropic).
// 2 café/home cheesecake slices + 2 small black coffees.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-04';
const DESCRIPTION = 'two slices of cheesecake and two small coffees';

const items = [
  {
    food: 'Cheesecake',
    qty: '2 typical café/home slices (~110–125 g each)',
    calories: 840,
    protein_g: 14,
    carbs_g: 66,
    fat_g: 56
  },
  {
    food: 'Coffee',
    qty: '2 small, black (or near-black)',
    calories: 5,
    protein_g: 0,
    carbs_g: 1,
    fat_g: 0
  }
];

const calories = 845;
const protein_g = 14;
const carbs_g = 67;
const fat_g = 56;

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

try {
  const existing = await sql<{ id: number }[]>`
    SELECT id FROM nutrition_entries
    WHERE user_id = ${USER_ID} AND date = ${DATE}
      AND description ILIKE '%cheesecake%'
    ORDER BY id
    LIMIT 1
  `;

  if (existing[0]) {
    const rows = await sql`
      UPDATE nutrition_entries
      SET description = ${DESCRIPTION},
          calories = ${calories},
          protein_g = ${protein_g},
          carbs_g = ${carbs_g},
          fat_g = ${fat_g},
          items_json = ${JSON.stringify(items)}::jsonb
      WHERE id = ${existing[0].id} AND user_id = ${USER_ID}
      RETURNING id, description, calories, protein_g, carbs_g, fat_g
    `;
    console.log('Updated', rows[0]);
  } else {
    const rows = await sql`
      INSERT INTO nutrition_entries (
        user_id, date, description, calories, protein_g, carbs_g, fat_g, items_json
      ) VALUES (
        ${USER_ID}, ${DATE}, ${DESCRIPTION},
        ${calories}, ${protein_g}, ${carbs_g}, ${fat_g},
        ${JSON.stringify(items)}::jsonb
      )
      RETURNING id, description, calories, protein_g, carbs_g, fat_g
    `;
    console.log('Inserted', rows[0]);
  }
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
