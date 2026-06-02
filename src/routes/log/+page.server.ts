import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import { getAllSessionsWithCounts } from '$lib/db/queries';
import { format } from 'date-fns';

const VALID_TYPES = [
  'pull-heavy',
  'pull-light',
  'push',
  'climb-indoor',
  'climb-outdoor',
  'rest',
  'mobility',
  'run',
  'test'
] as const;

type Filter = 'all' | 'completed' | 'pending' | 'today-and-back' | 'upcoming';

export const load: PageServerLoad = async ({ url, locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const filter = (url.searchParams.get('filter') ?? 'all') as Filter;
  const typeFilter = url.searchParams.get('type');
  const validType =
    typeFilter && (VALID_TYPES as readonly string[]).includes(typeFilter) ? typeFilter : null;

  let sessions = await getAllSessionsWithCounts(sql, userId);

  sessions.sort((a, b) => a.date.localeCompare(b.date));

  if (filter === 'completed') sessions = sessions.filter((s) => s.completed === 1);
  else if (filter === 'pending') sessions = sessions.filter((s) => s.completed === 0);
  else if (filter === 'today-and-back') sessions = sessions.filter((s) => s.date <= todayISO);
  else if (filter === 'upcoming') sessions = sessions.filter((s) => s.date > todayISO);

  if (validType) sessions = sessions.filter((s) => s.type === validType);

  return {
    sessions,
    todayISO,
    filter,
    typeFilter: validType
  };
};
