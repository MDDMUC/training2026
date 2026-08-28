// Time-of-day recommendation per prescribed exercise.
//
// Only returns a hint where there's a real timing case. Most strength /
// accessory work is fine "either" and gets no badge — keeping the indicator
// out where it would just be noise.
//
//   morning — fresh CNS, low-load tendon priming, must precede climbing
//             by ≥ 5 h to clear Baar's refractory window.
//   evening — skill-heavy or long efforts that benefit from a full
//             warm-up and a fed, awake body.

export type TimeOfDay = 'morning' | 'evening';

const MORNING_EXERCISES = new Set<string>([
  'No-hangs · Abrahangs (low-load tendon)',
  'No-hangs · Runway Calibration'
]);

const EVENING_EXERCISES = new Set<string>([
  'Indoor Climbing Session',
  'Outdoor Climbing',
  'Long Mobility + Easy Run',
  'Easy Run'
]);

export function getTimeOfDay(exerciseName: string): TimeOfDay | null {
  if (MORNING_EXERCISES.has(exerciseName)) return 'morning';
  if (EVENING_EXERCISES.has(exerciseName)) return 'evening';
  return null;
}

export const timeOfDayShort: Record<TimeOfDay, string> = {
  morning: 'AM',
  evening: 'PM'
};

export const timeOfDayTitle: Record<TimeOfDay, string> = {
  morning: 'Best in the morning — fresh CNS / tendon priming',
  evening: 'Best in the late afternoon / evening'
};
