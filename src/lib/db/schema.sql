-- Training 2026 — SQLite schema
-- Single-user, local. ISO date strings (YYYY-MM-DD) for dates; ISO timestamps elsewhere.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================================
-- PHASES (mesocycles) — the macro structure of the 12-week plan
-- ============================================================================
CREATE TABLE IF NOT EXISTS phases (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  mesocycle_num   INTEGER NOT NULL,            -- 1, 2, 3
  name            TEXT NOT NULL,               -- "Base + Tendon Prep"
  short_name      TEXT NOT NULL,               -- "BASE"
  start_date      TEXT NOT NULL,               -- YYYY-MM-DD (Monday)
  end_date        TEXT NOT NULL,               -- YYYY-MM-DD (Sunday)
  description     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- SESSIONS — every training day
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  date            TEXT NOT NULL,               -- YYYY-MM-DD
  phase_id        INTEGER REFERENCES phases(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,               -- pull-heavy | pull-light | push | climb-indoor | climb-outdoor | rest | mobility | run | test
  title           TEXT,                        -- "Pull (Heavy) — Density Hangs + Weighted Pulls"
  scheduled       INTEGER NOT NULL DEFAULT 0,  -- boolean: 1 if this came from the seeded plan
  completed       INTEGER NOT NULL DEFAULT 0,  -- boolean: 1 once logged
  duration_min    INTEGER,
  rpe             INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  body_weight_kg  REAL,
  sleep_hours     REAL,                        -- hours slept night before this session
  readiness       INTEGER CHECK (readiness IS NULL OR readiness BETWEEN 1 AND 10),
  notes           TEXT,                        -- markdown
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_phase ON sessions(phase_id);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);

-- ============================================================================
-- EXERCISES — within a session
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercises (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,               -- "Weighted Pull-up", "Density Hang", "Dips", ...
  display_order   INTEGER NOT NULL,
  notes           TEXT,                        -- prescription notes (seeded, immutable for athlete)
  athlete_notes   TEXT                         -- athlete's own annotations
);

CREATE INDEX IF NOT EXISTS idx_exercises_session ON exercises(session_id);

-- ============================================================================
-- EXERCISE SETS — within an exercise
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercise_sets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id     INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_num         INTEGER NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'work', -- 'warmup' | 'work' | 'backoff' | 'checklist'
  label           TEXT,                         -- short descriptor: "L · half-crimp", "warm-up", etc.
  reps            INTEGER,
  load_kg         REAL,
  load_kg_added   REAL,
  hold_seconds    INTEGER,
  rest_seconds    INTEGER,
  rpe             INTEGER CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  completed       INTEGER NOT NULL DEFAULT 0,   -- boolean
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_sets_exercise ON exercise_sets(exercise_id);

-- ============================================================================
-- TINDEQ TESTS — finger peak-force tests
-- ============================================================================
CREATE TABLE IF NOT EXISTS tindeq_tests (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id          INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  date                TEXT NOT NULL,
  hand                TEXT NOT NULL CHECK (hand IN ('L', 'R')),
  edge_mm             INTEGER NOT NULL,
  grip_position       TEXT NOT NULL CHECK (grip_position IN ('half-crimp', 'open-hand', 'full-crimp', 'sloper', 'pinch')),
  peak_force_kg       REAL NOT NULL,
  body_weight_kg      REAL,
  notes               TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tindeq_date ON tindeq_tests(date);
CREATE INDEX IF NOT EXISTS idx_tindeq_hand ON tindeq_tests(hand);

-- ============================================================================
-- PULL-UP TESTS — 1RM estimation records
-- ============================================================================
CREATE TABLE IF NOT EXISTS pullup_tests (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id              INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  date                    TEXT NOT NULL,
  body_weight_kg          REAL NOT NULL,
  top_load_added_kg       REAL NOT NULL,
  top_reps                INTEGER NOT NULL,
  estimated_1rm_added_kg  REAL NOT NULL,
  notes                   TEXT,
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pullup_date ON pullup_tests(date);

-- ============================================================================
-- CLIMBING ATTEMPTS — per-route log on climb days
-- ============================================================================
CREATE TABLE IF NOT EXISTS climbing_attempts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  route_name      TEXT,
  grade           TEXT NOT NULL,
  style           TEXT NOT NULL CHECK (style IN ('onsight', 'flash', 'redpoint', 'repeat', 'attempt', 'project')),
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_climbing_session ON climbing_attempts(session_id);

-- ============================================================================
-- RUNNING LOGS — for Friday easy runs + ad-hoc cardio
-- ============================================================================
CREATE TABLE IF NOT EXISTS running_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  date            TEXT NOT NULL,
  distance_km     REAL NOT NULL,
  duration_min    REAL NOT NULL,
  pace_min_per_km REAL,                        -- computed: duration / distance
  surface         TEXT,                        -- 'trail' | 'road' | 'treadmill' | other free-text
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_running_session ON running_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_running_date ON running_logs(date);

-- ============================================================================
-- TRIGGERS — keep updated_at fresh on sessions
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS sessions_updated_at
  AFTER UPDATE ON sessions
  FOR EACH ROW
  WHEN OLD.updated_at = NEW.updated_at OR NEW.updated_at IS NULL
BEGIN
  UPDATE sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;
