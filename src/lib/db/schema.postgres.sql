-- Training 2026 — Postgres schema (Supabase).
-- Multi-tenant: every data row carries user_id; queries must filter by it.
-- Apply with: npx tsx scripts/apply-pg-schema.ts

-- ============================================================================
-- USERS — auth + identity
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,            -- 'martin', 'antonia'
  email           TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  password_hash   TEXT NOT NULL,               -- bcrypt
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PHASES — per-user mesocycle structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS phases (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mesocycle_num   INTEGER NOT NULL,
  name            TEXT NOT NULL,
  short_name      TEXT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phases_user ON phases(user_id);

-- ============================================================================
-- SESSIONS — every training day, per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  phase_id        BIGINT REFERENCES phases(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,
  title           TEXT,
  scheduled       BOOLEAN NOT NULL DEFAULT FALSE,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  duration_min    INTEGER,
  rpe             INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  body_weight_kg  DOUBLE PRECISION,
  sleep_hours     DOUBLE PRECISION,
  readiness       INTEGER CHECK (readiness IS NULL OR readiness BETWEEN 1 AND 10),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_phase ON sessions(phase_id);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);

-- ============================================================================
-- EXERCISES — within a session (inherits user via session_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercises (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id      BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  display_order   INTEGER NOT NULL,
  notes           TEXT,
  athlete_notes   TEXT
);
CREATE INDEX IF NOT EXISTS idx_exercises_session ON exercises(session_id);

-- ============================================================================
-- EXERCISE SETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercise_sets (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exercise_id     BIGINT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_num         INTEGER NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'work',
  label           TEXT,
  reps            INTEGER,
  load_kg         DOUBLE PRECISION,
  load_kg_added   DOUBLE PRECISION,
  hold_seconds    INTEGER,
  rest_seconds    INTEGER,
  rpe             INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON exercise_sets(exercise_id);

-- ============================================================================
-- TINDEQ TESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tindeq_tests (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id          BIGINT REFERENCES sessions(id) ON DELETE SET NULL,
  date                DATE NOT NULL,
  hand                TEXT NOT NULL CHECK (hand IN ('L', 'R')),
  edge_mm             INTEGER NOT NULL,
  grip_position       TEXT NOT NULL CHECK (grip_position IN ('half-crimp','open-hand','full-crimp','sloper','pinch')),
  peak_force_kg       DOUBLE PRECISION NOT NULL,
  body_weight_kg      DOUBLE PRECISION,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tindeq_user_date ON tindeq_tests(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tindeq_hand ON tindeq_tests(hand);

-- ============================================================================
-- PULL-UP TESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS pullup_tests (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id              BIGINT REFERENCES sessions(id) ON DELETE SET NULL,
  date                    DATE NOT NULL,
  body_weight_kg          DOUBLE PRECISION NOT NULL,
  top_load_added_kg       DOUBLE PRECISION NOT NULL,
  top_reps                INTEGER NOT NULL,
  estimated_1rm_added_kg  DOUBLE PRECISION NOT NULL,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pullup_user_date ON pullup_tests(user_id, date);

-- ============================================================================
-- CLIMBING ATTEMPTS (inherits user via session_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS climbing_attempts (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id      BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  route_name      TEXT,
  grade           TEXT NOT NULL,
  style           TEXT NOT NULL CHECK (style IN ('onsight','flash','redpoint','repeat','attempt','project')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_climbing_session ON climbing_attempts(session_id);

-- ============================================================================
-- RUNNING LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS running_logs (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id      BIGINT REFERENCES sessions(id) ON DELETE SET NULL,
  date            DATE NOT NULL,
  distance_km     DOUBLE PRECISION NOT NULL,
  duration_min    DOUBLE PRECISION NOT NULL,
  pace_min_per_km DOUBLE PRECISION,
  surface         TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_running_user_date ON running_logs(user_id, date);

-- ============================================================================
-- NUTRITION — per-user profile + daily entries
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_nutrition_profile (
  user_id                   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age                       INTEGER NOT NULL,
  height_cm                 DOUBLE PRECISION NOT NULL,
  sex                       TEXT NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female')),
  default_weight_kg         DOUBLE PRECISION,                       -- fallback when no logged sessions
  baseline_activity_factor  DOUBLE PRECISION NOT NULL DEFAULT 1.4,  -- NEAT only; workout calories added on top
  protein_g_per_kg          DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  calorie_tolerance_pct     DOUBLE PRECISION NOT NULL DEFAULT 0.10, -- ±10% counts as "hit"
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_nutrition_profile ADD COLUMN IF NOT EXISTS sex TEXT NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female'));
ALTER TABLE user_nutrition_profile ADD COLUMN IF NOT EXISTS default_weight_kg DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  description TEXT NOT NULL,
  calories    DOUBLE PRECISION NOT NULL,
  protein_g   DOUBLE PRECISION NOT NULL,
  carbs_g     DOUBLE PRECISION NOT NULL,
  fat_g       DOUBLE PRECISION NOT NULL,
  items_json  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON nutrition_entries(user_id, date);

-- Per-day workout burn from the user's watch. Surfaced on Today and added
-- on top of the baseline TDEE to derive the calorie goal.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS activity_calories INTEGER;

-- ============================================================================
-- updated_at trigger for sessions
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sessions_updated_at ON sessions;
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
