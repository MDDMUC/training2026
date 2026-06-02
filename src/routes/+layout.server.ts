import type { LayoutServerLoad } from './$types';
import { getSql } from '$lib/db';
import { getRecentSessions } from '$lib/db/queries';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    // /login renders inside the root layout; no user → no data.
    return { recentSessions: [], user: null };
  }
  const sql = getSql();
  const recent = await getRecentSessions(sql, locals.user.id);
  return { recentSessions: recent, user: locals.user };
};
