// Meso 1 — Hypertrophy Base (load ramp) after the back-joint adjustment.
// Cycle name stays "Re-entry" for DB continuity. Fri 4 Sep → Thu 1 Oct.
// Full size menu on Pull/Push/Run; loads ramp ~50% → ~90% of H2 Phase 1 normals.
// No hangboard, no climbing, no Abrahangs, no OHP, no added pull-up weight. 3–4 RIR.

import { addDays, format } from 'date-fns';
import type { SessionType, SetKind } from './types';
import { H2_CYCLE_NAME } from './resetPlan';

export { H2_CYCLE_NAME };

export const REENTRY_CYCLE_NAME = 'Re-entry';
export const REENTRY_START = '2026-09-04';
export const REENTRY_END = '2026-10-01';

export const REENTRY_CONSTRAINT =
  'Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Hypertrophy base: full size menu at ramped loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing, no OHP this block.';

type Week = 1 | 2 | 3 | 4;

/** Fraction of H2 Phase 1 Week-1 “normal” working load. */
const LOAD_FRAC: Record<Week, number> = {
  1: 0.5,
  2: 0.65,
  3: 0.825,
  4: 0.9
};

/** H2 Phase 1 Week-1 anchors (kg). DB row is a supported proxy for the old 50 kg barbell hinge. */
const NORMAL = {
  bench: 55,
  rowDb: 24,
  curl: 16,
  hammer: 9,
  lateral: 8,
  fly: 8,
  incline: 14
} as const;

export interface SeedSet {
  kind: SetKind;
  label: string;
  reps?: number;
  load_kg?: number;
  load_kg_added?: number;
  hold_seconds?: number;
  rest_seconds?: number;
  rpe?: number;
  notes?: string;
}

export interface SeedExercise {
  name: string;
  notes: string;
  sets: SeedSet[];
}

export interface ReentrySessionSpec {
  type: SessionType;
  title: string;
  notes: string;
  exercises: SeedExercise[];
}

export interface ReentryPhaseSeed {
  mesocycle_num: 1;
  name: string;
  short_name: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ReentrySessionSeed {
  date: string;
  mesocycle_num: 1;
  spec: ReentrySessionSpec;
}

const SESSION_NOTES = `**Hypertrophy Base · Meso 1.** ${REENTRY_CONSTRAINT}

Loads ramp toward H2 Phase 1 Week-1 normals (~50% → ~90%). Week 4 cuts volume, not identity. If the joint spoke, repeat the earlier week instead of progressing. H2 2026 is archived (Log → Previous plan).`;

function work(
  label: string,
  opts: Omit<SeedSet, 'kind' | 'label'> = {}
): SeedSet {
  return { kind: 'work', label, rpe: 6, ...opts };
}

function check(label: string, notes?: string): SeedSet {
  return { kind: 'checklist', label, notes };
}

/** Round to nearest 0.5 kg (plate-friendly). */
function kgAt(normal: number, week: Week): number {
  const raw = normal * LOAD_FRAC[week];
  return Math.max(1, Math.round(raw * 2) / 2);
}

function pullWarmup(): SeedExercise {
  return {
    name: 'Warm-up · conservative',
    notes:
      'No recruitment ladder to 95%. Tendon glides, band ER, scapular pull-ups only. Hangboard is parked this block.',
    sets: [
      check('Tendon glides — 10 reps each pattern'),
      check('Band ER + scapular retraction — 2 × 12'),
      check('Scapular pull-ups — 2 × 8')
    ]
  };
}

function pullUps(sets: number, reps: number, restFirst: number): SeedExercise {
  const rows: SeedSet[] = [];
  for (let i = 0; i < sets; i++) {
    rows.push(
      work(`Pull-up · BW · set ${i + 1}`, {
        reps,
        load_kg_added: 0,
        rest_seconds: i === 0 ? restFirst : 180
      })
    );
  }
  return {
    name: 'Pull-ups · bodyweight',
    notes:
      'No added weight this meso (Phase 1 normal was +18 kg). Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR. No dip belt.',
    sets: rows
  };
}

function curls(week: Week, rounds: number): SeedExercise {
  const curlKg = kgAt(NORMAL.curl, week);
  const hammerKg = kgAt(NORMAL.hammer, week);
  const reps = week >= 3 ? 12 : 10;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Bicep curl L · ${curlKg} kg · set ${i + 1}`, {
        reps,
        load_kg: curlKg,
        rest_seconds: 45
      })
    );
    sets.push(
      work(`Bicep curl R · ${curlKg} kg · set ${i + 1}`, {
        reps,
        load_kg: curlKg,
        rest_seconds: 60
      })
    );
  }
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Hammer curl L · ${hammerKg} kg · set ${i + 1}`, {
        reps: 10,
        load_kg: hammerKg,
        rest_seconds: 45
      })
    );
    sets.push(
      work(`Hammer curl R · ${hammerKg} kg · set ${i + 1}`, {
        reps: 10,
        load_kg: hammerKg,
        rest_seconds: 60
      })
    );
  }
  return {
    name: 'Curls',
    notes: `Hypertrophy arms. Phase 1 normal 16 / 9 kg. This week ~${Math.round(LOAD_FRAC[week] * 100)}%. Slow eccentric. 3–4 RIR.`,
    sets
  };
}

