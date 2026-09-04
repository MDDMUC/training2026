-- Archive Martin's current cycle and seed Re-entry (2026-09-04 -> 2026-10-01).
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
    'martin', 1, 'Hypertrophy Base — load ramp', 'REENTRY',
    '2026-09-04', '2026-10-01', 'Meso 1 of the new macrocycle. Pull → Push → Run twice, then rest. Full size menu (chest, side delts, biceps, forearms) at ~50%→~90% of H2 Phase 1 loads. Week 4 volume deload. No hangboard, climbing, OHP, or weighted pulls. Next meso is a separate decision after Week 4.', false, 'Re-entry'
  ) RETURNING id INTO phase_id;

  -- 2026-09-04 · pull-heavy · Pull A — pulls, biceps, forearms
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-04', phase_id, 'pull-heavy', 'Pull A — pulls, biceps, forearms',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Curls', 3, 'Hypertrophy arms. Phase 1 normal 16 / 9 kg. This week ~50%. Slow eccentric. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 8 kg · set 1', 10, 8, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bicep curl L · 8 kg · set 2', 10, 8, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bicep curl R · 8 kg · set 2', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Hammer curl L · 4.5 kg · set 1', 10, 4.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Hammer curl R · 4.5 kg · set 1', 10, 4.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Hammer curl L · 4.5 kg · set 2', 10, 4.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Hammer curl R · 4.5 kg · set 2', 10, 4.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Forearms', 4, 'Wrist flexors + extensors. Light. Supported forearm on a bench. Full ROM, no elbow swing. Skip if tendons nag — pull grip already loads them.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Wrist curl · 3 kg · set 1', 15, 3, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Wrist curl · 3 kg · set 2', 15, 3, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Wrist extensor · 2 kg · set 1', 15, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Wrist extensor · 2 kg · set 2', 15, 2, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-05 · push · Push A — dips, chest, delts, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-05', phase_id, 'push', 'Push A — dips, chest, delts, split squat',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip. No OHP.')
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
  VALUES (sess_id, 'Dips', 2, '3–4 RIR. Bodyweight only. No OHP this block — overhead pressing paused while the joint settles. Full rest between sets.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 5, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R2 Dips · BW', 5, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R3 Dips · BW', 5, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB (proxy for old 50 kg hinge). Bench Phase 1 normal 55 kg — this week ~50%. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 12 kg', 8, 12, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 27.5 kg', 6, 27.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 12 kg', 8, 12, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 27.5 kg', 6, 27.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 DB / chest-supported row · 12 kg', 8, 12, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 Bench · 27.5 kg', 6, 27.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 4, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 4 kg · set 1', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 4 kg · set 1', 12, 4, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 4 kg · set 2', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 4 kg · set 2', 12, 4, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Lateral raise L · 4 kg · set 3', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Lateral raise R · 4 kg · set 3', 12, 4, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'DB fly', 5, 'Pec sweep. Flat or slight-incline. Soft elbows, stop when the stretch is honest — do not dump into the anterior shoulder. 3–4 RIR. Skip if a pec or the joint nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'DB fly L · 4 kg · set 1', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'DB fly R · 4 kg · set 1', 12, 4, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'DB fly L · 4 kg · set 2', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'DB fly R · 4 kg · set 2', 12, 4, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 6, 'Rear-delt insurance. Wrist extensors live on Pull A forearms — not doubled here. Side delts are the seated laterals above.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Face pull · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Reverse fly · set 2', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 7, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. Bodyweight, 3-1-3.')
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
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 8, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-06 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-06', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-09-07 · pull-light · Pull B — light pulls, arms touch, bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-07', phase_id, 'pull-light', 'Pull B — light pulls, arms touch, bird-dog',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Easy curls', 3, 'Second weekly biceps touch. One easy round. 3–4 RIR. Skip if elbows or the joint ask.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Easy curl L · 8 kg', 12, 8, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Easy curl R · 8 kg', 12, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 4, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block.')
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
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-08 · push · Push B — push-ups, incline, delts
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-08', phase_id, 'push', 'Push B — push-ups, incline, delts',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, 'Volume press. 3+ RIR. Knees-down is fine if the joint or a shoulder asks. Dips stay on Push A — not stacked here.')
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
  VALUES (sess_id, 'Incline DB press', 2, 'Upper chest. Bench ~30°. Back supported. Left first. 3–4 RIR. The only hard press on Push B — not stacked on SA press, extra dips, or OHP.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Incline DB press L · 7 kg · set 1', 8, 7, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Incline DB press R · 7 kg · set 1', 8, 7, NULL, NULL, 75, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Incline DB press L · 7 kg · set 2', 8, 7, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Incline DB press R · 7 kg · set 2', 8, 7, NULL, NULL, 75, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 3, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 4 kg · set 1', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 4 kg · set 1', 12, 4, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 4 kg · set 2', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 4 kg · set 2', 12, 4, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Lateral raise L · 4 kg · set 3', 12, 4, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Lateral raise R · 4 kg · set 3', 12, 4, NULL, NULL, 45, 6, NULL
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

  -- 2026-09-09 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-09', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-09-10 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-10', phase_id, 'rest', 'Rest',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  -- 2026-09-11 · pull-heavy · Pull A — pulls, biceps, forearms
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-11', phase_id, 'pull-heavy', 'Pull A — pulls, biceps, forearms',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Curls', 3, 'Hypertrophy arms. Phase 1 normal 16 / 9 kg. This week ~65%. Slow eccentric. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 10.5 kg · set 1', 10, 10.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 10.5 kg · set 1', 10, 10.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bicep curl L · 10.5 kg · set 2', 10, 10.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bicep curl R · 10.5 kg · set 2', 10, 10.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Hammer curl L · 6 kg · set 1', 10, 6, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Hammer curl R · 6 kg · set 1', 10, 6, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Hammer curl L · 6 kg · set 2', 10, 6, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Hammer curl R · 6 kg · set 2', 10, 6, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Forearms', 4, 'Wrist flexors + extensors. Light. Supported forearm on a bench. Full ROM, no elbow swing. Skip if tendons nag — pull grip already loads them.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Wrist curl · 4 kg · set 1', 15, 4, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Wrist curl · 4 kg · set 2', 15, 4, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Wrist extensor · 2.5 kg · set 1', 15, 2.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Wrist extensor · 2.5 kg · set 2', 15, 2.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-12 · push · Push A — dips, chest, delts, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-12', phase_id, 'push', 'Push A — dips, chest, delts, split squat',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip. No OHP.')
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
  VALUES (sess_id, 'Dips', 2, '3–4 RIR. Bodyweight only. No OHP this block — overhead pressing paused while the joint settles. Full rest between sets.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 6, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R2 Dips · BW', 6, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R3 Dips · BW', 6, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB (proxy for old 50 kg hinge). Bench Phase 1 normal 55 kg — this week ~65%. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 15.5 kg', 8, 15.5, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 36 kg', 6, 36, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 15.5 kg', 8, 15.5, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 36 kg', 6, 36, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 DB / chest-supported row · 15.5 kg', 8, 15.5, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 Bench · 36 kg', 6, 36, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 4, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 5 kg · set 1', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 5 kg · set 1', 12, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 5 kg · set 2', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 5 kg · set 2', 12, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Lateral raise L · 5 kg · set 3', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Lateral raise R · 5 kg · set 3', 12, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Lateral raise L · 5 kg · set 4', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Lateral raise R · 5 kg · set 4', 12, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'DB fly', 5, 'Pec sweep. Flat or slight-incline. Soft elbows, stop when the stretch is honest — do not dump into the anterior shoulder. 3–4 RIR. Skip if a pec or the joint nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'DB fly L · 5 kg · set 1', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'DB fly R · 5 kg · set 1', 12, 5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'DB fly L · 5 kg · set 2', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'DB fly R · 5 kg · set 2', 12, 5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 6, 'Rear-delt insurance. Wrist extensors live on Pull A forearms — not doubled here. Side delts are the seated laterals above.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Face pull · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Reverse fly · set 2', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 7, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. Bodyweight, 3-1-3.')
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
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 8, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-13 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-13', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-09-14 · pull-light · Pull B — light pulls, arms touch, bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-14', phase_id, 'pull-light', 'Pull B — light pulls, arms touch, bird-dog',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Easy curls', 3, 'Second weekly biceps touch. One easy round. 3–4 RIR. Skip if elbows or the joint ask.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Easy curl L · 10.5 kg', 12, 10.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Easy curl R · 10.5 kg', 12, 10.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 4, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block.')
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
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-15 · push · Push B — push-ups, incline, delts
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-15', phase_id, 'push', 'Push B — push-ups, incline, delts',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, 'Volume press. 3+ RIR. Knees-down is fine if the joint or a shoulder asks. Dips stay on Push A — not stacked here.')
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
  VALUES (sess_id, 'Incline DB press', 2, 'Upper chest. Bench ~30°. Back supported. Left first. 3–4 RIR. The only hard press on Push B — not stacked on SA press, extra dips, or OHP.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Incline DB press L · 9 kg · set 1', 8, 9, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Incline DB press R · 9 kg · set 1', 8, 9, NULL, NULL, 75, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Incline DB press L · 9 kg · set 2', 8, 9, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Incline DB press R · 9 kg · set 2', 8, 9, NULL, NULL, 75, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 3, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 5 kg · set 1', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 5 kg · set 1', 12, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 5 kg · set 2', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 5 kg · set 2', 12, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Lateral raise L · 5 kg · set 3', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Lateral raise R · 5 kg · set 3', 12, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Lateral raise L · 5 kg · set 4', 12, 5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Lateral raise R · 5 kg · set 4', 12, 5, NULL, NULL, 45, 6, NULL
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

  -- 2026-09-16 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-16', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-09-17 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-17', phase_id, 'rest', 'Rest',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  -- 2026-09-18 · pull-heavy · Pull A — pulls, biceps, forearms
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-18', phase_id, 'pull-heavy', 'Pull A — pulls, biceps, forearms',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Curls', 3, 'Hypertrophy arms. Phase 1 normal 16 / 9 kg. This week ~83%. Slow eccentric. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 13 kg · set 1', 12, 13, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 13 kg · set 1', 12, 13, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Bicep curl L · 13 kg · set 2', 12, 13, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Bicep curl R · 13 kg · set 2', 12, 13, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Hammer curl L · 7.5 kg · set 1', 10, 7.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Hammer curl R · 7.5 kg · set 1', 10, 7.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Hammer curl L · 7.5 kg · set 2', 10, 7.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Hammer curl R · 7.5 kg · set 2', 10, 7.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Forearms', 4, 'Wrist flexors + extensors. Light. Supported forearm on a bench. Full ROM, no elbow swing. Skip if tendons nag — pull grip already loads them.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Wrist curl · 5 kg · set 1', 15, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Wrist curl · 5 kg · set 2', 15, 5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Wrist extensor · 3.5 kg · set 1', 15, 3.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Wrist extensor · 3.5 kg · set 2', 15, 3.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-19 · push · Push A — dips, chest, delts, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-19', phase_id, 'push', 'Push A — dips, chest, delts, split squat',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip. No OHP.')
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
  VALUES (sess_id, 'Dips', 2, '3–4 RIR. Bodyweight only. No OHP this block — overhead pressing paused while the joint settles. Full rest between sets.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 7, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R2 Dips · BW', 7, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R3 Dips · BW', 7, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB (proxy for old 50 kg hinge). Bench Phase 1 normal 55 kg — this week ~83%. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 20 kg', 8, 20, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 45.5 kg', 8, 45.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 20 kg', 8, 20, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 45.5 kg', 8, 45.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'R3 DB / chest-supported row · 20 kg', 8, 20, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'R3 Bench · 45.5 kg', 8, 45.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 4, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 6.5 kg · set 1', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 6.5 kg · set 1', 15, 6.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 6.5 kg · set 2', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 6.5 kg · set 2', 15, 6.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Lateral raise L · 6.5 kg · set 3', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Lateral raise R · 6.5 kg · set 3', 15, 6.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Lateral raise L · 6.5 kg · set 4', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Lateral raise R · 6.5 kg · set 4', 15, 6.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'DB fly', 5, 'Pec sweep. Flat or slight-incline. Soft elbows, stop when the stretch is honest — do not dump into the anterior shoulder. 3–4 RIR. Skip if a pec or the joint nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'DB fly L · 6.5 kg · set 1', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'DB fly R · 6.5 kg · set 1', 15, 6.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'DB fly L · 6.5 kg · set 2', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'DB fly R · 6.5 kg · set 2', 15, 6.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 6, 'Rear-delt insurance. Wrist extensors live on Pull A forearms — not doubled here. Side delts are the seated laterals above.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Face pull · set 2', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Reverse fly · set 2', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 7, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. Bodyweight, 3-1-3.')
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
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 8, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-20 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-20', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-09-21 · pull-light · Pull B — light pulls, arms touch, bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-21', phase_id, 'pull-light', 'Pull B — light pulls, arms touch, bird-dog',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Easy curls', 3, 'Second weekly biceps touch. One easy round. 3–4 RIR. Skip if elbows or the joint ask.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Easy curl L · 13 kg', 12, 13, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Easy curl R · 13 kg', 12, 13, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 4, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block.')
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
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-22 · push · Push B — push-ups, incline, delts
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-22', phase_id, 'push', 'Push B — push-ups, incline, delts',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, 'Volume press. 3+ RIR. Knees-down is fine if the joint or a shoulder asks. Dips stay on Push A — not stacked here.')
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
  VALUES (sess_id, 'Incline DB press', 2, 'Upper chest. Bench ~30°. Back supported. Left first. 3–4 RIR. The only hard press on Push B — not stacked on SA press, extra dips, or OHP.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Incline DB press L · 11.5 kg · set 1', 10, 11.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Incline DB press R · 11.5 kg · set 1', 10, 11.5, NULL, NULL, 75, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Incline DB press L · 11.5 kg · set 2', 10, 11.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Incline DB press R · 11.5 kg · set 2', 10, 11.5, NULL, NULL, 75, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 3, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 6.5 kg · set 1', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 6.5 kg · set 1', 15, 6.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 6.5 kg · set 2', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 6.5 kg · set 2', 15, 6.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 5, 'work', 'Lateral raise L · 6.5 kg · set 3', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 6, 'work', 'Lateral raise R · 6.5 kg · set 3', 15, 6.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 7, 'work', 'Lateral raise L · 6.5 kg · set 4', 15, 6.5, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 8, 'work', 'Lateral raise R · 6.5 kg · set 4', 15, 6.5, NULL, NULL, 45, 6, NULL
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

  -- 2026-09-23 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-23', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-09-24 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-24', phase_id, 'rest', 'Rest',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  -- 2026-09-25 · pull-heavy · Pull A — pulls, biceps, forearms
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-25', phase_id, 'pull-heavy', 'Pull A — pulls, biceps, forearms',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Curls', 3, 'Hypertrophy arms. Phase 1 normal 16 / 9 kg. This week ~90%. Slow eccentric. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Bicep curl L · 14.5 kg · set 1', 12, 14.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Bicep curl R · 14.5 kg · set 1', 12, 14.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Hammer curl L · 8 kg · set 1', 10, 8, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Hammer curl R · 8 kg · set 1', 10, 8, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Forearms', 4, 'Wrist flexors + extensors. Light. Supported forearm on a bench. Full ROM, no elbow swing. Skip if tendons nag — pull grip already loads them.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Wrist curl · 5.5 kg · set 1', 15, 5.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Wrist extensor · 3.5 kg · set 1', 15, 3.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-26 · push · Push A — dips, chest, delts, split squat
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-26', phase_id, 'push', 'Push A — dips, chest, delts, split squat',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Warm-up · push', 1, 'Band ER, scapular wall slides, one easy dip. No OHP.')
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
  VALUES (sess_id, 'Dips', 2, '3–4 RIR. Bodyweight only. No OHP this block — overhead pressing paused while the joint settles. Full rest between sets.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 Dips · BW', 5, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R2 Dips · BW', 5, NULL, NULL, NULL, 120, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Superset · Horizontal (Row + Bench)', 3, 'Row is chest-supported or DB (proxy for old 50 kg hinge). Bench Phase 1 normal 55 kg — this week ~90%. 3–4 RIR.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'R1 DB / chest-supported row · 21.5 kg', 8, 21.5, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'R1 Bench · 49.5 kg', 8, 49.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'R2 DB / chest-supported row · 21.5 kg', 8, 21.5, NULL, NULL, 0, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'R2 Bench · 49.5 kg', 8, 49.5, NULL, NULL, 180, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 4, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 7 kg · set 1', 15, 7, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 7 kg · set 1', 15, 7, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 7 kg · set 2', 15, 7, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 7 kg · set 2', 15, 7, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'DB fly', 5, 'Pec sweep. Flat or slight-incline. Soft elbows, stop when the stretch is honest — do not dump into the anterior shoulder. 3–4 RIR. Skip if a pec or the joint nags.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'DB fly L · 7 kg · set 1', 15, 7, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'DB fly R · 7 kg · set 1', 15, 7, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Antagonist + prehab', 6, 'Rear-delt insurance. Wrist extensors live on Pull A forearms — not doubled here. Side delts are the seated laterals above.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Face pull · set 1', 15, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Reverse fly · set 1', 12, NULL, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bulgarian split squat', 7, 'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. Bodyweight, 3-1-3.')
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
  VALUES (sess_id, 'Hip + hamstring mobility · 10–15 min', 8, '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10–15 min · 90/90, hamstring, ankle', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-27 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-27', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-09-28 · pull-light · Pull B — light pulls, arms touch, bird-dog
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-28', phase_id, 'pull-light', 'Pull B — light pulls, arms touch, bird-dog',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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
  VALUES (sess_id, 'Pull-ups · bodyweight', 2, 'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.')
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
  VALUES (sess_id, 'Easy curls', 3, 'Second weekly biceps touch. One easy round. 3–4 RIR. Skip if elbows or the joint ask.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Easy curl L · 14.5 kg', 12, 14.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Easy curl R · 14.5 kg', 12, 14.5, NULL, NULL, 60, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Bird-dog', 4, 'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block.')
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
  VALUES (sess_id, 'Mobility · 10 min', 5, 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'checklist', '10 min · hips / hamstring / ankle / shoulders', NULL, NULL, NULL, NULL, NULL, NULL, NULL
  );

  -- 2026-09-29 · push · Push B — push-ups, incline, delts
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-29', phase_id, 'push', 'Push B — push-ups, incline, delts',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
  ) RETURNING id INTO sess_id;
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Push-ups', 1, 'Volume press. 3+ RIR. Knees-down is fine if the joint or a shoulder asks. Dips stay on Push A — not stacked here.')
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
  VALUES (sess_id, 'Incline DB press', 2, 'Upper chest. Bench ~30°. Back supported. Left first. 3–4 RIR. The only hard press on Push B — not stacked on SA press, extra dips, or OHP.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Incline DB press L · 12.5 kg · set 1', 10, 12.5, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Incline DB press R · 12.5 kg · set 1', 10, 12.5, NULL, NULL, 75, 6, NULL
  );
  INSERT INTO exercises (session_id, name, display_order, notes)
  VALUES (sess_id, 'Seated DB lateral raise', 3, 'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.')
  RETURNING id INTO ex_id;
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 1, 'work', 'Lateral raise L · 7 kg · set 1', 15, 7, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 2, 'work', 'Lateral raise R · 7 kg · set 1', 15, 7, NULL, NULL, 45, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 3, 'work', 'Lateral raise L · 7 kg · set 2', 15, 7, NULL, NULL, 30, 6, NULL
  );
  INSERT INTO exercise_sets (
    exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds, rpe, notes
  ) VALUES (
    ex_id, 4, 'work', 'Lateral raise R · 7 kg · set 2', 15, 7, NULL, NULL, 45, 6, NULL
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

  -- 2026-09-30 · run · Run — box pistol + easy run
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-09-30', phase_id, 'run', 'Run — box pistol + easy run',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).', false, 'Re-entry'
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

  -- 2026-10-01 · rest · Rest
  INSERT INTO sessions (
    user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
  ) VALUES (
    'martin', '2026-10-01', phase_id, 'rest', 'Rest',
    true, false, '**Hypertrophy Base · Meso 1.** Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).

Optional 20–30 min walk. No “I’ll just do curls.”', false, 'Re-entry'
  ) RETURNING id INTO sess_id;

  RAISE NOTICE 'Re-entry seeded.';
END $$;
