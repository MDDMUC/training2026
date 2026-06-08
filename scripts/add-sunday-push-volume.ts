// Add a 2nd push day per week. After the +2-day plan shift, the weekly
// `mobility` sessions land on Sundays. This script converts each one into
// `push` type with title "Push · Volume + Mobility + Run", and prepends a
// push-volume exercise block ahead of the existing Abrahangs + mobility +
// easy run blocks. The mobility flow and easy run are preserved in full.
//
// Why Sunday? It sits 72 h after Thursday's heavy push (same spacing as
// Wed pull-heavy → Sat pull-light), so it mirrors the pull cadence
// without colliding with climbing days.
//
// Idempotent: skips any session whose title already starts with "Push · Volume".

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

const PLAN_START = '2026-06-10';
const NEW_TITLE = 'Push · Volume + Mobility + Run';
const USER_ID = 'martin';

// Push-volume block: bodyweight + light load, RIR-driven. Targets horizontal
// + vertical patterns + scapular work — counter to the Thursday heavy push
// (which is dips, OHP, bench). Total ~30 min.
const PUSH_EXERCISE = {
  name: 'Push · Volume Block',
  notes:
    '**Push-volume day** — counter-load to balance the weekly pull skew.\n\n' +
    '- Push-ups, archer push-ups or pseudo-planche if the standard set is too easy.\n' +
    '- Single-arm DB shoulder press emphasises the weaker side first.\n' +
    '- Tempo dips: 3 s down, 1 s pause, 1 s up. Stop ~2 reps before failure.\n' +
    '- Band pull-aparts and Y-T-W are antagonist insurance for the shoulder.\n\n' +
    'If shoulder or neck feels off, drop one set per movement before skipping.',
  sets: [
    // Push-ups — 3 work sets, max reps @ RIR 2
    { kind: 'work', label: 'Push-up — set 1', reps: 12, rest_seconds: 90, rpe: 7 },
    { kind: 'work', label: 'Push-up — set 2', reps: 12, rest_seconds: 90, rpe: 7 },
    { kind: 'work', label: 'Push-up — set 3', reps: 12, rest_seconds: 90, rpe: 8 },
    // Single-arm DB OHP — 3 × 8 each side, weak side first
    { kind: 'work', label: 'SA DB Press L (weak first)', reps: 8, load_kg: 12, rest_seconds: 60, rpe: 7 },
    { kind: 'work', label: 'SA DB Press R', reps: 8, load_kg: 12, rest_seconds: 60, rpe: 7 },
    { kind: 'work', label: 'SA DB Press L', reps: 8, load_kg: 12, rest_seconds: 60, rpe: 7 },
    { kind: 'work', label: 'SA DB Press R', reps: 8, load_kg: 12, rest_seconds: 60, rpe: 7 },
    { kind: 'work', label: 'SA DB Press L', reps: 8, load_kg: 12, rest_seconds: 60, rpe: 8 },
    { kind: 'work', label: 'SA DB Press R', reps: 8, load_kg: 12, rest_seconds: 60, rpe: 8 },
    // Tempo dips — 3 × 6 bodyweight, slow eccentric
    { kind: 'work', label: 'Tempo Dip · 3-1-1', reps: 6, rest_seconds: 90, rpe: 7 },
    { kind: 'work', label: 'Tempo Dip · 3-1-1', reps: 6, rest_seconds: 90, rpe: 7 },
    { kind: 'work', label: 'Tempo Dip · 3-1-1', reps: 6, rest_seconds: 90, rpe: 8 },
    // Antagonist / shoulder insurance — high rep
    { kind: 'work', label: 'Band pull-apart', reps: 20, rest_seconds: 45 },
    { kind: 'work', label: 'Band pull-apart', reps: 20, rest_seconds: 45 },
    { kind: 'work', label: 'Band pull-apart', reps: 20, rest_seconds: 45 },
    { kind: 'work', label: 'Prone Y-T-W (1 kg)', reps: 10, load_kg: 1, rest_seconds: 60 },
    { kind: 'work', label: 'Prone Y-T-W (1 kg)', reps: 10, load_kg: 1, rest_seconds: 60 }
  ]
};

try {
  const sessions = await sql<{ id: number; date: string; title: string | null; type: string }[]>`
    SELECT id, date, title, type
    FROM sessions
    WHERE user_id = ${USER_ID}
      AND date >= ${PLAN_START}
      AND type = 'mobility'
    ORDER BY date ASC
  `;
  console.log(`Found ${sessions.length} mobility sessions on/after ${PLAN_START}.`);

  let converted = 0;
  let skipped = 0;

  for (const s of sessions) {
    if (s.title && s.title.startsWith('Push · Volume')) {
      skipped++;
      continue;
    }
    await sql.begin(async (tx) => {
      // Flip type + title. The session keeps its existing exercises (Abrahangs,
      // long mobility, easy run); we prepend the push block at display_order=0.
      await tx`
        UPDATE sessions
        SET type = 'push', title = ${NEW_TITLE}
        WHERE id = ${s.id}
      `;
      // Bump existing display_orders by 1 to make room at position 1.
      await tx`
        UPDATE exercises
        SET display_order = display_order + 1
        WHERE session_id = ${s.id}
      `;
      const inserted = await tx<{ id: number }[]>`
        INSERT INTO exercises (session_id, name, display_order, notes)
        VALUES (${s.id}, ${PUSH_EXERCISE.name}, 1, ${PUSH_EXERCISE.notes})
        RETURNING id
      `;
      const exerciseId = inserted[0].id;
      for (let i = 0; i < PUSH_EXERCISE.sets.length; i++) {
        const st = PUSH_EXERCISE.sets[i];
        await tx`
          INSERT INTO exercise_sets (
            exercise_id, set_num, kind, label, reps, load_kg, rest_seconds, rpe
          ) VALUES (
            ${exerciseId}, ${i + 1}, ${st.kind}, ${st.label},
            ${st.reps ?? null}, ${st.load_kg ?? null},
            ${st.rest_seconds ?? null}, ${st.rpe ?? null}
          )
        `;
      }
    });
    converted++;
    console.log(`  ${s.date}: converted (was mobility) → push (${PUSH_EXERCISE.sets.length} sets added)`);
  }

  console.log(`\nDone. Converted: ${converted}. Skipped (already done): ${skipped}.`);
} finally {
  await sql.end();
}
