<script lang="ts">
  import type { WeeklyLoad } from '$lib/db/queries';
  import { parseISO, format } from 'date-fns';

  type Props = {
    weeks: WeeklyLoad[];
    todayISO: string;
  };
  let { weeks, todayISO }: Props = $props();

  const todayDate = $derived(parseISO(todayISO).getTime());

  const maxSets = $derived(Math.max(20, ...weeks.map((w) => w.sets_total)));

  // Find the current week (todayISO falls inside)
  function isCurrentWeek(w: WeeklyLoad): boolean {
    const start = parseISO(w.week_start).getTime();
    const end = start + 7 * 24 * 60 * 60 * 1000;
    return todayDate >= start && todayDate < end;
  }

  // Group weeks by phase to draw phase separators
  const phaseBoundaries = $derived.by(() => {
    const set = new Set<number>();
    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i].phase_short_name !== weeks[i - 1].phase_short_name) {
        set.add(i);
      }
    }
    return set;
  });
</script>

<div class="weekly">
  <header>
    <h3>Weekly Training Load</h3>
    <p class="subtitle">Sets completed vs. prescribed, per week.</p>
  </header>

  <div class="chart">
    {#each weeks as w, i (w.week_num)}
      <div class="col" class:phase-sep={phaseBoundaries.has(i)} class:current={isCurrentWeek(w)}>
        <div class="bars">
          <div class="track" style="height: {(w.sets_total / maxSets) * 100}%;">
            <div
              class="fill"
              style="height: {w.sets_total ? (w.sets_completed / w.sets_total) * 100 : 0}%;"
            ></div>
          </div>
        </div>
        <div class="meta">
          <span class="phase-pill" data-phase={w.phase_short_name}>{w.phase_short_name ?? '—'}</span>
          <span class="week-num">W{w.week_num}</span>
          <span class="week-date">{format(parseISO(w.week_start), 'MMM d')}</span>
          <span class="counts">
            <span class="done">{w.sets_completed}</span><span class="sep">/</span><span class="total">{w.sets_total}</span>
          </span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .weekly {
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
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-subtle);
    margin-top: var(--space-1);
  }

  .chart {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-1);
    align-items: end;
    height: 220px;
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
  }

  .track {
    width: 100%;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    display: flex;
    align-items: end;
    overflow: hidden;
    min-height: 4px;
  }

  .fill {
    width: 100%;
    background: var(--color-fg-default);
    transition: height var(--motion-slow) var(--ease-standard);
  }

  .col.current .fill { background: var(--color-bg-accent); }
  .col.current .track { border-color: var(--color-border-accent); }

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

  .week-num {
    font-weight: var(--weight-semibold);
    color: var(--color-fg-default);
  }

  .week-date {
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: none;
    letter-spacing: 0;
  }

  .counts {
    font: var(--weight-medium) 10px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }

  .done { color: var(--color-fg-default); }
  .sep { color: var(--color-fg-subtle); margin: 0 1px; }
  .total { color: var(--color-fg-muted); }

  @media (max-width: 768px) {
    .chart { grid-template-columns: repeat(6, 1fr); height: 380px; }
  }
</style>
