// Spine-reset plan — seeded after the H2 2026 cycle was archived.
// Constraint: misaligned back joint being adjusted. No full training.
// This is not a performance block. Stop on any joint symptoms.

import { addDays, format } from 'date-fns';
import type { SessionType } from './types';

export const RESET_CYCLE_NAME = 'Reset';
export const H2_CYCLE_NAME = 'H2 2026';

export const SPINE_CONSTRAINT =
  'Back joint is being adjusted. No hanging, no pull-ups, no climbing, no running, no loaded flexion or rotation. Stop immediately if the joint speaks. Pain-free only.';

type SetSpec = {
  kind: 'checklist';
  label: string;
};

type ExerciseSpec = { name: string; notes: string; sets: SetSpec[] };

export type ResetSessionSpec = {
  type: SessionType;
  title: string;
  notes: string;
  exercises: ExerciseSpec[];
};

function walk(minutes: string): ExerciseSpec {
  return {
    name: 'Easy walk',
    notes:
      'Flat ground, easy breathing. This is circulation, not training. Turn around the moment the back joint complains.',
    sets: [{ kind: 'checklist', label: `Walk ${minutes} · pain-free` }]
  };
}

function unloadedMobility(): ExerciseSpec {
  return {
    name: 'Unloaded mobility',
    notes:
      'Hips, ankles, shoulders, easy breathing. No loaded spinal flexion, no max rotation, no hanging, no twisting under load. Skip anything that refers to the joint.',
    sets: [{ kind: 'checklist', label: '~10 min · hips / ankles / shoulders / breath' }]
  };
}

const PROTECT_NOTES = `**Protect.** ${SPINE_CONSTRAINT}

The H2 2026 plan is archived (Log → Previous plan). Do not sneak in old sessions.`;

const RESTORE_NOTES = `**Restore — only if the adjustment is holding and symptoms are quiet.** ${SPINE_CONSTRAINT}

Still no performance work. The next climbing block is designed after clearance, not before.`;

function protectDay(kind: 'walk' | 'walk-mob' | 'rest'): ResetSessionSpec {
  if (kind === 'rest') {
    return {
      type: 'rest',
      title: 'Rest — let the adjustment hold',
      notes: PROTECT_NOTES,
      exercises: []
    };
  }
  const withMob = kind === 'walk-mob';
  return {
    type: 'mobility',
    title: withMob ? 'Walk + unloaded mobility' : 'Walk — easy, pain-free',
    notes: PROTECT_NOTES,
    exercises: withMob ? [walk('20–30 min'), unloadedMobility()] : [walk('20–30 min')]
  };
}

function restoreDay(kind: 'walk' | 'walk-mob' | 'rest'): ResetSessionSpec {
  if (kind === 'rest') {
    return {
      type: 'rest',
      title: 'Rest — symptoms decide',
      notes: RESTORE_NOTES,
      exercises: []
    };
  }
  const withMob = kind === 'walk-mob';
  return {
    type: 'mobility',
    title: withMob ? 'Walk + unloaded mobility' : 'Walk — easy, pain-free',
    notes: RESTORE_NOTES,
    exercises: withMob ? [walk('30–40 min'), unloadedMobility()] : [walk('30–40 min')]
  };
}

// Mon=0 … Sun=6 relative to the cycle start date (not calendar weekday).
const WEEK: Array<'walk' | 'walk-mob' | 'rest'> = [
  'walk',
  'rest',
  'walk-mob',
  'walk',
  'rest',
  'walk',
  'rest'
];

export interface ResetPhaseSeed {
  mesocycle_num: 1 | 2;
  name: string;
  short_name: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ResetSessionSeed {
  date: string;
  mesocycle_num: 1 | 2;
  spec: ResetSessionSpec;
}

export function buildResetPlan(startISO: string): {
  phases: ResetPhaseSeed[];
  sessions: ResetSessionSeed[];
} {
  const start = new Date(startISO + 'T00:00:00');
  const protectEnd = addDays(start, 13);
  const restoreStart = addDays(start, 14);
  const restoreEnd = addDays(start, 41);

  const phases: ResetPhaseSeed[] = [
    {
      mesocycle_num: 1,
      name: 'Protect — spine',
      short_name: 'HOLD',
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(protectEnd, 'yyyy-MM-dd'),
      description:
        'Two weeks. Joint is being adjusted. Walk and rest only. No climbing training. H2 2026 is archived, not deleted.'
    },
    {
      mesocycle_num: 2,
      name: 'Restore — if quiet',
      short_name: 'RESTORE',
      start_date: format(restoreStart, 'yyyy-MM-dd'),
      end_date: format(restoreEnd, 'yyyy-MM-dd'),
      description:
        'Four weeks of the same constraint, slightly longer walks, still no hangs / pull-ups / climbing / running. Locked until the joint is quiet. Next performance block is a separate decision.'
    }
  ];

  const sessions: ResetSessionSeed[] = [];
  for (let i = 0; i < 14; i++) {
    sessions.push({
      date: format(addDays(start, i), 'yyyy-MM-dd'),
      mesocycle_num: 1,
      spec: protectDay(WEEK[i % 7])
    });
  }
  for (let i = 0; i < 28; i++) {
    sessions.push({
      date: format(addDays(restoreStart, i), 'yyyy-MM-dd'),
      mesocycle_num: 2,
      spec: restoreDay(WEEK[i % 7])
    });
  }

  return { phases, sessions };
}
