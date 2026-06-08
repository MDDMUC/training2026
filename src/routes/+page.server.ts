import type { PageServerLoad, Actions } from './$types';
import { getSql } from '$lib/db';
import { fail } from '@sveltejs/kit';
import { updateSessionFields } from '$lib/db/queries';
import {
  getSessionByDate,
  getPhaseForDate,
  getLatestTindeqPerHand,
  getLatestPullupTest,
  getLatestBodyweight,
  getLatestSleep,
  getSessionsInRangeWithCounts,
  getAllClimbingAttempts,
  getSleepHistory,
  getAllSetsForSession,
  getAllRunningLogs,
  getLatestRun,
  getAllPhases,
  getNutritionProfile,
  upsertNutritionProfile,
  listNutritionEntriesForDate,
  insertNutritionEntry,
  deleteNutritionEntry,
  getActivityCaloriesForDate,
  setActivityCaloriesForDate,
  getBodyWeightOnOrBefore
} from '$lib/db/queries';
import { computeDailyTargets, sumEntries, PROFILE_DEFAULTS, type NutritionItem } from '$lib/domain/nutrition';
import { computeSessionLoad } from '$lib/domain/load';
import { generateInsights } from '$lib/domain/insights';
import {
  differenceInCalendarDays,
  startOfWeek,
  endOfWeek,
  format as formatDate,
  addDays,
  subWeeks
} from 'date-fns';
import { format } from 'date-fns';
import { asymmetryPercent } from '$lib/domain/types';

