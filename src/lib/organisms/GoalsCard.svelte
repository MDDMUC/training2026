<script lang="ts">
  import { GOALS, progressPct, type Goal } from '$lib/domain/goals';

  type Props = {
    tindeqR: number | null;
    tindeqL: number | null;
    asymmetryPct: number | null;
    pullup1RM: number | null;
    runPace: number | null;
  };
  let { tindeqR, tindeqL, asymmetryPct, pullup1RM, runPace }: Props = $props();

  function currentFor(g: Goal): number | null {
    switch (g.source) {
      case 'tindeq_r': return tindeqR;
      case 'tindeq_l': return tindeqL;
      case 'asymmetry': return asymmetryPct !== null ? Math.abs(asymmetryPct) : null;
      case 'pullup_1rm': return pullup1RM;
      case 'run_pace': return runPace;
    }
  }

  function fmt(n: number, unit: string): string {
    if (unit === 'min/km') {
      const mins = Math.floor(n);
      const secs = Math.round((n - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')} /km`;
    }
    return `${n.toFixed(1)}${unit === '%' ? '%' : ' ' + unit}`;
  }
</script>

<section class="goals">
  <header>
    <h3>Macrocycle Goals</h3>
    <p class="subtitle">Targets through Sun Aug 30, 2026.</p>
  </header>

  <ul>
    {#each GOALS as g (g.id)}
      {@const current = currentFor(g)}
      {@const pct = current !== null ? progressPct(g, current) : 0}
      {@const reached = current !== null && (g.direction === 'up' ? current >= g.target : current <= g.target)}
      <li class="goal" class:reached>
        <div class="row1">
          <span class="label">{g.label}</span>
          <span class="numbers">
            {#if current !== null}
              <span class="current">{fmt(current, g.unit)}</span>
            {:else}
              <span class="current empty">—</span>
            {/if}
            <span class="arrow">→</span>
            <span class="target">{fmt(g.target, g.unit)}</span>
          </span>
        </div>
        <div class="track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div class="fill" style="width: {pct}%;"></div>
          <span class="pct">{pct.toFixed(0)}%</span>
        </div>
        <div class="row3">
          <span class="baseline">From {fmt(g.baseline, g.unit)}</span>
          {#if g.notes}<span class="note">{g.notes}</span>{/if}
        </div>
      </li>
    {/each}
  </ul>
</section>

<style>
  .goals {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header { margin-bottom: var(--space-4); }
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

  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .goal { display: flex; flex-direction: column; gap: var(--space-2); }

  .row1 {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .label {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-default);
  }

  .numbers {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    font: var(--weight-semibold) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .current { color: var(--color-fg-default); }
  .current.empty { color: var(--color-fg-subtle); }
  .arrow { color: var(--color-fg-subtle); }
  .target { color: var(--color-fg-muted); }

  .reached .current { color: var(--color-fg-accent); }

  .track {
    position: relative;
    height: 8px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--color-fg-default);
    transition: width var(--motion-slow) var(--ease-standard);
  }

  .reached .fill { background: var(--color-bg-accent); }

  .pct {
    position: absolute;
    top: -22px;
    right: 0;
    font: var(--weight-medium) 11px/1 var(--font-mono);
    color: var(--color-fg-subtle);
    font-variant-numeric: tabular-nums;
  }

  .row3 {
    display: flex;
    gap: var(--space-3);
    font: var(--text-body-sm-weight) 12px/1.3 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .baseline { flex-shrink: 0; }
  .note { color: var(--color-fg-subtle); font-style: italic; }
</style>
