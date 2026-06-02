// Seed Antonia's 12-week macro: 3 phases × 4 weeks × 3 sessions/week = 36 sessions.
// Goal: first strict unassisted pull-up by Week 11 or 12.
//
// Idempotent: deletes all antonia-owned sessions + phases first.
// Re-run with: npx tsx -r dotenv/config scripts/seed-antonia-plan.ts

import 'dotenv/config';
import postgres from 'postgres';

const USER_ID = 'antonia';
const url = process.env.DATABASE_URL!;
const sql = postgres(url, { ssl: 'require', max: 1 });

type SetSpec = {
  kind: 'warmup' | 'work' | 'backoff' | 'checklist';
  label: string;
  reps?: number;
  hold_seconds?: number;
  rest_seconds?: number;
};
type ExerciseSpec = { name: string; notes: string; sets: SetSpec[] };
type SessionSpec = { type: string; title: string; notes: string; exercises: ExerciseSpec[] };

// ────────────────────────────────────────────────────────────────────────────
// Phase 1 — FOUNDATION (Weeks 1–4, Jun 8 – Jul 5)
// ────────────────────────────────────────────────────────────────────────────

const MOB_NOTES =
  '**~5 min warm-up.** Arm circles forward + back × 10, scapular wall slides × 8, banded shoulder dislocates × 10, cat-cow × 8. Move slowly — this is preparation, not work.';

function warmUpExercise(): ExerciseSpec {
  return {
    name: 'Warm-up Flow',
    notes: MOB_NOTES,
    sets: [{ kind: 'checklist', label: 'Mobility flow · ~5 min' }]
  };
}

// PHASE 1 · MONDAY · PRIMARY PULL
function p1_mon(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  const scapSets = deload ? 2 : 3;
  const bandedReps = deload ? 4 : week === 1 ? 5 : week === 2 ? 6 : 7;
  const rowReps = deload ? 6 : week === 1 ? 8 : week === 2 ? 9 : 10;
  const pushupReps = deload ? 5 : week === 1 ? 6 : week === 2 ? 8 : 10;
  return {
    type: 'pull-heavy',
    title: deload
      ? 'Foundation · Mon (deload) — light pull + reset'
      : `Foundation · Mon W${week} — Scaps, Banded Pull-ups, Rows`,
    notes: deload
      ? '**Deload week.** Reduce volume by ~40%. Quality over quantity. Same exercises, fewer reps. Friday will be the test session.'
      : '**Primary pull day.** Goal: build the scap → pull pattern. Quality first; if the last set degrades in form, stop one rep short.',
    exercises: [
      warmUpExercise(),
      {
        name: 'Scapular Pull-ups',
        notes:
          '**Hang from the bar with straight arms.** Without bending your elbows, pull your shoulder blades **down and back** — this lifts your body ~5 cm. Hold 1 s at top, lower with control. **No elbow bend at any point.** This is the engagement pattern most beginners skip; it’s the foundation for the real pull-up.',
        sets: Array.from({ length: scapSets }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · 8 reps · 90 s rest`,
          reps: 8,
          rest_seconds: 90
        }))
      },
      {
        name: 'Band-assisted Pull-ups',
        notes: `**Thickest band looped over bar.** Put one knee in the band loop (more assistance) or one foot (less). Pull chin over bar, control the descent over 2 s. **Form first** — if you can’t do ${bandedReps} reps with clean form, stop earlier. Goal this week: ${bandedReps} clean reps × 3 sets.`,
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${bandedReps} reps · thick band · 2 min rest`,
          reps: bandedReps,
          rest_seconds: 120
        }))
      },
      {
        name: 'Inverted Rows',
        notes:
          '**Under a sturdy bar/table at hip height** with feet on floor. Keep body straight (plank). Pull chest to bar, squeeze shoulder blades. Slower = harder; aim for 2 s up, 2 s down. To make it harder, walk feet farther under the bar. To make it easier, raise the bar.',
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${rowReps} reps · 90 s rest`,
          reps: rowReps,
          rest_seconds: 90
        }))
      },
      {
        name: 'Push-ups (variant)',
        notes: `**Pick the hardest variant you can do for ${pushupReps} clean reps:** wall → incline (hands on bench/wall) → knee → full. Whichever you pick, **chest must touch / nearly touch**. Slow down: 2 s down, 2 s up. Hooper’s 1:1 push-to-pull rule lives here.`,
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${pushupReps} reps · 60 s rest`,
          reps: pushupReps,
          rest_seconds: 60
        }))
      },
      {
        name: 'Band External Rotation (0° abduction)',
        notes:
          '**Elbow pinned to side, 90° bent.** Band held in hand, anchored at elbow height to your side. Rotate forearm away from body, keeping elbow glued to ribs. Last 2 reps should be challenging — pick the band thickness that delivers that. Per Wong & Ng research, this is the climber-mirroring strength dose, not a warm-up dose.',
        sets: [
          { kind: 'work', label: 'L · 10 reps · band: medium', reps: 10, rest_seconds: 45 },
          { kind: 'work', label: 'R · 10 reps · band: medium', reps: 10, rest_seconds: 45 }
        ]
      },
      {
        name: 'Hollow Body Hold',
        notes:
          '**Lie on back. Press low back to the floor — non-negotiable.** Lift legs to ~30° and arms overhead. Body forms a shallow banana. Hold for time. If low back lifts off the floor, bring legs higher (easier). Core shape that makes pull-ups feel one grade easier.',
        sets: [
          { kind: 'work', label: 'Hold 1 · 20 s', hold_seconds: 20, rest_seconds: 45 },
          { kind: 'work', label: 'Hold 2 · 20 s', hold_seconds: 20 }
        ]
      }
    ]
  };
}

