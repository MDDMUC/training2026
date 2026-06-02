<script lang="ts">
  import type { WeeklyLoad } from '$lib/db/queries';
  import { formatTonnage, formatHoldTime } from '$lib/domain/load';
  import { parseISO, format } from 'date-fns';

  type Props = {
    weeks: WeeklyLoad[];
    todayISO: string;
  };
  let { weeks, todayISO }: Props = $props();

  const todayDate = $derived(parseISO(todayISO).getTime());

  // Combine tonnage + iso-seconds into a single "volume" score for the bar height.
  // 60s of iso ≈ 100 kg of tonnage (rough heuristic so density-hang weeks visually
  // weigh comparably to weighted-pull weeks).
  function combined(w: WeeklyLoad): number {
    return w.tonnage_kg + w.isometric_seconds * (100 / 60);
  }

  const maxScore = $derived(Math.max(100, ...weeks.map((w) => combined(w))));

  function isCurrentWeek(w: WeeklyLoad): boolean {
    const start = parseISO(w.week_start).getTime();
    const end = start + 7 * 24 * 60 * 60 * 1000;
    return todayDate >= start && todayDate < end;
  }

  const phaseBoundaries = $derived.by(() => {
    const set = new Set<number>();
    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i].phase_short_name !== weeks[i - 1].phase_short_name) set.add(i);
    }
    return set;
  });

  const grandTotal = $derived({
    tonnage: weeks.reduce((a, w) => a + w.tonnage_kg, 0),
    iso: weeks.reduce((a, w) => a + w.isometric_seconds, 0)
  });
</script>

<div class="vol">
  <header>
    <h3>Volume per Week</h3>
    <p class="subtitle">
      Tonnage from completed work sets, plus isometric time-under-tension.
      Cycle total:
      <strong>{formatTonnage(grandTotal.tonnage)}</strong>
      {#if grandTotal.iso > 0} + <strong>{formatHoldTime(grandTotal.iso)}</strong> isos{/if}.
    </p>
  </header>

  <div class="chart">
    {#each weeks as w, i (w.week_num)}
      {@const score = combined(w)}
      {@const pct = score > 0 ? Math.max(2, (score / maxScore) * 100) : 0}
      {@const current = isCurrentWeek(w)}
      <div class="col" class:phase-sep={phaseBoundaries.has(i)} class:current>
        <div class="bars">
          <div class="bar" style="height: {pct}%;"></div>
        </div>
        <div class="meta">
          <span class="phase-pill">{w.phase_short_name ?? '—'}</span>
          <span class="week-num">W{w.week_num}</span>
          <span class="tonnage">
            {#if w.tonnage_kg > 0}{formatTonnage(w.tonnage_kg)}{:else}—{/if}
          </span>
          {#if w.isometric_seconds > 0}
            <span class="iso">+{formatHoldTime(w.isometric_seconds)}</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .vol {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header { margin-bottom: var(--space-5); }
  h3 {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .subtitle {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-subtle);
    margin-top: var(--space-1);
  }
  .subtitle strong {
    color: var(--color-fg-default);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: var(--weight-semibold);
  }

  .chart {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-1);
    align-items: end;
    height: 240px;
  }

  .col {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-left: 1px solid transparent;
    padding-left: 6px;
  }
  .col.phase-sep { border-left-color: var(--color-border-strong); }

  .bars {
    flex: 1;
    display: flex;
    align-items: end;
    margin-bottom: var(--space-2);
    min-height: 4px;
  }

  .bar {
    width: 100%;
    background: var(--color-fg-default);
    border-radius: var(--radius-1) var(--radius-1) 0 0;
    min-height: 2px;
    transition: height var(--motion-slow) var(--ease-standard);
  }

  .col.current .bar { background: var(--color-bg-accent); }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font: var(--text-micro-weight) 10px/1.1 var(--font-sans);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .phase-pill {
    font-size: 9px;
    padding: 1px 4px;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    color: var(--color-fg-muted);
  }
  .col.current .phase-pill {
    border-color: var(--color-border-accent);
    color: var(--color-fg-accent);
  }

  .week-num { font-weight: var(--weight-semibold); color: var(--color-fg-default); }

  .tonnage, .iso {
    font: var(--weight-medium) 10px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-transform: none;
    letter-spacing: 0;
    color: var(--color-fg-muted);
  }
  .tonnage { color: var(--color-fg-default); }

  @media (max-width: 768px) {
    .chart { grid-template-columns: repeat(6, 1fr); height: 380px; }
  }
</style>
