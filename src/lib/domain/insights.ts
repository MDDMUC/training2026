// Lightweight rule-based insight scanner.
// Reads pre-aggregated state, returns ordered cards. Pure function — easy to test.

export type InsightSeverity = 'info' | 'good' | 'warn';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  detail: string;
  action?: { href: string; label: string };
}

export interface InsightInputs {
  asymmetryPct: number | null;
  sleepAvg7: number | null;
  sleepEntriesCount: number;
  todaysReadiness: number | null;
  todaysSessionType: string | null;
  weekSessionsTotal: number;
  weekSessionsCompleted: number;
  /** Days elapsed since plan start (negative if pre-plan). */
  daysSincePlanStart: number;
  weekTonnageKg: number;
  prevWeekTonnageKg: number;
  /** Latest pace; null if no runs logged. */
  latestRunPace: number | null;
  /** From the running goal target. */
  runPaceTarget: number;
  /** Days until the current phase ends (positive if still within), null if no phase. */
  daysUntilPhaseEnd: number | null;
  currentPhaseShortName: string | null;
  nextPhaseShortName: string | null;
  /** ISO date of the next scheduled test session (if any). */
  nextTestDate: string | null;
}

const HARD_SESSION_TYPES = new Set(['pull-heavy', 'push', 'climb-outdoor', 'test']);

export function generateInsights(i: InsightInputs): Insight[] {
  const out: Insight[] = [];

  // 1. Asymmetry warning
  if (i.asymmetryPct !== null && Math.abs(i.asymmetryPct) >= 5) {
    out.push({
      id: 'asymmetry',
      severity: 'warn',
      title: `${Math.abs(i.asymmetryPct).toFixed(1)}% finger asymmetry — train L first`,
      detail:
        'When asymmetry stays above 3%, do every finger set L-hand first while fresh. Match R-hand volume at the same relative %, not the same absolute load.',
      action: { href: '/analysis', label: 'See gauge' }
    });
  }

  // 2. Sleep below target
  if (i.sleepAvg7 !== null && i.sleepEntriesCount >= 3 && i.sleepAvg7 < 7) {
    out.push({
      id: 'sleep',
      severity: 'warn',
      title: `7-day sleep avg ${i.sleepAvg7.toFixed(1)} h — below 7 h target`,
      detail:
        'Sleep is the over-40 bottleneck. Two consecutive weeks under 7 h is the threshold to add an extra deload microcycle.',
      action: { href: '/analysis', label: 'See sleep chart' }
    });
  }

  // 3. Low readiness on a hard day
  if (
    i.todaysReadiness !== null &&
    i.todaysReadiness <= 5 &&
    i.todaysSessionType &&
    HARD_SESSION_TYPES.has(i.todaysSessionType)
  ) {
    out.push({
      id: 'low-readiness',
      severity: 'warn',
      title: `Readiness ${i.todaysReadiness}/10 — scale back today`,
      detail:
        'Today is a hard quality day. With readiness under 6, drop one working set, cap intensity at 80% of plan, and re-test tomorrow.'
    });
  }

  // 4. Missed sessions earlier this week (only if mid-week)
  // weekSessionsTotal counts the full week; if half-way through, expect ~half completed.
  // Simplification: if completed < 30% and plan-start is ≥ 2 days ago, nudge.
  if (
    i.daysSincePlanStart >= 0 &&
    i.weekSessionsTotal > 0 &&
    i.weekSessionsCompleted === 0 &&
    i.daysSincePlanStart % 7 >= 3 // mid-week or later
  ) {
    out.push({
      id: 'no-week-completion',
      severity: 'info',
      title: 'No sessions logged this week yet',
      detail:
        'If you trained but didn\'t log it, the easiest path is to tick what you actually did — the prescription is a starting point, not a contract.',
      action: { href: '/calendar/week', label: 'Open week' }
    });
  }

  // 5. Tonnage trending up (positive feedback)
  if (i.prevWeekTonnageKg > 0 && i.weekTonnageKg > i.prevWeekTonnageKg * 1.1) {
    const pct = Math.round(((i.weekTonnageKg - i.prevWeekTonnageKg) / i.prevWeekTonnageKg) * 100);
    out.push({
      id: 'tonnage-up',
      severity: 'good',
      title: `Tonnage up ${pct}% vs last week`,
      detail: 'Volume progressing well. Watch for 3+ consecutive weeks of double-digit growth — that\'s when injury risk climbs.'
    });
  }

  // 6. Run pace approaching target
  if (i.latestRunPace !== null && i.latestRunPace <= i.runPaceTarget + 0.2 && i.latestRunPace > i.runPaceTarget) {
    out.push({
      id: 'pace-close',
      severity: 'good',
      title: 'Run pace within 12 s/km of target',
      detail: 'Keep paces conversational. Don\'t chase the target on hard days — let it come from accumulated fitness.'
    });
  } else if (i.latestRunPace !== null && i.latestRunPace <= i.runPaceTarget) {
    out.push({
      id: 'pace-hit',
      severity: 'good',
      title: 'Run pace target hit',
      detail: 'Easy pace under 8:00/km — original sub-focus goal achieved.'
    });
  }

  // 7. Pre-plan window
  if (i.daysSincePlanStart < 0) {
    out.push({
      id: 'pre-plan',
      severity: 'info',
      title: `Plan starts in ${-i.daysSincePlanStart} day${i.daysSincePlanStart === -1 ? '' : 's'}`,
      detail:
        'Use the runway to confirm the Tindeq baseline, sleep, and a body-weight check-in are recorded. Phase 1 starts Mon Jun 8.',
      action: { href: '/log/by-date/2026-06-08', label: 'Preview Mon Jun 8' }
    });
  }

  // 8. Phase transition — final week of any phase
  if (
    i.daysUntilPhaseEnd !== null &&
    i.daysUntilPhaseEnd >= 0 &&
    i.daysUntilPhaseEnd <= 6 &&
    i.currentPhaseShortName
  ) {
    const isFinalPhase = i.nextPhaseShortName === null;
    const testHref = i.nextTestDate ? `/log/by-date/${i.nextTestDate}` : '/calendar';
    const detailParts: string[] = [];
    if (i.nextTestDate) {
      detailParts.push(`Test session: ${new Date(i.nextTestDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`);
    }
    if (!isFinalPhase && i.nextPhaseShortName) {
      detailParts.push(
        `After the test, calibrate Phase ${i.nextPhaseShortName} loads from the new MVC and 1RM. Update plan/0${i.nextPhaseShortName === 'MAX' ? '3' : '4'}-*.md with concrete week tables.`
      );
    } else if (isFinalPhase) {
      detailParts.push('Final week. After Wed test + Sat performance day, review the cycle and start drafting H1 2027 goals.');
    }
    out.push({
      id: 'phase-transition',
      severity: 'info',
      title: `Phase ${i.currentPhaseShortName} ends in ${i.daysUntilPhaseEnd} day${i.daysUntilPhaseEnd === 1 ? '' : 's'}`,
      detail: detailParts.join(' '),
      action: { href: testHref, label: 'Open test day' }
    });
  }

  return out.slice(0, 4); // cap to avoid clutter
}
