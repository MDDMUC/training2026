import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import {
  getAllTindeqTests,
  getAllPullupTests,
  getPhaseForDate,
  getPhaseProgress,
  getWeeklyLoad,
  getBodyweightHistory
} from '$lib/db/queries';
import { format } from 'date-fns';

export const load: PageServerLoad = async ({ locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const tindeqTests = await getAllTindeqTests(sql, userId);
  const pullupTests = await getAllPullupTests(sql, userId);
  const phase = await getPhaseForDate(sql, userId, todayISO);
  const phaseProgress = phase ? await getPhaseProgress(sql, userId, phase.id) : null;
  const weeklyLoad = await getWeeklyLoad(sql, userId);
  const bodyweightHistory = await getBodyweightHistory(sql, userId);

  return {
    todayISO,
    tindeqTests,
    pullupTests,
    phase,
    phaseProgress,
    weeklyLoad,
    bodyweightHistory
  };
};