// PHASE 1 · WEDNESDAY · VOLUME / ROW FOCUS
function p1_wed(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  const rowReps = deload ? 6 : week === 1 ? 8 : week === 2 ? 9 : 10;
  const bandedReps = deload ? 4 : week === 1 ? 5 : week === 2 ? 6 : 6;
  const pushupReps = deload ? 5 : week === 1 ? 6 : week === 2 ? 8 : 10;
  const deadHang = deload ? 10 : week === 1 ? 15 : week === 2 ? 18 : 20;
  return {
    type: 'pull-light',
    title: deload
      ? 'Foundation · Wed (deload) — light volume'
      : `Foundation · Wed W${week} — Rows + Dead Hang + Antagonist`,
    notes: deload
      ? '**Deload.** Reduce volume. Listen to fatigue; if shoulders feel off from Mon, take an extra rest day and shift this session to Thu.'
      : '**Volume + antagonist day.** Lighter than Mon. Builds horizontal pull capacity and rows in lower-trap selective work.',
    exercises: [
      warmUpExercise(),
      {
        name: 'Inverted Rows (heavier angle)',
        notes:
          '**Lower the bar by one notch from Monday** (or walk feet farther in) so the same reps feel harder. Body straight, chest to bar, scapular squeeze at top. 2 s up, 2 s down. If form breaks, raise the bar back.',
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${rowReps} reps · 90 s rest`,
          reps: rowReps,
          rest_seconds: 90
        }))
      },
      {
        name: 'Band-assisted Pull-ups (lighter scheme)',
        notes: `**Same setup as Monday, but ${bandedReps} reps × 3 sets** with the thick band. Today the goal is movement *quality* not max effort — emphasise the controlled descent.`,
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${bandedReps} reps · thick band · 2 min rest`,
          reps: bandedReps,
          rest_seconds: 120
        }))
      },
      {
        name: 'Push-ups (variant)',
        notes:
          'Same variant as Monday. Pick the hardest you can complete with clean form. Chest touches.',
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${pushupReps} reps · 60 s rest`,
          reps: pushupReps,
          rest_seconds: 60
        }))
      },
      {
        name: 'Prone Y Raise',
        notes:
          '**Lie face-down on the floor or a bench.** Arms in Y shape overhead, thumbs pointing up to ceiling. Lift arms a few cm off the floor without shrugging. Hold 1 s. **Light load only (0.5–1 kg or empty hands)** — this is selectivity work for the lower trap (per Hwang & Jeon 2024), not a strength lift.',
        sets: [
          { kind: 'work', label: 'Set 1 · 12 reps · 60 s rest', reps: 12, rest_seconds: 60 },
          { kind: 'work', label: 'Set 2 · 12 reps', reps: 12 }
        ]
      },
      {
        name: 'Active Dead Hang',
        notes: `**Hang from bar with arms straight.** Shoulders are **active** — pull shoulder blades down (away from ears), don’t passively hang. This is grip + scapular endurance. Build to ${deadHang} s × 3 sets.`,
        sets: [
          { kind: 'work', label: `Set 1 · ${deadHang} s`, hold_seconds: deadHang, rest_seconds: 90 },
          { kind: 'work', label: `Set 2 · ${deadHang} s`, hold_seconds: deadHang, rest_seconds: 90 },
          { kind: 'work', label: `Set 3 · ${deadHang} s`, hold_seconds: deadHang }
        ]
      }
    ]
  };
}

// PHASE 1 · FRIDAY · ECCENTRICS + MOBILITY
function p1_fri(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  // In phase 1 we INTRODUCE negatives gently — Week 1 just dead-hang practice, Wk 2+ short eccentrics
  const eccentricSeconds = week === 1 ? 0 : week === 2 ? 3 : week === 3 ? 4 : 3;
  const eccentricSets = week === 1 ? 0 : deload ? 2 : 3;
  return {
    type: 'mobility',
    title: deload
      ? 'Foundation · Fri (test) — benchmarks'
      : week === 1
        ? 'Foundation · Fri W1 — Practice + Mobility'
        : `Foundation · Fri W${week} — Eccentrics intro + Mobility`,
    notes: deload
      ? '**End-of-Phase-1 test day.** Measure baselines: max active dead hang, max banded pull-ups in a row, max push-ups, max inverted rows. Log everything in the set notes. These numbers reset Phase 2 prescriptions.'
      : week === 1
        ? '**Skill-building day.** No eccentrics yet — first week is about learning to engage the lats and scaps before adding load.'
        : `**Eccentrics intro.** Short, controlled negative pull-ups. Step or jump to the top, lower over ${eccentricSeconds} s. Stop the moment form breaks. This is the single biggest driver of your first pull-up (Steven Low).`,
    exercises: deload
      ? [
          warmUpExercise(),
          {
            name: 'TEST · Max Active Dead Hang',
            notes:
              '**Single max-effort hang.** Active scaps. Hold until grip fails. Log seconds in set notes. Baseline for Phase 2.',
            sets: [{ kind: 'work', label: 'Max hold · log seconds', hold_seconds: 0 }]
          },
          {
            name: 'TEST · Max Banded Pull-ups (thick band)',
            notes:
              '**Single set to technical failure** with the thick band. Clean reps only — when form degrades, stop. Log reps in set notes.',
            sets: [{ kind: 'work', label: 'Max reps · log count', reps: 0 }]
          },
          {
            name: 'TEST · Max Inverted Rows',
            notes:
              'Set bar at the angle you used in Week 3. Max clean reps. Log count.',
            sets: [{ kind: 'work', label: 'Max reps · log count', reps: 0 }]
          },
          {
            name: 'TEST · Max Push-ups',
            notes:
              'Hardest variant you used in Week 3. Max clean reps. Log count.',
            sets: [{ kind: 'work', label: 'Max reps · log count', reps: 0 }]
          },
          {
            name: 'Cool-down Mobility',
            notes:
              'Cat-cow × 8, child’s pose 60 s, doorway pec stretch 30 s/side, downward dog 30 s.',
            sets: [{ kind: 'checklist', label: 'Long mobility · 10 min' }]
          }
        ]
      : [
          warmUpExercise(),
          ...(week === 1
            ? [
                {
                  name: 'Scapular Pull-up Practice',
                  notes:
                    '**Repeat Monday\'s scap pull-ups with more attention to feel.** Try to identify the moment the shoulder blades engage. 3 sets × 6 reps.',
                  sets: Array.from({ length: 3 }, (_, i) => ({
                    kind: 'work' as const,
                    label: `Set ${i + 1} · 6 reps · 90 s rest`,
                    reps: 6,
                    rest_seconds: 90
                  }))
                }
              ]
            : [
                {
                  name: 'Eccentric (Negative) Pull-ups',
                  notes: `**Step on a chair to the top position** (chin over bar, elbows bent). Take feet off the chair and **lower yourself over ${eccentricSeconds} s** until arms are straight. Step back up — do NOT pull yourself up. 3 reps per set. **Stop one rep before form breaks.**`,
                  sets: Array.from({ length: eccentricSets }, (_, i) => ({
                    kind: 'work' as const,
                    label: `Set ${i + 1} · 3 reps · ${eccentricSeconds}s descent · 2 min rest`,
                    reps: 3,
                    hold_seconds: eccentricSeconds,
                    rest_seconds: 120
                  }))
                }
              ]),
          {
            name: 'Inverted Rows',
            notes: 'Easy pace, focus on the scap squeeze at the top.',
            sets: [
              { kind: 'work', label: 'Set 1 · 10 reps · 60 s rest', reps: 10, rest_seconds: 60 },
              { kind: 'work', label: 'Set 2 · 10 reps', reps: 10 }
            ]
          },
          {
            name: 'Push-up Plus',
            notes:
              '**A normal push-up, then at the top push the floor away as hard as you can** — your upper back rounds slightly, shoulder blades wrap forward. That extra push is the "plus" — highest serratus EMG of any exercise tested (Cools et al. 2003). Prevents scapular winging.',
            sets: [
              { kind: 'work', label: 'Set 1 · 10 reps · 60 s rest', reps: 10, rest_seconds: 60 },
              { kind: 'work', label: 'Set 2 · 10 reps', reps: 10 }
            ]
          },
          {
            name: 'Long Mobility Flow',
            notes:
              '**~10 min.** Cat-cow × 8 · 90/90 hip switch 1 min/side · downward dog 30 s · doorway pec stretch 30 s/side · child\'s pose 60 s · thread-the-needle 30 s/side · standing forward fold 60 s.',
            sets: [{ kind: 'checklist', label: 'Mobility flow · 10 min' }]
          }
        ]
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 2 — BUILD (Weeks 5–8, Jul 6 – Aug 2)
// Centerpiece: eccentrics. Thinner band. More volume on push-ups + rows.
// ────────────────────────────────────────────────────────────────────────────

function p2_mon(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  const eccentricSeconds = deload ? 4 : week === 1 ? 5 : week === 2 ? 6 : 7;
  const eccentricSets = deload ? 2 : 3;
  const eccentricReps = deload ? 3 : 4;
  const bandedReps = deload ? 4 : week === 1 ? 6 : week === 2 ? 7 : 8;
  const rowReps = deload ? 8 : week === 1 ? 10 : week === 2 ? 11 : 12;
  const pushupReps = deload ? 6 : week === 1 ? 8 : week === 2 ? 10 : 12;
  return {
    type: 'pull-heavy',
    title: deload
      ? 'Build · Mon (deload) — quality only'
      : `Build · Mon W${week} — Eccentrics + Medium Band Pulls`,
    notes: deload
      ? '**Deload.** Reduce all working sets by ~40%. Friday is the test session — preserve freshness.'
      : '**Heavy pull day.** Eccentrics are now the centerpiece — they are the single biggest driver of your first pull-up. Move to the medium-thickness band for assisted pulls.',
    exercises: [
      warmUpExercise(),
      {
        name: 'Scapular Pull-ups',
        notes: 'Same as Phase 1 — by now this should feel automatic. Quick 2 sets to prime.',
        sets: [
          { kind: 'work', label: 'Set 1 · 8 reps · 60 s rest', reps: 8, rest_seconds: 60 },
          { kind: 'work', label: 'Set 2 · 8 reps', reps: 8 }
        ]
      },
      {
        name: 'Eccentric (Negative) Pull-ups',
        notes: `**Star of the show this phase.** Step to the top, then lower over ${eccentricSeconds} s — fully controlled, no jerking. Step back up. ${eccentricReps} reps × ${eccentricSets} sets. **Stop a rep early if the descent loses control** — quality of the eccentric is what builds strength.`,
        sets: Array.from({ length: eccentricSets }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${eccentricReps} reps · ${eccentricSeconds}s descent · 3 min rest`,
          reps: eccentricReps,
          hold_seconds: eccentricSeconds,
          rest_seconds: 180
        }))
      },
      {
        name: 'Band-assisted Pull-ups (medium band)',
        notes: `**Switch to the medium band.** It’ll feel harder than the thick band. ${bandedReps} reps × 3 sets. If you can’t hit ${bandedReps}, finish the set you can and note actual reps in set notes — that\'s real signal.`,
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${bandedReps} reps · medium band · 2 min rest`,
          reps: bandedReps,
          rest_seconds: 120
        }))
      },
      {
        name: 'Inverted Rows',
        notes:
          '**Lower the bar another notch from Phase 1.** Or progress to feet-elevated rows (feet on a chair, body horizontal). Push for the higher rep count.',
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${rowReps} reps · 90 s rest`,
          reps: rowReps,
          rest_seconds: 90
        }))
      },
      {
        name: 'Push-ups (variant)',
        notes: `**Try a harder variant if last phase\'s was easy** (e.g., knee → full, full → feet elevated). ${pushupReps} reps × 3 sets.`,
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${pushupReps} reps · 60 s rest`,
          reps: pushupReps,
          rest_seconds: 60
        }))
      },
      {
        name: 'Band External Rotation (0° abduction)',
        notes:
          'Same as Phase 1. Progress to a thicker band when 10 reps starts to feel easy.',
        sets: [
          { kind: 'work', label: 'L · 10 reps', reps: 10, rest_seconds: 45 },
          { kind: 'work', label: 'R · 10 reps', reps: 10 }
        ]
      },
      {
        name: 'Hollow Body Hold',
        notes: 'Hold longer than Phase 1 — work up to 30 s × 2.',
        sets: [
          { kind: 'work', label: 'Hold 1 · 30 s', hold_seconds: 30, rest_seconds: 60 },
          { kind: 'work', label: 'Hold 2 · 30 s', hold_seconds: 30 }
        ]
      }
    ]
  };
}

function p2_wed(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  const rowReps = deload ? 8 : week === 1 ? 10 : week === 2 ? 11 : 12;
  const bandedReps = deload ? 4 : week === 1 ? 5 : 6;
  const pushupReps = deload ? 6 : week === 1 ? 8 : 10;
  const deadHang = deload ? 20 : week === 1 ? 25 : week === 2 ? 28 : 30;
  return {
    type: 'pull-light',
    title: deload
      ? 'Build · Wed (deload)'
      : `Build · Wed W${week} — Rows + Dead Hang Progression`,
    notes: deload
      ? '**Deload day.** Cut volume, focus on technique. The Friday test matters more than today.'
      : '**Volume + antagonist.** Dead hang gets meaningful here — 30 s is a real benchmark for first pull-up readiness.',
    exercises: [
      warmUpExercise(),
      {
        name: 'Inverted Rows (deep angle)',
        notes:
          'Body as close to horizontal as you can maintain clean form. Chest to bar. 2 s up, 2 s down.',
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${rowReps} reps · 90 s rest`,
          reps: rowReps,
          rest_seconds: 90
        }))
      },
      {
        name: 'Band-assisted Pull-ups (medium band)',
        notes:
          'Lighter rep scheme — quality emphasis. Focus on slow controlled descent.',
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${bandedReps} reps · medium band · 2 min rest`,
          reps: bandedReps,
          rest_seconds: 120
        }))
      },
      {
        name: 'Push-ups (variant)',
        notes: 'Same variant as Monday. Quality reps.',
        sets: Array.from({ length: 3 }, (_, i) => ({
          kind: 'work' as const,
          label: `Set ${i + 1} · ${pushupReps} reps · 60 s rest`,
          reps: pushupReps,
          rest_seconds: 60
        }))
      },
      {
        name: 'Prone Y Raise',
        notes: 'Light load (0.5–1 kg). Selectivity, not strength.',
        sets: [
          { kind: 'work', label: 'Set 1 · 12 reps · 60 s rest', reps: 12, rest_seconds: 60 },
          { kind: 'work', label: 'Set 2 · 12 reps', reps: 12 }
        ]
      },
      {
        name: 'Active Dead Hang',
        notes: `**Active hang** — scaps pulled down. Build to ${deadHang} s × 3. ${deadHang >= 30 ? '30 s is a real first-pull-up readiness marker — being able to hang means your grip and shoulder won\'t be the failure point.' : ''}`,
        sets: [
          { kind: 'work', label: `Set 1 · ${deadHang} s`, hold_seconds: deadHang, rest_seconds: 120 },
          { kind: 'work', label: `Set 2 · ${deadHang} s`, hold_seconds: deadHang, rest_seconds: 120 },
          { kind: 'work', label: `Set 3 · ${deadHang} s`, hold_seconds: deadHang }
        ]
      }
    ]
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 3 — PEAK (Weeks 9–12, Aug 3 – Aug 30)
// Mission: realize the strength. First strict unassisted pull-up.
// ────────────────────────────────────────────────────────────────────────────

function p3_mon(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  const eccentricSeconds = deload ? 6 : week === 1 ? 8 : week === 2 ? 9 : 10;
  const thinBandReps = deload ? 3 : week === 1 ? 4 : week === 2 ? 5 : 5;
  return {
    type: 'pull-heavy',
    title: deload
      ? 'Peak · Mon — Performance week + final test'
      : `Peak · Mon W${week} — Long Eccentrics + Thin Band`,
    notes: deload
      ? '**Performance week.** Today is intentionally light — preserve neural freshness for the FINAL pull-up test on Friday Aug 28 (or Sat Aug 29). One easy set of each, just to stay sharp.'
      : '**Peak phase intent: high quality, low volume.** The goal is the first unassisted pull-up, expected Week 11 or 12. Today: slow eccentrics + thin-band assisted attempts.',
    exercises: deload
      ? [
          warmUpExercise(),
          {
            name: 'Easy Scapular Pull-ups',
            notes: 'Single set, just to feel the pattern. Don\'t fatigue.',
            sets: [{ kind: 'work', label: 'Set 1 · 5 reps', reps: 5 }]
          },
          {
            name: 'Easy Eccentric Pull-up',
            notes: '1–2 reps, ~6 s descent. Just movement, no max effort.',
            sets: [{ kind: 'work', label: '2 reps · 6s descent', reps: 2, hold_seconds: 6 }]
          },
          {
            name: 'Easy Inverted Rows',
            notes: '1 set × 8 reps, easy angle.',
            sets: [{ kind: 'work', label: '8 reps', reps: 8 }]
          },
          {
            name: 'Light Mobility',
            notes: '10 min flow. Save energy for the test.',
            sets: [{ kind: 'checklist', label: 'Mobility · 10 min' }]
          }
        ]
      : [
          warmUpExercise(),
          {
            name: 'Scapular Pull-ups',
            notes: 'Quick activation. 2 sets × 6 reps.',
            sets: [
              { kind: 'work', label: 'Set 1 · 6 reps · 60 s rest', reps: 6, rest_seconds: 60 },
              { kind: 'work', label: 'Set 2 · 6 reps', reps: 6 }
            ]
          },
          {
            name: 'Eccentric (Negative) Pull-ups — Slowest',
            notes: `**${eccentricSeconds} s descent.** This is the longest you\'ll go. 3 reps × 3 sets, 3 min rest. By the third set, the descent might shorten — that\'s fine, log actual seconds in set notes.`,
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · 3 reps · ${eccentricSeconds}s descent · 3 min rest`,
              reps: 3,
              hold_seconds: eccentricSeconds,
              rest_seconds: 180
            }))
          },
          {
            name: 'Band-assisted Pull-ups (thin band)',
            notes: `**Switch to the thinnest band.** Minimal assistance. ${thinBandReps} reps × 3 sets. This is the most pull-up-like exercise yet. If you can do 5 strict reps with the thin band by Week 11, an unassisted pull-up is one band-removal away.`,
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · ${thinBandReps} reps · thin band · 2 min rest`,
              reps: thinBandReps,
              rest_seconds: 120
            }))
          },
          {
            name: 'Inverted Rows (feet elevated if able)',
            notes:
              'Feet on a chair, body horizontal. Strict reps. 3 sets × 10.',
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · 10 reps · 90 s rest`,
              reps: 10,
              rest_seconds: 90
            }))
          },
          {
            name: 'Push-ups',
            notes: 'Full or harder variant. 3 sets × 10–12.',
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · 12 reps · 60 s rest`,
              reps: 12,
              rest_seconds: 60
            }))
          },
          {
            name: 'Band External Rotation',
            notes: 'Maintenance dose.',
            sets: [
              { kind: 'work', label: 'L · 10 reps', reps: 10, rest_seconds: 45 },
              { kind: 'work', label: 'R · 10 reps', reps: 10 }
            ]
          }
        ]
  };
}

