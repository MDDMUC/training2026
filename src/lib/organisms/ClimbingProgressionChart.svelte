<script lang="ts">
  import type { ClimbingAttempt, ClimbStyle } from '$lib/domain/types';
  import { CLIMB_STYLE_LABELS } from '$lib/domain/types';
  import { gradeRank, rankLabel } from '$lib/utils/grade';
  import { parseISO, format } from 'date-fns';

  type AttemptWithDate = ClimbingAttempt & { date: string };
  type Props = { attempts: AttemptWithDate[] };
  let { attempts }: Props = $props();

  // Filter to parseable attempts
  const parsed = $derived(
    attempts
      .map((a) => ({ ...a, rank: gradeRank(a.grade) }))
      .filter((a) => a.rank > 0)
  );

  const W = 640;
  const H = 220;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const ranks = $derived(parsed.map((p) => p.rank));
  const yMin = $derived(ranks.length ? Math.min(...ranks) - 2 : 60);
  const yMax = $derived(ranks.length ? Math.max(...ranks) + 2 : 80);

  const dates = $derived(parsed.map((p) => parseISO(p.date).getTime()));
  const xMin = $derived(dates.length ? Math.min(...dates) : Date.now());
  const xMax = $derived(dates.length ? Math.max(...dates) : Date.now() + 1);

  function xFor(d: string): number {
    if (xMax === xMin) return padL + plotW / 2;
    return padL + ((parseISO(d).getTime() - xMin) / (xMax - xMin)) * plotW;
  }
  function yFor(r: number): number {
    if (yMax === yMin) return padT + plotH / 2;
    return padT + plotH - ((r - yMin) / (yMax - yMin)) * plotH;
  }

  // Three y-axis ticks
  const yTicks = $derived([yMin, Math.round((yMin + yMax) / 2), yMax]);

  // Style → SVG marker variant
  function markerFor(style: ClimbStyle, x: number, y: number, accent: boolean) {
    return { style, x, y, accent };
  }
</script>

<div class="chart-card">
  <header>
    <h3>Climbing Progression</h3>
    <p class="subtitle">Each dot = one route or boulder logged.</p>
  </header>

  {#if parsed.length === 0}
    <p class="empty">No climbs logged yet.</p>
  {:else}
    <svg viewBox="0 0 {W} {H}" class="chart" role="img" aria-label="Climbing progression scatter">
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} class="axis" />
      <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} class="axis" />

      {#each yTicks as r (r)}
        <text x={padL - 8} y={yFor(r) + 4} class="axis-label" text-anchor="end">{rankLabel(r)}</text>
        <line x1={padL} y1={yFor(r)} x2={padL + plotW} y2={yFor(r)} class="gridline" />
      {/each}

      {#each parsed as a, i (a.id)}
        {@const cx = xFor(a.date)}
        {@const cy = yFor(a.rank)}
        {@const accent = a.style === 'onsight'}
        {#if a.style === 'onsight' || a.style === 'flash'}
          <!-- onsight / flash = filled triangle -->
          <polygon
            points="{cx},{cy - 5} {cx - 4},{cy + 3} {cx + 4},{cy + 3}"
            class:accent
            class="mark filled"
          />
        {:else if a.style === 'redpoint' || a.style === 'repeat'}
          <!-- redpoint / repeat = filled circle -->
          <circle cx={cx} cy={cy} r="4" class="mark filled" />
        {:else}
          <!-- attempt / project = open ring -->
          <circle cx={cx} cy={cy} r="4" class="mark hollow" />
        {/if}
      {/each}

      <text x={padL} y={padT + plotH + 20} class="axis-label" text-anchor="start">
        {format(parseISO(parsed[0].date), 'MMM d')}
      </text>
      <text x={padL + plotW} y={padT + plotH + 20} class="axis-label" text-anchor="end">
        {format(parseISO(parsed[parsed.length - 1].date), 'MMM d')}
      </text>
    </svg>

    <div class="legend">
      <span><svg width="12" height="12"><polygon points="6,1 1,10 11,10" class="mark accent filled" /></svg> Onsight</span>
      <span><svg width="12" height="12"><polygon points="6,1 1,10 11,10" class="mark filled" /></svg> Flash</span>
      <span><svg width="12" height="12"><circle cx="6" cy="6" r="4" class="mark filled" /></svg> Redpoint / Repeat</span>
      <span><svg width="12" height="12"><circle cx="6" cy="6" r="4" class="mark hollow" /></svg> Attempt / Project</span>
    </div>
  {/if}
</div>

<style>
  .chart-card {
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

  .chart { width: 100%; height: auto; max-width: 640px; }

  .axis { stroke: var(--chart-axis); stroke-width: 1; }
  .gridline { stroke: var(--chart-gridline); stroke-width: 1; opacity: 0.35; }
  .axis-label { font: var(--weight-medium) 11px/1 var(--font-mono); fill: var(--color-fg-muted); }

  .mark.filled { fill: var(--color-fg-default); stroke: none; }
  .mark.hollow { fill: none; stroke: var(--color-fg-muted); stroke-width: 1.5; }
  .mark.accent { fill: var(--color-fg-accent); }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-top: var(--space-3);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }
  .legend svg { vertical-align: middle; margin-right: var(--space-1); }

  .empty {
    color: var(--color-fg-muted);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }
</style>
