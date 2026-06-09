import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import { getSessionsInRangeWithCounts, getAllPhases } from '$lib/db/queries';
import { startOfWeek, endOfWeek, format, parseISO, isValid, addDays } from 'date-fns';

export const load: PageServerLoad = async ({ url, locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const weekParam = url.searchParams.get('start');
  const today = new Date();
  let anchor = today;

  if (weekParam) {
    const parsed = parseISO(weekParam);
    if (isValid(parsed)) anchor = parsed;
  }

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });

  const [sessions, phases] = await Promise.all([
    getSessionsInRangeWithCounts(
      sql,
      userId,
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    ),
    getAllPhases(sql, userId)
  ]);

  return {
    weekStartISO: format(weekStart, 'yyyy-MM-dd'),
    weekEndISO: format(weekEnd, 'yyyy-MM-dd'),
    prevWeekStart: format(addDays(weekStart, -7), 'yyyy-MM-dd'),
    nextWeekStart: format(addDays(weekStart, 7), 'yyyy-MM-dd'),
    todayISO: format(today, 'yyyy-MM-dd'),
    sessions,
    phases
  };
};
