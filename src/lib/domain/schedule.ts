// The canonical 12-week schedule (Wed Jun 10 → Tue Sep 1, 2026).
// Source: training2026/plan/01-weekly-template.md and 02-phase1-base-tendon-prep.md.
// Used to seed the database so the calendar is immediately populated.
//
// NOTE: post-seed migrations applied on top of this seed:
//   - scripts/shift-plan-by-2-days.ts   (already reflected in the dates below)
//   - scripts/add-sunday-push-volume.ts (converts the weekly mobility day to
//     a push-volume session with prepended push exercises)
// If you ever re-seed from scratch, re-run add-sunday-push-volume.ts after.

import type { SessionType } from './types';

export interface PhaseSeed {
  mesocycle_num: 1 | 2 | 3;
  name: string;
  short_name: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface SessionSeed {
  date: string;          // YYYY-MM-DD
  type: SessionType;
  title: string;
  mesocycle_num: 1 | 2 | 3;
}

export const PHASES: PhaseSeed[] = [
  {
    mesocycle_num: 1,
    name: 'Base + Tendon Prep',
    short_name: 'BASE',
    start_date: '2026-06-10',
    end_date: '2026-07-07',
    description:
      'Re-introduce structured training. Density Hangs at 75% MVC. Build pull-up volume. Begin closing L-hand asymmetry. Establish mobility and gentle running re-entry.'
  },
  {
    mesocycle_num: 2,
    name: 'Max Strength',
    short_name: 'MAX',
    start_date: '2026-07-08',
    end_date: '2026-08-04',
    description:
      'Lattice-style max hangs at 85–90% MVC. Heavy weighted pull-up triples at 85% 1RM. Limit bouldering replaces volume climbing.'
  },
  {
    mesocycle_num: 3,
    name: 'Power & Peak',
    short_name: 'PEAK',
    start_date: '2026-08-05',
    end_date: '2026-09-01',
    description:
      'Convert strength to climbing output. Route intervals and 4×4 bouldering. Maintenance hangboard once per week. Outdoor performance peak in final week.'
  }
];

// Weekly day-of-week pattern. Index 0 = Monday, 6 = Sunday.
type DayName = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
const DAY_NAMES: DayName[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeeklyTemplate {
  Mon: { type: SessionType; title: string };
  Tue: { type: SessionType; title: string };
  Wed: { type: SessionType; title: string };
  Thu: { type: SessionType; title: string };
  Fri: { type: SessionType; title: string };
  Sat: { type: SessionType; title: string };
  Sun: { type: SessionType; title: string };
}

const PHASE1_TEMPLATE: WeeklyTemplate = {
  Mon: { type: 'pull-heavy', title: 'Pull · Heavy — Density Hangs + Weighted Pulls' },
  Tue: { type: 'push', title: 'Push + Antagonist + Single-leg Knee' },
  Wed: { type: 'climb-indoor', title: 'Climb · Indoor — Volume 60–100 moves' },
  Thu: { type: 'pull-light', title: 'Pull · Asymmetry — L-first submax isos' },
  Fri: { type: 'mobility', title: 'Long Mobility + Easy Run' },
  Sat: { type: 'climb-outdoor', title: 'Climb · Outdoor — Volume at level' },
  Sun: { type: 'rest', title: 'Rest (or optional 2nd outdoor)' }
};

const PHASE2_TEMPLATE: WeeklyTemplate = {
  Mon: { type: 'pull-heavy', title: 'Pull · Heavy — Max Hangs 85% + Heavy Triples' },
  Tue: { type: 'push', title: 'Push + Antagonist (1 RIR)' },
  Wed: { type: 'climb-indoor', title: 'Climb · Indoor — Limit Bouldering' },
  Thu: { type: 'pull-light', title: 'Pull · Asymmetry — Submax repeaters 75% MVC' },
  Fri: { type: 'mobility', title: 'Long Mobility + Easy Run' },
  Sat: { type: 'climb-outdoor', title: 'Climb · Outdoor — Mixed: volume + project tries' },
  Sun: { type: 'rest', title: 'Rest' }
};

const PHASE3_TEMPLATE: WeeklyTemplate = {
  Mon: { type: 'pull-heavy', title: 'Pull · Heavy — Maintenance Hangs + Low-vol Max Pulls' },
  Tue: { type: 'push', title: 'Push + Antagonist (maintenance)' },
  Wed: { type: 'climb-indoor', title: 'Climb · Indoor — Route Intervals / 4×4' },
  Thu: { type: 'climb-indoor', title: 'Climb · Indoor — Power Endurance (optional)' },
  Fri: { type: 'mobility', title: 'Long Mobility + Easy Run' },
  Sat: { type: 'climb-outdoor', title: 'Climb · Outdoor — Project Day (4–6 burns)' },
  Sun: { type: 'rest', title: 'Rest' }
};

// Week 4 (deload + test), Week 8 (deload + test), Week 12 (taper + final test) override:
const DELOAD_TEMPLATE: Partial<WeeklyTemplate> = {
  Mon: { type: 'pull-light', title: 'Pull · Deload — Light hangs + light pulls' },
  Tue: { type: 'push', title: 'Push · Deload — single round each' },
  Wed: { type: 'climb-indoor', title: 'Climb · Easy — jugs only, no projecting' },
  Thu: { type: 'rest', title: 'Rest' },
  Fri: { type: 'mobility', title: 'Mobility only — no run' }
};

// Week 4 Saturday is the test session
const TEST_SATURDAY = { type: 'test' as SessionType, title: 'Test Session — Tindeq + Pull-up 1RM' };

function dateAddDays(isoDate: string, days: number): string {
  // Parse as UTC to avoid local-timezone offset bugs around DST.
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildWeek(
  weekStartMon: string,
  template: WeeklyTemplate,
  overrides: Partial<WeeklyTemplate> | null,
  mesocycle: 1 | 2 | 3,
  weekInPhase: number,
  isLastWeekOfPhase: boolean
): SessionSeed[] {
  const sessions: SessionSeed[] = [];
  for (let i = 0; i < 7; i++) {
    const dayName = DAY_NAMES[i];
    const date = dateAddDays(weekStartMon, i);
    let entry = template[dayName];

    if (overrides && overrides[dayName]) {
      entry = overrides[dayName]!;
    }

    // Week 4 / 8 / 12 of phase: Saturday is the test session (Phase 1 + 2),
    // Wed of Week 12 is the final test for Phase 3.
    if (isLastWeekOfPhase) {
      if ((mesocycle === 1 || mesocycle === 2) && dayName === 'Sat') {
        entry = TEST_SATURDAY;
      }
      if (mesocycle === 3 && dayName === 'Wed') {
        entry = TEST_SATURDAY;
      }
    }

    sessions.push({
      date,
      type: entry.type,
      title: entry.title,
      mesocycle_num: mesocycle
    });
  }
  return sessions;
}

export function buildFullSchedule(): SessionSeed[] {
  const all: SessionSeed[] = [];

  // Phase 1: Jun 10 (Wed) → Jul 7 (Tue) — 4 weeks
  for (let w = 0; w < 4; w++) {
    const weekStart = dateAddDays('2026-06-10', w * 7);
    const isLast = w === 3;
    const overrides = isLast ? DELOAD_TEMPLATE : null;
    all.push(...buildWeek(weekStart, PHASE1_TEMPLATE, overrides, 1, w + 1, isLast));
  }

  // Phase 2: Jul 8 → Aug 4 — 4 weeks
  for (let w = 0; w < 4; w++) {
    const weekStart = dateAddDays('2026-07-08', w * 7);
    const isLast = w === 3;
    const overrides = isLast ? DELOAD_TEMPLATE : null;
    all.push(...buildWeek(weekStart, PHASE2_TEMPLATE, overrides, 2, w + 1, isLast));
  }

  // Phase 3: Aug 5 → Sep 1 — 4 weeks
  for (let w = 0; w < 4; w++) {
    const weekStart = dateAddDays('2026-08-05', w * 7);
    const isLast = w === 3;
    // Phase 3 final week is a taper — special schedule
    const overrides = isLast
      ? {
          Mon: { type: 'pull-light' as SessionType, title: 'Pull · Taper — light touch only' },
          Tue: { type: 'mobility' as SessionType, title: 'Mobility only' },
          Wed: { type: 'test' as SessionType, title: 'Final Test — Tindeq + Pull-up + Critical Force' },
          Thu: { type: 'rest' as SessionType, title: 'Rest' },
          Fri: { type: 'rest' as SessionType, title: 'Rest — long mobility' },
          Sat: { type: 'climb-outdoor' as SessionType, title: 'Performance Day — best project' },
          Sun: { type: 'rest' as SessionType, title: 'Rest — Phase 3 review' }
        }
      : null;
    all.push(...buildWeek(weekStart, PHASE3_TEMPLATE, overrides, 3, w + 1, isLast));
  }

  return all;
}
