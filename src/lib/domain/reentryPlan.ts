// Conservative 4-week re-entry after the back-joint adjustment.
// Locked with Martin 2026-08-28; start shifted to Wed 2 Sep (2026-09-01 +1, then +1).
// Not a performance block. No hangboard, no climbing, no Abrahangs. Stop if the joint speaks.
// Push days include extra chest + side-delt looks work at 3–4 RIR.

import { addDays, format } from 'date-fns';
import type { SessionType, SetKind } from './types';
import { H2_CYCLE_NAME } from './resetPlan';

export { H2_CYCLE_NAME };

export const REENTRY_CYCLE_NAME = 'Re-entry';
export const REENTRY_START = '2026-09-02';
export const REENTRY_END = '2026-09-29';

export const REENTRY_CONSTRAINT =
  'Back joint still being adjusted. Doctor cleared training for blood flow and to keep the joint seated. Light loads, 3–4 RIR. Stop if the joint speaks. No hangboard, no climbing this block.';

type Week = 1 | 2 | 3 | 4;

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

const SESSION_NOTES = `**Re-entry · conservative.** ${REENTRY_CONSTRAINT}

H2 2026 is archived (Log → Previous plan). Week 2–3 loads assume the previous week was quiet — if the joint spoke, repeat the earlier week instead of progressing.`;

function work(
  label: string,
  opts: Omit<SeedSet, 'kind' | 'label'> = {}
): SeedSet {
  return { kind: 'work', label, rpe: 6, ...opts };
}

function check(label: string, notes?: string): SeedSet {
  return { kind: 'checklist', label, notes };
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
      'No added weight. Dead-hang start, chin over bar, controlled negative. Stop at 3+ RIR — if 5 is hard, do 3–4. No dip belt.',
    sets: rows
  };
}

function curls(week: Week): SeedExercise {
  const reps = week === 3 ? 12 : 10;
  const rounds = week === 4 ? 1 : 2;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Bicep curl L · 12 kg · set ${i + 1}`, {
        reps,
        load_kg: 12,
        rest_seconds: 60
      })
    );
    sets.push(
      work(`Bicep curl R · 12 kg · set ${i + 1}`, {
        reps,
        load_kg: 12,
        rest_seconds: 60
      })
    );
  }
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Hammer curl L · 8 kg · set ${i + 1}`, {
        reps: 10,
        load_kg: 8,
        rest_seconds: 60
      })
    );
    sets.push(
      work(`Hammer curl R · 8 kg · set ${i + 1}`, {
        reps: 10,
        load_kg: 8,
        rest_seconds: 60
      })
    );
  }
  return {
    name: 'Curls',
    notes: 'Was 16 kg / 9 kg in H2 Week 1. Slow eccentric. Stop with reps in reserve.',
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
  return {
    type: 'pull-heavy',
    title: 'Pull A — bodyweight pulls + curls',
    notes: SESSION_NOTES,
    exercises: [
      pullWarmup(),
      pullUps(setCount, 5, 120),
      curls(week),
      shortMobility()
    ]
  };
}

function pullB(week: Week): ReentrySessionSpec {
  const setCount = { 1: 3, 2: 3, 3: 4, 4: 2 }[week];
  const reps = { 1: 5, 2: 6, 3: 5, 4: 5 }[week];
  const birdRounds = week === 4 ? 2 : 3;
  const bird: SeedSet[] = [];
  for (let i = 0; i < birdRounds; i++) {
    bird.push(work(`Bird-dog L · round ${i + 1}`, { reps: 8, rest_seconds: 30 }));
    bird.push(work(`Bird-dog R · round ${i + 1}`, { reps: 8, rest_seconds: 45 }));
  }
  return {
    type: 'pull-light',
    title: 'Pull B — light pulls + bird-dog',
    notes: SESSION_NOTES,
    exercises: [
      pullWarmup(),
      pullUps(setCount, reps, 180),
      {
        name: 'Bird-dog',
        notes:
          'Spine-friendly core. Opposite arm/leg, long spine, no rotation hunt. Hollow hold and hanging leg raise stay out this block. Pallof stays out unless anti-rotation is obviously quiet.',
        sets: bird
      },
      shortMobility()
    ]
  };
}

function pushWarmup(): SeedExercise {
  return {
    name: 'Warm-up · push',
    notes: 'Band ER, scapular wall slides, one easy dip.',
    sets: [
      check('Band ER + wall slides'),
      check('1 easy dip (range as comfort allows)')
    ]
  };
}

function looksLaterals(week: Week, rounds: number): SeedExercise {
  const kg = week === 3 ? 7 : 6;
  const reps = week === 3 ? 15 : 12;
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
      'Looks work — side delts. Sit so the spine stays quiet. Slight elbow bend, raise to just below shoulder height, no shrug, no swing. Pause a beat at the bottom (stretch). 3–4 RIR. Training load, not the old 2 kg activation dose.',
    sets
  };
}

