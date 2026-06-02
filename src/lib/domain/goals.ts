// H2 2026 macrocycle goals — derived from Martin's brief in context/jetgpt_dump.md.
// Baseline is the 2026-05-28 testing session. Target dates are end of macrocycle
// (Sun Aug 30, 2026).

export interface Goal {
  id: string;
  label: string;
  unit: string;
  baseline: number;
  target: number;
  /** Direction: "up" — bigger is better. "down" — smaller is better. */
  direction: 'up' | 'down';
  /** Hint for current value source. */
  source: 'tindeq_r' | 'tindeq_l' | 'asymmetry' | 'pullup_1rm' | 'run_pace';
  notes?: string;
}

export const GOALS: Goal[] = [
  {
    id: 'pullup',
    label: 'Pull-up 1RM added',
    unit: 'kg',
    baseline: 35,
    target: 55,
    direction: 'up',
    source: 'pullup_1rm',
    notes: '~167% BW for one rep — Lattice elite (8b+) territory.'
  },
  {
    id: 'tindeq-r',
    label: 'Tindeq R · 20 mm half-crimp',
    unit: 'kg',
    baseline: 55,
    target: 60,
    direction: 'up',
    source: 'tindeq_r'
  },
  {
    id: 'tindeq-l',
    label: 'Tindeq L · 20 mm half-crimp',
    unit: 'kg',
    baseline: 52,
    target: 57,
    direction: 'up',
    source: 'tindeq_l',
    notes: 'Weaker side from healed A2 pulley — primary asymmetry target.'
  },
  {
    id: 'asymmetry',
    label: 'Bilateral asymmetry',
    unit: '%',
    baseline: 5.5,
    target: 3,
    direction: 'down',
    source: 'asymmetry',
    notes: 'Under 3% by end of cycle.'
  },
  {
    id: 'run-pace',
    label: 'Easy-run pace (conversational)',
    unit: 'min/km',
    baseline: 8.5,
    target: 8.0,
    direction: 'down',
    source: 'run_pace',
    notes: 'Sub-focus: rebuild running 2+ years post-ACL. Soft surface, conversational.'
  }
];

export function progressPct(g: Goal, current: number): number {
  // Map current → 0–100 between baseline and target. Clamp.
  const span = g.direction === 'up' ? g.target - g.baseline : g.baseline - g.target;
  if (span <= 0) return current >= (g.direction === 'up' ? g.target : g.baseline) ? 100 : 0;
  const delta = g.direction === 'up' ? current - g.baseline : g.baseline - current;
  return Math.max(0, Math.min(100, (delta / span) * 100));
}
