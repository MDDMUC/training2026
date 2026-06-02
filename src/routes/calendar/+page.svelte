<script lang="ts">
  import MonthGrid from '$lib/organisms/MonthGrid.svelte';
  import PhaseStrip from '$lib/organisms/PhaseStrip.svelte';
  import Button from '$lib/atoms/Button.svelte';
  import { parseISO, addMonths, subMonths, format } from 'date-fns';

  let { data } = $props();

  const month = $derived(parseISO(data.monthISO + '-01'));
  const today = $derived(parseISO(data.todayISO));

  const prevHref = $derived(`/calendar?month=${format(subMonths(month, 1), 'yyyy-MM')}`);
  const nextHref = $derived(`/calendar?month=${format(addMonths(month, 1), 'yyyy-MM')}`);
</script>

<div class="calendar-page">
  <!-- Top bar: phase strip on left, month controls on right -->
  <header class="topline">
    <div class="phase-section">
      <p class="section-label">12-Week Plan</p>
      <PhaseStrip phases={data.phases} {today} />
    </div>

    <div class="month-controls">
      <h2 class="month-label">{data.monthLabel}</h2>
      <div class="controls">
        <Button variant="ghost" size="sm" href={prevHref}>&laquo;</Button>
        <Button variant="ghost" size="sm" href="/calendar">Today</Button>
        <Button variant="ghost" size="sm" href={nextHref}>&raquo;</Button>
        <span class="divider"></span>
        <Button variant="ghost" size="sm" href="/calendar/week">Week</Button>
        <Button variant="ghost" size="sm" href="/calendar/phase/1">Phase</Button>
        <span class="divider"></span>
        <Button variant="ghost" size="sm" href="/log/free">+ Free session</Button>
        <Button variant="secondary" size="sm" href="/api/calendar.ics">Export .ics</Button>
      </div>
    </div>
  </header>

  <MonthGrid {month} sessions={data.sessions} {today} />
</div>

<style>
  .calendar-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  .topline {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-6);
    align-items: end;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }

  .phase-section { min-width: 0; }

  .section-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-2);
  }

  .month-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-2);
  }

  .month-label {
    font: var(--text-h2-weight) var(--text-h2-size)/1 var(--font-sans);
    letter-spacing: var(--text-h2-tracking);
  }

  .controls {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    align-items: center;
  }

  .divider {
    width: 1px;
    height: 18px;
    background: var(--color-border-default);
    margin: 0 var(--space-1);
  }

  @media (max-width: 1024px) {
    .topline {
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }
    .month-controls { align-items: flex-start; }
  }
</style>
