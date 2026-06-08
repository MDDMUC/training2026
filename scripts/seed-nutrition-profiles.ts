// Seed default nutrition profiles. Idempotent: upserts on user_id.
// Martin:  43yo male,   196 cm, 83 kg.
// Antonia: 44yo female, 174 cm, 69 kg.

import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1 });

const profiles: {
  user_id: string;
  age: number;
  height_cm: number;
  sex: 'male' | 'female';
  default_weight_kg: number;
}[] = [
  { user_id: 'martin',  age: 43, height_cm: 196, sex: 'male',   default_weight_kg: 83 },
  { user_id: 'antonia', age: 44, height_cm: 174, sex: 'female', default_weight_kg: 69 }
];

try {
  for (const p of profiles) {
    await sql`
      INSERT INTO user_nutrition_profile (user_id, age, height_cm, sex, default_weight_kg)
      VALUES (${p.user_id}, ${p.age}, ${p.height_cm}, ${p.sex}, ${p.default_weight_kg})
      ON CONFLICT (user_id) DO UPDATE
        SET age = EXCLUDED.age,
            height_cm = EXCLUDED.height_cm,
            sex = EXCLUDED.sex,
            default_weight_kg = EXCLUDED.default_weight_kg,
            updated_at = NOW()
    `;
    console.log(`upserted ${p.user_id}: ${p.age}yo ${p.sex}, ${p.height_cm} cm, default ${p.default_weight_kg} kg`);
  }
} catch (e) {
  console.error('Seed failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
