import type { Sql } from '$lib/db';
import type {
  Session,
  SessionWithPhase,
  Phase,
  TindeqTest,
  PullupTest,
  Exercise,
  ExerciseSet,
  ClimbingAttempt,
  ClimbStyle,
  RunningLog
} from '$lib/domain/types';
import type { NutritionEntry, NutritionItem, NutritionProfile } from '$lib/domain/nutrition';
import { PROFILE_DEFAULTS } from '$lib/domain/nutrition';

// ---------- Boolean coercion helpers ----------
// Postgres returns native booleans for boolean columns; the rest of the app
// (Svelte components, domain/load.ts) expects 0/1 numbers. Coerce at the query
// layer so the data contract stays stable.

function coerceBool(v: unknown): number {
  return v === true || v === 1 || v === '1' ? 1 : 0;
}

function coerceSession<T extends { completed?: unknown; scheduled?: unknown }>(row: T): T {
  if (row && typeof row === 'object') {
    if ('completed' in row) (row as { completed: number }).completed = coerceBool(row.completed);
    if ('scheduled' in row) (row as { scheduled: number }).scheduled = coerceBool(row.scheduled);
  }
  return row;
}

function coerceSet<T extends { completed?: unknown }>(row: T): T {
  if (row && typeof row === 'object' && 'completed' in row) {
    (row as { completed: number }).completed = coerceBool(row.completed);
  }
  return row;
}

// ---------- Phases ----------