function looksFly(week: Week): SeedExercise {
  const kg = 8;
  const reps = week === 3 ? 15 : 12;
  const rounds = week === 4 ? 1 : 2;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`DB fly L · ${kg} kg · set ${i + 1}`, {
        reps,
        load_kg: kg,
        rest_seconds: 30
      })
    );
    sets.push(
      work(`DB fly R · ${kg} kg · set ${i + 1}`, {
        reps,
        load_kg: kg,
        rest_seconds: 60
      })
    );
  }
  return {
    name: 'DB fly',
    notes:
      'Looks work — pec sweep. Flat or slight-incline. Soft elbows, stop when the stretch is honest — do not dump into the anterior shoulder. 10–15 reps, 3–4 RIR. Skip if a pec or the joint nags.',
    sets
  };
}

function looksInclinePress(week: Week): SeedExercise {
  const kg = week === 3 ? 12 : 10;
  const rounds = week === 4 ? 1 : 2;
  const sets: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push(
      work(`Incline DB press L · ${kg} kg · set ${i + 1}`, {
        reps: 8,
        load_kg: kg,
        rest_seconds: 45
      })
    );
    sets.push(
      work(`Incline DB press R · ${kg} kg · set ${i + 1}`, {
        reps: 8,
        load_kg: kg,
        rest_seconds: 75
      })
    );
  }
  return {
    name: 'Incline DB press',
    notes:
      'Looks work — upper chest. Bench ~30°. Back supported. Left first. Lower the DBs deeper than the chest if the shoulder allows. 3–4 RIR. The only hard press on Push B — not stacked on SA press or extra dips.',
    sets
  };
}

function pushA(week: Week): ReentrySessionSpec {
  const rounds = { 1: 3, 2: 3, 3: 3, 4: 2 }[week];
  const dipReps = { 1: 5, 2: 6, 3: 6, 4: 5 }[week];
  const ohpKg = { 1: 20, 2: 20, 3: 22.5, 4: 20 }[week];
  const ohpReps = { 1: 6, 2: 8, 3: 6, 4: 6 }[week];
  const benchKg = { 1: 35, 2: 37.5, 3: 37.5, 4: 35 }[week];
  const bssReps = { 1: 6, 2: 6, 3: 8, 4: 6 }[week];
  const bssRounds = week === 4 ? 1 : 2;
  const antagonistRounds = week === 4 ? 1 : 2;

  const vertical: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    vertical.push(work(`R${i + 1} Dips · BW`, { reps: dipReps, rest_seconds: 0 }));
    vertical.push(
      work(`R${i + 1} OHP · ${ohpKg} kg`, {
        reps: ohpReps,
        load_kg: ohpKg,
        rest_seconds: 180
      })
    );
  }

  const horizontal: SeedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    horizontal.push(
      work(`R${i + 1} DB / chest-supported row · 16 kg`, {
        reps: 8,
        load_kg: 16,
        rest_seconds: 0
      })
    );
    horizontal.push(
      work(`R${i + 1} Bench · ${benchKg} kg`, {
        reps: 6,
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
  for (let i = 0; i < antagonistRounds; i++) {
    prehab.push(work(`Wrist extensors · set ${i + 1}`, { reps: 15, rest_seconds: 45 }));
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
    title: 'Push A — press, chest, delts, split squat',
    notes: SESSION_NOTES,
    exercises: [
      pushWarmup(),
      {
        name: 'Superset A · Vertical (Dips + OHP)',
        notes: '3–4 RIR. No added weight on dips. OHP well under the old 30 kg Week-1 load.',
        sets: vertical
      },
      {
        name: 'Superset B · Horizontal (Row + Bench)',
        notes:
          'Row is chest-supported or DB — more upright than the old 50 kg barbell hinge. Bench well under the old 55 kg.',
        sets: horizontal
      },
      looksLaterals(week, { 1: 3, 2: 4, 3: 4, 4: 2 }[week]),
      looksFly(week),
      {
        name: 'Antagonist + prehab',
        notes:
          'Rear-delt + elbow insurance. Side-delt looks work is the seated lateral raise above — not a 2 kg activation dose.',
        sets: prehab
      },
      {
        name: 'Bulgarian split squat',
        notes:
          'The strength single-leg for this block. Surgical (R) first. Knee tracks over middle toe. No step-up — pistol skill lives on the run days. Bodyweight, 3-1-3.',
        sets: bss
      },
      {
        name: 'Hip + hamstring mobility · 10–15 min',
        notes: '90/90, hamstring, ankle. Cossack / horse stance wait for the run-day flow so they do not stack on the split squat.',
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
          'The one leftover volume press. 3+ RIR. Knees-down is fine if the joint or a shoulder asks. Dips stay on Push A — not stacked here.',
        sets: pushups
      },
      looksInclinePress(week),
      looksLaterals(week, { 1: 3, 2: 4, 3: 4, 4: 2 }[week]),
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
        notes:
          `Conversational, ≤8:30/km. Walk breaks are the session, not a failure. If the joint or knee nags, cut to a brisk walk of the same time. Soft surface if you have it.`,
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
      name: 'Re-entry — conservative base',
      short_name: 'REENTRY',
      start_date: REENTRY_START,
      end_date: REENTRY_END,
      description:
        'Four weeks. Pull → Push → Run twice, then rest. Bodyweight pulls, light push loads, box-pistol skill, easy running. Hangboard and climbing parked. Stop if the joint speaks. Next block is a separate decision after Week 4.'
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
