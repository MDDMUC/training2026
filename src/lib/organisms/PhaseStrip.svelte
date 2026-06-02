<script lang="ts">
  import type { Phase } from '$lib/domain/types';
  import { differenceInCalendarDays, parseISO, isWithinInterval, format } from 'date-fns';

  type Props = {
    phases: Phase[];
    today: Date;
  };
  let { phases, today }: Props = $props();

  // Compute total span from earliest start to latest end
  const earliest = $derived(
    phases.reduce(
      (acc, p) => (parseISO(p.start_date) < acc ? parseISO(p.start_date) : acc),
      parseISO(phases[0]?.start_date ?? '2026-06-08')
    )
  );
  const latest = $derived(
    phases.reduce(
      (acc, p) => (parseISO(p.end_date) > acc ? parseISO(p.end_date) : acc),
      parseISO(phases[0]?.end_date ?? '2026-08-30')
    )
  );

  const totalDays = $derived(differenceInCalendarDays(latest, earliest) + 1);

  function phaseWidthPct(p: Phase): number {
    const days = differenceInCalendarDays(parseISO(p.end_date), parseISO(p.start_date)) + 1;
    return (days / totalDays) * 100;
  }

  function phaseLeftPct(p: Phase): number {
    const days = differenceInCalendarDays(parseISO(p.start_date), earliest);
    return (days / totalDays) * 100;
  }

  const todayLeftPct = $derived.by(() => {
    if (!isWithinInterval(today, { start: earliest, end: latest })) return null;
    const days = differenceInCalendarDays(today, earliest);
    return (days / totalDays) * 100;
  });
</script>

<div class="strip" aria-label="Phase strip">
  <div class="bar">
    {#each phases as p (p.id)}
      <div
        class="phase"
        style="left: {phaseLeftPct(p)}%; width: {phaseWidthPct(p)}%;"
        title="{p.name} · {p.start_date} → {p.end_date}"
      >
        <div class="phase-label">{p.short_name}</div>
        <div class="phase-dates">{format(parseISO(p.start_date), 'MMM d')} – {format(parseISO(p.end_date), 'MMM d')}</div>
      </div>
    {/each}
    {#if todayLeftPct !== null}
      <div class="today-marker" style="left: {todayLeftPct}%;" aria-label="Today"></div>
    {/if}
  </div>
</div>

<style>
  .strip {
    width: 100%;
  }

  .bar {
    position: relative;
    height: 56px;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    overflow: hidden;
    background: var(--color-bg-surface);
  }

  .phase {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px solid var(--color-border-default);
    padding: var(--space-2) var(--space-3);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .phase:first-child { border-left: none; }

  .phase-label {
    font: var(--weight-bold) 13px/1 var(--font-sans);
    letter-spacing: 0.06em;
    color: var(--color-fg-default);
  }

  .phase-dates {
    font: var(--weight-medium) 11px/1.2 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    margin-top: 4px;
  }

  .today-marker {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    background: var(--color-bg-accent);
  }

  .today-marker::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    width: 8px;
    height: 8px;
    background: var(--color-bg-accent);
    border-radius: 50%;
  }
</style>
