<script lang="ts">
  import { parseISO, format } from 'date-fns';

  export interface Point {
    date: string;
    value: number;
    id?: number;
  }

  type Props = {
    title: string;
    unit: string;
    /** Primary series (always rendered). */
    primary: Point[];
    /** Optional secondary series rendered dashed (e.g. L hand). */
    secondary?: Point[];
    /** Label shown next to the latest primary value (e.g. "R" for Tindeq). */
    primaryLabel?: string;
    /** Label for the secondary series (e.g. "L"). */
    secondaryLabel?: string;
    /** Padding for y-axis range (absolute units). */
    yPad?: number;
    /** Decimals shown on the latest number. Default 1. */
    decimals?: number;
  };
  let {
    title,
    unit,
    primary,
    secondary,
    primaryLabel,
    secondaryLabel,
    yPad = 3,
    decimals = 1
  }: Props = $props();

  // Card-internal layout:
  //   header        ~auto
  //   chart-area    flex:1
  // SVG viewBox is tuned to roughly match the chart-area's likely aspect (1.6:1)
  // so the chart stays visually correct without distortion.

  // SVG coordinate system
  const W = 600;
  const H = 360;
  const padL = 56;
  const padR = 24;
  const padT = 16;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Merge values from both series for axis scaling
  const allValues = $derived([
    ...primary.map((p) => p.value),
    ...(secondary ?? []).map((p) => p.value)
  ]);
  const allDates = $derived([
    ...primary.map((p) => parseISO(p.date).getTime()),
    ...(secondary ?? []).map((p) => parseISO(p.date).getTime())
  ]);

  const yMin = $derived(allValues.length ? Math.floor(Math.min(...allValues) - yPad) : 0);
  const yMax = $derived(allValues.length ? Math.ceil(Math.max(...allValues) + yPad) : 100);
  const xMin = $derived(allDates.length ? Math.min(...allDates) : Date.now());
  const xMax = $derived(allDates.length ? Math.max(...allDates) : Date.now() + 1);

  function xFor(date: string): number {
    if (xMax === xMin) return padL + plotW / 2;
    return padL + ((parseISO(date).getTime() - xMin) / (xMax - xMin)) * plotW;
  }
  function yFor(v: number): number {
    if (yMax === yMin) return padT + plotH / 2;
    return padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  }
  function pathOf(pts: Point[]): string {
    if (pts.length < 2) {
      // For single-point series, no path
      return '';
    }
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.date).toFixed(1)} ${yFor(p.value).toFixed(1)}`)
      .join(' ');
  }

  const yTicks = $derived(allValues.length
    ? [yMin, Math.round((yMin + yMax) / 2), yMax]
    : []);

  const latestPrimary = $derived(primary.length > 0 ? primary[primary.length - 1] : null);
  const latestSecondary = $derived(secondary && secondary.length > 0 ? secondary[secondary.length - 1] : null);

  const earliestDate = $derived(allDates.length ? new Date(xMin) : null);
  const latestDate = $derived(allDates.length ? new Date(xMax) : null);

  const hasData = $derived(primary.length > 0 || (secondary?.length ?? 0) > 0);
</script>

<section class="card">
  <header>
    <h3 class="title">{title}</h3>
    {#if hasData && latestPrimary}
      <div class="value-row">
        <span class="value">
          {latestPrimary.value.toFixed(decimals)}
          {#if primaryLabel}<span class="series-label">{primaryLabel}</span>{/if}
        </span>
        {#if latestSecondary}
          <span class="separator">/</span>
          <span class="value muted">
            {latestSecondary.value.toFixed(decimals)}
            {#if secondaryLabel}<span class="series-label">{secondaryLabel}</span>{/if}
          </span>
        {/if}
        <span class="unit">{unit}</span>
      </div>
    {/if}
  </header>

  <div class="chart-area">
    {#if !hasData}
      <p class="empty">No data yet.</p>
    {:else}
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" class="chart" role="img" aria-label={title}>
        <!-- Axes -->
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} class="axis" />
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} class="axis" />

        <!-- Y ticks + gridlines -->
        {#each yTicks as v (v)}
          <line x1={padL} y1={yFor(v)} x2={padL + plotW} y2={yFor(v)} class="gridline" />
          <text x={padL - 12} y={yFor(v)} class="axis-label y" text-anchor="end" dominant-baseline="middle">{v}</text>
        {/each}

        <!-- Secondary line (dashed, muted) -->
        {#if secondary && secondary.length >= 2}
          <path d={pathOf(secondary)} class="line secondary" fill="none" />
        {/if}

        <!-- Primary line -->
        {#if primary.length >= 2}
          <path d={pathOf(primary)} class="line primary" fill="none" />
        {/if}

        <!-- Secondary points -->
        {#if secondary}
          {#each secondary as p, i (p.id ?? p.date)}
            <circle
              cx={xFor(p.date)}
              cy={yFor(p.value)}
              r={i === secondary.length - 1 ? 7 : 4}
              class="point secondary"
              class:current={i === secondary.length - 1}
            />
          {/each}
        {/if}

        <!-- Primary points -->
        {#each primary as p, i (p.id ?? p.date)}
          <circle
            cx={xFor(p.date)}
            cy={yFor(p.value)}
            r={i === primary.length - 1 ? 7 : 4}
            class="point primary"
            class:current={i === primary.length - 1}
          />
        {/each}

        <!-- X-axis date labels -->
        {#if earliestDate && latestDate}
          <text x={padL} y={padT + plotH + 24} class="axis-label x" text-anchor="start">
            {format(earliestDate, 'MMM d')}
          </text>
          <text x={padL + plotW} y={padT + plotH + 24} class="axis-label x" text-anchor="end">
            {format(latestDate, 'MMM d')}
          </text>
        {/if}
      </svg>
    {/if}
  </div>
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    min-width: 0;
    height: 100%;
  }

  header {
    flex: 0 0 auto;
    margin-bottom: var(--space-4);
  }

  .title {
    font: var(--weight-semibold) 13px/1 var(--font-sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin: 0 0 var(--space-2) 0;
  }

  .value-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .value {
    font: var(--weight-bold) 36px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    color: var(--color-fg-default);
  }

  .value.muted { color: var(--color-fg-muted); font-weight: var(--weight-medium); }

  .series-label {
    font: var(--weight-medium) 13px/1 var(--font-sans);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-fg-subtle);
    margin-left: 4px;
  }

  .separator {
    font: var(--weight-medium) 28px/1 var(--font-mono);
    color: var(--color-fg-subtle);
  }

  .unit {
    font: var(--weight-medium) 16px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }

  .chart-area {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: stretch;
  }

  .chart {
    width: 100%;
    height: auto;
    max-height: 100%;
  }

  .axis { stroke: var(--chart-axis); stroke-width: 1.5; }
  .gridline { stroke: var(--chart-gridline); stroke-width: 1; opacity: 0.4; }

  .axis-label {
    font: var(--weight-medium) 14px/1 var(--font-mono);
    fill: var(--color-fg-muted);
  }

  .line {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .line.primary { stroke: var(--chart-line); stroke-width: 2.5; }
  .line.secondary { stroke: var(--chart-line-muted); stroke-width: 2; stroke-dasharray: 6 4; }

  .point.primary { fill: var(--color-fg-default); }
  .point.primary.current { fill: var(--chart-point-current); }
  .point.secondary { fill: var(--color-fg-muted); }
  .point.secondary.current { fill: var(--chart-point-current); }

  .empty {
    margin: auto;
    color: var(--color-fg-subtle);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }
</style>
