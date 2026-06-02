// Domain types for Training 2026

export type SessionType =
  | 'pull-heavy'
  | 'pull-light'
  | 'push'
  | 'climb-indoor'
  | 'climb-outdoor'
  | 'rest'
  | 'mobility'
  | 'run'
  | 'test';

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  'pull-heavy': 'Pull · Heavy',
  'pull-light': 'Pull · Light',
  'push': 'Push + Antagonist',
  'climb-indoor': 'Climb · Indoor',
  'climb-outdoor': 'Climb · Outdoor',
  'rest': 'Rest',
  'mobility': 'Mobility',
  'run': 'Run',
  'test': 'Test Session'
};

export type Hand = 'L' | 'R';

export type GripPosition = 'half-crimp' | 'open-hand' | 'full-crimp' | 'sloper' | 'pinch';

export type ClimbStyle = 'onsight' | 'flash' | 'redpoint' | 'repeat' | 'attempt' | 'project';

export const CLIMB_STYLE_LABELS: Record<ClimbStyle, string> = {
  onsight: 'Onsight',
  flash: 'Flash',
  redpoint: 'Redpoint',
  repeat: 'Repeat',
  attempt: 'Attempt',
  project: 'Project work'
};

export interface ClimbingAttempt {
  id: number;
  session_id: number;
  route_name: string | null;
  grade: string;
  style: ClimbStyle;
  notes: string | null;
  created_at: string;
}

export interface RunningLog {
  id: number;
  session_id: number | null;
  date: string;
  distance_km: number;
  duration_min: number;
  pace_min_per_km: number | null;
  surface: string | null;
  notes: string | null;
  created_at: string;
}

export interface Phase {
  id: number;
  mesocycle_num: number;
  name: string;
  short_name: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
}

export interface Session {
  id: number;
  date: string;
  phase_id: number | null;
  type: SessionType;
  title: string | null;
  scheduled: number;
  completed: number;
  duration_min: number | null;
  rpe: number | null;
  body_weight_kg: number | null;
  sleep_hours: number | null;
  readiness: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithPhase extends Session {
  phase_name: string | null;
  phase_short_name: string | null;
  phase_mesocycle_num: number | null;
}

export interface Exercise {
  id: number;
  session_id: number;
  name: string;
  display_order: number;
  notes: string | null;          // prescription guidance, seeded
  athlete_notes: string | null;  // athlete-written annotation
}

export type SetKind = 'warmup' | 'work' | 'backoff' | 'checklist';

export interface ExerciseSet {
  id: number;
  exercise_id: number;
  set_num: number;
  kind: SetKind;
  label: string | null;
  reps: number | null;
  load_kg: number | null;
  load_kg_added: number | null;
  hold_seconds: number | null;
  rest_seconds: number | null;
  rpe: number | null;
  completed: number;
  notes: string | null;
}

export interface TindeqTest {
  id: number;
  session_id: number | null;
  date: string;
  hand: Hand;
  edge_mm: number;
  grip_position: GripPosition;
  peak_force_kg: number;
  body_weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

export interface PullupTest {
  id: number;
  session_id: number | null;
  date: string;
  body_weight_kg: number;
  top_load_added_kg: number;
  top_reps: number;
  estimated_1rm_added_kg: number;
  notes: string | null;
  created_at: string;
}

// 1RM estimation (Epley)
export function estimateOneRepMaxAdded(
  bodyWeightKg: number,
  addedLoadKg: number,
  reps: number
): number {
  const totalLoad = bodyWeightKg + addedLoadKg;
  const oneRmTotal = totalLoad * (1 + reps / 30);
  return Math.round((oneRmTotal - bodyWeightKg) * 10) / 10;
}

// Asymmetry %
export function asymmetryPercent(rKg: number, lKg: number): number {
  const stronger = Math.max(rKg, lKg);
  if (stronger === 0) return 0;
  return Math.round(((rKg - lKg) / stronger) * 1000) / 10;
}
