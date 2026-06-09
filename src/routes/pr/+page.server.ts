import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import {
  getAllTindeqTests,
  getAllPullupTests,
  getAllClimbingAttempts,
  getAllRunningLogs,
  getWeeklyLoad,
  getExerciseIndex,
  getExerciseInstancesByName
} from '$lib/db/queries';
import { gradeRank, rankLabel } from '$lib/utils/grade';
import { format } from 'date-fns';

export const load: PageServerLoad = async ({ locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  // Stage 1 — every aggregate query independent. Parallel.
  const [tindeq, pullups, climbsRaw, runs, weeks, exNames] = await Promise.all([
    getAllTindeqTests(sql, userId),
    getAllPullupTests(sql, userId),
    getAllClimbingAttempts(sql, userId),
    getAllRunningLogs(sql, userId),
    getWeeklyLoad(sql, userId),
    getExerciseIndex(sql, userId)
  ]);

  // Stage 2 — per-exercise instances, fired together instead of N sequential RTTs.
  const allInstances = await Promise.all(
    exNames.map((row) => getExerciseInstancesByName(sql, userId, row.name))
  );

  const tindeqR = tindeq.filter((t) => t.hand === 'R');
  const tindeqL = tindeq.filter((t) => t.hand === 'L');
  const bestTindeqR =
    tindeqR.length > 0
      ? tindeqR.reduce((a, b) => (b.peak_force_kg > a.peak_force_kg ? b : a))
      : null;
  const bestTindeqL =
    tindeqL.length > 0
      ? tindeqL.reduce((a, b) => (b.peak_force_kg > a.peak_force_kg ? b : a))
      : null;

  const bestPullup =
    pullups.length > 0
      ? pullups.reduce((a, b) =>
          b.estimated_1rm_added_kg > a.estimated_1rm_added_kg ? b : a
        )
      : null;

  const climbs = climbsRaw.map((a) => ({ ...a, rank: gradeRank(a.grade) }));
  const onsightOrFlash = climbs.filter(
    (a) => (a.style === 'onsight' || a.style === 'flash') && a.rank > 0
  );
  const redpoint = climbs.filter(
    (a) => (a.style === 'redpoint' || a.style === 'repeat') && a.rank > 0
  );
  const hardestOnsight =
    onsightOrFlash.length > 0
      ? onsightOrFlash.reduce((a, b) => (b.rank > a.rank ? b : a))
      : null;
  const hardestRedpoint =
    redpoint.length > 0 ? redpoint.reduce((a, b) => (b.rank > a.rank ? b : a)) : null;

  const fastestRun =
    runs.filter((r) => r.pace_min_per_km !== null).length > 0
      ? runs
          .filter((r) => r.pace_min_per_km !== null)
          .reduce((a, b) =>
            (b.pace_min_per_km as number) < (a.pace_min_per_km as number) ? b : a
          )
      : null;
  const longestRun =
    runs.length > 0 ? runs.reduce((a, b) => (b.distance_km > a.distance_km ? b : a)) : null;

  const peakTonnageWeek =
    weeks.length > 0 ? weeks.reduce((a, b) => (b.tonnage_kg > a.tonnage_kg ? b : a)) : null;

  const exercisePRs: Array<{
    name: string;
    instances: number;
    best_date: string;
    top_set: NonNullable<Awaited<ReturnType<typeof getExerciseInstancesByName>>[number]['top_set']>;
  }> = [];
  exNames.forEach((row, i) => {
    const completed = allInstances[i].filter((inst) => inst.session_completed === 1 && inst.top_set);
    if (completed.length === 0) return;
    const best = completed.reduce((a, b) => {
      const sa = a.top_set!.load_kg_added ?? a.top_set!.load_kg ?? a.top_set!.hold_seconds ?? 0;
      const sb = b.top_set!.load_kg_added ?? b.top_set!.load_kg ?? b.top_set!.hold_seconds ?? 0;
      return sb > sa ? b : a;
    });
    exercisePRs.push({
      name: row.name,
      instances: row.instances,
      best_date: best.session_date,
      top_set: best.top_set!
    });
  });

  return {
    todayISO,
    bestTindeqR,
    bestTindeqL,
    bestPullup,
    hardestOnsight: hardestOnsight
      ? { ...hardestOnsight, gradeLabel: rankLabel(hardestOnsight.rank) }
      : null,
    hardestRedpoint: hardestRedpoint
      ? { ...hardestRedpoint, gradeLabel: rankLabel(hardestRedpoint.rank) }
      : null,
    fastestRun,
    longestRun,
    peakTonnageWeek,
    exercisePRs
  };
};
