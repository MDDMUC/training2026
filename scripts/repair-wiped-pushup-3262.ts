// Restore reps on Push-up set wiped by the SetRow null-save bug.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 1,
  prepare: false
});

try {
  const siblings = await sql`
    SELECT id, set_num, label, reps FROM exercise_sets
    WHERE exercise_id = (SELECT exercise_id FROM exercise_sets WHERE id = 3262)
    ORDER BY set_num
  `;
  console.log('Sibling sets:', siblings);
  const guess = siblings.find((s) => s.id !== '3262' && s.reps != null)?.reps ?? 8;
  const updated = await sql`
    UPDATE exercise_sets SET reps = ${guess}
    WHERE id = 3262 AND reps IS NULL
      AND exercise_id IN (
        SELECT e.id FROM exercises e
        JOIN sessions s ON s.id = e.session_id
        WHERE s.user_id = 'martin'
      )
    RETURNING id, label, reps
  `;
  console.log('Repaired:', updated);
} finally {
  await sql.end();
}