function p3_wed(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  return {
    type: 'pull-light',
    title: deload
      ? 'Peak · Wed — Performance week, light maintenance'
      : `Peak · Wed W${week} — Pull-up Attempts + Rows`,
    notes: deload
      ? '**Performance week, mid-week.** Very light. One pull-up attempt only (you\'ll do the proper test on Fri/Sat). Then rest.'
      : '**Mid-week practice.** Each Wednesday from here on, attempt one unassisted pull-up at the start of the session (before fatigue). Then continue with the lighter session.',
    exercises: deload
      ? [
          warmUpExercise(),
          {
            name: 'Single Unassisted Pull-up Attempt',
            notes:
              '**One attempt only.** Fresh, before any fatigue. Don\'t make this a max-out session — Friday is the real test.',
            sets: [{ kind: 'work', label: '1 attempt · log result', reps: 1 }]
          },
          {
            name: 'Easy Inverted Rows',
            notes: '1 set × 8 reps.',
            sets: [{ kind: 'work', label: '8 reps', reps: 8 }]
          },
          {
            name: 'Mobility',
            notes: '10 min long flow.',
            sets: [{ kind: 'checklist', label: 'Mobility · 10 min' }]
          }
        ]
      : [
          warmUpExercise(),
          {
            name: 'Unassisted Pull-up Attempt (fresh)',
            notes:
              '**Right after warm-up, before anything else.** One attempt at a strict pull-up. **Log the outcome: no movement / partial / full rep / multiple.** This is the most important rep of your week.',
            sets: [{ kind: 'work', label: 'Attempt · log result', reps: 1, rest_seconds: 180 }]
          },
          {
            name: 'Inverted Rows (deep angle)',
            notes: 'Body horizontal, 3 sets × 12.',
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · 12 reps · 90 s rest`,
              reps: 12,
              rest_seconds: 90
            }))
          },
          {
            name: 'Band-assisted Pull-ups (thin band)',
            notes: 'Maintain volume. 5 reps × 3 sets.',
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · 5 reps · thin band · 2 min rest`,
              reps: 5,
              rest_seconds: 120
            }))
          },
          {
            name: 'Push-ups',
            notes: 'Hardest variant, 3 × 10.',
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · 10 reps · 60 s rest`,
              reps: 10,
              rest_seconds: 60
            }))
          },
          {
            name: 'Active Dead Hang',
            notes: 'Build to 35 s × 3. Grip endurance for the eventual pull-up holds.',
            sets: [
              { kind: 'work', label: 'Set 1 · 35 s', hold_seconds: 35, rest_seconds: 120 },
              { kind: 'work', label: 'Set 2 · 35 s', hold_seconds: 35, rest_seconds: 120 },
              { kind: 'work', label: 'Set 3 · 35 s', hold_seconds: 35 }
            ]
          }
        ]
  };
}

function p3_fri(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  return {
    type: 'mobility',
    title: deload
      ? '🎯 Peak · Fri — FINAL TEST: First Pull-up Attempt'
      : `Peak · Fri W${week} — Eccentrics + Antagonist`,
    notes: deload
      ? '**The day this whole 12-week cycle was built for.** Full warm-up. Two or three unassisted pull-up attempts, fresh, with full rest between. Record everything. Then long mobility, celebrate, eat well.'
      : '**Eccentric polish + serratus.** Lower the volume, raise the quality.',
    exercises: deload
      ? [
          warmUpExercise(),
          {
            name: 'Recruitment Set',
            notes:
              '**3 banded pull-ups (thin band)** + **15 s active dead hang** + **3 scap pull-ups**. Full rest. This wakes the nervous system without fatiguing.',
            sets: [
              { kind: 'work', label: '3 banded pulls', reps: 3, rest_seconds: 60 },
              { kind: 'work', label: '15s active hang', hold_seconds: 15, rest_seconds: 60 },
              { kind: 'work', label: '3 scap pull-ups', reps: 3, rest_seconds: 180 }
            ]
          },
          {
            name: '🎯 UNASSISTED PULL-UP — ATTEMPT 1',
            notes:
              '**The first real attempt of the test.** Hang from bar, full strict pull-up: chin clears bar, lower with control. Log the result honestly — partial / full / multiple. Rest 4 min before attempt 2.',
            sets: [{ kind: 'work', label: 'Attempt 1 · log result', reps: 1, rest_seconds: 240 }]
          },
          {
            name: '🎯 UNASSISTED PULL-UP — ATTEMPT 2',
            notes:
              'Second attempt. By now you know the feel. Same protocol — strict, controlled descent.',
            sets: [{ kind: 'work', label: 'Attempt 2 · log result', reps: 1, rest_seconds: 240 }]
          },
          {
            name: '🎯 UNASSISTED PULL-UP — ATTEMPT 3 (if fresh)',
            notes:
              'Optional third attempt **only if you feel fresh**. If attempts 1+2 went well, this is a max-rep set: how many strict pull-ups can you do? If they didn\'t, skip this and finish with bands.',
            sets: [{ kind: 'work', label: 'Attempt 3 · max reps', reps: 0 }]
          },
          {
            name: 'Final Benchmark Test (post-pull-up)',
            notes:
              'After the pull-up attempts: max active dead hang, max inverted rows, max push-ups. Log everything.',
            sets: [
              { kind: 'work', label: 'Max dead hang · log s', hold_seconds: 0, rest_seconds: 120 },
              { kind: 'work', label: 'Max inverted rows · log reps', reps: 0, rest_seconds: 120 },
              { kind: 'work', label: 'Max push-ups · log reps', reps: 0 }
            ]
          },
          {
            name: 'Long Cool-down + Celebration',
            notes:
              'Long mobility flow, hot shower, real meal. Review the journey. Plan the next cycle (multiple pull-ups, then weighted).',
            sets: [{ kind: 'checklist', label: 'Long mobility · 15 min' }]
          }
        ]
      : [
          warmUpExercise(),
          {
            name: 'Eccentric (Negative) Pull-ups',
            notes:
              '**Same as Monday but slightly fewer reps.** 8 s descent, 2 reps × 3 sets. Long rest.',
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · 2 reps · 8s descent · 3 min rest`,
              reps: 2,
              hold_seconds: 8,
              rest_seconds: 180
            }))
          },
          {
            name: 'Inverted Rows',
            notes: 'Quality reps. 2 sets × 10.',
            sets: [
              { kind: 'work', label: 'Set 1 · 10 reps · 60 s rest', reps: 10, rest_seconds: 60 },
              { kind: 'work', label: 'Set 2 · 10 reps', reps: 10 }
            ]
          },
          {
            name: 'Push-up Plus',
            notes: 'Highest serratus EMG. 2 × 10.',
            sets: [
              { kind: 'work', label: 'Set 1 · 10 reps · 60 s rest', reps: 10, rest_seconds: 60 },
              { kind: 'work', label: 'Set 2 · 10 reps', reps: 10 }
            ]
          },
          {
            name: 'Prone Y Raise',
            notes: 'Maintenance dose.',
            sets: [{ kind: 'work', label: '2 × 12 reps', reps: 12 }]
          },
          {
            name: 'Long Mobility Flow',
            notes: 'Full 10–15 min sequence.',
            sets: [{ kind: 'checklist', label: 'Mobility · 10–15 min' }]
          }
        ]
  };
}

