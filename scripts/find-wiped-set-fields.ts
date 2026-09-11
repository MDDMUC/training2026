// Report work sets with null reps/load that look like they were wiped (label still has numbers).
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
    SELECT s.date::text AS date, e.name AS exercise, es.id, es.label, es.kind,
           es.reps, es.load_kg, es.load_kg_added, es.hold_seconds
    FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    JOIN sessions s ON s.id = e.session_id
    WHERE s.user_id = 'martin'
      AND COALESCE(s.archived, false) = false
      AND s.date >= '2026-09-01'
      AND es.kind <> 'checklist'
      AND es.hold_seconds IS NULL
      AND (
        es.reps IS NULL
        OR (es.load_kg IS NULL AND es.load_kg_added IS NULL AND es.label ~* 'kg')
      )
    ORDER BY s.date DESC, es.id
    LIMIT 50
  `;
  console.log('Suspicious wiped fields:', rows.length);
  for (const r of rows) console.log(r);
} finally {
  await sql.end();
}
