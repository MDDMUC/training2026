// Undo the verify-setrow-mobile.mjs side effect on Pull A set 1 reps.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
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
  const rows = await sql`
    SELECT es.id, es.label, es.reps
    FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    JOIN sessions s ON s.id = e.session_id
    WHERE s.user_id = 'martin' AND s.id = 250 AND e.name = 'Pull-ups · bodyweight'
      AND es.set_num = 1
  `;
  console.log('Before', rows);
  if (rows[0] && Number(rows[0].reps) === 9) {
    await sql`
      UPDATE exercise_sets SET reps = 5
      WHERE id = ${rows[0].id}
        AND exercise_id IN (
          SELECT e.id FROM exercises e
          JOIN sessions s ON s.id = e.session_id
          WHERE s.user_id = 'martin'
        )
    `;
    console.log('Restored set', rows[0].id, 'reps → 5');
  } else {
    console.log('No-op — reps not 9');
  }
} finally {
  await sql.end();
}
