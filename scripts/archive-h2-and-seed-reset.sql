-- Archive Martin's H2 2026 plan (keep every row) and seed the spine-reset plan.
-- Paste in the Supabase SQL editor if the Node script cannot reach the pooler.
-- Idempotent. Does not touch Antonia. Does not DELETE sessions.

ALTER TABLE phases ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE phases ADD COLUMN IF NOT EXISTS cycle_name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cycle_name TEXT;
CREATE INDEX IF NOT EXISTS idx_phases_user_archived ON phases(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_sessions_user_archived ON sessions(user_id, archived, date);

DO $$
DECLARE
  hold_id BIGINT;
  restore_id BIGINT;
  start_d DATE := CURRENT_DATE;
  protect_notes TEXT :=
    '**Protect.** Back joint is being adjusted. No hanging, no pull-ups, no climbing, no running, no loaded flexion or rotation. Stop immediately if the joint speaks. Pain-free only.

The H2 2026 plan is archived (Log → Previous plan). Do not sneak in old sessions.';
  restore_notes TEXT :=
    '**Restore — only if the adjustment is holding and symptoms are quiet.** Back joint is being adjusted. No hanging, no pull-ups, no climbing, no running, no loaded flexion or rotation. Stop immediately if the joint speaks. Pain-free only.

Still no performance work. The next climbing block is designed after clearance, not before.';
  walk_notes TEXT :=
    'Flat ground, easy breathing. This is circulation, not training. Turn around the moment the back joint complains.';
  mob_notes TEXT :=
    'Hips, ankles, shoulders, easy breathing. No loaded spinal flexion, no max rotation, no hanging, no twisting under load. Skip anything that refers to the joint.';
  d DATE;
  i INT;
  kind TEXT;
  sess_id BIGINT;
  ex_id BIGINT;
  sess_type TEXT;
  sess_title TEXT;
  sess_notes TEXT;
  walk_label TEXT;
  with_mob BOOLEAN;
BEGIN
  IF EXISTS (
    SELECT 1 FROM phases
    WHERE user_id = 'martin' AND short_name = 'HOLD' AND COALESCE(archived, false) = false
  ) THEN
    RAISE NOTICE 'Reset plan already active. Nothing to do.';
    RETURN;
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
    'martin', 1, 'Protect — spine', 'HOLD', start_d, start_d + 13,
    'Two weeks. Joint is being adjusted. Walk and rest only. No climbing training. H2 2026 is archived, not deleted.',
    false, 'Reset'
  ) RETURNING id INTO hold_id;

  INSERT INTO phases (
    user_id, mesocycle_num, name, short_name, start_date, end_date, description, archived, cycle_name
  ) VALUES (
    'martin', 2, 'Restore — if quiet', 'RESTORE', start_d + 14, start_d + 41,
    'Four weeks of the same constraint, slightly longer walks, still no hangs / pull-ups / climbing / running. Locked until the joint is quiet. Next performance block is a separate decision.',
    false, 'Reset'
  ) RETURNING id INTO restore_id;

  FOR i IN 0..41 LOOP
    d := start_d + i;
    kind := (ARRAY['walk','rest','walk-mob','walk','rest','walk','rest'])[1 + (i % 7)];
    sess_notes := CASE WHEN i < 14 THEN protect_notes ELSE restore_notes END;
    walk_label := CASE WHEN i < 14 THEN 'Walk 20–30 min · pain-free' ELSE 'Walk 30–40 min · pain-free' END;

    IF kind = 'rest' THEN
      sess_type := 'rest';
      sess_title := CASE WHEN i < 14 THEN 'Rest — let the adjustment hold' ELSE 'Rest — symptoms decide' END;
      INSERT INTO sessions (
        user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
      ) VALUES (
        'martin', d, CASE WHEN i < 14 THEN hold_id ELSE restore_id END,
        sess_type, sess_title, true, false, sess_notes, false, 'Reset'
      );
    ELSE
      with_mob := kind = 'walk-mob';
      sess_type := 'mobility';
      sess_title := CASE WHEN with_mob THEN 'Walk + unloaded mobility' ELSE 'Walk — easy, pain-free' END;
      INSERT INTO sessions (
        user_id, date, phase_id, type, title, scheduled, completed, notes, archived, cycle_name
      ) VALUES (
        'martin', d, CASE WHEN i < 14 THEN hold_id ELSE restore_id END,
        sess_type, sess_title, true, false, sess_notes, false, 'Reset'
      ) RETURNING id INTO sess_id;

      INSERT INTO exercises (session_id, name, display_order, notes)
      VALUES (sess_id, 'Easy walk', 1, walk_notes)
      RETURNING id INTO ex_id;
      INSERT INTO exercise_sets (exercise_id, set_num, kind, label)
      VALUES (ex_id, 1, 'checklist', walk_label);

      IF with_mob THEN
        INSERT INTO exercises (session_id, name, display_order, notes)
        VALUES (sess_id, 'Unloaded mobility', 2, mob_notes)
        RETURNING id INTO ex_id;
        INSERT INTO exercise_sets (exercise_id, set_num, kind, label)
        VALUES (ex_id, 1, 'checklist', '~10 min · hips / ankles / shoulders / breath');
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'H2 2026 archived. Reset plan seeded from %.', start_d;
END $$;
