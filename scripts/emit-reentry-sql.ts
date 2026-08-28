// Writes scripts/archive-h2-and-seed-reentry.sql from the TS plan builder.
// No database connection. Re-run after changing reentryPlan.ts.

import { writeFileSync } from 'node:fs';
import { buildReentryPlan, H2_CYCLE_NAME, REENTRY_CYCLE_NAME } from '../src/lib/domain/reentryPlan';

function lit(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return "'" + value.replace(/'/g, "''") + "'";
}

const { phases, sessions } = buildReentryPlan();
const lines: string[] = [];

lines.push(`-- Archive Martin's current cycle and seed Re-entry (Mon 2026-08-31 → Sun 2026-09-27).`);
lines.push(`-- Generated from src/lib/domain/reentryPlan.ts — do not hand-edit.`);
lines.push(`-- Paste in the Supabase SQL editor if the Node script cannot reach the pooler.`);
lines.push(`-- Idempotent. Martin only. Does not DELETE H2 rows. Does not touch Antonia.`);
lines.push('');
lines.push(`ALTER TABLE phases ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;`);
lines.push(`ALTER TABLE phases ADD COLUMN IF NOT EXISTS cycle_name TEXT;`);
lines.push(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;`);
lines.push(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cycle_name TEXT;`);
lines.push(`CREATE INDEX IF NOT EXISTS idx_phases_user_archived ON phases(user_id, archived);`);
lines.push(`CREATE INDEX IF NOT EXISTS idx_sessions_user_archived ON sessions(user_id, archived, date);`);
lines.push('');
lines.push(`DO $$`);
lines.push(`DECLARE`);
lines.push(`  phase_id BIGINT;`);
lines.push(`  sess_id BIGINT;`);
lines.push(`  ex_id BIGINT;`);
lines.push(`  n INT;`);
lines.push(`BEGIN`);
lines.push(`  SELECT COUNT(*) INTO n FROM sessions`);
lines.push(`  WHERE user_id = 'martin' AND cycle_name = ${lit(REENTRY_CYCLE_NAME)} AND COALESCE(archived, false) = false;`);
lines.push(`  IF n = 28 THEN`);
lines.push(`    RAISE NOTICE 'Re-entry cycle already active (28 sessions). Nothing to do.';`);
lines.push(`    RETURN;`);
lines.push(`  END IF;`);
lines.push('');
lines.push(`  IF n > 0 THEN`);
lines.push(`    DELETE FROM sessions`);
lines.push(`    WHERE user_id = 'martin' AND cycle_name = ${lit(REENTRY_CYCLE_NAME)} AND COALESCE(archived, false) = false;`);
lines.push(`    DELETE FROM phases`);
lines.push(`    WHERE user_id = 'martin' AND cycle_name = ${lit(REENTRY_CYCLE_NAME)} AND COALESCE(archived, false) = false;`);
lines.push(`  END IF;`);
lines.push('');
lines.push(`  UPDATE phases`);
lines.push(`  SET archived = true, cycle_name = COALESCE(cycle_name, ${lit(H2_CYCLE_NAME)})`);
lines.push(`  WHERE user_id = 'martin' AND COALESCE(archived, false) = false;`);
lines.push('');
lines.push(`  UPDATE sessions`);
lines.push(`  SET archived = true, cycle_name = COALESCE(cycle_name, ${lit(H2_CYCLE_NAME)})`);
lines.push(`  WHERE user_id = 'martin' AND COALESCE(archived, false) = false;`);
lines.push('');

const p = phases[0];
lines.push(`  INSERT INTO phases (`);
lines.push(`    user_id, mesocycle_num, name, short_name, start_date, end_date, description, archived, cycle_name`);
lines.push(`  ) VALUES (`);
lines.push(`    'martin', ${p.mesocycle_num}, ${lit(p.name)}, ${lit(p.short_name)},`);
lines.push(`    ${lit(p.start_date)}, ${lit(p.end_date)}, ${lit(p.description)}, false, ${lit(REENTRY_CYCLE_NAME)}`);
lines.push(`  ) RETURNING id INTO phase_id;`);
lines.push('');

for (const row of sessions) {
  const spec = row.spec;
  lines.push(`  -- ${row.date} · ${spec.type} · ${spec.title}`);
  lines.push(`  INSERT INTO sessions (`);
  lines.push(`    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name`);
  lines.push(`  ) VALUES (`);
  lines.push(`    'martin', ${lit(row.date)}, phase_id, ${lit(spec.type)}, ${lit(spec.title)},`);
  lines.push(`    true, false, ${lit(spec.notes)}, false, ${lit(REENTRY_CYCLE_NAME)}`);
  lines.push(`  ) RETURNING id INTO sess_id;`);
  spec.exercises.forEach((ex, i) => {
    lines.push(`  INSERT INTO exercises (session_id, name, display_order, notes)`);
    lines.push(`  VALUES (sess_id, ${lit(ex.name)}, ${i + 1}, ${lit(ex.notes)})`);
    lines.push(`  RETURNING id INTO ex_id;`);
    ex.sets.forEach((s, si) => {
      lines.push(`  INSERT INTO exercise_sets (`);
      lines.push(`    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes`);
      lines.push(`  ) VALUES (`);
      lines.push(
        `    ex_id, ${si + 1}, ${lit(s.kind)}, ${lit(s.label)}, ${lit(s.reps ?? null)}, ${lit(s.load_kg ?? null)}, ${lit(s.load_kg_added ?? null)}, ${lit(s.hold_seconds ?? null)}, ${lit(s.rest_seconds ?? null)}, ${lit(s.rpe ?? null)}, ${lit(s.notes ?? null)}`
      );
      lines.push(`  );`);
    });
  });
  lines.push('');
}

lines.push(`  RAISE NOTICE 'Re-entry seeded.';`);
lines.push(`END $$;`);
lines.push('');

const out = 'scripts/archive-h2-and-seed-reentry.sql';
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`Wrote ${out} (${lines.length} lines, ${sessions.length} sessions).`);