function p2_fri(week: 1 | 2 | 3 | 4): SessionSpec {
  const deload = week === 4;
  const eccentricSeconds = deload ? 5 : week === 1 ? 6 : week === 2 ? 7 : 8;
  const eccentricReps = deload ? 2 : 3;
  return {
    type: 'mobility',
    title: deload
      ? 'Build · Fri (test) — Phase 2 benchmarks'
      : `Build · Fri W${week} — Long Eccentrics + Serratus`,
    notes: deload
      ? '**End-of-Phase-2 test.** Re-measure all 4 benchmarks from Phase 1 test, plus add: max eccentric descent (seconds), and attempt one unassisted pull-up (yes, today — measure where you are).'
      : `**Long eccentrics + antagonist polish.** Today\'s descents are ${eccentricSeconds} s — that\'s real pull-up specific strength. Stop before form breaks.`,
    exercises: deload
      ? [
          warmUpExercise(),
          {
            name: 'TEST · Max Active Dead Hang',
            notes: 'Same protocol as Phase 1 test. Log seconds.',
            sets: [{ kind: 'work', label: 'Max hold · log seconds', hold_seconds: 0 }]
          },
          {
            name: 'TEST · Max Eccentric Descent',
            notes:
              '**One rep. Slowest possible descent.** Step to top, lower as slowly as you can hold form. Stop the clock when arms straighten. Log seconds.',
            sets: [{ kind: 'work', label: 'Max controlled descent · log seconds', hold_seconds: 0 }]
          },
          {
            name: 'TEST · Unassisted Pull-up Attempt',
            notes:
              '**Two attempts max.** Hang from bar, attempt one strict pull-up. **If you can\'t move at all, that\'s fine — it\'s data.** Log: no movement / partial movement / full rep. Phase 3 will be calibrated to whatever this shows.',
            sets: [{ kind: 'work', label: 'Attempt · log result in notes', reps: 0 }]
          },
          {
            name: 'TEST · Max Inverted Rows',
            notes: 'Same angle as Week 7. Max clean reps. Log count.',
            sets: [{ kind: 'work', label: 'Max reps · log count', reps: 0 }]
          },
          {
            name: 'TEST · Max Push-ups',
            notes: 'Hardest variant from Week 7. Max clean reps.',
            sets: [{ kind: 'work', label: 'Max reps · log count', reps: 0 }]
          },
          {
            name: 'Cool-down Mobility',
            notes: 'Long flow — 10 min.',
            sets: [{ kind: 'checklist', label: 'Long mobility · 10 min' }]
          }
        ]
      : [
          warmUpExercise(),
          {
            name: 'Eccentric (Negative) Pull-ups — Long Descent',
            notes: `**Today is the longest descent of the week.** Step to top, lower over ${eccentricSeconds} s. ${eccentricReps} reps per set, 3 sets. Rest 3 min between — fatigue ruins the eccentric.`,
            sets: Array.from({ length: 3 }, (_, i) => ({
              kind: 'work' as const,
              label: `Set ${i + 1} · ${eccentricReps} reps · ${eccentricSeconds}s descent · 3 min rest`,
              reps: eccentricReps,
              hold_seconds: eccentricSeconds,
              rest_seconds: 180
            }))
          },
          {
            name: 'Inverted Rows',
            notes: 'Quality reps, 2 sets only — Friday is for the eccentrics.',
            sets: [
              { kind: 'work', label: 'Set 1 · 10 reps · 60 s rest', reps: 10, rest_seconds: 60 },
              { kind: 'work', label: 'Set 2 · 10 reps', reps: 10 }
            ]
          },
          {
            name: 'Push-up Plus',
            notes:
              'At the top of each push-up, drive the floor away — feel the upper back round and shoulder blades wrap forward. Serratus selectivity.',
            sets: [
              { kind: 'work', label: 'Set 1 · 10 reps · 60 s rest', reps: 10, rest_seconds: 60 },
              { kind: 'work', label: 'Set 2 · 10 reps', reps: 10 }
            ]
          },
          {
            name: 'Long Mobility Flow',
            notes:
              'Cat-cow · 90/90 hip switch · downward dog · doorway pec stretch · child\'s pose · thread-the-needle · forward fold. ~10 min.',
            sets: [{ kind: 'checklist', label: 'Mobility flow · 10 min' }]
          }
        ]
  };
}


