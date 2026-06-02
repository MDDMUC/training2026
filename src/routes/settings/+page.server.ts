import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import { getUserCounts } from '$lib/db/queries';

export const load: PageServerLoad = async ({ locals }) => {
  const sql = getSql();
  const counts = await getUserCounts(sql, locals.user!.id);

  return {
    counts,
    // No longer a local DB file; surface the user ID for display.
    dbPath: `supabase (user: ${locals.user!.id})`
  };
};
