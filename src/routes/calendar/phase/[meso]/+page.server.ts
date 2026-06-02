import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import {
  getAllPhases,
  getPhaseProgress,
  getSessionsInRangeWithCounts
} from '$lib/db/queries';
import { format, parseISO, addDays } from 'date-fns';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const meso = Number(params.meso);
  if (!Number.isFinite(meso) || meso < 1 || meso > 3) {
    error(404, 'Phase not found');
  }
  const sql = getSql();
  const userId = locals.user!.id;
  const phases = await getAllPhases(sql, userId);
  const phase = phases.find((p) => p.mesocycle_num === meso);
  if (!phase) error(404, 'Phase not found');

  const progress = await getPhaseProgress(sql, userId, phase.id);
  const sessions = await getSessionsInRangeWithCounts(
    sql,
    userId,
    phase.start_date,
    phase.end_date
  );

  const weeks: Array<{
    weekInPhase: number;
    start: string;
    end: string;
    sessions: typeof sessions;
  }> = [];

  for (let w = 0; w < 4; w++) {
    const start = addDays(parseISO(phase.start_date), w * 7);
    const end = addDays(start, 6);
    const startISO = format(start, 'yyyy-MM-dd');
    const endISO = format(end, 'yyyy-MM-dd');
    weeks.push({
      weekInPhase: w + 1,
      start: startISO,
      end: endISO,
      sessions: sessions.filter((s) => s.date >= startISO && s.date <= endISO)
    });
  }

  const prevMeso = meso > 1 ? meso - 1 : null;
  const nextMeso = meso < 3 ? meso + 1 : null;

  return {
    phase,
    progress,
    weeks,
    todayISO: format(new Date(), 'yyyy-MM-dd'),
    prevMeso,
    nextMeso,
    allPhases: phases
  };
};
