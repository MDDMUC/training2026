<script lang="ts">
  import type { Phase } from '$lib/domain/types';
  import type { PhaseProgress } from '$lib/db/queries';
  import { parseISO, format, differenceInCalendarDays } from 'date-fns';

  type Props = {
    phase: Phase;
    progress: PhaseProgress;
    todayISO: string;
  };
  let { phase, progress, todayISO }: Props = $props();

  const today = $derived(parseISO(todayISO));
  const start = $derived(parseISO(phase.start_date));
  const end = $derived(parseISO(phase.end_date));

  const totalDays = $derived(differenceInCalendarDays(end, start) + 1);
  const elapsed = $derived(Math.max(0, Math.min(totalDays, differenceInCalendarDays(today, start) + 1)));
  const weekInPhase = $derived(Math.min(4, Math.max(1, Math.floor(elapsed / 7) + 1)));

  const sessionsPct = $derived(progress.sessions_total ? (progress.sessions_completed / progress.sessions_total) * 100 : 0);
  const setsPct = $derived(progress.sets_total ? (progress.sets_completed / progress.sets_total) * 100 : 0);
  const datePct = $derived((elapsed / totalDays) * 100);
</script>

<section class="card">
  <header>
    <div class="title-line">
      <span class="phase-tag">{phase.short_name}</span>
      <h3>{phase.name}</h3>
    </div>
    <div class="dates">
      {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
    </div>
  </header>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Week</div>
      <div class="stat-value">{weekInPhase}<span class="stat-sep">/</span><span class="stat-denom">4</span></div>
      <div class="stat-meta">{elapsed} of {totalDays} days</div>
    </div>
    <div class="stat">
      <div class="stat-label">Sessions</div>
      <div class="stat-value">{progress.sessions_completed}<span class="stat-sep">/</span><span class="stat-denom">{progress.sessions_total}</span></div>
      <div class="stat-meta">{sessionsPct.toFixed(0)}% logged</div>
    </div>
    <div class="stat">
      <div class="stat-label">Sets</div>
      <div class="stat-value">{progress.sets_completed}<span class="stat-sep">/</span><span class="stat-denom">{progress.sets_total}</span></div>
      <div class="stat-meta">{setsPct.toFixed(0)}% logged</div>
    </div>
  </div>

  <div class="progress-bars">
    <div class="pb-row">
      <span class="pb-label">Time</span>
      <div class="track"><div class="fill time" style="width: {datePct}%;"></div></div>
      <span class="pb-pct">{datePct.toFixed(0)}%</span>
    </div>
    <div class="pb-row">
      <span class="pb-label">Sets done</span>
      <div class="track"><div class="fill" style="width: {setsPct}%;"></div></div>
      <span class="pb-pct">{setsPct.toFixed(0)}%</span>
    </div>
  </div>

  {#if phase.description}
    <p class="description">{phase.description}</p>
  {/if}
</section>

<style>
  .card {
    padding: var(--space-6);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }

  .title-line { display: flex; align-items: baseline; gap: var(--space-3); }

  .phase-tag {
    font: var(--weight-bold) 13px/1 var(--font-sans);
    letter-spacing: 0.08em;
    padding: 4px var(--space-2);
    color: var(--color-fg-inverse);
    background: var(--color-bg-inverse);
    border-radius: var(--radius-1);
  }

  h3 {
    font: var(--text-h3-weight) var(--text-h3-size)/1 var(--font-sans);
    letter-spacing: -0.01em;
    margin: 0;
  }

  .dates {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-5);
    margin-bottom: var(--space-5);
  }

  .stat-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-1);
  }

  .stat-value {
    font: var(--text-data-lg-weight) var(--text-data-lg-size)/var(--text-data-lg-line) var(--font-mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    color: var(--color-fg-default);
  }

  .stat-sep { color: var(--color-fg-subtle); margin: 0 2px; }
  .stat-denom { color: var(--color-fg-muted); font-size: 0.6em; }

  .stat-meta {
    font: var(--text-body-sm-weight) 12px/1 var(--font-sans);
    color: var(--color-fg-muted);
    margin-top: var(--space-1);
  }

  .progress-bars {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .pb-row {
    display: grid;
    grid-template-columns: 80px 1fr 40px;
    align-items: center;
    gap: var(--space-3);
  }

  .pb-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .track {
    height: 4px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--color-fg-default);
    transition: width var(--motion-slow) var(--ease-standard);
  }

  .fill.time { background: var(--color-bg-accent); }

  .pb-pct {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    text-align: right;
  }

  .description {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.5 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0;
  }
</style>
