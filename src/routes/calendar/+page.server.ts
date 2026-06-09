import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import { getAllPhases, getSessionsInRangeWithCounts } from '$lib/db/queries';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isValid
} from 'date-fns';

export const load: PageServerLoad = async ({ url, locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;

  const monthParam = url.searchParams.get('month');
  const today = new Date();
  let month = today;

  if (monthParam) {
    const parsed = parseISO(monthParam + '-01');
    if (isValid(parsed)) month = parsed;
  }

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });

  const [sessions, phases] = await Promise.all([
    getSessionsInRangeWithCounts(
      sql,
      userId,
      format(gridStart, 'yyyy-MM-dd'),
      format(gridEnd, 'yyyy-MM-dd')
    ),
    getAllPhases(sql, userId)
  ]);

  return {
    monthISO: format(month, 'yyyy-MM'),
    monthLabel: format(month, 'MMMM yyyy'),
    todayISO: format(today, 'yyyy-MM-dd'),
    sessions,
    phases
  };
};
