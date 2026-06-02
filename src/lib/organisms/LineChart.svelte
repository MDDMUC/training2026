<script lang="ts">
  import { parseISO, format } from 'date-fns';

  export interface Point {
    date: string;       // YYYY-MM-DD
    value: number;
    id?: number;
  }

  type Props = {
    title: string;
    points: Point[];
    unit?: string;
    /** y-axis padding in absolute units. Default 5. */
    yPad?: number;
    /** ViewBox height (default 200). Increase for taller charts. */
    height?: number;
    /** Large mode: bigger labels, fatter line, more headroom for axes. */
    large?: boolean;
  };
  let { title, points, unit = 'kg', yPad = 5, height = 200, large = false }: Props = $props();

  const chartW = 640;
  const chartH = $derived(height);
  const padL = $derived(large ? 72 : 56);
  const padR = 16;
  const padT = $derived(large ? 20 : 16);
  const padB = $derived(large ? 44 : 32);
  const plotW = $derived(chartW - padL - padR);
  const plotH = $derived(chartH - padT - padB);

  const yMin = $derived(points.length ? Math.floor(Math.min(...points.map((p) => p.value)) - yPad) : 0);
  const yMax = $derived(points.length ? Math.ceil(Math.max(...points.map((p) => p.value)) + yPad) : 100);

  const xMin = $derived(points.length ? parseISO(points[0].date).getTime() : 0);
  const xMax = $derived(points.length ? parseISO(points[points.length - 1].date).getTime() : 1);

  function xFor(date: string): number {
    if (xMax === xMin) return padL + plotW / 2;
    return padL + ((parseISO(date).getTime() - xMin) / (xMax - xMin)) * plotW;
  }
  function yFor(v: number): number {
    if (yMax === yMin) return padT + plotH / 2;
    return padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  }

  const pathD = $derived(
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.date).toFixed(1)} ${yFor(p.value).toFixed(1)}`)
      .join(' ')
  );

  const yTicks = $derived([yMin, Math.round((yMin + yMax) / 2), yMax]);
</script>

<div class="chart-wrap" class:large>
  <header>
    <h3>{title}</h3>
    {#if points.length > 0}
      <span class="latest">
        <span class="num">{points[points.length - 1].value.toFixed(1)}</span><span class="unit">{unit}</span>
      </span>
    {/if}
  </header>

  {#if points.length === 0}
    <p class="empty">No data yet.</p>
  {:else}
    <svg viewBox="0 0 {chartW} {chartH}" class="chart" role="img" aria-label={title}>
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} class="axis" />
      <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} class="axis" />

      {#each yTicks as v (v)}
        <text x={padL - 10} y={yFor(v) + (large ? 6 : 4)} class="axis-label" text-anchor="end">{v}</text>
        <line x1={padL} y1={yFor(v)} x2={padL + plotW} y2={yFor(v)} class="gridline" />
      {/each}

      <path d={pathD} class="line" fill="none" />

      {#each points as p, i (p.id ?? p.date)}
        <circle
          cx={xFor(p.date)}
          cy={yFor(p.value)}
          r={large ? (i === points.length - 1 ? 7 : 5) : i === points.length - 1 ? 4 : 3}
          class="point"
          class:current={i === points.length - 1}
        />
      {/each}

      <text x={padL} y={padT + plotH + (large ? 28 : 20)} class="axis-label" text-anchor="start">
        {format(parseISO(points[0].date), 'MMM d')}
      </text>
      <text x={padL + plotW} y={padT + plotH + (large ? 28 : 20)} class="axis-label" text-anchor="end">
        {format(parseISO(points[points.length - 1].date), 'MMM d')}
      </text>
    </svg>
  {/if}
</div>

<style>
  .chart-wrap {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  h3 {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin: 0;
  }

  .latest {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .latest .num {
    font: var(--weight-semibold) 18px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
    margin: 0 2px;
  }

  .unit { color: var(--color-fg-muted); }

  /* Large variant: prominent header, bigger axis labels, fatter line */
  .chart-wrap.large header {
    margin-bottom: var(--space-3);
    align-items: end;
  }
  .chart-wrap.large h3 {
    font-size: 14px;
    letter-spacing: 0.06em;
    color: var(--color-fg-default);
  }
  .chart-wrap.large .latest .num {
    font-size: 36px;
    letter-spacing: -0.01em;
  }
  .chart-wrap.large .latest .unit {
    font-size: 14px;
    margin-left: 2px;
  }
  .chart-wrap.large .axis-label {
    font-size: 16px;
  }
  .chart-wrap.large .line {
    stroke-width: 2.5;
  }
  .chart-wrap.large .axis {
    stroke-width: 1.5;
  }

  .chart { width: 100%; height: auto; }

  .axis { stroke: var(--chart-axis); stroke-width: 1; }
  .gridline { stroke: var(--chart-gridline); stroke-width: 1; opacity: 0.35; }

  .axis-label {
    font: var(--weight-medium) 11px/1 var(--font-mono);
    fill: var(--color-fg-muted);
  }

  .line {
    stroke: var(--chart-line);
    stroke-width: 1.5;
  }

  .point { fill: var(--color-fg-default); }
  .point.current { fill: var(--chart-point-current); r: 5; }

  .empty {
    color: var(--color-fg-muted);
    font: var(--text-body-weight) var(--text-body-size)/1.5 var(--font-sans);
  }
</style>
