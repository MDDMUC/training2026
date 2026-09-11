import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1, prepare: false });
try {
  const r = await sql`
    UPDATE exercise_sets es
    SET completed = false
    FROM exercises e
    WHERE es.exercise_id = e.id
      AND e.session_id = 250
      AND e.name = 'Mobility · 10 min'
    RETURNING es.id, es.completed, es.label
  `;
  console.log('Mobility sets:', r);
} finally {
  await sql.end();
}
