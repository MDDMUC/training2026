<script lang="ts">
  import { enhance } from '$app/forms';
  import type { TindeqTest } from '$lib/domain/types';
  import { asymmetryPercent } from '$lib/domain/types';
  import { parseISO, format } from 'date-fns';

  type Props = {
    recentR: TindeqTest[];
    recentL: TindeqTest[];
  };
  let { recentR, recentL }: Props = $props();

  let peakL = $state<number | null>(null);
  let peakR = $state<number | null>(null);
  let edge = $state<number>(20);
  let grip = $state<'half-crimp' | 'open-hand' | 'full-crimp' | 'sloper' | 'pinch'>('half-crimp');
  let bw = $state<number | null>(null);
  let notes = $state<string>('');

  const previewAsym = $derived(
    peakL !== null && peakR !== null ? asymmetryPercent(peakR, peakL) : null
  );

  // Sparkline data — chronological order
  const lastR = $derived([...recentR].reverse());
  const lastL = $derived([...recentL].reverse());

  const sparkW = 200;
  const sparkH = 36;
  const sparkPad = 4;
  const allValues = $derived([...lastR.map((t) => t.peak_force_kg), ...lastL.map((t) => t.peak_force_kg)]);
  const sparkMin = $derived(allValues.length ? Math.min(...allValues) - 1 : 0);
  const sparkMax = $derived(allValues.length ? Math.max(...allValues) + 1 : 1);

  function sparkPath(pts: TindeqTest[]): string {
    if (pts.length < 2) return '';
    const range = Math.max(0.001, sparkMax - sparkMin);
    return pts
      .map((p, i) => {
        const x = sparkPad + (i / (pts.length - 1)) * (sparkW - 2 * sparkPad);
        const y = sparkPad + (1 - (p.peak_force_kg - sparkMin) / range) * (sparkH - 2 * sparkPad);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }
</script>

<section class="quicklog">
  <header>
    <h3>Tindeq Quick-log</h3>
    <p class="subtitle">Records a new test row for both hands.</p>
  </header>

  <form method="POST" action="?/recordTindeq" use:enhance>
    <div class="inputs">
      <label class="big-input">
        <span>L · peak</span>
        <input type="number" name="peak_l_kg" inputmode="decimal" step="0.1" min="0" bind:value={peakL} required />
        <span class="unit">kg</span>
      </label>
      <label class="big-input">
        <span>R · peak</span>
        <input type="number" name="peak_r_kg" inputmode="decimal" step="0.1" min="0" bind:value={peakR} required />
        <span class="unit">kg</span>
      </label>
    </div>

    {#if previewAsym !== null}
      <div class="asym-preview" class:warn={Math.abs(previewAsym) >= 7}>
        Preview asymmetry: <span class="asym-num">{previewAsym >= 0 ? '−' : '+'}{Math.abs(previewAsym).toFixed(1)}%</span>
        {#if Math.abs(previewAsym) >= 7}<span class="warn-flag">priority L</span>{/if}
      </div>
    {/if}

    <div class="meta">
      <label class="small-input">
        <span>Edge</span>
        <input type="number" name="edge_mm" inputmode="numeric" min="1" max="100" bind:value={edge} />
        <span class="unit">mm</span>
      </label>
      <label class="small-input">
        <span>Grip</span>
        <select name="grip_position" bind:value={grip}>
          <option value="half-crimp">half-crimp</option>
          <option value="open-hand">open-hand</option>
          <option value="full-crimp">full-crimp</option>
          <option value="sloper">sloper</option>
          <option value="pinch">pinch</option>
        </select>
      </label>
      <label class="small-input">
        <span>Body weight</span>
        <input type="number" name="body_weight_kg" inputmode="decimal" step="0.1" bind:value={bw} placeholder="—" />
        <span class="unit">kg</span>
      </label>
    </div>

    <label class="notes-field">
      <span>Notes</span>
      <input type="text" name="notes" bind:value={notes} placeholder="Conditions, sleep, anything notable" />
    </label>

    <div class="submit-row">
      <button type="submit" class="submit">Save Tindeq Test</button>
    </div>
  </form>

  <div class="history">
    <div class="hist-row">
      <div class="hist-label">R history</div>
      {#if lastR.length}
        <svg viewBox="0 0 {sparkW} {sparkH}" class="spark" aria-label="R history">
          <path d={sparkPath(lastR)} class="spark-line" fill="none" />
          {#each lastR as p, i (p.id)}
            {@const range = Math.max(0.001, sparkMax - sparkMin)}
            <circle
              cx={sparkPad + (lastR.length > 1 ? (i / (lastR.length - 1)) * (sparkW - 2 * sparkPad) : sparkW / 2)}
              cy={sparkPad + (1 - (p.peak_force_kg - sparkMin) / range) * (sparkH - 2 * sparkPad)}
              r={i === lastR.length - 1 ? 3 : 2}
              class:current={i === lastR.length - 1}
            />
          {/each}
        </svg>
        <div class="hist-values">
          {#each lastR as p (p.id)}<span>{p.peak_force_kg.toFixed(1)}</span>{/each}
        </div>
        <div class="hist-dates">
          <span>{format(parseISO(lastR[0].date), 'MMM d')}</span>
          <span>{format(parseISO(lastR[lastR.length - 1].date), 'MMM d')}</span>
        </div>
      {:else}
        <span class="empty">no history</span>
      {/if}
    </div>

    <div class="hist-row">
      <div class="hist-label">L history</div>
      {#if lastL.length}
        <svg viewBox="0 0 {sparkW} {sparkH}" class="spark" aria-label="L history">
          <path d={sparkPath(lastL)} class="spark-line muted" fill="none" />
          {#each lastL as p, i (p.id)}
            {@const range = Math.max(0.001, sparkMax - sparkMin)}
            <circle
              cx={sparkPad + (lastL.length > 1 ? (i / (lastL.length - 1)) * (sparkW - 2 * sparkPad) : sparkW / 2)}
              cy={sparkPad + (1 - (p.peak_force_kg - sparkMin) / range) * (sparkH - 2 * sparkPad)}
              r={i === lastL.length - 1 ? 3 : 2}
              class:current={i === lastL.length - 1}
              class="muted"
            />
          {/each}
        </svg>
        <div class="hist-values">
          {#each lastL as p (p.id)}<span>{p.peak_force_kg.toFixed(1)}</span>{/each}
        </div>
      {:else}
        <span class="empty">no history</span>
      {/if}
    </div>
  </div>
</section>

<style>
  .quicklog {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header { margin-bottom: var(--space-5); }

  h3 {
    font: var(--text-h3-weight) var(--text-h3-size)/1 var(--font-sans);
  }

  .subtitle {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
    margin-top: var(--space-1);
  }

  .inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .big-input {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    position: relative;
  }

  .big-input input {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-data-lg-weight) 32px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
    letter-spacing: -0.01em;
  }

  .big-input input:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 1px;
  }

  .big-input .unit {
    position: absolute;
    right: var(--space-3);
    bottom: var(--space-3);
    color: var(--color-fg-muted);
    font: var(--weight-medium) 14px/1 var(--font-mono);
  }

  .asym-preview {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-1);
    background: var(--color-bg-subtle);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-muted);
    margin-bottom: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .asym-num {
    font: var(--weight-semibold) 16px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .asym-preview.warn .asym-num { color: var(--color-fg-accent); }

  .warn-flag {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-accent);
    padding: 2px var(--space-2);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-1);
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .small-input {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    position: relative;
  }

  .small-input input, .small-input select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-data-weight) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .small-input .unit {
    position: absolute;
    right: var(--space-2);
    bottom: 7px;
    color: var(--color-fg-muted);
    font-size: 11px;
  }

  .notes-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-4);
  }

  .notes-field input {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/1.4 var(--font-sans);
    text-transform: none;
    letter-spacing: 0;
  }

  .submit-row { display: flex; justify-content: flex-end; }

  .submit {
    padding: var(--space-2) var(--space-5);
    border: 1px solid var(--color-fg-default);
    border-radius: var(--radius-2);
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    cursor: pointer;
  }

  .submit:hover {
    background: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
  }

  .history {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border-default);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .hist-row {
    display: grid;
    grid-template-columns: 90px auto 1fr;
    gap: var(--space-3);
    align-items: center;
  }

  .hist-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .spark { height: 32px; }
  .spark-line { stroke: var(--color-fg-default); stroke-width: 1.5; fill: none; }
  .spark-line.muted { stroke: var(--color-fg-muted); stroke-dasharray: 3 2; }
  .spark circle { fill: var(--color-fg-default); }
  .spark circle.muted { fill: var(--color-fg-muted); }
  .spark circle.current { fill: var(--color-fg-accent); r: 3; }

  .hist-values {
    display: flex;
    gap: var(--space-2);
    font: var(--text-data-weight) 11px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }

  .hist-dates {
    display: flex;
    justify-content: space-between;
    grid-column: 2;
    font: var(--text-micro-weight) 10px/1 var(--font-mono);
    color: var(--color-fg-subtle);
    margin-top: 2px;
  }

  .empty { color: var(--color-fg-subtle); }
</style>
