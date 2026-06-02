<script lang="ts">
  type Props = {
    rKg: number;
    lKg: number;
    /** Threshold above which the gap gets the accent treatment. */
    warnThreshold?: number;
    /** Optional unit / context label below the title. */
    subtitle?: string;
  };
  let { rKg, lKg, warnThreshold = 7, subtitle }: Props = $props();

  const stronger = $derived(Math.max(rKg, lKg));
  const asymPct = $derived(stronger === 0 ? 0 : ((rKg - lKg) / stronger) * 100);

  // bars scale to the stronger hand = 100%
  const rPct = $derived(stronger === 0 ? 0 : (rKg / stronger) * 100);
  const lPct = $derived(stronger === 0 ? 0 : (lKg / stronger) * 100);

  const overThreshold = $derived(Math.abs(asymPct) >= warnThreshold);
  const weakerSide = $derived(asymPct > 0 ? 'L' : asymPct < 0 ? 'R' : null);
  const gapKg = $derived(Math.abs(rKg - lKg));
</script>

<div class="gauge" class:warn={overThreshold}>
  <header>
    <h3>Asymmetry</h3>
    {#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
  </header>

  <div class="rows">
    <div class="row">
      <span class="hand">R</span>
      <div class="track">
        <div class="bar" style="width: {rPct}%;"></div>
      </div>
      <span class="value">{rKg.toFixed(1)}<span class="unit">kg</span></span>
    </div>
    <div class="row">
      <span class="hand">L</span>
      <div class="track">
        <div class="bar" style="width: {lPct}%;"></div>
      </div>
      <span class="value">{lKg.toFixed(1)}<span class="unit">kg</span></span>
    </div>
  </div>

  <footer>
    <div class="gap">
      <span class="gap-num">{asymPct >= 0 ? '−' : '+'}{Math.abs(asymPct).toFixed(1)}%</span>
      {#if weakerSide}
        <span class="gap-meta">L is {gapKg.toFixed(1)} kg weaker</span>
      {:else}
        <span class="gap-meta">balanced</span>
      {/if}
    </div>
    {#if overThreshold}
      <span class="flag">priority L</span>
    {:else}
      <span class="flag-ok">within target</span>
    {/if}
  </footer>
</div>

<style>
  .gauge {
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

  .rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
  }

  .row {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    align-items: center;
    gap: var(--space-3);
  }

  .hand {
    font: var(--weight-bold) 13px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }

  .track {
    height: 8px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-1);
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background: var(--color-fg-default);
    transition: width var(--motion-slow) var(--ease-standard);
  }

  .gauge.warn .bar { background: var(--color-bg-accent); }

  .value {
    font: var(--weight-semibold) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .unit { color: var(--color-fg-muted); font-size: 0.78em; margin-left: 2px; }

  footer {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  .gap { display: flex; align-items: baseline; gap: var(--space-3); }

  .gap-num {
    font: var(--text-data-lg-weight) 24px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
    letter-spacing: -0.01em;
  }

  .gauge.warn .gap-num { color: var(--color-fg-accent); }

  .gap-meta {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .flag, .flag-ok {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    padding: 4px var(--space-2);
    border-radius: var(--radius-1);
  }

  .flag {
    color: var(--color-fg-accent);
    border: 1px solid var(--color-border-accent);
  }

  .flag-ok {
    color: var(--color-fg-muted);
    border: 1px solid var(--color-border-default);
  }
</style>