// ════════════════════════════════════════════════════════════════════════════
// Runner: insert 3 phases + 36 sessions for Antonia.
// ════════════════════════════════════════════════════════════════════════════

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

const MACRO_START = '2026-06-08';

const phases = [
  { mesocycle_num: 1, name: 'Foundation', short_name: 'FOUND', start_date: '2026-06-08', end_date: '2026-07-05',
    description: 'Build movement quality, scapular control, base work capacity. Learn every exercise. End-of-phase test sets baselines for Phase 2.' },
  { mesocycle_num: 2, name: 'Build', short_name: 'BUILD', start_date: '2026-07-06', end_date: '2026-08-02',
    description: 'Progressive overload — eccentrics are the centerpiece. Medium band replaces thick. End-of-phase test attempts first unassisted pull-up.' },
  { mesocycle_num: 3, name: 'Peak', short_name: 'PEAK', start_date: '2026-08-03', end_date: '2026-08-30',
    description: 'Realize the strength. Thin band, slowest eccentrics, fresh unassisted attempts on Wednesdays. Final test: Fri Aug 28 — first strict pull-up.' }
];

function templateFor(phase: 1|2|3, dow: 'mon'|'wed'|'fri', w: 1|2|3|4): SessionSpec {
  if (phase === 1) return dow === 'mon' ? p1_mon(w) : dow === 'wed' ? p1_wed(w) : p1_fri(w);
  if (phase === 2) return dow === 'mon' ? p2_mon(w) : dow === 'wed' ? p2_wed(w) : p2_fri(w);
  return dow === 'mon' ? p3_mon(w) : dow === 'wed' ? p3_wed(w) : p3_fri(w);
}

