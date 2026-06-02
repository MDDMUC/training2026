// Prescription generator — turns a scheduled session into exercises + sets.
// Phase 1 (Base + Tendon Prep, Jun 8 – Jul 5, 2026) is detailed here.
// Phase 2 and 3 detailed prescriptions get added after each phase's test session.

import type { SessionType, SetKind } from './types';

export interface PrescribedSet {
  set_num: number;
  kind: SetKind;
  label?: string;
  reps?: number;
  load_kg?: number;
  load_kg_added?: number;
  hold_seconds?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface PrescribedExercise {
  name: string;
  display_order: number;
  notes?: string;
  sets: PrescribedSet[];
}

export interface PrescribedSession {
  exercises: PrescribedExercise[];
}

// Baseline metrics — captured 2026-05-28 and used to drive Phase 1 loads.
// Phase 2 + 3 re-derive these from each phase's test session.
export const BASELINE = {
  body_weight_kg: 82,
  tindeq_r_kg: 55,
  tindeq_l_kg: 52,
  pullup_1rm_added_kg: 35
};

// MVC fractions — round to nearest 0.5 kg for Tindeq targets.
function round05(x: number): number {
  return Math.round(x * 2) / 2;
}
export const TARGETS = {
  density_75_l: round05(BASELINE.tindeq_l_kg * 0.75), // 39.0
  density_75_r: round05(BASELINE.tindeq_r_kg * 0.75), // 41.5 ≈ 41.0 (we want 41.3, use 41)
  iso_70_l: round05(BASELINE.tindeq_l_kg * 0.7),     // 36.5
  iso_70_r: round05(BASELINE.tindeq_r_kg * 0.7)      // 38.5
};

// Phase 1 weekly progression: density-hang sets × hold-seconds, pull-up working load.
interface Phase1WeekParams {
  density_sets: number;     // total sets across L/R/half/open
  density_hold_s: number;
  density_edge_mm: number;
  pull_working_added: number;
  pull_working_reps: number;
  pull_working_sets: number;
  iso_sets_per_hand: number;
  iso_hold_s: number;
}

const PHASE1_WEEK: Record<number, Phase1WeekParams> = {
  1: { density_sets: 4, density_hold_s: 20, density_edge_mm: 25, pull_working_added: 18, pull_working_reps: 6, pull_working_sets: 3, iso_sets_per_hand: 4, iso_hold_s: 6 },
  2: { density_sets: 5, density_hold_s: 25, density_edge_mm: 25, pull_working_added: 20, pull_working_reps: 6, pull_working_sets: 3, iso_sets_per_hand: 5, iso_hold_s: 6 },
  3: { density_sets: 6, density_hold_s: 30, density_edge_mm: 20, pull_working_added: 22, pull_working_reps: 6, pull_working_sets: 3, iso_sets_per_hand: 5, iso_hold_s: 7 },
  4: { density_sets: 3, density_hold_s: 20, density_edge_mm: 25, pull_working_added: 15, pull_working_reps: 5, pull_working_sets: 3, iso_sets_per_hand: 3, iso_hold_s: 6 }
};

// ============================================================================
// Reusable building blocks
// ============================================================================

function hooperWarmup(order: number): PrescribedExercise {
  return {
    name: 'Warm-up · Hooper 3-step',
    display_order: order,
    notes: 'Tendon glides, band external rotation, recruitment pulls.',
    sets: [
      { set_num: 1, kind: 'checklist', label: 'Tendon glides — 10 reps each pattern' },
      { set_num: 2, kind: 'checklist', label: 'Band ER + scapular retraction — 2 × 12' },
      {
        set_num: 3,
        kind: 'checklist',
        label: 'Recruitment pulls — 5 ascending sets @ 30/50/70/85/95% effort, 2 min rest'
      }
    ]
  };
}

function shortMobility(order: number): PrescribedExercise {
  return {
    name: 'Mobility · 10 min',
    display_order: order,
    notes: 'Hip 90/90, hamstring active straight-leg, ankle wall test.',
    sets: [{ set_num: 1, kind: 'checklist', label: '10 min mobility flow' }]
  };
}

function densityHangs(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const p = PHASE1_WEEK[week];
  const sets: PrescribedSet[] = [];
  // Cycle L · R · L · R, alternating half-crimp / open-hand pairs.
  // For 4 sets: L-half, R-half, L-open, R-open
  // For 5 sets: L-half, R-half, L-open, R-open, L-half
  // For 6 sets: L-half, R-half, L-open, R-open, L-half, R-half
  const pattern: Array<{ hand: 'L' | 'R'; grip: 'half-crimp' | 'open-hand' }> = [];
  for (let i = 0; i < p.density_sets; i++) {
    const hand = i % 2 === 0 ? 'L' : 'R';
    const grip = i < 2 || i >= 4 ? 'half-crimp' : 'open-hand';
    pattern.push({ hand, grip });
  }
  pattern.forEach((s, i) => {
    const target = s.hand === 'L' ? TARGETS.density_75_l : TARGETS.density_75_r;
    sets.push({
      set_num: i + 1,
      kind: 'work',
      label: `${s.hand} · ${s.grip}`,
      reps: 2,
      load_kg: target,
      hold_seconds: p.density_hold_s,
      rest_seconds: 180
    });
  });
  return {
    name: `Density Hangs · ${p.density_edge_mm} mm edge`,
    display_order: order,
    notes: `Tindeq target ~75% MVC: L ${TARGETS.density_75_l} kg, R ${TARGETS.density_75_r} kg. 2 reps per set to failure, 10–15 s between reps, 3 min between sets. **L hand first.** 24-hour pain rule applies.`,
    sets
  };
}

function weightedPullsHeavy(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const p = PHASE1_WEEK[week];
  const sets: PrescribedSet[] = [];
  let n = 1;
  if (week < 4) {
    // Warm-up pyramid
    [0, 5, 10, 15].forEach((added) => {
      sets.push({ set_num: n++, kind: 'warmup', label: `+${added} kg`, reps: 5, load_kg_added: added, rest_seconds: 120 });
    });
    // Working sets
    for (let i = 0; i < p.pull_working_sets; i++) {
      sets.push({
        set_num: n++,
        kind: 'work',
        label: `Working`,
        reps: p.pull_working_reps,
        load_kg_added: p.pull_working_added,
        rest_seconds: 240
      });
    }
    // Backoff
    sets.push({ set_num: n++, kind: 'backoff', label: 'Backoff', reps: 6, load_kg_added: 10, rest_seconds: 120 });
  } else {
    // Deload: simple 3 working sets, no pyramid, no backoff
    for (let i = 0; i < p.pull_working_sets; i++) {
      sets.push({
        set_num: n++,
        kind: 'work',
        reps: p.pull_working_reps,
        load_kg_added: p.pull_working_added,
        rest_seconds: 180
      });
    }
  }
  return {
    name: 'Weighted Pull-ups',
    display_order: order,
    notes: 'Strict form: 3 s up, 1 s top, 3 s down. No kipping.',
    sets
  };
}

function bicepCurls(order: number): PrescribedExercise {
  return {
    name: 'Bicep Curls · 16 kg',
    display_order: order,
    notes: 'Slow eccentric. Each set per arm.',
    sets: [
      { set_num: 1, kind: 'work', label: 'L arm', reps: 12, load_kg: 16, rest_seconds: 60 },
      { set_num: 2, kind: 'work', label: 'R arm', reps: 12, load_kg: 16, rest_seconds: 60 },
      { set_num: 3, kind: 'work', label: 'L arm', reps: 12, load_kg: 16, rest_seconds: 60 },
      { set_num: 4, kind: 'work', label: 'R arm', reps: 12, load_kg: 16, rest_seconds: 60 }
    ]
  };
}

function hammerCurls(order: number): PrescribedExercise {
  return {
    name: 'Hammer Curls · 9 kg',
    display_order: order,
    notes: 'Brachialis / brachioradialis focus.',
    sets: [
      { set_num: 1, kind: 'work', label: 'L arm', reps: 12, load_kg: 9, rest_seconds: 60 },
      { set_num: 2, kind: 'work', label: 'R arm', reps: 12, load_kg: 9, rest_seconds: 60 },
      { set_num: 3, kind: 'work', label: 'L arm', reps: 12, load_kg: 9, rest_seconds: 60 },
      { set_num: 4, kind: 'work', label: 'R arm', reps: 12, load_kg: 9, rest_seconds: 60 }
    ]
  };
}

function asymmetryIsos(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const p = PHASE1_WEEK[week];
  const sets: PrescribedSet[] = [];
  let n = 1;
  // L first, then R
  for (let i = 0; i < p.iso_sets_per_hand; i++) {
    sets.push({
      set_num: n++,
      kind: 'work',
      label: 'L · half-crimp',
      hold_seconds: p.iso_hold_s,
      load_kg: TARGETS.iso_70_l,
      rest_seconds: 90
    });
  }
  for (let i = 0; i < p.iso_sets_per_hand; i++) {
    sets.push({
      set_num: n++,
      kind: 'work',
      label: 'R · half-crimp',
      hold_seconds: p.iso_hold_s,
      load_kg: TARGETS.iso_70_r,
      rest_seconds: 90
    });
  }
  return {
    name: 'Tindeq Asymmetry Isos · 20 mm',
    display_order: order,
    notes: `~70% MVC: L ${TARGETS.iso_70_l} kg, R ${TARGETS.iso_70_r} kg. L hand first, fully rested.`,
    sets
  };
}

function weightedPullsLight(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const added = week === 4 ? 10 : 12;
  return {
    name: 'Weighted Pull-ups · Light',
    display_order: order,
    notes: '2–3 RIR. Volume work, not max effort.',
    sets: [
      { set_num: 1, kind: 'work', reps: 6, load_kg_added: added, rest_seconds: 180 },
      { set_num: 2, kind: 'work', reps: 6, load_kg_added: added, rest_seconds: 180 },
      { set_num: 3, kind: 'work', reps: 6, load_kg_added: added, rest_seconds: 180 }
    ]
  };
}

function pushSupersetA(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const isDeload = week === 4;
  const sets: PrescribedSet[] = [];
  const rounds = isDeload ? 1 : 3;
  for (let i = 0; i < rounds; i++) {
    sets.push({ set_num: i * 2 + 1, kind: 'work', label: `R${i + 1} Dips`, reps: 7, rest_seconds: 0 });
    sets.push({ set_num: i * 2 + 2, kind: 'work', label: `R${i + 1} OHP 30 kg`, reps: 7, load_kg: 30, rest_seconds: 180 });
  }
  return {
    name: 'Superset A · Vertical (Dips + OHP)',
    display_order: order,
    notes: '5–8 reps @ 1–2 RIR. 3 min rest between rounds.',
    sets
  };
}

function pushSupersetB(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const isDeload = week === 4;
  const sets: PrescribedSet[] = [];
  const rounds = isDeload ? 1 : 3;
  for (let i = 0; i < rounds; i++) {
    sets.push({ set_num: i * 2 + 1, kind: 'work', label: `R${i + 1} Row 50 kg`, reps: 7, load_kg: 50, rest_seconds: 0 });
    sets.push({ set_num: i * 2 + 2, kind: 'work', label: `R${i + 1} Bench 55 kg`, reps: 7, load_kg: 55, rest_seconds: 180 });
  }
  return {
    name: 'Superset B · Horizontal (Row + Bench)',
    display_order: order,
    notes: '5–8 reps @ 1–2 RIR. 3 min rest between rounds.',
    sets
  };
}

/**
 * Antagonist · Shoulder Balance — evidence-based revision (2026-05-28).
 *
 * Replaces the previous lateral-raise-heavy block. New emphasis:
 *  - Band external rotation at 0° abduction (Wong & Ng 2009 — climbers have
 *    ER:IR 0.79 vs 1.03 in non-climbers; needs strength-load ER, not 2 kg
 *    lateral raises masquerading as prehab)
 *  - Push-up plus / serratus protraction (Decker EMG, Cools JOSPT 2003 — highest
 *    EMG serratus exercise; addresses scapular winging endemic to climbers)
 *  - Prone Y raise (Hwang & Jeon IES 2024 — most lower-trap-selective; balances
 *    the over-recruited upper trap from pulling)
 *  - Trimmed lateral raise + reverse fly volume (the previous 4×14 @ 2 kg was
 *    not a productive use of sets on a healthy deltoid)
 *
 * See context/research_antagonist_balance.md for the full evidence base.
 */
function antagonistAndPrehab(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  if (week === 4) {
    return {
      name: 'Antagonist · Deload — skip',
      display_order: order,
      notes: 'Skip antagonist supersets in deload week.',
      sets: [{ set_num: 1, kind: 'checklist', label: 'Skipped (deload)' }]
    };
  }
  return {
    name: 'Antagonist · Shoulder Balance',
    display_order: order,
    notes:
      '**External rotation first** at strength load, not 2 kg prehab load. ' +
      'Use the thickest rubber band you can do 10 strict reps with — pin elbow to side, forearm parallel to floor. ' +
      'Push-up plus = full push-up, then drive the shoulder blades apart at the top (the "plus"). ' +
      'Prone Y is on a bench face-down, thumbs up, lift arms in a Y — strict scapular set, no shrug. ' +
      'Bases: Wong & Ng 2009 (ER deficit), Cools 2003 (serratus EMG), Hwang & Jeon 2024 (lower trap).',
    sets: [
      // External rotation at 0° abduction — strength load (rubber band)
      { set_num: 1, kind: 'work', label: 'Band ER L · elbow at side', reps: 10, rest_seconds: 45 },
      { set_num: 2, kind: 'work', label: 'Band ER R · elbow at side', reps: 10, rest_seconds: 45 },
      { set_num: 3, kind: 'work', label: 'Band ER L · elbow at side', reps: 10, rest_seconds: 45 },
      { set_num: 4, kind: 'work', label: 'Band ER R · elbow at side', reps: 10, rest_seconds: 45 },
      { set_num: 5, kind: 'work', label: 'Band ER L · elbow at side', reps: 10, rest_seconds: 45 },
      { set_num: 6, kind: 'work', label: 'Band ER R · elbow at side', reps: 10, rest_seconds: 45 },
      // Push-up plus — serratus / scap protraction
      { set_num: 7, kind: 'work', label: 'Push-up plus', reps: 10, rest_seconds: 60 },
      { set_num: 8, kind: 'work', label: 'Push-up plus', reps: 10, rest_seconds: 60 },
      { set_num: 9, kind: 'work', label: 'Push-up plus', reps: 10, rest_seconds: 60 },
      // Prone Y raise — lower trap
      { set_num: 10, kind: 'work', label: 'Prone Y raise · 1 kg', reps: 12, load_kg: 1, rest_seconds: 60 },
      { set_num: 11, kind: 'work', label: 'Prone Y raise · 1 kg', reps: 12, load_kg: 1, rest_seconds: 60 },
      // Trimmed lateral + reverse fly (was 4×14 LR + 2×12 RF, now 2×12 LR + 1×12 RF)
      { set_num: 12, kind: 'work', label: 'Lateral raise L · 2 kg', reps: 12, load_kg: 2, rest_seconds: 45 },
      { set_num: 13, kind: 'work', label: 'Lateral raise R · 2 kg', reps: 12, load_kg: 2, rest_seconds: 45 },
      { set_num: 14, kind: 'work', label: 'Lateral raise L · 2 kg', reps: 12, load_kg: 2, rest_seconds: 45 },
      { set_num: 15, kind: 'work', label: 'Lateral raise R · 2 kg', reps: 12, load_kg: 2, rest_seconds: 45 },
      { set_num: 16, kind: 'work', label: 'Reverse fly', reps: 12, rest_seconds: 60 }
    ]
  };
}

/**
 * Forearm + Finger Extensor Balance — evidence-based revision (2026-05-28).
 *
 * The big change: add isolated FINGER extensor work (digit extensors, distinct
 * from the wrist extensors already trained). Devise et al. (Frontiers 2023,
 * n=78) found climbers' flexor:extensor ratio is 6.27:1 vs ~3.7:1 in untrained,
 * and only EXTENSOR-ISOLATED training at 80% MES, 2×/week, ~15 min sessions
 * rebalances it. Paired training improves both sides but doesn't shift the ratio.
 *
 * Hardware caveat: Martin has rubber bands but no graded extensor device (no
 * Tindeq attachment, no Theraband FlexBar). The protocol scales around band
 * tension and progression — start with the thinnest band that lets you reach 15
 * reps at hard effort, progress band thickness over weeks. A graded device
 * (Tindeq extensor attachment, or EZ-grip) would be a future upgrade.
 *
 * Eccentric flexor wrist curl replaces the prior generic flexor wrist curl —
 * eccentric loading is the mechanism behind the "Reverse Tyler Twist" (Tyler et
 * al. 2014) protocol for medial epicondylitis ("climber's elbow"). Without a
 * FlexBar we use a dumbbell with a 5-second eccentric.
 *
 * Scheduling: 2×/week (Tue + Thu) per Devise. Skipped in deload weeks.
 *
 * See context/research_antagonist_balance.md for the full evidence base.
 */
function forearmBalance(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  if (week === 4) {
    return {
      name: 'Forearm + Extensor Balance · Deload',
      display_order: order,
      notes: 'Skip in deload week.',
      sets: [{ set_num: 1, kind: 'checklist', label: 'Skipped (deload)' }]
    };
  }
  return {
    name: 'Forearm + Extensor Balance',
    display_order: order,
    notes:
      '**Three movements, all priority.** ' +
      '(1) Wrist extensor curls — palm down, slow tempo (3 s up · 1 s top · 3 s down). ' +
      '(2) Rubber-band finger extensions — all fingers spread the band wide and slow, full ROM, hardest band you can do 15 strict reps with. ' +
      'Progress band thickness over weeks. (No FlexBar / Tindeq attachment yet — band is the load mechanism.) ' +
      '(3) Eccentric flexor wrist curl — palm up, **5-second lowering**, light concentric. ' +
      'This is the climber\'s-elbow (medial epicondylitis) prehab — eccentric loading per the Reverse Tyler Twist protocol (Tyler 2014). ' +
      'Stop ≥ 2 reps in reserve on all.',
    sets: [
      // Wrist EXTENSION — primary extensor builder
      { set_num: 1, kind: 'work', label: 'Wrist extension L · palm down', reps: 15, load_kg: 5, rest_seconds: 60 },
      { set_num: 2, kind: 'work', label: 'Wrist extension R · palm down', reps: 15, load_kg: 5, rest_seconds: 60 },
      { set_num: 3, kind: 'work', label: 'Wrist extension L · palm down', reps: 15, load_kg: 5, rest_seconds: 60 },
      { set_num: 4, kind: 'work', label: 'Wrist extension R · palm down', reps: 15, load_kg: 5, rest_seconds: 60 },
      // FINGER extensors — rubber band (Devise 2023 isolated extensor protocol)
      { set_num: 5, kind: 'work', label: 'Finger extensions L · rubber band', reps: 15, rest_seconds: 45 },
      { set_num: 6, kind: 'work', label: 'Finger extensions R · rubber band', reps: 15, rest_seconds: 45 },
      { set_num: 7, kind: 'work', label: 'Finger extensions L · rubber band', reps: 15, rest_seconds: 45 },
      { set_num: 8, kind: 'work', label: 'Finger extensions R · rubber band', reps: 15, rest_seconds: 45 },
      { set_num: 9, kind: 'work', label: 'Finger extensions L · rubber band', reps: 15, rest_seconds: 45 },
      { set_num: 10, kind: 'work', label: 'Finger extensions R · rubber band', reps: 15, rest_seconds: 45 },
      // Eccentric flexor wrist curl — medial epicondylitis prehab
      { set_num: 11, kind: 'work', label: 'Eccentric flexor curl L · 5 s lower', reps: 15, load_kg: 7, rest_seconds: 60 },
      { set_num: 12, kind: 'work', label: 'Eccentric flexor curl R · 5 s lower', reps: 15, load_kg: 7, rest_seconds: 60 },
      { set_num: 13, kind: 'work', label: 'Eccentric flexor curl L · 5 s lower', reps: 15, load_kg: 7, rest_seconds: 60 },
      { set_num: 14, kind: 'work', label: 'Eccentric flexor curl R · 5 s lower', reps: 15, load_kg: 7, rest_seconds: 60 }
    ]
  };
}

/**
 * Single-leg RDL — bilateral posterior chain + ACL maturity work.
 *
 * Climbers chronically under-train hamstrings and glutes. For Martin's L knee
 * (ACL reconstructed), unilateral hinge work continues the late-stage return-
 * to-sport progression (Grindem et al., BJSM 2016). Light DB to start.
 * Skipped in deload weeks.
 */
function singleLegRDL(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  if (week === 4) {
    return {
      name: 'Single-leg RDL · Deload — skip',
      display_order: order,
      notes: 'Skip in deload week.',
      sets: [{ set_num: 1, kind: 'checklist', label: 'Skipped (deload)' }]
    };
  }
  return {
    name: 'Single-leg RDL',
    display_order: order,
    notes:
      'Hinge from the hip, soft knee, spine neutral — the standing leg\'s hamstring should bite hard. ' +
      'Light DB in opposite hand (offset load). 8 reps per side, alternating, 3 rounds. ' +
      'Slow tempo. If balance is the limit, hold a wall lightly with the free hand.',
    sets: [
      { set_num: 1, kind: 'work', label: 'R1 SL RDL L · 5 kg DB', reps: 8, load_kg: 5, rest_seconds: 60 },
      { set_num: 2, kind: 'work', label: 'R1 SL RDL R · 5 kg DB', reps: 8, load_kg: 5, rest_seconds: 60 },
      { set_num: 3, kind: 'work', label: 'R2 SL RDL L · 5 kg DB', reps: 8, load_kg: 5, rest_seconds: 60 },
      { set_num: 4, kind: 'work', label: 'R2 SL RDL R · 5 kg DB', reps: 8, load_kg: 5, rest_seconds: 60 },
      { set_num: 5, kind: 'work', label: 'R3 SL RDL L · 5 kg DB', reps: 8, load_kg: 5, rest_seconds: 60 },
      { set_num: 6, kind: 'work', label: 'R3 SL RDL R · 5 kg DB', reps: 8, load_kg: 5, rest_seconds: 60 }
    ]
  };
}

function singleLegKnee(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const rounds = week === 4 ? 1 : 2;
  const sets: PrescribedSet[] = [];
  for (let i = 0; i < rounds; i++) {
    sets.push({ set_num: i * 4 + 1, kind: 'work', label: `R${i + 1} Bulgarian L · BW`, reps: 8, notes: '3-1-3 tempo' });
    sets.push({ set_num: i * 4 + 2, kind: 'work', label: `R${i + 1} Bulgarian R · BW`, reps: 8, notes: '3-1-3 tempo' });
    sets.push({ set_num: i * 4 + 3, kind: 'work', label: `R${i + 1} Step-up L`, reps: 10 });
    sets.push({ set_num: i * 4 + 4, kind: 'work', label: `R${i + 1} Step-up R`, reps: 10 });
  }
  return {
    name: 'Single-leg Knee Work',
    display_order: order,
    notes: 'Knee tracks over middle toe; depth as comfort allows.',
    sets
  };
}

/**
 * Lattice-grounded lower-body mobility focused on **deep squat depth**
 * and **knee mobility** — Martin's two stated priorities post-ACL.
 *
 * Sourced from Lattice's flexibility blog (side-split + pancake routines).
 * The four anchor drills:
 *   1. Cossack squats — knee tracks foot, deep lateral squat, gold-standard
 *      for ACL recovery and unilateral mobility
 *   2. Horse stance — wide-stance isometric hold, strengthens adductors at
 *      the end-range deep-squat width
 *   3. Half-split ISO (per side) — hip adductor + hamstring strength at range
 *   4. Deep-squat assisted hold — goal-specific drill; Martin's Phase-1
 *      target is 60 s unsupported BW
 */
function latticeDeepSquatMobility(order: number): PrescribedExercise {
  return {
    name: 'Deep-squat mobility · Lattice routine',
    display_order: order,
    notes:
      'Sourced from Lattice flexibility content. **Knees track over feet** on every squat — non-negotiable for the surgical knee. ' +
      'Tempo: 3 s down · 2 s pause · 2 s up · 1 s top. Build the deep-squat assisted hold toward a 60 s unsupported bodyweight squat by end of Phase 1.',
    sets: [
      // --- Cossack squats: knee-mobility primary ---
      { set_num: 1, kind: 'work', label: 'Cossack squat · 3-2-2-1 tempo', reps: 4, rest_seconds: 60 },
      { set_num: 2, kind: 'work', label: 'Cossack squat · 3-2-2-1 tempo', reps: 4, rest_seconds: 60 },
      { set_num: 3, kind: 'work', label: 'Cossack squat · 3-2-2-1 tempo', reps: 4, rest_seconds: 60 },
      // --- Horse stance: adductors at end-range ---
      { set_num: 4, kind: 'work', label: 'Horse stance · isometric hold', hold_seconds: 30, rest_seconds: 45 },
      { set_num: 5, kind: 'work', label: 'Horse stance · isometric hold', hold_seconds: 30, rest_seconds: 45 },
      { set_num: 6, kind: 'work', label: 'Horse stance · isometric hold', hold_seconds: 30, rest_seconds: 45 },
      // --- Half-split ISO: alternating L/R ---
      { set_num: 7, kind: 'work', label: 'Half-split ISO · L · anterior pelvic tilt', hold_seconds: 30, rest_seconds: 30 },
      { set_num: 8, kind: 'work', label: 'Half-split ISO · R · anterior pelvic tilt', hold_seconds: 30, rest_seconds: 30 },
      { set_num: 9, kind: 'work', label: 'Half-split ISO · L · anterior pelvic tilt', hold_seconds: 30, rest_seconds: 30 },
      { set_num: 10, kind: 'work', label: 'Half-split ISO · R · anterior pelvic tilt', hold_seconds: 30, rest_seconds: 30 },
      // --- Deep-squat assisted hold: goal-specific ---
      { set_num: 11, kind: 'work', label: 'Deep-squat assisted hold', hold_seconds: 60, rest_seconds: 30 },
      { set_num: 12, kind: 'work', label: 'Deep-squat assisted hold (unsupported if able)', hold_seconds: 60, rest_seconds: 30 }
    ]
  };
}

function indoorClimb(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const focus = week === 4
    ? '40–60 moves on jugs only. Technique focus. **No projecting.**'
    : week === 3
      ? '80–100 moves. May add one boulder 1 grade above comfort if fresh.'
      : '60–80 moves at 6a+ to 6c (V2–V4). **No projecting.** Movement quality and foot precision.';
  return {
    name: 'Indoor Climbing Session',
    display_order: order,
    notes: focus,
    sets: [
      { set_num: 1, kind: 'checklist', label: 'Hooper 3-step warm-up at the wall' },
      { set_num: 2, kind: 'checklist', label: 'Easy traverse + technique laps · 15 min' },
      { set_num: 3, kind: 'checklist', label: 'Main session — volume climbing per notes' },
      { set_num: 4, kind: 'checklist', label: 'Cool-down: tendon glides + 30% MVC hangs · 5 min' }
    ]
  };
}

function outdoorClimb(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const focus = week === 4
    ? '1–2 hard pitches max + lots of jugs. Reduced volume — deload week.'
    : week === 3
      ? '5–7 routes. One project attempt at +1 grade allowed — try, then leave it.'
      : '4–6 routes at or below onsight grade. **No projecting.** Movement quality.';
  return {
    name: 'Outdoor Climbing',
    display_order: order,
    notes: focus,
    sets: [
      { set_num: 1, kind: 'checklist', label: 'Hooper 3-step warm-up at base of route' },
      { set_num: 2, kind: 'checklist', label: 'Climbing per notes' },
      { set_num: 3, kind: 'checklist', label: 'Cool-down stretching at the crag (not after drive)' }
    ]
  };
}

/**
 * No-Hangs · Abrahangs — Emil Abrahamsson + Keith Baar protocol.
 *
 * Low-load (~40% MVC), short, daily-frequency tendon-collagen stimulus.
 * Each session: 10 hangs × (10 s pull / 50 s rest) = 10 min.
 *
 * Conservative deployment (per Martin 2026-05-28 decision):
 * - 1 session per day on Wed / Fri / Sat / Sun (4 sessions per week)
 * - Skips Mon (Density Hangs day) and Thu (Asymmetry Isos day) to avoid
 *   Baar's 6-hour refractory-period collision with heavier finger work
 * - Grip rotates across days so all 4 positions get covered each week
 *
 * Tindeq targets: ~40% MVC = 22 kg R (from R MVC 55) and 21 kg L (from L MVC 52).
 * Done as a two-hand protocol — pull only as hard as needed to feel a light strain.
 */
type NoHangGrip = 'half-crimp-4f' | 'open-4f' | 'front-3-open' | 'front-2-half-crimp';

function noHangsAbrahangs(order: number, grip: NoHangGrip): PrescribedExercise {
  const gripLabel = {
    'half-crimp-4f': '4-finger half-crimp · 20 mm',
    'open-4f': '4-finger open-hand · 20 mm',
    'front-3-open': 'Front-3 open · 20 mm',
    'front-2-half-crimp': 'Front-2 half-crimp · 20 mm'
  }[grip];

  const sets: PrescribedSet[] = [];
  for (let i = 1; i <= 10; i++) {
    sets.push({
      set_num: i,
      kind: 'work',
      label: `Hang ${i} · ${gripLabel}`,
      hold_seconds: 10,
      rest_seconds: 50,
      load_kg: 22
    });
  }

  return {
    name: 'No-hangs · Abrahangs (low-load tendon)',
    display_order: order,
    notes:
      'Do these **first thing in the morning** as a separate ~10-min session, before the day\'s main activity. ' +
      'Two-hand pull, feet on floor, only as hard as needed to feel a light strain in the forearms — ~40% MVC (target ≈ 22 kg per hand on the Tindeq). ' +
      '**24-hour pain rule still applies**: if the L middle finger PIP is sore the next morning, skip the next session. ' +
      'Stack: 15 g hydrolysed collagen + 500 mg vitamin C 30–60 min before, per Keith Baar.',
    sets
  };
}

/**
 * Runway calibration — 4 sessions between 2026-05-28 and Phase 1 start.
 * Goal: dial in the true 40% MVC feel on Tindeq, stress-test the L A2 with the
 * 24-h pain rule, and lock the morning collagen + vit C + edge routine before
 * Phase 1 introduces heavy load.
 *
 * Ramp:
 *   Day 1 — Sat May 30 — 18 kg (~35% L MVC), half-crimp 4f, 6 sets
 *   Day 2 — Mon Jun 1 — 20 kg, half-crimp 4f, 8 sets
 *   Day 3 — Wed Jun 3 — 22 kg, open 4f, 10 sets (full protocol)
 *   Day 4 — Fri Jun 5 — 22 kg, front-3 open, 10 sets
 *   (Sun Jun 7 — rest, no session seeded — Phase 1 starts Mon Jun 8)
 */
export type RunwayDay = 1 | 2 | 3 | 4;

interface RunwaySpec {
  date: string;
  loadKg: number;
  grip: NoHangGrip;
  setCount: number;
  intent: string;
}

export const RUNWAY_SPECS: Record<RunwayDay, RunwaySpec> = {
  1: { date: '2026-05-30', loadKg: 18, grip: 'half-crimp-4f', setCount: 6,
       intent: 'Lock the morning routine. Feel ~35% MVC on the Tindeq before pushing higher.' },
  2: { date: '2026-06-01', loadKg: 20, grip: 'half-crimp-4f', setCount: 8,
       intent: 'Increment load and set count. Confirm L A2 was fine the morning after Day 1.' },
  3: { date: '2026-06-03', loadKg: 22, grip: 'open-4f', setCount: 10,
       intent: 'First full protocol — 10 sets at target load. Switch grip to open 4f.' },
  4: { date: '2026-06-05', loadKg: 22, grip: 'front-3-open', setCount: 10,
       intent: 'Dress rehearsal. Front-3 open is the most pulley-loading grip — final A2 check.' }
};

export function buildRunwayCalibration(day: RunwayDay): PrescribedSession {
  const spec = RUNWAY_SPECS[day];
  const gripLabel = {
    'half-crimp-4f': '4-finger half-crimp · 20 mm',
    'open-4f': '4-finger open-hand · 20 mm',
    'front-3-open': 'Front-3 open · 20 mm',
    'front-2-half-crimp': 'Front-2 half-crimp · 20 mm'
  }[spec.grip];

  const sets: PrescribedSet[] = [];
  for (let i = 1; i <= spec.setCount; i++) {
    sets.push({
      set_num: i,
      kind: 'work',
      label: `Hang ${i} · ${gripLabel}`,
      hold_seconds: 10,
      rest_seconds: 50,
      load_kg: spec.loadKg
    });
  }

  return {
    exercises: [
      {
        name: 'No-hangs · Runway Calibration',
        display_order: 1,
        notes:
          `**Runway day ${day} of 4.** ${spec.intent} ` +
          `Two-hand pull, feet on floor, only as hard as needed to feel a light strain — target ${spec.loadKg} kg per hand on the Tindeq. ` +
          '**24-hour pain rule applies**: if the L middle finger PIP is sore the next morning, back off one step or skip. ' +
          'Stack: 15 g hydrolysed collagen + 500 mg vitamin C 30–60 min before, per Keith Baar.',
        sets
      }
    ]
  };
}

function fridayMobilityAndRun(order: number, week: 1 | 2 | 3 | 4): PrescribedExercise {
  const runMin = week === 4 ? 0 : week === 2 ? 35 : 30;
  return {
    name: 'Long Mobility + Easy Run',
    display_order: order,
    notes:
      (week === 4 ? 'Mobility only — no run this week (deload). ' : 'Pace ≤8:30/km, conversational, soft surface preferred. ') +
      'Lattice deep-squat work threaded in — Cossack + Horse stance reinforce Tuesday\'s session.',
    sets: [
      // Tissue prep
      { set_num: 1, kind: 'checklist', label: 'Foam roll calves/quads/IT/glutes · 8 min' },
      // Lattice deep-squat work (re-emphasis from Tuesday)
      { set_num: 2, kind: 'work', label: 'Cossack squat · 3-2-2-1 tempo', reps: 4, rest_seconds: 60 },
      { set_num: 3, kind: 'work', label: 'Cossack squat · 3-2-2-1 tempo', reps: 4, rest_seconds: 60 },
      { set_num: 4, kind: 'work', label: 'Horse stance · isometric', hold_seconds: 30, rest_seconds: 45 },
      { set_num: 5, kind: 'work', label: 'Horse stance · isometric', hold_seconds: 30, rest_seconds: 45 },
      // Hip openers + posterior chain
      { set_num: 6, kind: 'checklist', label: 'Pigeon + couch stretch · 4 min/side' },
      { set_num: 7, kind: 'checklist', label: 'Jefferson curl BW · 3 × 8' },
      { set_num: 8, kind: 'checklist', label: 'Supine PNF hamstring · 5/side' },
      { set_num: 9, kind: 'checklist', label: 'Ankle band distraction · 2 min/side' },
      // Goal drill
      { set_num: 10, kind: 'work', label: 'Deep-squat assisted hold', hold_seconds: 60, rest_seconds: 30 },
      { set_num: 11, kind: 'work', label: 'Deep-squat assisted hold (unsupported if able)', hold_seconds: 60, rest_seconds: 30 },
      // Upper body finish
      { set_num: 12, kind: 'checklist', label: 'T-spine flow · 5 min' },
      { set_num: 13, kind: 'checklist', label: 'Stick dislocates · 30 reps' },
      ...(runMin > 0
        ? [{ set_num: 14, kind: 'work' as SetKind, label: `Easy run · ${runMin} min`, hold_seconds: runMin * 60 }]
        : [{ set_num: 14, kind: 'checklist' as SetKind, label: 'No run today — deload' }])
    ]
  };
}

function restDay(): PrescribedSession {
  return {
    exercises: [
      {
        name: 'Rest Day',
        display_order: 1,
        notes: 'Full rest. Optional 30-min mobility walk. Sleep ≥7 h tonight if tomorrow is a hard day.',
        sets: [{ set_num: 1, kind: 'checklist', label: 'Rest acknowledged' }]
      }
    ]
  };
}

function testSession(): PrescribedSession {
  return {
    exercises: [
      {
        name: 'Warm-up · 15 min',
        display_order: 1,
        sets: [
          { set_num: 1, kind: 'checklist', label: 'Hooper 3-step' },
          { set_num: 2, kind: 'checklist', label: 'Recruitment ladder on Tindeq · L+R, 30/50/70/80/90%, 1 min rest each' }
        ]
      },
      {
        name: 'Test 1 · Tindeq Peak Force · 20 mm half-crimp',
        display_order: 2,
        notes: 'Record highest peak per hand. 3 s max pull, 3 attempts per hand, alternating L/R, 3 min rest each.',
        sets: [
          { set_num: 1, kind: 'work', label: 'L · attempt 1', hold_seconds: 3, rest_seconds: 180 },
          { set_num: 2, kind: 'work', label: 'R · attempt 1', hold_seconds: 3, rest_seconds: 180 },
          { set_num: 3, kind: 'work', label: 'L · attempt 2', hold_seconds: 3, rest_seconds: 180 },
          { set_num: 4, kind: 'work', label: 'R · attempt 2', hold_seconds: 3, rest_seconds: 180 },
          { set_num: 5, kind: 'work', label: 'L · attempt 3', hold_seconds: 3, rest_seconds: 180 },
          { set_num: 6, kind: 'work', label: 'R · attempt 3', hold_seconds: 3 }
        ]
      },
      {
        name: 'Test 2 · Weighted Pull-up est 1RM',
        display_order: 3,
        notes: 'Final set: heavy triple, 0 RIR. Compute 1RM via Epley = total × (1 + 3/30).',
        sets: [
          { set_num: 1, kind: 'warmup', label: 'BW', reps: 5, load_kg_added: 0, rest_seconds: 120 },
          { set_num: 2, kind: 'warmup', label: '+10 kg', reps: 3, load_kg_added: 10, rest_seconds: 180 },
          { set_num: 3, kind: 'warmup', label: '+20 kg', reps: 2, load_kg_added: 20, rest_seconds: 240 },
          { set_num: 4, kind: 'warmup', label: '+25 kg', reps: 2, load_kg_added: 25, rest_seconds: 240 },
          { set_num: 5, kind: 'work', label: 'Top triple · 0 RIR', reps: 3, load_kg_added: 30 }
        ]
      },
      {
        name: 'Test 3 · Critical Force (optional)',
        display_order: 4,
        notes: 'Only if fresh after Tests 1+2. Tindeq Critical Force mode: 24 × (7 s / 3 s) one-arm R, 20 mm half-crimp.',
        sets: [{ set_num: 1, kind: 'checklist', label: '4-min Critical Force test (optional)' }]
      }
    ]
  };
}

function coreFinisher(order: number): PrescribedExercise {
  return {
    name: 'Core',
    display_order: order,
    sets: [
      { set_num: 1, kind: 'work', label: 'Hollow hold', hold_seconds: 30, rest_seconds: 60 },
      { set_num: 2, kind: 'work', label: 'Hollow hold', hold_seconds: 30, rest_seconds: 60 },
      { set_num: 3, kind: 'work', label: 'Hollow hold', hold_seconds: 30, rest_seconds: 60 },
      { set_num: 4, kind: 'work', label: 'Pallof press L', reps: 12, rest_seconds: 60 },
      { set_num: 5, kind: 'work', label: 'Pallof press R', reps: 12, rest_seconds: 60 },
      { set_num: 6, kind: 'work', label: 'Pallof press L', reps: 12, rest_seconds: 60 },
      { set_num: 7, kind: 'work', label: 'Pallof press R', reps: 12, rest_seconds: 60 },
      { set_num: 8, kind: 'work', label: 'Hanging leg raise', reps: 8, rest_seconds: 90 },
      { set_num: 9, kind: 'work', label: 'Hanging leg raise', reps: 8, rest_seconds: 90 },
      { set_num: 10, kind: 'work', label: 'Hanging leg raise', reps: 8, rest_seconds: 90 }
    ]
  };
}

// ============================================================================
// Top-level dispatch
// ============================================================================

export interface DispatchInput {
  type: SessionType;
  mesocycle_num: number;
  week_in_phase: 1 | 2 | 3 | 4;
}

export function buildPrescription(input: DispatchInput): PrescribedSession {
  // Phase 1 is the only mesocycle with detailed prescriptions for now.
  // Phase 2 + 3 fall back to a placeholder skeleton until they're calibrated
  // from the Week 4 / Week 8 test results.
  if (input.mesocycle_num !== 1) {
    return phasePending(input);
  }
  const w = input.week_in_phase;
  switch (input.type) {
    case 'pull-heavy':
      return {
        exercises: [
          hooperWarmup(1),
          densityHangs(2, w),
          weightedPullsHeavy(3, w),
          bicepCurls(4),
          hammerCurls(5),
          shortMobility(6)
        ]
      };
    case 'pull-light':
      return {
        exercises: [
          hooperWarmup(1),
          asymmetryIsos(2, w),
          weightedPullsLight(3, w),
          coreFinisher(4),
          forearmBalance(5, w),
          shortMobility(6)
        ]
      };
    case 'push':
      return {
        exercises: [
          pushSupersetA(1, w),
          pushSupersetB(2, w),
          antagonistAndPrehab(3, w),
          forearmBalance(4, w),
          singleLegRDL(5, w),
          singleLegKnee(6, w),
          latticeDeepSquatMobility(7)
        ]
      };
    case 'climb-indoor':
      // Wed in Phase 1: 4-finger half-crimp no-hang day
      return {
        exercises: [
          noHangsAbrahangs(1, 'half-crimp-4f'),
          indoorClimb(2, w)
        ]
      };
    case 'climb-outdoor':
      // Sat in Phase 1: front-3 open no-hang day
      return {
        exercises: [
          noHangsAbrahangs(1, 'front-3-open'),
          outdoorClimb(2, w)
        ]
      };
    case 'mobility':
      // Fri in Phase 1: 4-finger open-hand no-hang day
      return {
        exercises: [
          noHangsAbrahangs(1, 'open-4f'),
          fridayMobilityAndRun(2, w)
        ]
      };
    case 'rest': {
      // Sun in Phase 1 (and Thu in deload weeks): front-2 half-crimp no-hang day
      const rest = restDay();
      return {
        exercises: [
          noHangsAbrahangs(1, 'front-2-half-crimp'),
          { ...rest.exercises[0], display_order: 2 }
        ]
      };
    }
    case 'test':
      return testSession();
    case 'run':
      return {
        exercises: [
          {
            name: 'Easy Run',
            display_order: 1,
            notes: 'Conversational pace ≤8:30/km. Stop if knee complains.',
            sets: [{ set_num: 1, kind: 'work', label: '30 min run', hold_seconds: 1800 }]
          }
        ]
      };
  }
}

function phasePending(input: DispatchInput): PrescribedSession {
  return {
    exercises: [
      {
        name: 'Phase ' + input.mesocycle_num + ' · ' + input.type,
        display_order: 1,
        notes: 'Detailed prescription pending — gets calibrated from the previous phase\'s test session results.',
        sets: [{ set_num: 1, kind: 'checklist', label: 'See ../plan/0' + (input.mesocycle_num + 1) + '-*.md for skeleton' }]
      }
    ]
  };
}
