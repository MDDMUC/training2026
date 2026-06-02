// Session-load (tonnage) computation.
// Counts only completed work sets so the number reflects what was actually done.

import type { ExerciseSet } from './types';

export interface SessionLoad {
  /** Sum of (load_kg + BW where load_kg_added is set) × reps, in kg, across completed work sets. */
  tonnage_kg: number;
  /** Sum of hold_seconds across completed isometric work sets. */
  isometric_seconds: number;
  /** Number of completed work sets contributing to the totals. */
  completed_work_sets: number;
}

interface SetWithSession {
  set: ExerciseSet;
  body_weight_kg: number | null;
}

const FALLBACK_BW_KG = 82;

export function computeSessionLoad(
  sets: ExerciseSet[],
  bodyWeightKg: number | null
): SessionLoad {
  const bw = bodyWeightKg ?? FALLBACK_BW_KG;
  let tonnage = 0;
  let iso = 0;
  let n = 0;

  for (const s of sets) {
    if (s.kind !== 'work' || s.completed !== 1) continue;
    n++;

    if (s.reps !== null && s.reps > 0) {
      if (s.load_kg_added !== null) {
        tonnage += (bw + s.load_kg_added) * s.reps;
      } else if (s.load_kg !== null) {
        tonnage += s.load_kg * s.reps;
      }
    }

    if (s.hold_seconds !== null && s.hold_seconds > 0) {
      // Each rep within a hold contributes the hold duration
      const reps = s.reps ?? 1;
      iso += s.hold_seconds * reps;
    }
  }

  return {
    tonnage_kg: Math.round(tonnage),
    isometric_seconds: iso,
    completed_work_sets: n
  };
}

export function formatTonnage(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} t`;
  }
  return `${kg} kg`;
}

export function formatHoldTime(seconds: number): string {
  if (seconds === 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