export const load: PageServerLoad = async ({ locals }) => {
  const sql = getSql();
  const userId = locals.user!.id;
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const todaySession = await getSessionByDate(sql, userId, todayISO);
  const phase = await getPhaseForDate(sql, userId, todayISO);
  const tindeq = await getLatestTindeqPerHand(sql, userId);
  const pullup = await getLatestPullupTest(sql, userId);
  const bodyweight = await getLatestBodyweight(sql, userId);
  const sleep = await getLatestSleep(sql, userId);

  // This-week snapshot
  const today = new Date();
  const weekStartISO = formatDate(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEndISO = formatDate(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekSessions = await getSessionsInRangeWithCounts(sql, userId, weekStartISO, weekEndISO);
  const allClimbs = await getAllClimbingAttempts(sql, userId);
  const weekClimbs = allClimbs.filter((a) => a.date >= weekStartISO && a.date <= weekEndISO);
  const allRuns = await getAllRunningLogs(sql, userId);
  const weekRuns = allRuns.filter((r) => r.date >= weekStartISO && r.date <= weekEndISO);
  const weekKm = weekRuns.reduce((a, r) => a + r.distance_km, 0);
  const latestRun = await getLatestRun(sql, userId);
  const sleepHistory = await getSleepHistory(sql, userId);
  const weekSleepEntries = sleepHistory.filter(
    (s) => s.date >= weekStartISO && s.date <= weekEndISO
  );
  const weekSleepAvg =
    weekSleepEntries.length > 0
      ? Math.round(
          (weekSleepEntries.reduce((a, s) => a + s.sleep_hours, 0) / weekSleepEntries.length) * 10
        ) / 10
      : null;

  // Roll up tonnage + isometric seconds across the week's sessions
  let weekTonnage = 0;
  let weekIsoSec = 0;
  for (const s of weekSessions) {
    const sets = await getAllSetsForSession(sql, userId, s.id);
    const load = computeSessionLoad(sets, s.body_weight_kg ?? null);
    weekTonnage += load.tonnage_kg;
    weekIsoSec += load.isometric_seconds;
  }

  const week = {
    startISO: weekStartISO,
    endISO: weekEndISO,
    sessionsTotal: weekSessions.length,
    sessionsCompleted: weekSessions.filter((s) => s.completed === 1).length,
    setsTotal: weekSessions.reduce((a, s) => a + s.sets_total, 0),
    setsCompleted: weekSessions.reduce((a, s) => a + s.sets_completed, 0),
    climbs: weekClimbs.length,
    sleepAvg: weekSleepAvg,
    tonnageKg: weekTonnage,
    isometricSeconds: weekIsoSec,
    runsCount: weekRuns.length,
    runKm: Math.round(weekKm * 10) / 10
  };

  const tomorrowISO = formatDate(addDays(today, 1), 'yyyy-MM-dd');
  const lookaheadEnd = formatDate(addDays(today, 14), 'yyyy-MM-dd');
  const upcoming = (await getSessionsInRangeWithCounts(sql, userId, tomorrowISO, lookaheadEnd))
    .filter((s) => s.type !== 'rest')
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextSession = upcoming[0] ?? null;

  const tindeqAsymmetry =
    tindeq.L && tindeq.R
      ? asymmetryPercent(tindeq.R.peak_force_kg, tindeq.L.peak_force_kg)
      : null;

  const prevWeekStart = formatDate(subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1), 'yyyy-MM-dd');
  const prevWeekEnd = formatDate(subWeeks(endOfWeek(today, { weekStartsOn: 1 }), 1), 'yyyy-MM-dd');
  const prevWeekSessions = await getSessionsInRangeWithCounts(
    sql,
    userId,
    prevWeekStart,
    prevWeekEnd
  );
  let prevWeekTonnage = 0;
  for (const s of prevWeekSessions) {
    const setRows = await getAllSetsForSession(sql, userId, s.id);
    prevWeekTonnage += computeSessionLoad(setRows, s.body_weight_kg ?? null).tonnage_kg;
  }

  const daysSincePlanStart = differenceInCalendarDays(today, new Date(2026, 5, 10));

  const allPhases = await getAllPhases(sql, userId);
  const daysUntilPhaseEnd = phase ? differenceInCalendarDays(new Date(phase.end_date), today) : null;
  const nextPhase = phase
    ? allPhases.find((p) => p.mesocycle_num === phase.mesocycle_num + 1) ?? null
    : null;
  const upcomingTests = (
    await getSessionsInRangeWithCounts(sql, userId, todayISO, '2026-08-30')
  ).filter((s) => s.type === 'test');
  const nextTestDate = upcomingTests.length > 0 ? upcomingTests[0].date : null;

  const insights = generateInsights({
    asymmetryPct: tindeqAsymmetry,
    sleepAvg7: weekSleepAvg,
    sleepEntriesCount: weekSleepEntries.length,
    todaysReadiness: todaySession?.readiness ?? null,
    todaysSessionType: todaySession?.type ?? null,
    weekSessionsTotal: weekSessions.length,
    weekSessionsCompleted: weekSessions.filter((s) => s.completed === 1).length,
    daysSincePlanStart,
    weekTonnageKg: weekTonnage,
    prevWeekTonnageKg: prevWeekTonnage,
    latestRunPace: latestRun?.pace_min_per_km ?? null,
    runPaceTarget: 8.0,
    daysUntilPhaseEnd,
    currentPhaseShortName: phase?.short_name ?? null,
    nextPhaseShortName: nextPhase?.short_name ?? null,
    nextTestDate
  });

  // ---------- Nutrition (today only) ----------
  const profile = (await getNutritionProfile(sql, userId)) ?? {
    user_id: userId,
    age: 43,
    height_cm: 196,
    sex: 'male' as const,
    default_weight_kg: 83,
    baseline_activity_factor: PROFILE_DEFAULTS.baseline_activity_factor,
    protein_g_per_kg: PROFILE_DEFAULTS.protein_g_per_kg,
    calorie_tolerance_pct: PROFILE_DEFAULTS.calorie_tolerance_pct,
    updated_at: new Date().toISOString()
  };
  const nutritionEntries = await listNutritionEntriesForDate(sql, userId, todayISO);
  const activityCaloriesToday = await getActivityCaloriesForDate(sql, userId, todayISO);
  const bodyWeightForGoal =
    (await getBodyWeightOnOrBefore(sql, userId, todayISO)) ??
    profile.default_weight_kg ??
    83;
  const nutritionTargets = computeDailyTargets(profile, bodyWeightForGoal, activityCaloriesToday);
  const nutritionTotals = sumEntries(nutritionEntries);

  return {
    todayISO,
    todayLabel: format(new Date(), 'EEEE, MMMM d'),
    phase,
    todaySession,
    tindeq,
    tindeqAsymmetry,
    pullup,
    bodyweight,
    sleep,
    week,
    nextSession,
    latestRun,
    insights,
    nutrition: {
      entries: nutritionEntries,
      totals: nutritionTotals,
      targets: nutritionTargets,
      activityCalories: activityCaloriesToday,
      bodyWeightKg: bodyWeightForGoal,
      profile
    }
  };
};

export const actions: Actions = {
  updateSession: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const sessionId = Number(form.get('sessionId'));
    if (!Number.isFinite(sessionId)) return fail(400, { error: 'bad sessionId' });

    const fields: Parameters<typeof updateSessionFields>[3] = {};
    for (const key of [
      'duration_min',
      'rpe',
      'body_weight_kg',
      'sleep_hours',
      'readiness'
    ] as const) {
      const raw = form.get(key);
      if (raw !== null) {
        const n = Number(raw);
        fields[key] = raw === '' ? null : Number.isFinite(n) ? n : null;
      }
    }

    await updateSessionFields(sql, userId, sessionId, fields);
    return { ok: true };
  },

  saveNutritionEntry: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const description = String(form.get('description') ?? '').trim();
    const calories = Number(form.get('calories'));
    const protein_g = Number(form.get('protein_g'));
    const carbs_g = Number(form.get('carbs_g'));
    const fat_g = Number(form.get('fat_g'));
    if (!description || ![calories, protein_g, carbs_g, fat_g].every(Number.isFinite)) {
      return fail(400, { error: 'invalid nutrition payload' });
    }
    let items_json: NutritionItem[] | null = null;
    const itemsRaw = form.get('items_json');
    if (typeof itemsRaw === 'string' && itemsRaw.length > 0) {
      try {
        items_json = JSON.parse(itemsRaw) as NutritionItem[];
      } catch {
        items_json = null;
      }
    }
    const todayISO = format(new Date(), 'yyyy-MM-dd');
    await insertNutritionEntry(sql, userId, {
      date: todayISO,
      description,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      items_json
    });
    return { ok: true };
  },

  deleteNutritionEntry: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const entryId = Number(form.get('entryId'));
    if (!Number.isFinite(entryId)) return fail(400, { error: 'bad entryId' });
    await deleteNutritionEntry(sql, userId, entryId);
    return { ok: true };
  },

  updateActivityCalories: async ({ request, locals }) => {
    const sql = getSql();
    const userId = locals.user!.id;
    const form = await request.formData();
    const raw = form.get('activity_calories');
    const todayISO = format(new Date(), 'yyyy-MM-dd');
    const kcal = raw === '' || raw === null ? null : Number(raw);
    if (kcal !== null && (!Number.isFinite(kcal) || kcal < 0 || kcal > 5000)) {
      return fail(400, { error: 'bad activity_calories' });
    }
    await setActivityCaloriesForDate(sql, userId, todayISO, kcal);
    return { ok: true };
  }
};
