-- Archive Martin's current cycle and seed Re-entry (Mon 2026-08-31 → Sun 2026-09-27).
-- Generated from src/lib/domain/reentryPlan.ts — do not hand-edit.
-- Paste in the Supabase SQL editor if the Node script cannot reach the pooler.
-- Idempotent. Martin only. Does not DELETE H2 rows. Does not touch Antonia.

ALTER TABLE phases ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE phases ADD COLUMN IF NOT EXISTS cycle_name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cycle_name TEXT;
CREATE INDEX IF NOT EXISTS idx_phases_user_archived ON phases(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_sessions_user_archived ON sessions(user_id, archived, date);

DO $$
DECLARE
  phase_id BIGINT;
  sess_id BIGINT;
  ex_id BIGINT;
  n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM sessions
  WHERE user_id = 'martin' AND cycle_name = 'Re-entry' AND COALESCE(archived, false) = false;
  IF n = 28 THEN
    RAISE NOTICE 'Re-entry cycle already active (28 sessions). Nothing to do.';
    RETURN;
  END IF;

  IF n > 0 THEN
    DELETE FROM sessions
    WHERE user_id = 'martin' AND cycle_name = 'Re-entry' AND COALESCE(archived, false) = false;
    DELETE FROM phases
    WHERE user_id = 'martin' AND cycle_name = 'Re-entry' AND COALESCE(archived, false) = false;
  END IF;

  UPDATE phases
  SET archived = true, cycle_name = COALESCE(cycle_name, 'H2 2026')
  WHERE user_id = 'martin' AND COALESCE(archived, false) = false;

  UPDATE sessions
  SET archived = true, cycle_name = COALESCE(cycle_name, 'H2 2026')
  WHERE user_id = 'martin' AND COALESCE(archived, false) = false;

  INSERT INTO phases (
    user_id, mesocycle_num, name, short_name, start_date, end_date, description, archived, cycle_name
  ) VALUES (
    'martin', 1, 'Re-entry — conservative base', 'REENTRY',
    '2026-08-31', '2026-09-27', 'Four weeks. Pull → Push → Run twice, then rest. Bodyweight pulls, light push loads, box-pistol skill, easy running. Hangboard and climbing parked. Stop if the joint speaks. Next block is a separate decision after Week 4.', false, 'Re-entry'
  ) RETURNING id INTO phase_id;

  -- 2026-08-31 · pull-heavy · Pull A — bodyweight pulls + curls
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-08-31', phase_id, 'pull-heavy', 'Pull A — bodyweight pulls + curls',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 5, NULL, 0, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Pull-up · BW · set 3', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Pull-up · BW · set 4', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Curls', 3, 'Was 16 kg / 9 kg in H2 Week 1. Slow eccentric. Stop with reps in reserve.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 12 kg · set 1', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 12 kg · set 1', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bicep curl L · 12 kg · set 2', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bicep curl R · 12 kg · set 2', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Hammer curl L · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Hammer curl R · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Hammer curl L · 8 kg · set 2', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Hammer curl R · 8 kg · set 2', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-01 · push · Push A — dips, press, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-01', phase_id, 'push', 'Push A — dips, press, split squat',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Band ER + wall slides', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', '1 easy dip (range as comfort allows)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset A · Vertical (Dips + OHP)', 2, '3–4 RIR. No added weight on dips. OHP well under the old 30 kg Week-1 load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 5, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 OHP · 20 kg', 6, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 Dips · BW', 5, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 OHP · 20 kg', 6, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 Dips · BW', 5, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 OHP · 20 kg', 6, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset B · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB — more upright than the old 50 kg barbell hinge. Bench well under the old 55 kg.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 35 kg', 6, 35, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 35 kg', 6, 35, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 Bench · 35 kg', 6, 35, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 4, 'Blood-flow / activation work. Stop if the joint or a shoulder nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 2 kg · set 1', 14, 2, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 2 kg · set 1', 14, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 2 kg · set 2', 14, 2, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 2 kg · set 2', 14, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Face pull · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Reverse fly · set 2', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 9, 'work', 'Wrist extensors · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 10, 'work', 'Wrist extensors · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 5, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. No step-up — pistol skill lives on the run days. Bodyweight, 3-1-3.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Bulgarian R · BW (surgical first)', 6, NULL, NULL, NULL, 45, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bulgarian L · BW', 6, NULL, NULL, NULL, 90, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 Bulgarian R · BW (surgical first)', 6, NULL, NULL, NULL, 45, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bulgarian L · BW', 6, NULL, NULL, NULL, 90, 6, '3-1-3 tempo'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 6, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow so they do not stack on the split squat.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-02 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-02', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'High box / chair, above parallel. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. If the last rep collapses or twists, the box is too low. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Box pistol R · round 3 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Box pistol L · round 3 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 20 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-03 · pull-light · Pull B — light pulls + bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-03', phase_id, 'pull-light', 'Pull B — light pulls + bird-dog',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Pull-up · BW · set 3', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 3, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block. Pallof stays out unless anti-rotation is obviously quiet.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bird-dog L · round 1', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bird-dog R · round 1', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bird-dog L · round 2', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bird-dog R · round 2', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Bird-dog L · round 3', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Bird-dog R · round 3', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-04 · push · Push B — volume
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-04', phase_id, 'push', 'Push B — volume',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, '3+ RIR. Knees-down is fine if the joint or a shoulder asks.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Push-up · set 1', 8, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Push-up · set 2', 8, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Push-up · set 3', 8, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Single-arm DB press', 2, 'Left first (weaker side). 8 kg — under the old 12 kg Sunday volume load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'SA DB press L · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'SA DB press R · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'SA DB press L · 8 kg · round 2', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'SA DB press R · 8 kg · round 2', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Tempo dips · 3-1-1', 3, '3 s down, 1 s pause, 1 s up. Bodyweight. Range as comfort allows.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Tempo dip 3-1-1 · set 1', 4, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Tempo dip 3-1-1 · set 2', 4, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Tempo dip 3-1-1 · set 3', 4, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Shoulder insurance', 4, 'Band pull-aparts + prone Y-T-W. No extra run on this day.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Band pull-apart · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Band pull-apart · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Band pull-apart · set 3', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Prone Y-T-W · 1 kg · set 1', 8, 1, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Prone Y-T-W · 1 kg · set 2', 8, 1, NULL, NULL, 60, 6, NULL
  );

  -- 2026-09-05 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-05', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'High box / chair, above parallel. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. If the last rep collapses or twists, the box is too low. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Box pistol R · round 3 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Box pistol L · round 3 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 20 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-06 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-06', phase_id, 'rest', 'Rest',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  -- 2026-09-07 · pull-heavy · Pull A — bodyweight pulls + curls
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-07', phase_id, 'pull-heavy', 'Pull A — bodyweight pulls + curls',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 5, NULL, 0, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Pull-up · BW · set 3', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Pull-up · BW · set 4', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Pull-up · BW · set 5', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Curls', 3, 'Was 16 kg / 9 kg in H2 Week 1. Slow eccentric. Stop with reps in reserve.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 12 kg · set 1', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 12 kg · set 1', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bicep curl L · 12 kg · set 2', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bicep curl R · 12 kg · set 2', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Hammer curl L · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Hammer curl R · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Hammer curl L · 8 kg · set 2', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Hammer curl R · 8 kg · set 2', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-08 · push · Push A — dips, press, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-08', phase_id, 'push', 'Push A — dips, press, split squat',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Band ER + wall slides', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', '1 easy dip (range as comfort allows)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset A · Vertical (Dips + OHP)', 2, '3–4 RIR. No added weight on dips. OHP well under the old 30 kg Week-1 load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 6, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 OHP · 20 kg', 8, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 Dips · BW', 6, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 OHP · 20 kg', 8, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 Dips · BW', 6, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 OHP · 20 kg', 8, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset B · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB — more upright than the old 50 kg barbell hinge. Bench well under the old 55 kg.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 37.5 kg', 6, 37.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 37.5 kg', 6, 37.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 Bench · 37.5 kg', 6, 37.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 4, 'Blood-flow / activation work. Stop if the joint or a shoulder nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 2 kg · set 1', 14, 2, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 2 kg · set 1', 14, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 2 kg · set 2', 14, 2, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 2 kg · set 2', 14, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Face pull · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Reverse fly · set 2', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 9, 'work', 'Wrist extensors · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 10, 'work', 'Wrist extensors · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 5, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. No step-up — pistol skill lives on the run days. Bodyweight, 3-1-3.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Bulgarian R · BW (surgical first)', 6, NULL, NULL, NULL, 45, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bulgarian L · BW', 6, NULL, NULL, NULL, 90, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 Bulgarian R · BW (surgical first)', 6, NULL, NULL, NULL, 45, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bulgarian L · BW', 6, NULL, NULL, NULL, 90, 6, '3-1-3 tempo'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 6, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow so they do not stack on the split squat.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-09 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-09', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'High box / chair, above parallel. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. If the last rep collapses or twists, the box is too low. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Box pistol R · round 3 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Box pistol L · round 3 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 25 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-10 · pull-light · Pull B — light pulls + bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-10', phase_id, 'pull-light', 'Pull B — light pulls + bird-dog',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 6, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 6, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Pull-up · BW · set 3', 6, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 3, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block. Pallof stays out unless anti-rotation is obviously quiet.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bird-dog L · round 1', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bird-dog R · round 1', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bird-dog L · round 2', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bird-dog R · round 2', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Bird-dog L · round 3', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Bird-dog R · round 3', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-11 · push · Push B — volume
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-11', phase_id, 'push', 'Push B — volume',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, '3+ RIR. Knees-down is fine if the joint or a shoulder asks.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Push-up · set 1', 10, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Push-up · set 2', 10, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Push-up · set 3', 10, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Single-arm DB press', 2, 'Left first (weaker side). 8 kg — under the old 12 kg Sunday volume load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'SA DB press L · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'SA DB press R · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'SA DB press L · 8 kg · round 2', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'SA DB press R · 8 kg · round 2', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Tempo dips · 3-1-1', 3, '3 s down, 1 s pause, 1 s up. Bodyweight. Range as comfort allows.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Tempo dip 3-1-1 · set 1', 5, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Tempo dip 3-1-1 · set 2', 5, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Tempo dip 3-1-1 · set 3', 5, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Shoulder insurance', 4, 'Band pull-aparts + prone Y-T-W. No extra run on this day.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Band pull-apart · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Band pull-apart · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Band pull-apart · set 3', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Prone Y-T-W · 1 kg · set 1', 8, 1, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Prone Y-T-W · 1 kg · set 2', 8, 1, NULL, NULL, 60, 6, NULL
  );

  -- 2026-09-12 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-12', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'High box / chair, above parallel. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. If the last rep collapses or twists, the box is too low. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Box pistol R · round 3 (3–5)', 4, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Box pistol L · round 3 (3–5)', 4, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 25 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-13 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-13', phase_id, 'rest', 'Rest',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  -- 2026-09-14 · pull-heavy · Pull A — bodyweight pulls + curls
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-14', phase_id, 'pull-heavy', 'Pull A — bodyweight pulls + curls',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 5, NULL, 0, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Pull-up · BW · set 3', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Pull-up · BW · set 4', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Pull-up · BW · set 5', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Curls', 3, 'Was 16 kg / 9 kg in H2 Week 1. Slow eccentric. Stop with reps in reserve.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 12 kg · set 1', 12, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 12 kg · set 1', 12, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bicep curl L · 12 kg · set 2', 12, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bicep curl R · 12 kg · set 2', 12, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Hammer curl L · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Hammer curl R · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Hammer curl L · 8 kg · set 2', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Hammer curl R · 8 kg · set 2', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-15 · push · Push A — dips, press, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-15', phase_id, 'push', 'Push A — dips, press, split squat',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Band ER + wall slides', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', '1 easy dip (range as comfort allows)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset A · Vertical (Dips + OHP)', 2, '3–4 RIR. No added weight on dips. OHP well under the old 30 kg Week-1 load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 6, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 OHP · 22.5 kg', 6, 22.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 Dips · BW', 6, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 OHP · 22.5 kg', 6, 22.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 Dips · BW', 6, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 OHP · 22.5 kg', 6, 22.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset B · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB — more upright than the old 50 kg barbell hinge. Bench well under the old 55 kg.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 37.5 kg', 6, 37.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 37.5 kg', 6, 37.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 Bench · 37.5 kg', 6, 37.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 4, 'Blood-flow / activation work. Stop if the joint or a shoulder nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 2 kg · set 1', 14, 2, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 2 kg · set 1', 14, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 2 kg · set 2', 14, 2, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 2 kg · set 2', 14, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Face pull · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Reverse fly · set 2', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 9, 'work', 'Wrist extensors · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 10, 'work', 'Wrist extensors · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 5, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. No step-up — pistol skill lives on the run days. Bodyweight, 3-1-3.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Bulgarian R · BW (surgical first)', 8, NULL, NULL, NULL, 45, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bulgarian L · BW', 8, NULL, NULL, NULL, 90, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 Bulgarian R · BW (surgical first)', 8, NULL, NULL, NULL, 45, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bulgarian L · BW', 8, NULL, NULL, NULL, 90, 6, '3-1-3 tempo'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 6, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow so they do not stack on the split squat.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-16 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-16', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'Box a bit lower only if weeks 1–2 were quiet on the joint and the knee. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (4–6)', 5, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (4–6)', 5, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (4–6)', 5, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (4–6)', 5, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Box pistol R · round 3 (4–6)', 5, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Box pistol L · round 3 (4–6)', 5, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 30 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-17 · pull-light · Pull B — light pulls + bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-17', phase_id, 'pull-light', 'Pull B — light pulls + bird-dog',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Pull-up · BW · set 3', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Pull-up · BW · set 4', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 3, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block. Pallof stays out unless anti-rotation is obviously quiet.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bird-dog L · round 1', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bird-dog R · round 1', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bird-dog L · round 2', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bird-dog R · round 2', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Bird-dog L · round 3', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Bird-dog R · round 3', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-18 · push · Push B — volume
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-18', phase_id, 'push', 'Push B — volume',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, '3+ RIR. Knees-down is fine if the joint or a shoulder asks.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Push-up · set 1', 10, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Push-up · set 2', 10, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Push-up · set 3', 10, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Single-arm DB press', 2, 'Left first (weaker side). 8 kg — under the old 12 kg Sunday volume load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'SA DB press L · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'SA DB press R · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'SA DB press L · 8 kg · round 2', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'SA DB press R · 8 kg · round 2', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Tempo dips · 3-1-1', 3, '3 s down, 1 s pause, 1 s up. Bodyweight. Range as comfort allows.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Tempo dip 3-1-1 · set 1', 5, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Tempo dip 3-1-1 · set 2', 5, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Tempo dip 3-1-1 · set 3', 5, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Shoulder insurance', 4, 'Band pull-aparts + prone Y-T-W. No extra run on this day.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Band pull-apart · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Band pull-apart · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Band pull-apart · set 3', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Prone Y-T-W · 1 kg · set 1', 8, 1, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Prone Y-T-W · 1 kg · set 2', 8, 1, NULL, NULL, 60, 6, NULL
  );

  -- 2026-09-19 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-19', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'Box a bit lower only if weeks 1–2 were quiet on the joint and the knee. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (4–6)', 5, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (4–6)', 5, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (4–6)', 5, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (4–6)', 5, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Box pistol R · round 3 (4–6)', 5, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Box pistol L · round 3 (4–6)', 5, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 30 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-20 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-20', phase_id, 'rest', 'Rest',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  -- 2026-09-21 · pull-heavy · Pull A — bodyweight pulls + curls
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-21', phase_id, 'pull-heavy', 'Pull A — bodyweight pulls + curls',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 5, NULL, 0, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Pull-up · BW · set 3', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Curls', 3, 'Was 16 kg / 9 kg in H2 Week 1. Slow eccentric. Stop with reps in reserve.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 12 kg · set 1', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 12 kg · set 1', 10, 12, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Hammer curl L · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Hammer curl R · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-22 · push · Push A — dips, press, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-22', phase_id, 'push', 'Push A — dips, press, split squat',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Band ER + wall slides', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', '1 easy dip (range as comfort allows)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset A · Vertical (Dips + OHP)', 2, '3–4 RIR. No added weight on dips. OHP well under the old 30 kg Week-1 load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 5, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 OHP · 20 kg', 6, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 Dips · BW', 5, NULL, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 OHP · 20 kg', 6, 20, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset B · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB — more upright than the old 50 kg barbell hinge. Bench well under the old 55 kg.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 35 kg', 6, 35, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 16 kg', 8, 16, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 35 kg', 6, 35, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 4, 'Blood-flow / activation work. Stop if the joint or a shoulder nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 2 kg · set 1', 14, 2, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 2 kg · set 1', 14, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Wrist extensors · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 5, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. No step-up — pistol skill lives on the run days. Bodyweight, 3-1-3.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Bulgarian R · BW (surgical first)', 6, NULL, NULL, NULL, 45, 6, '3-1-3 tempo'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bulgarian L · BW', 6, NULL, NULL, NULL, 90, 6, '3-1-3 tempo'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 6, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow so they do not stack on the split squat.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-23 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-23', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'High box / chair, above parallel. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. If the last rep collapses or twists, the box is too low. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (3)', 3, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (3)', 3, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (3)', 3, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (3)', 3, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 20 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-24 · pull-light · Pull B — light pulls + bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-24', phase_id, 'pull-light', 'Pull B — light pulls + bird-dog',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · conservative', 1, 'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Tendon glides — 10 reps each pattern', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Band ER + scapular retraction — 2 × 12', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Scapular pull-ups — 2 × 8', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Pull-up · BW · set 1', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Pull-up · BW · set 2', 5, NULL, 0, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 3, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block. Pallof stays out unless anti-rotation is obviously quiet.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bird-dog L · round 1', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bird-dog R · round 1', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bird-dog L · round 2', 8, NULL, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bird-dog R · round 2', 8, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 4, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-25 · push · Push B — volume
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-25', phase_id, 'push', 'Push B — volume',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, '3+ RIR. Knees-down is fine if the joint or a shoulder asks.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Push-up · set 1', 8, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Push-up · set 2', 8, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Single-arm DB press', 2, 'Left first (weaker side). 8 kg — under the old 12 kg Sunday volume load.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'SA DB press L · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'SA DB press R · 8 kg · round 1', 8, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Tempo dips · 3-1-1', 3, '3 s down, 1 s pause, 1 s up. Bodyweight. Range as comfort allows.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Tempo dip 3-1-1 · set 1', 4, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Tempo dip 3-1-1 · set 2', 4, NULL, NULL, NULL, 90, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Shoulder insurance', 4, 'Band pull-aparts + prone Y-T-W. No extra run on this day.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Band pull-apart · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Band pull-apart · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Prone Y-T-W · 1 kg · set 1', 8, 1, NULL, NULL, 60, 6, NULL
  );

  -- 2026-09-26 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-26', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Ankle + deep-squat hold', 1, 'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Ankle wall test · 1 min each', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Assisted deep-squat hold · 2 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Box pistol · skill', 2, 'High box / chair, above parallel. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. If the last rep collapses or twists, the box is too low. No free pistol, no shrimp, no added load this block.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Box pistol R · round 1 (3)', 3, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Box pistol L · round 1 (3)', 3, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Box pistol R · round 2 (3)', 3, NULL, NULL, NULL, 45, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Box pistol L · round 2 (3)', 3, NULL, NULL, NULL, 60, 6, '3 s down, pause, stand'
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility flow', 3, 'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '90/90 + pigeon + couch stretch', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'checklist', 'Hamstring (no Jefferson curl)', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'checklist', 'Cossack 3 × 4 slow · knee tracks foot', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'checklist', 'Horse stance 3 × 30 s', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'checklist', 'T-spine + stick dislocates', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Easy run', 4, 'Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', 'Easy run 20 min · walk breaks OK', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-27 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-27', phase_id, 'rest', 'Rest',
    true, false, '**Re-entry · conservative.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  RAISE NOTICE 'Re-entry seeded.';
END $$;
