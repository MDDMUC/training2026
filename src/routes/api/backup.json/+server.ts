import type { RequestHandler } from './$types';
import { getSql } from '$lib/db';

// Tables that carry user_id directly:
const USER_TABLES = ['phases', 'sessions', 'tindeq_tests', 'pullup_tests', 'running_logs'] as const;
// Tables that inherit ownership via session_id → sessions.user_id:
const INHERITED_TABLES = ['exercises', 'exercise_sets', 'climbing_attempts'] as const;

// Backup order (for downstream restore): phases first, then sessions, then
// child tables once their parents exist.
const ORDERED_TABLES = [
  'phases',
  'sessions',
  'exercises',
  'exercise_sets',
  'tindeq_tests',
  'pullup_tests',
  'climbing_attempts',
  'running_logs'
] as const;

export const GET: RequestHandler = async ({ locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;

  const data: Record<string, unknown[]> = {};

  for (const t of USER_TABLES) {
    data[t] = await sql.unsafe(`SELECT * FROM ${t} WHERE user_id = $1`, [userId]);
  }

  data.exercises = await sql.unsafe(
    `SELECT e.* FROM exercises e
     JOIN sessions s ON s.id = e.session_id
     WHERE s.user_id = $1`,
    [userId]
  );
  data.exercise_sets = await sql.unsafe(
    `SELECT es.* FROM exercise_sets es
     JOIN exercises e ON e.id = es.exercise_id
     JOIN sessions s ON s.id = e.session_id
     WHERE s.user_id = $1`,
    [userId]
  );
  data.climbing_attempts = await sql.unsafe(
    `SELECT ca.* FROM climbing_attempts ca
     JOIN sessions s ON s.id = ca.session_id
     WHERE s.user_id = $1`,
    [userId]
  );

  // Reorder into ORDERED_TABLES for downstream restore stability.
  const ordered: Record<string, unknown[]> = {};
  for (const t of ORDERED_TABLES) ordered[t] = data[t] ?? [];

  const exported_at = new Date().toISOString();
  const payload = {
    app: 'training-2026',
    version: 2,
    user_id: userId,
    exported_at,
    tables: ordered
  };

  const filename = `training2026-backup-${userId}-${exported_at.slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="${filename}"`
    }
  });
  // Silence unused warning; we keep INHERITED_TABLES for documentation only.
  void INHERITED_TABLES;
};
