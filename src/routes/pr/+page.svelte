<script lang="ts">
  import { parseISO, format } from 'date-fns';
  import { formatTonnage } from '$lib/domain/load';
  import { CLIMB_STYLE_LABELS } from '$lib/domain/types';

  let { data } = $props();

  function paceLabel(min: number): string {
    const m = Math.floor(min);
    const s = Math.round((min - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')} /km`;
  }

  function topSetSummary(t: { reps: number | null; load_kg: number | null; load_kg_added: number | null; hold_seconds: number | null }): string {
    const parts: string[] = [];
    if (t.reps !== null) parts.push(`${t.reps} reps`);
    if (t.hold_seconds !== null) parts.push(`${t.hold_seconds}s`);
    if (t.load_kg_added !== null) parts.push(`+${t.load_kg_added} kg`);
    else if (t.load_kg !== null) parts.push(`${t.load_kg} kg`);
    return parts.join(' · ') || '—';
  }
</script>

<div class="pr-page">
  <header class="head">
    <p class="eyebrow">Personal records</p>
    <h2>Best ever, across the cycle</h2>
    <p class="subtitle">Lifetime peaks tracked by the app. Updates as you log.</p>
  </header>

  <section class="big-grid">
    {#if data.bestTindeqR}
      <article class="pr-card">
        <div class="pr-label">Tindeq · R hand</div>
        <div class="pr-value">{data.bestTindeqR.peak_force_kg.toFixed(1)}<span class="unit">kg</span></div>
        <div class="pr-meta">{data.bestTindeqR.edge_mm}mm {data.bestTindeqR.grip_position} · {format(parseISO(data.bestTindeqR.date), 'MMM d, yyyy')}</div>
      </article>
    {/if}
    {#if data.bestTindeqL}
      <article class="pr-card">
        <div class="pr-label">Tindeq · L hand</div>
        <div class="pr-value">{data.bestTindeqL.peak_force_kg.toFixed(1)}<span class="unit">kg</span></div>
        <div class="pr-meta">{data.bestTindeqL.edge_mm}mm {data.bestTindeqL.grip_position} · {format(parseISO(data.bestTindeqL.date), 'MMM d, yyyy')}</div>
      </article>
    {/if}
    {#if data.bestPullup}
      <article class="pr-card">
        <div class="pr-label">Pull-up · est. 1RM</div>
        <div class="pr-value">+{data.bestPullup.estimated_1rm_added_kg.toFixed(1)}<span class="unit">kg</span></div>
        <div class="pr-meta">From +{data.bestPullup.top_load_added_kg.toFixed(0)} × {data.bestPullup.top_reps} · {format(parseISO(data.bestPullup.date), 'MMM d, yyyy')}</div>
      </article>
    {/if}
    {#if data.hardestOnsight}
      <article class="pr-card accent">
        <div class="pr-label">Hardest onsight / flash</div>
        <div class="pr-value">{data.hardestOnsight.grade}</div>
        <div class="pr-meta">{CLIMB_STYLE_LABELS[data.hardestOnsight.style]} · {format(parseISO(data.hardestOnsight.date), 'MMM d, yyyy')}</div>
      </article>
    {/if}
    {#if data.hardestRedpoint}
      <article class="pr-card">
        <div class="pr-label">Hardest redpoint</div>
        <div class="pr-value">{data.hardestRedpoint.grade}</div>
        <div class="pr-meta">{CLIMB_STYLE_LABELS[data.hardestRedpoint.style]} · {format(parseISO(data.hardestRedpoint.date), 'MMM d, yyyy')}</div>
      </article>
    {/if}
    {#if data.fastestRun && data.fastestRun.pace_min_per_km !== null}
      <article class="pr-card">
        <div class="pr-label">Fastest run pace</div>
        <div class="pr-value">{paceLabel(data.fastestRun.pace_min_per_km)}</div>
        <div class="pr-meta">{data.fastestRun.distance_km.toFixed(1)} km · {format(parseISO(data.fastestRun.date), 'MMM d, yyyy')}</div>
      </article>
    {/if}
    {#if data.longestRun}
      <article class="pr-card">
        <div class="pr-label">Longest run</div>
        <div class="pr-value">{data.longestRun.distance_km.toFixed(1)}<span class="unit">km</span></div>
        <div class="pr-meta">{data.longestRun.duration_min.toFixed(0)} min · {format(parseISO(data.longestRun.date), 'MMM d, yyyy')}</div>
      </article>
    {/if}
    {#if data.peakTonnageWeek && data.peakTonnageWeek.tonnage_kg > 0}
      <article class="pr-card">
        <div class="pr-label">Peak tonnage week</div>
        <div class="pr-value">{formatTonnage(data.peakTonnageWeek.tonnage_kg)}</div>
        <div class="pr-meta">Week {data.peakTonnageWeek.week_num} · {format(parseISO(data.peakTonnageWeek.week_start), 'MMM d')}</div>
      </article>
    {/if}
  </section>

  {#if data.exercisePRs.length > 0}
    <section class="ex-block">
      <h3>Best top-set per exercise</h3>
      <ul>
        {#each data.exercisePRs as e (e.name)}
          <li>
            <a href="/exercise/{encodeURIComponent(e.name)}" class="ex-row">
              <span class="ex-name">{e.name}</span>
              <span class="ex-top">{topSetSummary(e.top_set)}</span>
              <span class="ex-date">{format(parseISO(e.best_date), 'MMM d')}</span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .pr-page { display: flex; flex-direction: column; gap: var(--space-6); max-width: 1024px; }

  .head { padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border-default); }

  .eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-2);
  }

  h2 {
    font: var(--text-h1-weight) var(--text-h1-size)/1 var(--font-sans);
    letter-spacing: var(--text-h1-tracking);
    margin-bottom: var(--space-2);
  }

  .subtitle { color: var(--color-fg-muted); font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans); }

  .big-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-4);
  }

  .pr-card {
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .pr-card.accent {
    border-color: var(--color-border-accent);
    background: var(--color-bg-accent-tint);
  }

  .pr-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .pr-value {
    font: var(--text-data-lg-weight) var(--text-data-lg-size)/var(--text-data-lg-line) var(--font-mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    color: var(--color-fg-default);
    margin-top: var(--space-1);
  }

  .pr-card.accent .pr-value { color: var(--color-fg-accent); }

  .unit { font-size: 0.55em; color: var(--color-fg-muted); margin-left: 2px; }

  .pr-meta {
    font: var(--text-body-sm-weight) 12px/1.3 var(--font-sans);
    color: var(--color-fg-muted);
    margin-top: var(--space-2);
  }

  .ex-block {
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    overflow: hidden;
  }

  h3 {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  ul { list-style: none; padding: 0; margin: 0; }
  li { border-bottom: 1px solid var(--color-border-default); }
  li:last-child { border-bottom: 0; }

  .ex-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    color: var(--color-fg-default);
    text-decoration: none;
    align-items: center;
    transition: background var(--motion-default) var(--ease-standard);
  }
  .ex-row:hover { background: var(--color-bg-subtle); text-decoration: none; }

  .ex-name { font: var(--weight-semibold) var(--text-body-size)/1.3 var(--font-sans); }

  .ex-top {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .ex-date {
    font: var(--weight-medium) 12px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }
</style>
