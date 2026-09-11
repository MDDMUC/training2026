// Add therapist-friendly bent-arm floor fly to Martin's Pull A 2026-09-11.
// Elbows locked ~90°; floor stops the open — not a long-lever fly.
// Idempotent: skips if exercise already present.
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import postgres from 'postgres';

const USER_ID = 'martin';
const DATE = '2026-09-11';
const SESSION_ID = 250;
const EX_NAME = 'Bent-arm floor fly';
const KG = 5; // Week 2 looks-fly ramp (~65% of 8 kg)
const REPS = 12;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(url, {
  ssl: 'require',
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 15,
  types: {
    date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamp: { to: 1114, from: [1114], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    timestamptz: { to: 1184, from: [1184], serialize: (x: unknown) => String(x), parse: (x: string) => x }
  }
});

const NOTES = `Therapist-friendly pec work. Lie on back on the floor. Elbows locked ~90°, forearms vertical (fists toward ceiling). Keep that elbow angle fixed — only the upper arms move. Bring elbows toward the midline until the DBs meet over the sternum, then open until the upper arms meet the floor. Floor stops the long lever. Not a classic soft-elbow fly. 3–4 RIR. Skip if the chest knob speaks.`;

try {
  const sess = await sql<{ id: number; title: string }[]>`
    SELECT id, title FROM sessions
    WHERE id = ${SESSION_ID} AND user_id = ${USER_ID} AND date = ${DATE}
      AND COALESCE(archived, false) = false
  `;
  if (sess.length !== 1) {
    console.error('Expected session', SESSION_ID, 'on', DATE, '— found', sess);
    process.exit(1);
  }

  const existing = await sql<{ id: number }[]>`
    SELECT id FROM exercises
    WHERE session_id = ${SESSION_ID} AND name = ${EX_NAME}
  `;
  if (existing.length > 0) {
    console.log('Already present as exercise', existing[0].id, '— no-op.');
    process.exit(0);
  }

  await sql.begin(async (tx) => {
    // Insert after Curls (3): new order 4; bump Forearms + Mobility.
    await tx`
      UPDATE exercises
      SET display_order = display_order + 1
      WHERE session_id = ${SESSION_ID} AND display_order >= 4
    `;

    const [{ id: exId }] = await tx<{ id: number }[]>`
      INSERT INTO exercises (session_id, name, display_order, notes)
      VALUES (${SESSION_ID}, ${EX_NAME}, 4, ${NOTES})
      RETURNING id
    `;

    const labels = [
      [`Bent-arm floor fly L · ${KG} kg · set 1`, 30],
      [`Bent-arm floor fly R · ${KG} kg · set 1`, 60],
      [`Bent-arm floor fly L · ${KG} kg · set 2`, 30],
      [`Bent-arm floor fly R · ${KG} kg · set 2`, 60]
    ] as const;

    for (let i = 0; i < labels.length; i++) {
      const [label, rest] = labels[i];
      await tx`
        INSERT INTO exercise_sets
          (exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, rpe, completed)
        VALUES (
          ${exId}, ${i + 1}, 'work', ${label},
          ${REPS}, ${KG}, ${rest}, 6, false
        )
      `;
    }

    await tx`
      UPDATE sessions
      SET title = 'Pull A — pulls, biceps, chest, forearms',
          updated_at = NOW()
      WHERE id = ${SESSION_ID} AND user_id = ${USER_ID}
    `;

    console.log('Inserted', EX_NAME, 'as exercise', exId, 'on session', SESSION_ID);
  });

  const check = await sql`
    SELECT e.display_order, e.name,
           (SELECT COUNT(*)::int FROM exercise_sets es WHERE es.exercise_id = e.id) AS sets
    FROM exercises e
    WHERE e.session_id = ${SESSION_ID}
    ORDER BY e.display_order, e.id
  `;
  console.log('Order now:', check);
} catch (e) {
  console.error('Failed:', e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