function forearms(week: Week): SeedExercise {
  const flexKg = kgAt(6, week); // light; no heavy Phase-1 anchor
  const extKg = kgAt(4, week);
  const rounds = week === 4 ? 1 : 2;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Wrist curl · ${flexKg} kg · set ${i + 1}`, {
        reps: 15,
        load_kg: flexKg,
        rest_seconds: 45
      })
    );
  }
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Wrist extensor · ${extKg} kg · set ${i + 1}`, {
        reps: 15,
        load_kg: extKg,
        rest_seconds: 45
      })
    );
  }
  return {
    name: 'Forearms',
    notes:
      'Wrist flexors + extensors. Light. Supported forearm on a bench. Full ROM, no elbow swing. Skip if tendons nag — pull grip already loads them.',
    sets
  };
}

function shortMobility(): SeedExercise {
  return {
    name: 'Mobility · 10 min',
    notes: 'Hip 90/90, hamstring active straight-leg, ankle wall test, stick dislocates. No Jefferson curl.',
    sets: [check('10 min · hips / hamstring / ankle / shoulders')]
  };
}

function pullA(week: Week): ReentrySessionSpec {
  const setCount = { 1: 4, 2: 5, 3: 5, 4: 3 }[week];
  const curlRounds = week === 4 ? 1 : 2;
  return {
    type: 'pull-heavy',
    title: 'Pull A — pulls, biceps, forearms',
    notes: SESSION_NOTES,
    exercises: [
      pullWarmup(),
      pullUps(setCount, 5, 120),
      curls(week, curlRounds),
      forearms(week),
      shortMobility()
    ]
  };
}

function pullB(week: Week): ReentrySessionSpec {
  const setCount = { 1: 3, 2: 3, 3: 4, 4: 2 }[week];
  const reps = { 1: 5, 2: 6, 3: 5, 4: 5 }[week];
  const birdRounds = week === 4 ? 2 : 3;
  const curlKg = kgAt(NORMAL.curl, week);
  const bird: SeedSet[] = [];
  for (let i = 0; i < birdRounds; i++) {
    bird.push(work(`Bird-dog L · round ${i + 1}`, { reps: 8, rest_seconds: 30 }));
    bird.push(work(`Bird-dog R · round ${i + 1}`, { reps: 8, rest_seconds: 45 }));
  }
  const easyCurl: SeedSet[] = [
    work(`Easy curl L · ${curlKg} kg`, { reps: 12, load_kg: curlKg, rest_seconds: 45 }),
    work(`Easy curl R · ${curlKg} kg`, { reps: 12, load_kg: curlKg, rest_seconds: 60 })
  ];
  return {
    type: 'pull-light',
    title: 'Pull B — light pulls, arms touch, bird-dog',
    notes: SESSION_NOTES,
    exercises: [
      pullWarmup(),
      pullUps(setCount, reps, 180),
      {
        name: 'Easy curls',
        notes: 'Second weekly biceps touch. One easy round. 3–4 RIR. Skip if elbows or the joint ask.',
        sets: week === 4 ? easyCurl.slice(0, 2) : easyCurl
      },
      {
        name: 'Bird-dog',
        notes:
          'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block.',
        sets: bird
      },
      shortMobility()
    ]
  };
}

