// One-off: print the most-recent body-weight row used for nutrition calc.
import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

const sql = postgres(url, { ssl: 'require', max: 1 });

try {
  const rows = await sql`
    SELECT user_id, id, date, body_weight_kg, type, completed
    FROM sessions
    WHERE body_weight_kg IS NOT NULL
    ORDER BY user_id, date DESC, id DESC
    LIMIT 10
  `;
  console.log('Latest body weights across all users:');
  for (const r of rows) {
    console.log(`  [${r.user_id}] ${r.date}  ${r.body_weight_kg} kg  (session ${r.id}, type=${r.type}, completed=${r.completed})`);
  }
  const profiles = await sql`SELECT * FROM user_nutrition_profile ORDER BY user_id`;
  for (const p of profiles) {
    const weight = 83;
    const bmr = 10 * weight + 6.25 * Number(p.height_cm) - 5 * Number(p.age) + 5;
    const baseline = bmr * Number(p.baseline_activity_factor);
    console.log(`\n[${p.user_id}] age=${p.age}, height=${p.height_cm}cm, factor=${p.baseline_activity_factor}`);
    console.log(`  at 83 kg → BMR=${bmr}, baseline=${baseline.toFixed(0)}`);
  }
} finally {
  await sql.end();
}