export async function getAllPhases(sql: Sql, userId: string): Promise<Phase[]> {
  const rows = await sql<Phase[]>`
    SELECT * FROM phases
    WHERE user_id = ${userId}
    ORDER BY mesocycle_num ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function getPhaseForDate(sql: Sql, userId: string, date: string): Promise<Phase | null> {
  const rows = await sql<Phase[]>`
    SELECT * FROM phases
    WHERE user_id = ${userId}
      AND start_date <= ${date}
      AND end_date >= ${date}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ---------- Sessions ----------

export async function getSessionsInRange(
  sql: Sql,
  userId: string,
  startDate: string,
  endDate: string
): Promise<SessionWithPhase[]> {
  const rows = await sql<SessionWithPhase[]>`
    SELECT s.*,
           p.name          AS phase_name,
           p.short_name    AS phase_short_name,
           p.mesocycle_num AS phase_mesocycle_num
    FROM sessions s
    LEFT JOIN phases p ON p.id = s.phase_id
    WHERE s.user_id = ${userId}
      AND s.date BETWEEN ${startDate} AND ${endDate}
    ORDER BY s.date ASC, s.id ASC
  `;
  return rows.map(coerceSession);
}

export async function getSessionByDate(
  sql: Sql,
  userId: string,
  date: string
): Promise<SessionWithPhase | null> {
  const rows = await sql<SessionWithPhase[]>`
    SELECT s.*,
           p.name          AS phase_name,
           p.short_name    AS phase_short_name,
           p.mesocycle_num AS phase_mesocycle_num
    FROM sessions s
    LEFT JOIN phases p ON p.id = s.phase_id
    WHERE s.user_id = ${userId}
      AND s.date = ${date}
    ORDER BY s.id ASC
    LIMIT 1
  `;
  return rows[0] ? coerceSession(rows[0]) : null;
}

export async function getSessionById(
  sql: Sql,
  userId: string,
  id: number
): Promise<SessionWithPhase | null> {
  const rows = await sql<SessionWithPhase[]>`
    SELECT s.*,
           p.name          AS phase_name,
           p.short_name    AS phase_short_name,
           p.mesocycle_num AS phase_mesocycle_num
    FROM sessions s
    LEFT JOIN phases p ON p.id = s.phase_id
    WHERE s.id = ${id}
      AND s.user_id = ${userId}
  `;
  return rows[0] ? coerceSession(rows[0]) : null;
}

// ---------- Exercises + sets ----------

export async function getExercisesForSession(
  sql: Sql,
  userId: string,
  sessionId: number
): Promise<Exercise[]> {
  const rows = await sql<Exercise[]>`
    SELECT e.* FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE e.session_id = ${sessionId}
      AND s.user_id = ${userId}
    ORDER BY e.display_order ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function getSetsForExercise(
  sql: Sql,
  userId: string,
  exerciseId: number
): Promise<ExerciseSet[]> {
  const rows = await sql<ExerciseSet[]>`
    SELECT es.* FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    JOIN sessions s ON s.id = e.session_id
    WHERE es.exercise_id = ${exerciseId}
      AND s.user_id = ${userId}
    ORDER BY es.set_num ASC
  `;
  return rows.map(coerceSet);
}

export interface ExerciseWithSets extends Exercise {
  sets: ExerciseSet[];
}

export async function getSessionPrescription(
  sql: Sql,
  userId: string,
  sessionId: number
): Promise<ExerciseWithSets[]> {
  const exercises = await getExercisesForSession(sql, userId, sessionId);
  const out: ExerciseWithSets[] = [];
  for (const ex of exercises) {
    const sets = await getSetsForExercise(sql, userId, ex.id);
    out.push({ ...ex, sets });
  }
  return out;
}

// ---------- Mutations ----------

export async function toggleSetCompleted(sql: Sql, userId: string, setId: number): Promise<void> {
  const result = await sql`
    UPDATE exercise_sets
    SET completed = NOT completed
    WHERE id = ${setId}
      AND exercise_id IN (
        SELECT e.id FROM exercises e
        JOIN sessions s ON s.id = e.session_id
        WHERE s.user_id = ${userId}
      )
  `;
  if (result.count === 0) throw new Error('set not found or not owned by user');
}

/**
 * Recompute session.completed based on whether every set in the session is done.
 * Returns the new completed value (0 or 1) for parity with the old API.
 */
export async function recomputeSessionCompletion(
  sql: Sql,
  userId: string,
  sessionId: number
): Promise<number> {
  const owns = await sql<{ id: number }[]>`
    SELECT id FROM sessions WHERE id = ${sessionId} AND user_id = ${userId}
  `;
  if (owns.length === 0) throw new Error('session not found or not owned by user');

  const rows = await sql<{ total: number; done: number }[]>`
    SELECT
      COUNT(es.id)::int AS total,
      COALESCE(SUM(CASE WHEN es.completed THEN 1 ELSE 0 END), 0)::int AS done
    FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    WHERE e.session_id = ${sessionId}
  `;
  const total = Number(rows[0]?.total ?? 0);
  const done = Number(rows[0]?.done ?? 0);
  const completed = total > 0 && done === total;
  await sql`UPDATE sessions SET completed = ${completed} WHERE id = ${sessionId} AND user_id = ${userId}`;
  return completed ? 1 : 0;
}

export async function getSessionIdFromSetId(
  sql: Sql,
  userId: string,
  setId: number
): Promise<number | null> {
  const rows = await sql<{ session_id: number }[]>`
    SELECT e.session_id FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    JOIN sessions s ON s.id = e.session_id
    WHERE es.id = ${setId}
      AND s.user_id = ${userId}
  `;
  return rows[0]?.session_id ?? null;
}

export async function markAllSetsInExercise(
  sql: Sql,
  userId: string,
  exerciseId: number,
  completed: 0 | 1
): Promise<void> {
  const result = await sql`
    UPDATE exercise_sets
    SET completed = ${completed === 1}
    WHERE exercise_id = ${exerciseId}
      AND exercise_id IN (
        SELECT e.id FROM exercises e
        JOIN sessions s ON s.id = e.session_id
        WHERE s.user_id = ${userId}
      )
  `;
  // No throw if zero — exercise may legitimately have no sets to update.
  void result;
}

export async function updateExerciseNotes(
  sql: Sql,
  userId: string,
  exerciseId: number,
  notes: string | null
): Promise<void> {
  const result = await sql`
    UPDATE exercises
    SET athlete_notes = ${notes}
    WHERE id = ${exerciseId}
      AND session_id IN (SELECT id FROM sessions WHERE user_id = ${userId})
  `;
  if (result.count === 0) throw new Error('exercise not found or not owned by user');
}

// ---------- Ad-hoc mutations: exercises and sets ----------

export async function insertExercise(
  sql: Sql,
  userId: string,
  sessionId: number,
  name: string,
  notes: string | null
): Promise<number> {
  // Verify the session belongs to the user
  const owns = await sql<{ id: number }[]>`
    SELECT id FROM sessions WHERE id = ${sessionId} AND user_id = ${userId}
  `;
  if (owns.length === 0) throw new Error('session not found or not owned by user');

  const maxRow = await sql<{ max_order: number | null }[]>`
    SELECT MAX(display_order) AS max_order FROM exercises WHERE session_id = ${sessionId}
  `;
  const order = (maxRow[0]?.max_order ?? 0) + 1;

  const inserted = await sql<{ id: number }[]>`
    INSERT INTO exercises (session_id, name, display_order, notes)
    VALUES (${sessionId}, ${name}, ${order}, ${notes})
    RETURNING id
  `;
  return Number(inserted[0].id);
}

export async function deleteExercise(
  sql: Sql,
  userId: string,
  exerciseId: number
): Promise<void> {
  const result = await sql`
    DELETE FROM exercises
    WHERE id = ${exerciseId}
      AND session_id IN (SELECT id FROM sessions WHERE user_id = ${userId})
  `;
  if (result.count === 0) throw new Error('exercise not found or not owned by user');
}

export async function insertSet(
  sql: Sql,
  userId: string,
  exerciseId: number,
  fields: {
    kind?: 'warmup' | 'work' | 'backoff' | 'checklist';
    label?: string | null;
    reps?: number | null;
    load_kg?: number | null;
    load_kg_added?: number | null;
    hold_seconds?: number | null;
    rest_seconds?: number | null;
  } = {}
): Promise<number> {
  // Verify exercise belongs to user
  const owns = await sql<{ id: number }[]>`
    SELECT e.id FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE e.id = ${exerciseId} AND s.user_id = ${userId}
  `;
  if (owns.length === 0) throw new Error('exercise not found or not owned by user');

  const maxRow = await sql<{ max_num: number | null }[]>`
    SELECT MAX(set_num) AS max_num FROM exercise_sets WHERE exercise_id = ${exerciseId}
  `;
  const num = (maxRow[0]?.max_num ?? 0) + 1;

  const inserted = await sql<{ id: number }[]>`
    INSERT INTO exercise_sets
      (exercise_id, set_num, kind, label, reps, load_kg, load_kg_added, hold_seconds, rest_seconds)
    VALUES (
      ${exerciseId},
      ${num},
      ${fields.kind ?? 'work'},
      ${fields.label ?? null},
      ${fields.reps ?? null},
      ${fields.load_kg ?? null},
      ${fields.load_kg_added ?? null},
      ${fields.hold_seconds ?? null},
      ${fields.rest_seconds ?? null}
    )
    RETURNING id
  `;
  return Number(inserted[0].id);
}

export async function deleteSet(sql: Sql, userId: string, setId: number): Promise<void> {
  const result = await sql`
    DELETE FROM exercise_sets
    WHERE id = ${setId}
      AND exercise_id IN (
        SELECT e.id FROM exercises e
        JOIN sessions s ON s.id = e.session_id
        WHERE s.user_id = ${userId}
      )
  `;
  if (result.count === 0) throw new Error('set not found or not owned by user');
}

export async function getLastSetForExercise(
  sql: Sql,
  userId: string,
  exerciseId: number
): Promise<ExerciseSet | null> {
  const rows = await sql<ExerciseSet[]>`
    SELECT es.* FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    JOIN sessions s ON s.id = e.session_id
    WHERE es.exercise_id = ${exerciseId}
      AND s.user_id = ${userId}
      AND es.kind = 'work'
    ORDER BY es.set_num DESC
    LIMIT 1
  `;
  return rows[0] ? coerceSet(rows[0]) : null;
}

export async function getAllSetsForSession(
  sql: Sql,
  userId: string,
  sessionId: number
): Promise<ExerciseSet[]> {
  const rows = await sql<ExerciseSet[]>`
    SELECT es.* FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    JOIN sessions s ON s.id = e.session_id
    WHERE e.session_id = ${sessionId}
      AND s.user_id = ${userId}
  `;
  return rows.map(coerceSet);
}

// ---------- Exercise drill-down ----------

export interface ExerciseInstance {
  exercise_id: number;
  session_id: number;
  session_date: string;
  session_completed: number;
  phase_short_name: string | null;
  athlete_notes: string | null;
  prescription_notes: string | null;
  sets: ExerciseSet[];
  top_set: ExerciseSet | null;
}

/** Every appearance of an exercise (by name) across the macrocycle, oldest first. */
export async function getExerciseInstancesByName(
  sql: Sql,
  userId: string,
  name: string
): Promise<ExerciseInstance[]> {
  const rows = await sql<{
    exercise_id: number;
    session_id: number;
    session_date: string;
    session_completed: unknown;
    phase_short_name: string | null;
    athlete_notes: string | null;
    prescription_notes: string | null;
  }[]>`
    SELECT e.id          AS exercise_id,
           s.id          AS session_id,
           s.date        AS session_date,
           s.completed   AS session_completed,
           p.short_name  AS phase_short_name,
           e.athlete_notes AS athlete_notes,
           e.notes       AS prescription_notes
    FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    LEFT JOIN phases p ON p.id = s.phase_id
    WHERE e.name = ${name}
      AND s.user_id = ${userId}
    ORDER BY s.date ASC, s.id ASC
  `;

  // Was: 2 sequential queries per instance row inside a for-loop. With ~5
  // instances per exercise that's 10 sequential RTTs; the PR page calls this
  // for every exercise (30+), compounding into 300+ serial round-trips.
  // Now: fire both inner queries in parallel, all rows in parallel.
  const fetched = await Promise.all(
    rows.map(async (r) => {
      const [sets, top] = await Promise.all([
        getSetsForExercise(sql, userId, r.exercise_id),
        topWorkSet(sql, r.exercise_id)
      ]);
      return { r, sets, top };
    })
  );
  return fetched.map(({ r, sets, top }) => ({
    exercise_id: r.exercise_id,
    session_id: r.session_id,
    session_date: r.session_date,
    session_completed: coerceBool(r.session_completed),
    phase_short_name: r.phase_short_name,
    athlete_notes: r.athlete_notes,
    prescription_notes: r.prescription_notes,
    sets,
    top_set: top
  }));
}

export async function getDistinctExerciseNames(sql: Sql, userId: string): Promise<string[]> {
  const rows = await sql<{ name: string }[]>`
    SELECT DISTINCT e.name FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE s.user_id = ${userId}
    ORDER BY e.name ASC
  `;
  return rows.map((r) => r.name);
}

export interface ExerciseIndexRow {
  name: string;
  instances: number;
  completed: number;
  first_date: string;
  last_date: string;
}

// ---------- Free-session creation ----------

/** Create a new ad-hoc (unscheduled) session and return its id. */
export async function createFreeSession(
  sql: Sql,
  userId: string,
  args: {
    date: string;
    type: string;
    title: string | null;
    phaseId: number | null;
  }
): Promise<number> {
  const inserted = await sql<{ id: number }[]>`
    INSERT INTO sessions (user_id, date, phase_id, type, title, scheduled, completed)
    VALUES (${userId}, ${args.date}, ${args.phaseId}, ${args.type}, ${args.title}, false, false)
    RETURNING id
  `;
  return Number(inserted[0].id);
}

/** Returns ALL sessions for a given date, in id order. */
export async function getSessionsForDate(
  sql: Sql,
  userId: string,
  date: string
): Promise<SessionWithPhase[]> {
  const rows = await sql<SessionWithPhase[]>`
    SELECT s.*,
           p.name          AS phase_name,
           p.short_name    AS phase_short_name,
           p.mesocycle_num AS phase_mesocycle_num
    FROM sessions s
    LEFT JOIN phases p ON p.id = s.phase_id
    WHERE s.user_id = ${userId}
      AND s.date = ${date}
    ORDER BY s.scheduled DESC, s.id ASC
  `;
  return rows.map(coerceSession);
}

export async function getExerciseIndex(sql: Sql, userId: string): Promise<ExerciseIndexRow[]> {
  const rows = await sql<{
    name: string;
    instances: number;
    completed: number;
    first_date: string;
    last_date: string;
  }[]>`
    SELECT
      e.name                                                       AS name,
      COUNT(DISTINCT e.id)::int                                    AS instances,
      SUM(CASE WHEN s.completed THEN 1 ELSE 0 END)::int            AS completed,
      MIN(s.date)::text                                            AS first_date,
      MAX(s.date)::text                                            AS last_date
    FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE s.user_id = ${userId}
    GROUP BY e.name
    ORDER BY e.name ASC
  `;
  return rows.map((r) => ({
    name: r.name,
    instances: Number(r.instances),
    completed: Number(r.completed),
    first_date: r.first_date,
    last_date: r.last_date
  }));
}

export async function updateSetField(
  sql: Sql,
  userId: string,
  setId: number,
  field: 'reps' | 'load_kg' | 'load_kg_added' | 'hold_seconds' | 'rpe' | 'notes',
  value: number | string | null
): Promise<void> {
  const allowed = ['reps', 'load_kg', 'load_kg_added', 'hold_seconds', 'rpe', 'notes'];
  if (!allowed.includes(field)) throw new Error('invalid field');
  const result = await sql.unsafe(
    `UPDATE exercise_sets SET ${field} = $1
     WHERE id = $2
       AND exercise_id IN (
         SELECT e.id FROM exercises e
         JOIN sessions s ON s.id = e.session_id
         WHERE s.user_id = $3
       )`,
    [value, setId, userId]
  );
  if (result.count === 0) throw new Error('set not found or not owned by user');
}

// ---------- Sessions with set counts ----------

export interface SessionWithCounts extends SessionWithPhase {
  sets_total: number;
  sets_completed: number;
}

export async function getSessionsInRangeWithCounts(
  sql: Sql,
  userId: string,
  startDate: string,
  endDate: string
): Promise<SessionWithCounts[]> {
  const rows = await sql<SessionWithCounts[]>`
    SELECT s.*,
           p.name          AS phase_name,
           p.short_name    AS phase_short_name,
           p.mesocycle_num AS phase_mesocycle_num,
           COALESCE(c.sets_total, 0)::int     AS sets_total,
           COALESCE(c.sets_completed, 0)::int AS sets_completed
    FROM sessions s
    LEFT JOIN phases p ON p.id = s.phase_id
    LEFT JOIN (
      SELECT e.session_id,
             COUNT(es.id)::int AS sets_total,
             SUM(CASE WHEN es.completed THEN 1 ELSE 0 END)::int AS sets_completed
      FROM exercise_sets es
      JOIN exercises e ON e.id = es.exercise_id
      GROUP BY e.session_id
    ) c ON c.session_id = s.id
    WHERE s.user_id = ${userId}
      AND s.date BETWEEN ${startDate} AND ${endDate}
    ORDER BY s.date ASC, s.id ASC
  `;
  return rows.map((r) => {
    const coerced = coerceSession(r);
    coerced.sets_total = Number(coerced.sets_total);
    coerced.sets_completed = Number(coerced.sets_completed);
    return coerced;
  });
}

// ---------- Phase progress ----------

export interface PhaseProgress {
  sessions_total: number;
  sessions_completed: number;
  sets_total: number;
  sets_completed: number;
}

export async function getPhaseProgress(
  sql: Sql,
  userId: string,
  phaseId: number
): Promise<PhaseProgress> {
  const rows = await sql<PhaseProgress[]>`
    SELECT
      (SELECT COUNT(*)::int FROM sessions WHERE phase_id = ${phaseId} AND user_id = ${userId})                                      AS sessions_total,
      (SELECT COUNT(*)::int FROM sessions WHERE phase_id = ${phaseId} AND user_id = ${userId} AND completed)                        AS sessions_completed,
      (SELECT COUNT(es.id)::int
         FROM exercise_sets es JOIN exercises e ON e.id = es.exercise_id
         JOIN sessions s ON s.id = e.session_id WHERE s.phase_id = ${phaseId} AND s.user_id = ${userId})                            AS sets_total,
      (SELECT COUNT(es.id)::int
         FROM exercise_sets es JOIN exercises e ON e.id = es.exercise_id
         JOIN sessions s ON s.id = e.session_id WHERE s.phase_id = ${phaseId} AND s.user_id = ${userId} AND es.completed)           AS sets_completed
  `;
  const row = rows[0];
  return row
    ? {
        sessions_total: Number(row.sessions_total),
        sessions_completed: Number(row.sessions_completed),
        sets_total: Number(row.sets_total),
        sets_completed: Number(row.sets_completed)
      }
    : { sessions_total: 0, sessions_completed: 0, sets_total: 0, sets_completed: 0 };
}

// ---------- Body-weight history ----------

export interface BodyweightPoint {
  date: string;
  body_weight_kg: number;
  // null for sessionless daily_check_ins rows (no session to link back to).
  // Consumers keying off this id must fall back to `date` for those rows.
  session_id: number | null;
}

/**
 * Body weight is logged primarily on sessions, but baseline / test records
 * also carry it. The chart reads a deduplicated union so pre-plan baselines
 * still appear.
 */
export async function getBodyweightHistory(sql: Sql, userId: string): Promise<BodyweightPoint[]> {
  const fromSessions = await sql<BodyweightPoint[]>`
    SELECT date::text, body_weight_kg, id AS session_id
    FROM sessions
    WHERE user_id = ${userId}
      AND body_weight_kg IS NOT NULL
  `;

  const fromPullup = await sql<BodyweightPoint[]>`
    SELECT date::text, body_weight_kg, COALESCE(session_id, -id) AS session_id
    FROM pullup_tests
    WHERE user_id = ${userId}
  `;

  const fromTindeq = await sql<BodyweightPoint[]>`
    SELECT date::text, body_weight_kg, COALESCE(session_id, -id) AS session_id
    FROM tindeq_tests
    WHERE user_id = ${userId}
      AND body_weight_kg IS NOT NULL
  `;

  // Sessionless daily check-ins. session_id is NULL (no session to link back
  // to). Using NULL — not a sentinel like -1 — keeps the field unique-by-date
  // and prevents `{#each ... (p.id)}` collisions when multiple check-ins
  // appear in the same series.
  const fromCheckIns = await sql<BodyweightPoint[]>`
    SELECT date::text, body_weight_kg, NULL::int AS session_id
    FROM daily_check_ins
    WHERE user_id = ${userId}
      AND body_weight_kg IS NOT NULL
  `;

  const byDate = new Map<string, BodyweightPoint>();
  // Apply in priority order: tindeq < pullup < check-in < session, so sessions win
  // when both exist for a day. Check-ins are the canonical daily surface so they
  // take precedence over test-derived weights.
  const norm = (p: BodyweightPoint): BodyweightPoint => ({
    ...p,
    session_id: p.session_id === null ? null : Number(p.session_id)
  });
  for (const p of fromTindeq) byDate.set(p.date, norm(p));
  for (const p of fromPullup) byDate.set(p.date, norm(p));
  for (const p of fromCheckIns) byDate.set(p.date, norm(p));
  for (const p of fromSessions) byDate.set(p.date, norm(p));

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getLatestBodyweight(sql: Sql, userId: string): Promise<BodyweightPoint | null> {
  const history = await getBodyweightHistory(sql, userId);
  return history.length ? history[history.length - 1] : null;
}

export interface SleepPoint {
  date: string;
  sleep_hours: number;
  // null for sessionless daily_check_ins rows.
  session_id: number | null;
}

export async function getSleepHistory(sql: Sql, userId: string): Promise<SleepPoint[]> {
  const fromSessions = await sql<SleepPoint[]>`
    SELECT date::text, sleep_hours, id AS session_id
    FROM sessions
    WHERE user_id = ${userId}
      AND sleep_hours IS NOT NULL
  `;
  const fromCheckIns = await sql<SleepPoint[]>`
    SELECT date::text, sleep_hours, NULL::int AS session_id
    FROM daily_check_ins
    WHERE user_id = ${userId}
      AND sleep_hours IS NOT NULL
  `;
  // Sessions win on collision (training-day sleep is the authoritative number
  // because it was logged in the same flow as the workout).
  const byDate = new Map<string, SleepPoint>();
  for (const p of fromCheckIns) byDate.set(p.date, { ...p, session_id: Number(p.session_id) });
  for (const p of fromSessions) byDate.set(p.date, { ...p, session_id: Number(p.session_id) });
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getLatestSleep(sql: Sql, userId: string): Promise<SleepPoint | null> {
  const history = await getSleepHistory(sql, userId);
  return history.length ? history[history.length - 1] : null;
}

// ---------- Weekly training load ----------

export interface WeeklyLoad {
  week_num: number;
  week_start: string;
  phase_short_name: string | null;
  sessions_total: number;
  sessions_completed: number;
  sets_total: number;
  sets_completed: number;
  tonnage_kg: number;
  isometric_seconds: number;
}

const MACROCYCLE_START = '2026-06-10';

export async function getWeeklyLoad(sql: Sql, userId: string): Promise<WeeklyLoad[]> {
  const rows = await sql<{
    date: string;
    completed: unknown;
    sets_total: number;
    sets_completed: number;
    phase_short_name: string | null;
  }[]>`
    SELECT
      s.date::text                                                AS date,
      s.completed                                                 AS completed,
      COALESCE(c.sets_total, 0)::int     AS sets_total,
      COALESCE(c.sets_completed, 0)::int AS sets_completed,
      p.short_name                                                AS phase_short_name
    FROM sessions s
    LEFT JOIN phases p ON p.id = s.phase_id
    LEFT JOIN (
      SELECT e.session_id,
             COUNT(es.id)::int AS sets_total,
             SUM(CASE WHEN es.completed THEN 1 ELSE 0 END)::int AS sets_completed
      FROM exercise_sets es
      JOIN exercises e ON e.id = es.exercise_id
      GROUP BY e.session_id
    ) c ON c.session_id = s.id
    WHERE s.user_id = ${userId}
      AND s.date BETWEEN ${MACROCYCLE_START} AND ${'2026-08-30'}
    ORDER BY s.date ASC
  `;

  // bucket into 12 weeks starting from MACROCYCLE_START
  const buckets = new Map<number, WeeklyLoad>();
  for (let w = 0; w < 12; w++) {
    const [y, m, d] = MACROCYCLE_START.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d));
    start.setUTCDate(start.getUTCDate() + w * 7);
    buckets.set(w + 1, {
      week_num: w + 1,
      week_start: start.toISOString().slice(0, 10),
      phase_short_name: null,
      sessions_total: 0,
      sessions_completed: 0,
      sets_total: 0,
      sets_completed: 0,
      tonnage_kg: 0,
      isometric_seconds: 0
    });
  }

  // Roll up tonnage from completed work sets across all sessions
  const tonnageRows = await sql<{
    session_date: string;
    reps: number | null;
    load_kg: number | null;
    load_kg_added: number | null;
    hold_seconds: number | null;
    body_weight_kg: number | null;
  }[]>`
    SELECT s.date::text AS session_date,
           es.reps, es.load_kg, es.load_kg_added, es.hold_seconds,
           s.body_weight_kg
    FROM exercise_sets es
    JOIN exercises e ON e.id = es.exercise_id
    JOIN sessions s ON s.id = e.session_id
    WHERE s.user_id = ${userId}
      AND es.kind = 'work'
      AND es.completed = true
      AND s.date BETWEEN ${MACROCYCLE_START} AND ${'2026-08-30'}
  `;

  function weekIdxFor(date: string): number {
    const [y, m, d] = date.split('-').map(Number);
    const [ys, ms, ds] = MACROCYCLE_START.split('-').map(Number);
    const rD = Date.UTC(y, m - 1, d);
    const sD = Date.UTC(ys, ms - 1, ds);
    const dayIdx = Math.floor((rD - sD) / (1000 * 60 * 60 * 24));
    return Math.floor(dayIdx / 7) + 1;
  }

  for (const r of rows) {
    const weekIdx = weekIdxFor(r.date);
    const bucket = buckets.get(weekIdx);
    if (!bucket) continue;
    bucket.sessions_total += 1;
    bucket.sessions_completed += coerceBool(r.completed) === 1 ? 1 : 0;
    bucket.sets_total += Number(r.sets_total);
    bucket.sets_completed += Number(r.sets_completed);
    if (!bucket.phase_short_name) bucket.phase_short_name = r.phase_short_name;
  }

  // Add tonnage rollup
  const FALLBACK_BW = 82;
  for (const t of tonnageRows) {
    const bucket = buckets.get(weekIdxFor(t.session_date));
    if (!bucket) continue;
    const bw = t.body_weight_kg ?? FALLBACK_BW;
    if (t.reps !== null && t.reps > 0) {
      if (t.load_kg_added !== null) bucket.tonnage_kg += (bw + t.load_kg_added) * t.reps;
      else if (t.load_kg !== null) bucket.tonnage_kg += t.load_kg * t.reps;
    }
    if (t.hold_seconds !== null && t.hold_seconds > 0) {
      bucket.isometric_seconds += t.hold_seconds * (t.reps ?? 1);
    }
  }

  for (const b of buckets.values()) b.tonnage_kg = Math.round(b.tonnage_kg);

  return Array.from(buckets.values());
}

// ---------- Climbing attempts ----------

export async function getClimbingAttempts(
  sql: Sql,
  userId: string,
  sessionId: number
): Promise<ClimbingAttempt[]> {
  const rows = await sql<ClimbingAttempt[]>`
    SELECT ca.* FROM climbing_attempts ca
    JOIN sessions s ON s.id = ca.session_id
    WHERE ca.session_id = ${sessionId}
      AND s.user_id = ${userId}
    ORDER BY ca.id ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function insertClimbingAttempt(
  sql: Sql,
  userId: string,
  row: {
    session_id: number;
    route_name: string | null;
    grade: string;
    style: ClimbStyle;
    notes: string | null;
  }
): Promise<number> {
  const owns = await sql<{ id: number }[]>`
    SELECT id FROM sessions WHERE id = ${row.session_id} AND user_id = ${userId}
  `;
  if (owns.length === 0) throw new Error('session not found or not owned by user');

  const inserted = await sql<{ id: number }[]>`
    INSERT INTO climbing_attempts (session_id, route_name, grade, style, notes)
    VALUES (${row.session_id}, ${row.route_name}, ${row.grade}, ${row.style}, ${row.notes})
    RETURNING id
  `;
  return Number(inserted[0].id);
}

export async function deleteClimbingAttempt(
  sql: Sql,
  userId: string,
  id: number
): Promise<void> {
  const result = await sql`
    DELETE FROM climbing_attempts
    WHERE id = ${id}
      AND session_id IN (SELECT id FROM sessions WHERE user_id = ${userId})
  `;
  if (result.count === 0) throw new Error('climbing attempt not found or not owned by user');
}

export async function getAllSessionsWithCounts(
  sql: Sql,
  userId: string
): Promise<SessionWithCounts[]> {
  return getSessionsInRangeWithCounts(sql, userId, '2026-01-01', '2026-12-31');
}

// ---------- Running logs ----------

export async function getRunningLogsForSession(
  sql: Sql,
  userId: string,
  sessionId: number
): Promise<RunningLog[]> {
  const rows = await sql<RunningLog[]>`
    SELECT * FROM running_logs
    WHERE session_id = ${sessionId}
      AND user_id = ${userId}
    ORDER BY id ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function getAllRunningLogs(sql: Sql, userId: string): Promise<RunningLog[]> {
  const rows = await sql<RunningLog[]>`
    SELECT * FROM running_logs
    WHERE user_id = ${userId}
    ORDER BY date ASC, id ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function insertRunningLog(
  sql: Sql,
  userId: string,
  row: {
    session_id: number | null;
    date: string;
    distance_km: number;
    duration_min: number;
    surface: string | null;
    notes: string | null;
  }
): Promise<number> {
  // If session_id provided, verify ownership
  if (row.session_id !== null) {
    const owns = await sql<{ id: number }[]>`
      SELECT id FROM sessions WHERE id = ${row.session_id} AND user_id = ${userId}
    `;
    if (owns.length === 0) throw new Error('session not found or not owned by user');
  }

  const pace =
    row.distance_km > 0 ? Math.round((row.duration_min / row.distance_km) * 100) / 100 : null;

  const inserted = await sql<{ id: number }[]>`
    INSERT INTO running_logs
      (user_id, session_id, date, distance_km, duration_min, pace_min_per_km, surface, notes)
    VALUES (
      ${userId}, ${row.session_id}, ${row.date}, ${row.distance_km}, ${row.duration_min},
      ${pace}, ${row.surface}, ${row.notes}
    )
    RETURNING id
  `;
  return Number(inserted[0].id);
}

export async function deleteRunningLog(sql: Sql, userId: string, id: number): Promise<void> {
  const result = await sql`
    DELETE FROM running_logs WHERE id = ${id} AND user_id = ${userId}
  `;
  if (result.count === 0) throw new Error('running log not found or not owned by user');
}

export async function getLatestRun(sql: Sql, userId: string): Promise<RunningLog | null> {
  const rows = await sql<RunningLog[]>`
    SELECT * FROM running_logs
    WHERE user_id = ${userId}
    ORDER BY date DESC, id DESC LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getAllClimbingAttempts(
  sql: Sql,
  userId: string
): Promise<Array<ClimbingAttempt & { date: string }>> {
  const rows = await sql<(ClimbingAttempt & { date: string })[]>`
    SELECT ca.*, s.date::text AS date
    FROM climbing_attempts ca
    JOIN sessions s ON s.id = ca.session_id
    WHERE s.user_id = ${userId}
    ORDER BY s.date ASC, ca.id ASC
  `;
  return rows.map((r) => ({ ...r }));
}

// ---------- Exercise context (prev / next instance) ----------

export interface ExerciseSnapshot {
  session_id: number;
  session_date: string;
  exercise_id: number;
  top_set: ExerciseSet | null;
  work_set_count: number;
  any_completed: boolean;
}

export interface ExerciseContext {
  previous: ExerciseSnapshot | null;
  next: ExerciseSnapshot | null;
}

/** Pick the heaviest work set for an exercise. */
async function topWorkSet(sql: Sql, exerciseId: number): Promise<ExerciseSet | null> {
  const rows = await sql<ExerciseSet[]>`
    SELECT * FROM exercise_sets
    WHERE exercise_id = ${exerciseId} AND kind = 'work'
    ORDER BY
      CASE WHEN load_kg_added IS NULL THEN 1 ELSE 0 END,
      load_kg_added DESC NULLS LAST,
      CASE WHEN load_kg IS NULL THEN 1 ELSE 0 END,
      load_kg DESC NULLS LAST,
      CASE WHEN hold_seconds IS NULL THEN 1 ELSE 0 END,
      hold_seconds DESC NULLS LAST,
      set_num ASC
    LIMIT 1
  `;
  return rows[0] ? coerceSet(rows[0]) : null;
}

async function snapshotFor(
  sql: Sql,
  exerciseId: number,
  sessionId: number,
  sessionDate: string
): Promise<ExerciseSnapshot> {
  const rows = await sql<{ work_set_count: number; any_completed: number }[]>`
    SELECT
      COALESCE(SUM(CASE WHEN kind = 'work' THEN 1 ELSE 0 END), 0)::int AS work_set_count,
      COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)::int     AS any_completed
    FROM exercise_sets WHERE exercise_id = ${exerciseId}
  `;
  const counts = rows[0];
  const top = await topWorkSet(sql, exerciseId);
  return {
    session_id: sessionId,
    session_date: sessionDate,
    exercise_id: exerciseId,
    top_set: top,
    work_set_count: Number(counts?.work_set_count ?? 0),
    any_completed: Number(counts?.any_completed ?? 0) > 0
  };
}

export async function getExerciseContext(
  sql: Sql,
  userId: string,
  currentSessionDate: string,
  currentSessionId: number,
  exerciseName: string
): Promise<ExerciseContext> {
  const prevRows = await sql<{ session_id: number; session_date: string; exercise_id: number }[]>`
    SELECT s.id AS session_id, s.date::text AS session_date, e.id AS exercise_id
    FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE e.name = ${exerciseName}
      AND s.user_id = ${userId}
      AND (s.date < ${currentSessionDate}
           OR (s.date = ${currentSessionDate} AND s.id < ${currentSessionId}))
      AND EXISTS (
        SELECT 1 FROM exercise_sets es WHERE es.exercise_id = e.id AND es.completed = true
      )
    ORDER BY s.date DESC, s.id DESC
    LIMIT 1
  `;

  const nextRows = await sql<{ session_id: number; session_date: string; exercise_id: number }[]>`
    SELECT s.id AS session_id, s.date::text AS session_date, e.id AS exercise_id
    FROM exercises e
    JOIN sessions s ON s.id = e.session_id
    WHERE e.name = ${exerciseName}
      AND s.user_id = ${userId}
      AND (s.date > ${currentSessionDate}
           OR (s.date = ${currentSessionDate} AND s.id > ${currentSessionId}))
      AND s.date <= ${'2026-08-30'}
    ORDER BY s.date ASC, s.id ASC
    LIMIT 1
  `;

  const previous = prevRows[0]
    ? await snapshotFor(sql, prevRows[0].exercise_id, prevRows[0].session_id, prevRows[0].session_date)
    : null;
  const next = nextRows[0]
    ? await snapshotFor(sql, nextRows[0].exercise_id, nextRows[0].session_id, nextRows[0].session_date)
    : null;

  return { previous, next };
}

// ---------- Inserts: test records ----------

export async function insertTindeqTest(
  sql: Sql,
  userId: string,
  row: {
    session_id: number | null;
    date: string;
    hand: 'L' | 'R';
    edge_mm: number;
    grip_position: 'half-crimp' | 'open-hand' | 'full-crimp' | 'sloper' | 'pinch';
    peak_force_kg: number;
    body_weight_kg: number | null;
    notes: string | null;
  }
): Promise<number> {
  if (row.session_id !== null) {
    const owns = await sql<{ id: number }[]>`
      SELECT id FROM sessions WHERE id = ${row.session_id} AND user_id = ${userId}
    `;
    if (owns.length === 0) throw new Error('session not found or not owned by user');
  }
  const inserted = await sql<{ id: number }[]>`
    INSERT INTO tindeq_tests
      (user_id, session_id, date, hand, edge_mm, grip_position, peak_force_kg, body_weight_kg, notes)
    VALUES (
      ${userId}, ${row.session_id}, ${row.date}, ${row.hand}, ${row.edge_mm},
      ${row.grip_position}, ${row.peak_force_kg}, ${row.body_weight_kg}, ${row.notes}
    )
    RETURNING id
  `;
  return Number(inserted[0].id);
}

export async function insertPullupTest(
  sql: Sql,
  userId: string,
  row: {
    session_id: number | null;
    date: string;
    body_weight_kg: number;
    top_load_added_kg: number;
    top_reps: number;
    estimated_1rm_added_kg: number;
    notes: string | null;
  }
): Promise<number> {
  if (row.session_id !== null) {
    const owns = await sql<{ id: number }[]>`
      SELECT id FROM sessions WHERE id = ${row.session_id} AND user_id = ${userId}
    `;
    if (owns.length === 0) throw new Error('session not found or not owned by user');
  }
  const inserted = await sql<{ id: number }[]>`
    INSERT INTO pullup_tests
      (user_id, session_id, date, body_weight_kg, top_load_added_kg, top_reps, estimated_1rm_added_kg, notes)
    VALUES (
      ${userId}, ${row.session_id}, ${row.date}, ${row.body_weight_kg},
      ${row.top_load_added_kg}, ${row.top_reps}, ${row.estimated_1rm_added_kg}, ${row.notes}
    )
    RETURNING id
  `;
  return Number(inserted[0].id);
}

export async function getRecentTindeqTests(
  sql: Sql,
  userId: string,
  hand: 'L' | 'R',
  limit = 5
): Promise<TindeqTest[]> {
  const rows = await sql<TindeqTest[]>`
    SELECT * FROM tindeq_tests
    WHERE user_id = ${userId} AND hand = ${hand}
    ORDER BY date DESC, id DESC LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...r }));
}

export async function updateSessionFields(
  sql: Sql,
  userId: string,
  sessionId: number,
  fields: {
    duration_min?: number | null;
    rpe?: number | null;
    body_weight_kg?: number | null;
    sleep_hours?: number | null;
    readiness?: number | null;
    notes?: string | null;
    completed?: number;
  }
): Promise<void> {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  // Build set clause with positional params. Allowed cols are a closed set.
  const allowed = new Set([
    'duration_min',
    'rpe',
    'body_weight_kg',
    'sleep_hours',
    'readiness',
    'notes',
    'completed'
  ]);
  const params: (number | string | boolean | null)[] = [];
  const fragments: string[] = [];
  let i = 1;
  for (const [k, v] of entries) {
    if (!allowed.has(k)) throw new Error(`invalid field: ${k}`);
    fragments.push(`${k} = $${i++}`);
    if (k === 'completed') {
      // Stored as boolean in Postgres; callers may pass 0/1 number.
      params.push((v as unknown) === 1 || (v as unknown) === true);
    } else {
      params.push(v as number | string | null);
    }
  }
  params.push(sessionId);
  params.push(userId);

  const result = await sql.unsafe(
    `UPDATE sessions SET ${fragments.join(', ')} WHERE id = $${i++} AND user_id = $${i}`,
    params
  );
  if (result.count === 0) throw new Error('session not found or not owned by user');
}

// ---------- Tindeq tests ----------

export async function getAllTindeqTests(sql: Sql, userId: string): Promise<TindeqTest[]> {
  const rows = await sql<TindeqTest[]>`
    SELECT * FROM tindeq_tests
    WHERE user_id = ${userId}
    ORDER BY date ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function getLatestTindeqPerHand(
  sql: Sql,
  userId: string
): Promise<{ L: TindeqTest | null; R: TindeqTest | null }> {
  const Lrows = await sql<TindeqTest[]>`
    SELECT * FROM tindeq_tests
    WHERE user_id = ${userId} AND hand = 'L'
    ORDER BY date DESC, id DESC LIMIT 1
  `;
  const Rrows = await sql<TindeqTest[]>`
    SELECT * FROM tindeq_tests
    WHERE user_id = ${userId} AND hand = 'R'
    ORDER BY date DESC, id DESC LIMIT 1
  `;
  return { L: Lrows[0] ?? null, R: Rrows[0] ?? null };
}

// ---------- Pull-up tests ----------

export async function getAllPullupTests(sql: Sql, userId: string): Promise<PullupTest[]> {
  const rows = await sql<PullupTest[]>`
    SELECT * FROM pullup_tests
    WHERE user_id = ${userId}
    ORDER BY date ASC
  `;
  return rows.map((r) => ({ ...r }));
}

export async function getLatestPullupTest(
  sql: Sql,
  userId: string
): Promise<PullupTest | null> {
  const rows = await sql<PullupTest[]>`
    SELECT * FROM pullup_tests
    WHERE user_id = ${userId}
    ORDER BY date DESC, id DESC LIMIT 1
  `;
  return rows[0] ?? null;
}

// ---------- Helper for layout server: recent sessions for command palette ----------

export interface RecentSessionRow {
  id: number;
  date: string;
  title: string | null;
  type: string;
  completed: number;
}

export async function getRecentSessions(sql: Sql, userId: string): Promise<RecentSessionRow[]> {
  const rows = await sql<{ id: number; date: string; title: string | null; type: string; completed: unknown }[]>`
    SELECT id, date::text AS date, title, type, completed
    FROM sessions
    WHERE user_id = ${userId}
    ORDER BY
      CASE WHEN completed THEN 0 ELSE 1 END,
      date DESC,
      id DESC
    LIMIT 10
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    date: r.date,
    title: r.title,
    type: r.type,
    completed: coerceBool(r.completed)
  }));
}

// ---------- Adjacent session date (prev/next nav) ----------

export async function getAdjacentSessionDate(
  sql: Sql,
  userId: string,
  date: string,
  direction: 'prev' | 'next'
): Promise<string | null> {
  if (direction === 'prev') {
    const rows = await sql<{ date: string }[]>`
      SELECT date::text AS date FROM sessions
      WHERE user_id = ${userId} AND date < ${date}
      ORDER BY date DESC LIMIT 1
    `;
    return rows[0]?.date ?? null;
  }
  const rows = await sql<{ date: string }[]>`
    SELECT date::text AS date FROM sessions
    WHERE user_id = ${userId} AND date > ${date}
    ORDER BY date ASC LIMIT 1
  `;
  return rows[0]?.date ?? null;
}

// ---------- Settings: DB stats (per-user) ----------

export interface UserCounts {
  sessions: number;
  sessions_completed: number;
  exercises: number;
  sets: number;
  sets_completed: number;
  tindeq: number;
  pullup: number;
  climbs: number;
}

export async function getUserCounts(sql: Sql, userId: string): Promise<UserCounts> {
  const rows = await sql<UserCounts[]>`
    SELECT
      (SELECT COUNT(*)::int FROM sessions WHERE user_id = ${userId})                                              AS sessions,
      (SELECT COUNT(*)::int FROM sessions WHERE user_id = ${userId} AND completed)                                AS sessions_completed,
      (SELECT COUNT(*)::int FROM exercises e
         JOIN sessions s ON s.id = e.session_id WHERE s.user_id = ${userId})                                      AS exercises,
      (SELECT COUNT(*)::int FROM exercise_sets es
         JOIN exercises e ON e.id = es.exercise_id
         JOIN sessions s ON s.id = e.session_id WHERE s.user_id = ${userId})                                      AS sets,
      (SELECT COUNT(*)::int FROM exercise_sets es
         JOIN exercises e ON e.id = es.exercise_id
         JOIN sessions s ON s.id = e.session_id WHERE s.user_id = ${userId} AND es.completed)                     AS sets_completed,
      (SELECT COUNT(*)::int FROM tindeq_tests WHERE user_id = ${userId})                                          AS tindeq,
      (SELECT COUNT(*)::int FROM pullup_tests WHERE user_id = ${userId})                                          AS pullup,
      (SELECT COUNT(*)::int FROM climbing_attempts ca
         JOIN sessions s ON s.id = ca.session_id WHERE s.user_id = ${userId})                                     AS climbs
  `;
  const row = rows[0];
  if (!row) {
    return {
      sessions: 0,
      sessions_completed: 0,
      exercises: 0,
      sets: 0,
      sets_completed: 0,
      tindeq: 0,
      pullup: 0,
      climbs: 0
    };
  }
  return {
    sessions: Number(row.sessions),
    sessions_completed: Number(row.sessions_completed),
    exercises: Number(row.exercises),
    sets: Number(row.sets),
    sets_completed: Number(row.sets_completed),
    tindeq: Number(row.tindeq),
    pullup: Number(row.pullup),
    climbs: Number(row.climbs)
  };
}

// ---------- Nutrition ----------

function coerceNutritionEntry(row: Record<string, unknown>): NutritionEntry {
  return {
    id: Number(row.id),
    user_id: String(row.user_id),
    date: String(row.date),
    description: String(row.description),
    calories: Number(row.calories),
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fat_g: Number(row.fat_g),
    items_json: (row.items_json as NutritionItem[] | null) ?? null,
    created_at: String(row.created_at)
  };
}

export async function getNutritionProfile(
  sql: Sql,
  userId: string
): Promise<NutritionProfile | null> {
  const rows = await sql<NutritionProfile[]>`
    SELECT user_id, age, height_cm, sex, default_weight_kg,
           baseline_activity_factor, protein_g_per_kg, calorie_tolerance_pct,
           updated_at
    FROM user_nutrition_profile
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function upsertNutritionProfile(
  sql: Sql,
  userId: string,
  fields: {
    age: number;
    height_cm: number;
    sex?: 'male' | 'female';
    default_weight_kg?: number | null;
    baseline_activity_factor?: number;
    protein_g_per_kg?: number;
    calorie_tolerance_pct?: number;
  }
): Promise<void> {
  await sql`
    INSERT INTO user_nutrition_profile (
      user_id, age, height_cm, sex, default_weight_kg,
      baseline_activity_factor, protein_g_per_kg, calorie_tolerance_pct
    )
    VALUES (
      ${userId}, ${fields.age}, ${fields.height_cm},
      ${fields.sex ?? 'male'}, ${fields.default_weight_kg ?? null},
      ${fields.baseline_activity_factor ?? PROFILE_DEFAULTS.baseline_activity_factor},
      ${fields.protein_g_per_kg ?? PROFILE_DEFAULTS.protein_g_per_kg},
      ${fields.calorie_tolerance_pct ?? PROFILE_DEFAULTS.calorie_tolerance_pct}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      age = EXCLUDED.age,
      height_cm = EXCLUDED.height_cm,
      sex = EXCLUDED.sex,
      default_weight_kg = EXCLUDED.default_weight_kg,
      baseline_activity_factor = EXCLUDED.baseline_activity_factor,
      protein_g_per_kg = EXCLUDED.protein_g_per_kg,
      calorie_tolerance_pct = EXCLUDED.calorie_tolerance_pct,
      updated_at = NOW()
  `;
}

export async function listNutritionEntriesForDate(
  sql: Sql,
  userId: string,
  date: string
): Promise<NutritionEntry[]> {
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM nutrition_entries
    WHERE user_id = ${userId} AND date = ${date}
    ORDER BY created_at ASC, id ASC
  `;
  return rows.map(coerceNutritionEntry);
}

export async function insertNutritionEntry(
  sql: Sql,
  userId: string,
  fields: {
    date: string;
    description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    items_json?: NutritionItem[] | null;
  }
): Promise<NutritionEntry> {
  const itemsJson = fields.items_json ? JSON.stringify(fields.items_json) : null;
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO nutrition_entries (
      user_id, date, description, calories, protein_g, carbs_g, fat_g, items_json
    )
    VALUES (
      ${userId}, ${fields.date}, ${fields.description},
      ${fields.calories}, ${fields.protein_g}, ${fields.carbs_g}, ${fields.fat_g},
      ${itemsJson}::jsonb
    )
    RETURNING *
  `;
  return coerceNutritionEntry(rows[0]);
}

export async function deleteNutritionEntry(
  sql: Sql,
  userId: string,
  entryId: number
): Promise<void> {
  await sql`
    DELETE FROM nutrition_entries
    WHERE id = ${entryId} AND user_id = ${userId}
  `;
}

// Latest body weight on or before a given date — used to compute today's
// protein goal. Falls back to most recent overall if nothing on/before date.
export async function getBodyWeightOnOrBefore(
  sql: Sql,
  userId: string,
  date: string
): Promise<number | null> {
  // Union sessions + daily_check_ins so rest-day weights flow through to
  // the nutrition goal calculation.
  const rows = await sql<{ body_weight_kg: number }[]>`
    SELECT body_weight_kg, date FROM (
      SELECT date, body_weight_kg, id::text AS ordkey FROM sessions
      WHERE user_id = ${userId} AND body_weight_kg IS NOT NULL AND date <= ${date}
      UNION ALL
      SELECT date, body_weight_kg, 'c' AS ordkey FROM daily_check_ins
      WHERE user_id = ${userId} AND body_weight_kg IS NOT NULL AND date <= ${date}
    ) AS combined
    ORDER BY date DESC, ordkey DESC
    LIMIT 1
  `;
  if (rows[0]) return Number(rows[0].body_weight_kg);
  const fallback = await sql<{ body_weight_kg: number }[]>`
    SELECT body_weight_kg FROM sessions
    WHERE user_id = ${userId} AND body_weight_kg IS NOT NULL
    ORDER BY date DESC, id DESC
    LIMIT 1
  `;
  return fallback[0] ? Number(fallback[0].body_weight_kg) : null;
}

// ============================================================================
// Daily check-ins — sessionless per-day capture of weight, sleep, readiness.
// ============================================================================

export interface DailyCheckIn {
  user_id: string;
  date: string;
  body_weight_kg: number | null;
  sleep_hours: number | null;
  readiness: number | null;
  note: string | null;
}

export async function getDailyCheckIn(
  sql: Sql,
  userId: string,
  date: string
): Promise<DailyCheckIn | null> {
  const rows = await sql<Record<string, unknown>[]>`
    SELECT user_id, date::text, body_weight_kg, sleep_hours, readiness, note
    FROM daily_check_ins
    WHERE user_id = ${userId} AND date = ${date}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    user_id: String(r.user_id),
    date: String(r.date),
    body_weight_kg: r.body_weight_kg === null ? null : Number(r.body_weight_kg),
    sleep_hours: r.sleep_hours === null ? null : Number(r.sleep_hours),
    readiness: r.readiness === null ? null : Number(r.readiness),
    note: r.note === null ? null : String(r.note)
  };
}

export async function upsertDailyCheckIn(
  sql: Sql,
  userId: string,
  date: string,
  fields: Partial<Pick<DailyCheckIn, 'body_weight_kg' | 'sleep_hours' | 'readiness' | 'note'>>
): Promise<void> {
  // Only update keys the caller actually provided — undefined keeps the
  // existing value, null clears it.
  const next = {
    body_weight_kg: fields.body_weight_kg === undefined ? null : fields.body_weight_kg,
    sleep_hours: fields.sleep_hours === undefined ? null : fields.sleep_hours,
    readiness: fields.readiness === undefined ? null : fields.readiness,
    note: fields.note === undefined ? null : fields.note
  };
  const setBw = 'body_weight_kg' in fields;
  const setSleep = 'sleep_hours' in fields;
  const setReady = 'readiness' in fields;
  const setNote = 'note' in fields;
  await sql`
    INSERT INTO daily_check_ins (user_id, date, body_weight_kg, sleep_hours, readiness, note)
    VALUES (${userId}, ${date}, ${next.body_weight_kg}, ${next.sleep_hours}, ${next.readiness}, ${next.note})
    ON CONFLICT (user_id, date) DO UPDATE SET
      body_weight_kg = CASE WHEN ${setBw} THEN EXCLUDED.body_weight_kg ELSE daily_check_ins.body_weight_kg END,
      sleep_hours    = CASE WHEN ${setSleep} THEN EXCLUDED.sleep_hours ELSE daily_check_ins.sleep_hours END,
      readiness      = CASE WHEN ${setReady} THEN EXCLUDED.readiness ELSE daily_check_ins.readiness END,
      note           = CASE WHEN ${setNote} THEN EXCLUDED.note ELSE daily_check_ins.note END,
      updated_at     = NOW()
  `;
}

export async function getActivityCaloriesForDate(
  sql: Sql,
  userId: string,
  date: string
): Promise<number> {
  const rows = await sql<{ total: string | number | null }[]>`
    SELECT COALESCE(SUM(activity_calories), 0) AS total
    FROM sessions
    WHERE user_id = ${userId} AND date = ${date}
  `;
  return Number(rows[0]?.total ?? 0);
}

export async function setActivityCaloriesForDate(
  sql: Sql,
  userId: string,
  date: string,
  kcal: number | null
): Promise<void> {
  // Apply to all sessions on this date (typically 0 or 1). If none exist,
  // create a free-session row so we have somewhere to store the burn.
  const rows = await sql<{ id: number }[]>`
    SELECT id FROM sessions
    WHERE user_id = ${userId} AND date = ${date}
  `;
  if (rows.length === 0) {
    await sql`
      INSERT INTO sessions (user_id, date, type, scheduled, activity_calories)
      VALUES (${userId}, ${date}, 'mobility', FALSE, ${kcal})
    `;
    return;
  }
  await sql`
    UPDATE sessions
    SET activity_calories = ${kcal}, updated_at = NOW()
    WHERE user_id = ${userId} AND date = ${date}
  `;
}

// Per-day rollups across a date range. Returns one row per day that has
// either a nutrition entry or an activity_calories burn on it; days without
// either are simply absent from the result and treated as "not logged".
export interface DailyNutritionRollup {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  activity_kcal: number;
  body_weight_kg: number | null;
}

export async function getDailyNutritionRollups(
  sql: Sql,
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyNutritionRollup[]> {
  const rows = await sql<Record<string, unknown>[]>`
    WITH dates AS (
      SELECT DISTINCT d FROM (
        SELECT date AS d FROM nutrition_entries
          WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
        UNION
        SELECT date AS d FROM sessions
          WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
            AND activity_calories IS NOT NULL
      ) u
    ),
    nut AS (
      SELECT date,
             COALESCE(SUM(calories), 0)  AS calories,
             COALESCE(SUM(protein_g), 0) AS protein_g,
             COALESCE(SUM(carbs_g), 0)   AS carbs_g,
             COALESCE(SUM(fat_g), 0)     AS fat_g
      FROM nutrition_entries
      WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
      GROUP BY date
    ),
    act AS (
      SELECT date,
             COALESCE(SUM(activity_calories), 0) AS activity_kcal,
             MAX(body_weight_kg) AS body_weight_kg
      FROM sessions
      WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
      GROUP BY date
    )
    SELECT d.d AS date,
           COALESCE(nut.calories, 0)  AS calories,
           COALESCE(nut.protein_g, 0) AS protein_g,
           COALESCE(nut.carbs_g, 0)   AS carbs_g,
           COALESCE(nut.fat_g, 0)     AS fat_g,
           COALESCE(act.activity_kcal, 0) AS activity_kcal,
           act.body_weight_kg
    FROM dates d
    LEFT JOIN nut ON nut.date = d.d
    LEFT JOIN act ON act.date = d.d
    ORDER BY d.d ASC
  `;
  return rows.map((r) => ({
    date: String(r.date),
    calories: Number(r.calories),
    protein_g: Number(r.protein_g),
    carbs_g: Number(r.carbs_g),
    fat_g: Number(r.fat_g),
    activity_kcal: Number(r.activity_kcal),
    body_weight_kg: r.body_weight_kg !== null && r.body_weight_kg !== undefined ? Number(r.body_weight_kg) : null
  }));
}
