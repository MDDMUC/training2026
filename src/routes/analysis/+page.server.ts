import type { PageServerLoad } from './$types';
import { getSql } from '$lib/db';
import {
  getAllTindeqTests,
  getAllPullupTests,
  getPhaseForDate,
  getPhaseProgress,
  getWeeklyLoad,
  getBodyweightHistory,
  getNutritionProfile,
  getDailyNutritionRollups
} from '$lib/db/queries';
import { format, subDays } from 'date-fns';
import {
  computeDailyTargets,
  trailingStreak,
  longestStreak,
  PROFILE_DEFAULTS
} from '$lib/domain/nutrition';

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

  // ---------- Nutrition consistency (rolling 60 days) ----------
  const RANGE_DAYS = 60;
  const startISO = format(subDays(new Date(), RANGE_DAYS - 1), 'yyyy-MM-dd');
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
  const rollups = await getDailyNutritionRollups(sql, userId, startISO, todayISO);

  // Build a continuous per-day series. Days without a nutrition log → not a hit
  // for either goal, but still occupy a slot in the streak/strip view.
  const byDate = new Map(rollups.map((r) => [r.date, r]));
  const fallbackWeight = bodyweightHistory[0]?.body_weight_kg ?? profile.default_weight_kg ?? 83;

  const days: {
    date: string;
    calories: number;
    protein_g: number;
    goal_kcal: number;
    protein_goal_g: number;
    calorieHit: boolean;
    proteinHit: boolean;
    logged: boolean;
  }[] = [];

  for (let i = 0; i < RANGE_DAYS; i++) {
    const d = format(subDays(new Date(), RANGE_DAYS - 1 - i), 'yyyy-MM-dd');
    const r = byDate.get(d);
    const weight = r?.body_weight_kg ?? fallbackWeight;
    const targets = computeDailyTargets(profile, weight, r?.activity_kcal ?? 0);
    const calories = r?.calories ?? 0;
    const protein_g = r?.protein_g ?? 0;
    const logged = !!r && (calories > 0 || protein_g > 0);
    const calorieHit =
      logged &&
      targets.goal_kcal > 0 &&
      Math.abs(calories - targets.goal_kcal) / targets.goal_kcal <= profile.calorie_tolerance_pct;
    const proteinHit = logged && protein_g >= targets.protein_goal_g;
    days.push({
      date: d,
      calories,
      protein_g,
      goal_kcal: targets.goal_kcal,
      protein_goal_g: targets.protein_goal_g,
      calorieHit,
      proteinHit,
      logged
    });
  }

  const calorieHits = days.map((d) => d.calorieHit);
  const proteinHits = days.map((d) => d.proteinHit);
  const bothHits = days.map((d) => d.calorieHit && d.proteinHit);

  const nutritionConsistency = {
    days,
    calorieStreak: trailingStreak(calorieHits),
    calorieLongest: longestStreak(calorieHits),
    proteinStreak: trailingStreak(proteinHits),
    proteinLongest: longestStreak(proteinHits),
    bothStreak: trailingStreak(bothHits),
    daysLogged: days.filter((d) => d.logged).length,
    daysInRange: RANGE_DAYS
  };

  return {
    todayISO,
    tindeqTests,
    pullupTests,
    phase,
    phaseProgress,
    weeklyLoad,
    bodyweightHistory,
    nutritionConsistency
  };
};