function pushWarmup(): SeedExercise {
  return {
    name: 'Warm-up · push',
    notes: 'Band ER, scapular wall slides, one easy dip. No OHP.',
    sets: [
      check('Band ER + wall slides'),
      check('1 easy dip (range as comfort allows)')
    ]
  };
}

function looksLaterals(week: Week, rounds: number): SeedExercise {
  const kg = kgAt(NORMAL.lateral, week);
  const reps = week >= 3 ? 15 : 12;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Lateral raise L · ${kg} kg · set ${i + 1}`, {
        reps,
        load_kg: kg,
        rest_seconds: 30
      })
    );
    sets.push(
      work(`Lateral raise R · ${kg} kg · set ${i + 1}`, {
        reps,
        load_kg: kg,
        rest_seconds: 45
      })
    );
  }
  return {
    name: 'Seated DB lateral raise',
    notes:
      'Side delts — priority isolation. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause at the bottom. 3–4 RIR. Not the old 2 kg activation dose.',
    sets
  };
}

function looksFly(week: Week): SeedExercise {
  // Bent-arm floor fly replaces long-lever DB fly (therapist: 90° elbows, short lever).
  const kg = kgAt(NORMAL.fly, week);
  const reps = week >= 3 ? 15 : 12;
  const rounds = week === 4 ? 1 : 2;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Bent-arm floor fly L · ${kg} kg · set ${i + 1}`, {
        reps,
        load_kg: kg,
        rest_seconds: 30
      })
    );
    sets.push(
      work(`Bent-arm floor fly R · ${kg} kg · set ${i + 1}`, {
        reps,
        load_kg: kg,
        rest_seconds: 60
      })
    );
  }
  return {
    name: 'Bent-arm floor fly',
    notes:
      'Therapist-friendly pec work. Lie on the floor. Elbows locked ~90°, forearms vertical. Keep elbow angle fixed — only upper arms move. Floor stops the open (no long lever). 3–4 RIR. Skip if the chest knob speaks.',
    sets
  };
}

