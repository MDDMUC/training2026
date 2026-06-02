import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import { getExerciseIndex } from '$lib/db/queries';
import { format } from 'date-fns';

export const load: PageServerLoad = async ({ url, locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const rows = await getExerciseIndex(sql, userId);
  const q = url.searchParams.get('q')?.toLowerCase().trim() ?? '';

  const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;

  return {
    rows: filtered,
    q,
    todayISO: format(new Date(), 'yyyy-MM-dd'),
    totalCount: rows.length
  };
};
