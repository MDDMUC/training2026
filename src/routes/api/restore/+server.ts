import type { RequestHandler } from './$types';
import { getSql } from '$lib/db';

interface BackupPayload {
  app: string;
  version: number;
  tables: Record<string, Record<string, unknown>[]>;
}

// Insertion order respects FK dependencies. Deletion is the reverse.
const INSERT_ORDER = [
  'phases',
  'sessions',
  'exercises',
  'exercise_sets',
  'tindeq_tests',
  'pullup_tests',
  'climbing_attempts',
  'running_logs'
] as const;

// Tables with a direct user_id column.
const USER_OWNED = new Set([
  'phases',
  'sessions',
  'tindeq_tests',
  'pullup_tests',
  'running_logs'
]);

export const POST: RequestHandler = async ({ request, url, locals }) => {
  if (url.searchParams.get('confirm') !== 'true') {
    return new Response(JSON.stringify({ error: 'restore requires ?confirm=true' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  let payload: BackupPayload;
  try {
    payload = (await request.json()) as BackupPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (payload.app !== 'training-2026') {
    return new Response(JSON.stringify({ error: 'not a training-2026 backup' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (
    !payload.tables ||
    !Array.isArray(payload.tables.phases) ||
    payload.tables.phases.length === 0
  ) {
    return new Response(
      JSON.stringify({ error: 'backup has no phases — refusing to wipe to nothing' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const sql = getSql();
  const userId = locals.user!.id;

  try {
    await sql.begin(async (tx) => {
      // 1. Wipe THIS user's data only — reverse FK order.
      // climbing_attempts → via session → user
      await tx.unsafe(
        `DELETE FROM climbing_attempts WHERE session_id IN (SELECT id FROM sessions WHERE user_id = $1)`,
        [userId]
      );
      await tx.unsafe(`DELETE FROM running_logs WHERE user_id = $1`, [userId]);
      await tx.unsafe(`DELETE FROM pullup_tests WHERE user_id = $1`, [userId]);
      await tx.unsafe(`DELETE FROM tindeq_tests WHERE user_id = $1`, [userId]);
      await tx.unsafe(
        `DELETE FROM exercise_sets WHERE exercise_id IN (
           SELECT e.id FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE s.user_id = $1
         )`,
        [userId]
      );
      await tx.unsafe(
        `DELETE FROM exercises WHERE session_id IN (SELECT id FROM sessions WHERE user_id = $1)`,
        [userId]
      );
      await tx.unsafe(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
      await tx.unsafe(`DELETE FROM phases WHERE user_id = $1`, [userId]);

      // 2. Insert in dependency order.
      for (const t of INSERT_ORDER) {
        const rows = payload.tables[t] ?? [];
        if (rows.length === 0) continue;
        for (const r of rows) {
          // Force user_id to current user on user-owned tables (defensive: ignore any
          // user_id in the payload that doesn't match the active session).
          const row: Record<string, unknown> = { ...r };
          if (USER_OWNED.has(t)) {
            row.user_id = userId;
          }
          // Drop the id so Postgres assigns fresh BIGINT identities — IDs from
          // an old backup may collide with other users' rows.
          delete row.id;
          // created_at/updated_at: let the DB default fire if not present;
          // if present in payload, allow it through.
          const cols = Object.keys(row);
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
          const values = cols.map((c) => row[c] ?? null);
          await tx.unsafe(
            `INSERT INTO ${t} (${cols.join(',')}) VALUES (${placeholders})`,
            values as (number | string | boolean | null)[]
          );
        }
      }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'restore failed', detail: String(e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  // Return summary for current user
  const counts: Record<string, number> = {};
  for (const t of INSERT_ORDER) {
    if (USER_OWNED.has(t)) {
      const rows = await sql.unsafe<{ c: number }[]>(
        `SELECT COUNT(*)::int AS c FROM ${t} WHERE user_id = $1`,
        [userId]
      );
      counts[t] = Number(rows[0]?.c ?? 0);
    } else if (t === 'exercises') {
      const rows = await sql.unsafe<{ c: number }[]>(
        `SELECT COUNT(*)::int AS c FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE s.user_id = $1`,
        [userId]
      );
      counts[t] = Number(rows[0]?.c ?? 0);
    } else if (t === 'exercise_sets') {
      const rows = await sql.unsafe<{ c: number }[]>(
        `SELECT COUNT(*)::int AS c FROM exercise_sets es
         JOIN exercises e ON e.id = es.exercise_id
         JOIN sessions s ON s.id = e.session_id
         WHERE s.user_id = $1`,
        [userId]
      );
      counts[t] = Number(rows[0]?.c ?? 0);
    } else if (t === 'climbing_attempts') {
      const rows = await sql.unsafe<{ c: number }[]>(
        `SELECT COUNT(*)::int AS c FROM climbing_attempts ca
         JOIN sessions s ON s.id = ca.session_id
         WHERE s.user_id = $1`,
        [userId]
      );
      counts[t] = Number(rows[0]?.c ?? 0);
    }
  }

  return new Response(JSON.stringify({ ok: true, counts }), {
    headers: { 'content-type': 'application/json' }
  });
};