function looksInclinePress(week: Week): SeedExercise {
  const kg = kgAt(NORMAL.incline, week);
  const rounds = week === 4 ? 1 : 2;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Incline DB press L · ${kg} kg · set ${i + 1}`, {
        reps: week >= 3 ? 10 : 8,
        load_kg: kg,
        rest_seconds: 45
      })
    );
    sets.push(
      work(`Incline DB press R · ${kg} kg · set ${i + 1}`, {
        reps: week >= 3 ? 10 : 8,
        load_kg: kg,
        rest_seconds: 75
      })
    );
  }
  return {
    name: 'Incline DB press',
    notes:
      'Upper chest. Bench ~30°. Back supported. Left first. 3–4 RIR. The only hard press on Push B — not stacked on SA press, extra dips, or OHP.',
    sets
  };
}

function pushA(week: Week): ReentrySessionSpec {
  const rounds = { 1: 3, 2: 3, 3: 3, 4: 2 }[week];
  const dipReps = { 1: 5, 2: 6, 3: 7, 4: 5 }[week];
  const benchKg = kgAt(NORMAL.bench, week);
  const rowKg = kgAt(NORMAL.rowDb, week);
  const bssReps = { 1: 6, 2: 6, 3: 8, 4: 6 }[week];
  const bssRounds = week === 4 ? 1 : 2;
  const antagonistRounds = week === 4 ? 1 : 2;
  const lateralRounds = { 1: 3, 2: 4, 3: 4, 4: 2 }[week];

  const dips: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    dips.push(work(`R${i + 1} Dips · BW`, { reps: dipReps, rest_seconds: 120 }));
  }

  const horizontal: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    horizontal.push(
      work(`R${i + 1} DB / chest-supported row · ${rowKg} kg`, {
        reps: 8,
        load_kg: rowKg,
        rest_seconds: 0
      })
    );
    horizontal.push(
      work(`R${i + 1} Bench · ${benchKg} kg`, {
        reps: week >= 3 ? 8 : 6,
        load_kg: benchKg,
        rest_seconds: 180
      })
    );
  }

  const prehab: SeedSet[] = [];
  for (let i = 0; i < antagonistRounds; i++) {
    prehab.push(work(`Face pull · set ${i + 1}`, { reps: 15, rest_seconds: 45 }));
  }
  for (let i = 0; i < antagonistRounds; i++) {
    prehab.push(work(`Reverse fly · set ${i + 1}`, { reps: 12, rest_seconds: 45 }));
  }

  const bss: SeedSet[] = [];
  for (let i = 0; i < bssRounds; i++) {
    bss.push(
      work(`R${i + 1} Bulgarian R · BW (surgical first)`, {
        reps: bssReps,
        rest_seconds: 45,
        notes: '3-1-3 tempo'
      })
    );
    bss.push(
      work(`R${i + 1} Bulgarian L · BW`, {
        reps: bssReps,
        rest_seconds: 90,
        notes: '3-1-3 tempo'
      })
    );
  }

  return {
    type: 'push',
    title: 'Push A — dips, chest, delts, split squat',
    notes: SESSION_NOTES,
    exercises: [
      pushWarmup(),
      {
        name: 'Dips',
        notes:
          '3–4 RIR. Bodyweight only. No OHP this block — overhead pressing paused while the joint settles. Full rest between sets.',
        sets: dips
      },
      {
        name: 'Superset · Horizontal (Row + Bench)',
        notes: `Row is chest-supported or DB (proxy for old 50 kg hinge). Bench Phase 1 normal 55 kg — this week ~${Math.round(LOAD_FRAC[week] * 100)}%. 3–4 RIR.`,
        sets: horizontal
      },
      looksLaterals(week, lateralRounds),
      looksFly(week),
      {
        name: 'Antagonist + prehab',
        notes:
          'Rear-delt insurance. Wrist extensors live on Pull A forearms — not doubled here. Side delts are the seated laterals above.',
        sets: prehab
      },
      {
        name: 'Bulgarian split squat',
        notes:
          'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. Bodyweight, 3-1-3.',
        sets: bss
      },
      {
        name: 'Hip + hamstring mobility · 10–15 min',
        notes: '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow.',
        sets: [check('10–15 min · 90/90, hamstring, ankle')]
      }
    ]
  };
}

function pushB(week: Week): ReentrySessionSpec {
  const puSets = week === 4 ? 2 : 3;
  const puReps = { 1: 8, 2: 10, 3: 10, 4: 8 }[week];
  const bpaSets = week === 4 ? 2 : 3;
  const ytwSets = week === 4 ? 1 : 2;
  const lateralRounds = { 1: 3, 2: 4, 3: 4, 4: 2 }[week];

  const pushups: SeedSet[] = [];
  for (let i = 0; i < puSets; i++) {
    pushups.push(work(`Push-up · set ${i + 1}`, { reps: puReps, rest_seconds: 90 }));
  }

  const bands: SeedSet[] = [];
  for (let i = 0; i < bpaSets; i++) {
    bands.push(work(`Band pull-apart · set ${i + 1}`, { reps: 15, rest_seconds: 45 }));
  }
  for (let i = 0; i < ytwSets; i++) {
    bands.push(work(`Prone Y-T-W · 1 kg · set ${i + 1}`, { reps: 8, load_kg: 1, rest_seconds: 60 }));
  }

  return {
    type: 'push',
    title: 'Push B — push-ups, incline, delts',
    notes: SESSION_NOTES,
    exercises: [
      {
        name: 'Push-ups',
        notes:
          'Volume press. 3+ RIR. Knees-down is fine if the joint or a shoulder asks. Dips stay on Push A — not stacked here.',
        sets: pushups
      },
      looksInclinePress(week),
      looksLaterals(week, lateralRounds),
      {
        name: 'Shoulder insurance',
        notes: 'Band pull-aparts + prone Y-T-W. No extra run on this day.',
        sets: bands
      }
    ]
  };
}

function runDay(week: Week): ReentrySessionSpec {
  const runMin = { 1: 20, 2: 25, 3: 30, 4: 20 }[week];
  const pistolRounds = week === 4 ? 2 : 3;
  const pistolReps = { 1: 4, 2: 4, 3: 5, 4: 3 }[week];
  const pistolRange = { 1: '3–5', 2: '3–5', 3: '4–6', 4: '3' }[week];
  const boxNote =
    week === 3
      ? 'Box a bit lower only if weeks 1–2 were quiet on the joint and the knee. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first.'
      : 'High box / chair, above parallel. Heel down. One hand on a rack / doorframe / TRX. Surgical (R) first. If the last rep collapses or twists, the box is too low.';

  const pistol: SeedSet[] = [];
  for (let i = 0; i < pistolRounds; i++) {
    pistol.push(
      work(`Box pistol R · round ${i + 1} (${pistolRange})`, {
        reps: pistolReps,
        rest_seconds: 45,
        notes: '3 s down, pause, stand'
      })
    );
    pistol.push(
      work(`Box pistol L · round ${i + 1} (${pistolRange})`, {
        reps: pistolReps,
        rest_seconds: 60,
        notes: '3 s down, pause, stand'
      })
    );
  }

  return {
    type: 'run',
    title: 'Run — box pistol + easy run',
    notes: SESSION_NOTES,
    exercises: [
      {
        name: 'Ankle + deep-squat hold',
        notes:
          'Do this first. Assisted two-leg squat is the ROM the pistol sits on. If the two-leg squat needs a high hold, the pistol box stays high.',
        sets: [
          check('Ankle wall test · 1 min each'),
          check('Assisted deep-squat hold · 2 × 30 s')
        ]
      },
      {
        name: 'Box pistol · skill',
        notes: boxNote + ' No free pistol, no shrimp, no added load this block.',
        sets: pistol
      },
      {
        name: 'Mobility flow',
        notes:
          'No Jefferson curl. Light Cossack here is mobility, not a second strength set — slow, knee tracks the foot.',
        sets: [
          check('90/90 + pigeon + couch stretch'),
          check('Hamstring (no Jefferson curl)'),
          check('Cossack 3 × 4 slow · knee tracks foot'),
          check('Horse stance 3 × 30 s'),
          check('T-spine + stick dislocates')
        ]
      },
      {
        name: 'Easy run',
        notes: `Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.`,
        sets: [check(`Easy run ${runMin} min · walk breaks OK`)]
      }
    ]
  };
}

function restDay(): ReentrySessionSpec {
  return {
    type: 'rest',
    title: 'Rest',
    notes: `${SESSION_NOTES}

Optional 20–30 min walk. No “I’ll just do curls.”`,
    exercises: []
  };
}

const WEEK_DAYS: Array<(week: Week) => ReentrySessionSpec> = [
  pullA,
  pushA,
  runDay,
  pullB,
  pushB,
  runDay,
  () => restDay()
];

export function buildReentryPlan(): {
  phases: ReentryPhaseSeed[];
  sessions: ReentrySessionSeed[];
} {
  const start = new Date(REENTRY_START + 'T00:00:00');
  const phases: ReentryPhaseSeed[] = [
    {
      mesocycle_num: 1,
      name: 'Hypertrophy Base — load ramp',
      short_name: 'REENTRY',
      start_date: REENTRY_START,
      end_date: REENTRY_END,
      description:
        'Meso 1 of the new macrocycle. Pull → Push → Run twice, then rest. Full size menu (chest, side delts, biceps, forearms) at ~50%→~90% of H2 Phase 1 loads. Week 4 volume deload. No hangboard, climbing, OHP, or weighted pulls. Next meso is a separate decision after Week 4.'
    }
  ];

  const sessions: ReentrySessionSeed[] = [];
  for (let i = 0; i < 28; i++) {
    const week = (Math.floor(i / 7) + 1) as Week;
    sessions.push({
      date: format(addDays(start, i), 'yyyy-MM-dd'),
      mesocycle_num: 1,
      spec: WEEK_DAYS[i % 7](week)
    });
  }

  return { phases, sessions };
}
