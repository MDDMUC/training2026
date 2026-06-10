// One-off: re-label bicep curl exercises from single-arm dumbbell (L/R
// alternating) to two-handed barbell. Existing sets keep their logged
// reps, load, RPE and completed state — only the exercise name, exercise
// notes, and per-set L/R labels change.
//
// Affects every Martin session whose exercise name is exactly
// 'Bicep Curls · 16 kg' (the seed name before this rename). Idempotent:
// re-running is a no-op once the new name is in place.

import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

const sql = postgres(url, {
  ssl: 'require',
  max: 1,
  types: {
    date:        { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamp:   { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
  }
});

const OLD_NAME = 'Bicep Curls · 16 kg';
const NEW_NAME = 'Bicep Curls · Bar · 16 kg';
const NEW_NOTES = 'Two-handed barbell curl. Slow eccentric.';

try {
  const targets = await sql<{ id: number; session_id: number }[]>`
    SELECT e.id, e.session_id
    FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE s.user_id = 'martin' AND e.name = ${OLD_NAME}
  `;

  if (targets.length === 0) {
    console.log('No exercises match — already renamed or nothing to update.');
    await sql.end();
    process.exit(0);
  }

  console.log(`Updating ${targets.length} exercise rows…`);
  for (const t of targets) {
    await sql`
      UPDATE exercises
      SET name = ${NEW_NAME}, notes = ${NEW_NOTES}
      WHERE id = ${t.id}
    `;
    await sql`
      UPDATE exercise_sets
      SET label = NULL
      WHERE exercise_id = ${t.id} AND (label = 'L arm' OR label = 'R arm')
    `;
    console.log(`  ✓ exercise ${t.id} (session ${t.session_id})`);
  }

  console.log('Done.');
} finally {
  await sql.end();
}