async function main() {
  try {
    console.log("Clearing antonia's existing plan...");
    await sql`DELETE FROM exercise_sets WHERE exercise_id IN (SELECT e.id FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE s.user_id = ${USER_ID})`;
    await sql`DELETE FROM exercises WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ${USER_ID})`;
    await sql`DELETE FROM sessions WHERE user_id = ${USER_ID}`;
    await sql`DELETE FROM phases WHERE user_id = ${USER_ID}`;

    const phaseIds: Record<number, number> = {};
    for (const p of phases) {
      const [{ id }] = await sql<{ id: number }[]>`
        INSERT INTO phases (user_id, mesocycle_num, name, short_name, start_date, end_date, description)
        VALUES (${USER_ID}, ${p.mesocycle_num}, ${p.name}, ${p.short_name}, ${p.start_date}, ${p.end_date}, ${p.description})
        RETURNING id`;
      phaseIds[p.mesocycle_num] = id;
      console.log(`Phase ${p.mesocycle_num} (${p.short_name}) → id ${id}`);
    }

    const dayOffsets = { mon: 0, wed: 2, fri: 4 } as const;
    let inserted = 0;
    for (let weekIdx = 0; weekIdx < 12; weekIdx++) {
      const phase = (weekIdx < 4 ? 1 : weekIdx < 8 ? 2 : 3) as 1|2|3;
      const w = ((weekIdx % 4) + 1) as 1|2|3|4;
      const weekStart = addDays(MACRO_START, weekIdx * 7);
      for (const dow of ['mon','wed','fri'] as const) {
        const date = addDays(weekStart, dayOffsets[dow]);
        const spec = templateFor(phase, dow, w);
        const [{ id: sessionId }] = await sql<{ id: number }[]>`
          INSERT INTO sessions (user_id, date, phase_id, type, title, scheduled, completed, notes)
          VALUES (${USER_ID}, ${date}, ${phaseIds[phase]}, ${spec.type}, ${spec.title}, true, false, ${spec.notes})
          RETURNING id`;
        let order = 1;
        for (const ex of spec.exercises) {
          const [{ id: exerciseId }] = await sql<{ id: number }[]>`
            INSERT INTO exercises (session_id, name, display_order, notes)
            VALUES (${sessionId}, ${ex.name}, ${order}, ${ex.notes})
            RETURNING id`;
          let setNum = 1;
          for (const s of ex.sets) {
            await sql`
              INSERT INTO exercise_sets (exercise_id, set_num, kind, label, reps, hold_seconds, rest_seconds)
              VALUES (${exerciseId}, ${setNum}, ${s.kind}, ${s.label}, ${s.reps ?? null}, ${s.hold_seconds ?? null}, ${s.rest_seconds ?? null})`;
            setNum++;
          }
          order++;
        }
        inserted++;
      }
    }

    console.log(`\n✓ Inserted ${inserted} sessions across 3 phases.`);
    const [counts] = await sql<{ sessions: number; exercises: number; sets: number }[]>`
      SELECT
        (SELECT COUNT(*)::int FROM sessions WHERE user_id = ${USER_ID}) AS sessions,
        (SELECT COUNT(*)::int FROM exercises WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ${USER_ID})) AS exercises,
        (SELECT COUNT(*)::int FROM exercise_sets WHERE exercise_id IN (SELECT e.id FROM exercises e JOIN sessions s ON s.id = e.session_id WHERE s.user_id = ${USER_ID})) AS sets`;
    console.log(`Counts → sessions: ${counts.sessions} · exercises: ${counts.exercises} · sets: ${counts.sets}`);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
