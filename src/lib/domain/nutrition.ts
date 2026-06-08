// Nutrition — TDEE math + types.
//
// TDEE model deliberately separates baseline from workout burn so the user can
// log activity calories from their watch each day:
//
//   BMR (Mifflin-St Jeor)
//     male:   10·kg + 6.25·cm − 5·age + 5
//     female: 10·kg + 6.25·cm − 5·age − 161
//   baseline_kcal = BMR × baseline_activity_factor   (NEAT only; default 1.4)
//   goal_kcal     = baseline_kcal + activity_calories_today
//
// Protein goal: 2 g per kg current body weight (default; configurable).
// "Goal hit" for streaks = total within ±tolerance_pct of goal_kcal (default 10%).

export type Sex = 'male' | 'female';

export interface NutritionProfile {
  user_id: string;
  age: number;
  height_cm: number;
  sex: Sex;
  default_weight_kg: number | null;
  baseline_activity_factor: number;
  protein_g_per_kg: number;
  calorie_tolerance_pct: number;
  updated_at: string;
}

export interface NutritionItem {
  food: string;
  qty?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface NutritionEntry {
  id: number;
  user_id: string;
  date: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items_json: NutritionItem[] | null;
  created_at: string;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DailyNutritionTargets {
  baseline_kcal: number;
  activity_kcal: number;
  goal_kcal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
}

export const PROFILE_DEFAULTS: Omit<
  NutritionProfile,
  'user_id' | 'age' | 'height_cm' | 'sex' | 'default_weight_kg' | 'updated_at'
> = {
  baseline_activity_factor: 1.4,
  protein_g_per_kg: 2.0,
  calorie_tolerance_pct: 0.1
};

export function mifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function computeDailyTargets(
  profile: NutritionProfile,
  bodyWeightKg: number,
  activityCalories: number
): DailyNutritionTargets {
  const bmr = mifflinStJeor(bodyWeightKg, profile.height_cm, profile.age, profile.sex);
  const baseline = bmr * profile.baseline_activity_factor;
  const goal = baseline + activityCalories;
  const proteinGoal = bodyWeightKg * profile.protein_g_per_kg;
  // Split the remaining calories ~30% fat / 70% carbs (typical training macro split).
  const proteinKcal = proteinGoal * 4;
  const remaining = Math.max(0, goal - proteinKcal);
  const fatGoal = (remaining * 0.3) / 9;
  const carbsGoal = (remaining * 0.7) / 4;
  return {
    baseline_kcal: Math.round(baseline),
    activity_kcal: Math.round(activityCalories),
    goal_kcal: Math.round(goal),
    protein_goal_g: Math.round(proteinGoal),
    carbs_goal_g: Math.round(carbsGoal),
    fat_goal_g: Math.round(fatGoal)
  };
}

export function sumEntries(entries: { calories: number; protein_g: number; carbs_g: number; fat_g: number }[]): NutritionTotals {
  return entries.reduce(
    (a, e) => ({
      calories: a.calories + e.calories,
      protein_g: a.protein_g + e.protein_g,
      carbs_g: a.carbs_g + e.carbs_g,
      fat_g: a.fat_g + e.fat_g
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export function caloriesHit(totals: NutritionTotals, target: DailyNutritionTargets, tolerancePct: number): boolean {
  if (target.goal_kcal <= 0) return false;
  const diff = Math.abs(totals.calories - target.goal_kcal) / target.goal_kcal;
  return diff <= tolerancePct;
}

export function proteinHit(totals: NutritionTotals, target: DailyNutritionTargets): boolean {
  if (target.protein_goal_g <= 0) return false;
  return totals.protein_g >= target.protein_goal_g;
}

// Days come in chronological order (oldest → newest). Streak counts the
// trailing run that ends on the most recent day.
export function trailingStreak(days: boolean[]): number {
  let n = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]) n++;
    else break;
  }
  return n;
}

export function longestStreak(days: boolean[]): number {
  let best = 0;
  let cur = 0;
  for (const d of days) {
    if (d) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}
