<script lang="ts">
  import Button from '$lib/atoms/Button.svelte';
  import Tag from '$lib/molecules/Tag.svelte';
  import LineChart from '$lib/organisms/LineChart.svelte';
  import type { Point } from '$lib/organisms/LineChart.svelte';
  import { renderInlineMarkdown } from '$lib/utils/markdown';
  import { parseISO, format } from 'date-fns';

  let { data } = $props();

  // Build a trend of the top-set "score" over completed-only instances
  function setScore(s: { load_kg_added: number | null; load_kg: number | null; hold_seconds: number | null }): number {
    return s.load_kg_added ?? s.load_kg ?? s.hold_seconds ?? 0;
  }

  // Heuristic to pick the unit label for the chart
  const trendPoints = $derived<Point[]>(
    data.instances
      .filter((inst) => inst.top_set && inst.session_completed === 1)
      .map((inst) => ({
        id: inst.exercise_id,
        date: inst.session_date,
        value: setScore(inst.top_set!)
      }))
  );

  // Inspect first instance's top-set to decide the unit ("kg" vs "s")
  const sampleTop = $derived(data.instances.find((i) => i.top_set)?.top_set ?? null);
  const unit = $derived(
    sampleTop?.load_kg_added !== null && sampleTop?.load_kg_added !== undefined
      ? 'kg added'
      : sampleTop?.load_kg !== null && sampleTop?.load_kg !== undefined
        ? 'kg'
        : sampleTop?.hold_seconds !== null && sampleTop?.hold_seconds !== undefined
          ? 's'
          : ''
  );

  function summarize(s: { reps: number | null; load_kg: number | null; load_kg_added: number | null; hold_seconds: number | null }): string {
    const parts: string[] = [];
    if (s.reps !== null) parts.push(`${s.reps} reps`);
    if (s.hold_seconds !== null) parts.push(`${s.hold_seconds}s`);
    if (s.load_kg_added !== null) parts.push(`+${s.load_kg_added} kg`);
    else if (s.load_kg !== null) parts.push(`${s.load_kg} kg`);
    return parts.length ? parts.join(' · ') : '—';
  }
</script>

<div class="ex-page">
  <header class="head">
    <p class="eyebrow">Exercise</p>
    <h2>{data.name}</h2>
    <div class="meta">
      <span>{data.instances.length} instance{data.instances.length === 1 ? '' : 's'}</span>
      <span class="sep">·</span>
      <span>{data.instances.filter((i) => i.session_completed === 1).length} completed</span>
    </div>
  </header>

  <div class="controls">
    {#if data.prevName}
      <Button variant="ghost" size="sm" href="/exercise/{encodeURIComponent(data.prevName)}">&laquo; {data.prevName}</Button>
    {/if}
    <Button variant="ghost" size="sm" href="/log">All sessions</Button>
    <Button variant="ghost" size="sm" href="/calendar">Calendar</Button>
    {#if data.nextName}
      <Button variant="ghost" size="sm" href="/exercise/{encodeURIComponent(data.nextName)}">{data.nextName} &raquo;</Button>
    {/if}
  </div>

  {#if trendPoints.length > 0}
    <LineChart title="Top working set over time" points={trendPoints} unit={unit} yPad={3} />
  {:else}
    <p class="empty-hint">No completed sessions for this exercise yet — chart will populate as you log them.</p>
  {/if}

  <section class="instances">
    <h3>Every instance</h3>
    <ul>
      {#each [...data.instances].reverse() as inst (inst.exercise_id)}
        <li class:done={inst.session_completed === 1}>
          <a href="/log/by-date/{inst.session_date}" class="row">
            <span class="date">
              <span class="dow">{format(parseISO(inst.session_date), 'EEE')}</span>
              <span class="dom">{format(parseISO(inst.session_date), 'MMM d')}</span>
            </span>
            <span class="phase">
              {#if inst.phase_short_name}<Tag>{inst.phase_short_name}</Tag>{/if}
            </span>
            <span class="top">
              {#if inst.top_set}{summarize(inst.top_set)}{:else}—{/if}
            </span>
            <span class="status">
              {#if inst.session_completed === 1}<span class="check">✓</span>{:else}<span class="dot">·</span>{/if}
            </span>
          </a>
          {#if inst.athlete_notes}
            <p class="athlete-notes">{@html renderInlineMarkdown(inst.athlete_notes)}</p>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .ex-page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 1024px; }

  .head { padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border-default); }
  .eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-2);
  }
  h2 { font: var(--text-h1-weight) var(--text-h1-size)/1 var(--font-sans); letter-spacing: var(--text-h1-tracking); margin-bottom: var(--space-3); }
  .meta {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }
  .meta .sep { margin: 0 var(--space-1); color: var(--color-fg-subtle); }

  .controls { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  .empty-hint {
    padding: var(--space-5);
    text-align: center;
    color: var(--color-fg-muted);
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-2);
  }

  .instances {
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
  li.done { opacity: 0.85; }

  .row {
    display: grid;
    grid-template-columns: 100px auto 1fr auto;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    color: var(--color-fg-default);
    text-decoration: none;
    align-items: center;
    transition: background var(--motion-default) var(--ease-standard);
  }
  .row:hover { background: var(--color-bg-subtle); text-decoration: none; }

  .date { display: flex; flex-direction: column; gap: 2px; }
  .dow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .dom {
    font: var(--weight-semibold) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .top {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .check { color: var(--color-fg-accent); font-weight: var(--weight-bold); }
  .dot { color: var(--color-fg-subtle); }

  .athlete-notes {
    padding: 0 var(--space-4) var(--space-3) 124px;
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-muted);
    font-style: italic;
  }

  @media (max-width: 640px) {
    .row { grid-template-columns: 80px 1fr auto; gap: var(--space-2); }
    .phase { grid-column: 2; }
    .top { grid-column: 2; }
    .athlete-notes { padding-left: var(--space-4); }
  }
</style>
