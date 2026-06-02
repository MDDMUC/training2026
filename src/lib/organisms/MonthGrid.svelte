<script lang="ts">
  import CalendarCell from './CalendarCell.svelte';
  import type { SessionWithCounts } from '$lib/db/queries';
  import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay
  } from 'date-fns';

  type Props = {
    month: Date;
    sessions: SessionWithCounts[];
    today: Date;
  };
  let { month, sessions, today }: Props = $props();

  const cells = $derived.by(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  });

  const sessionsByDate = $derived.by(() => {
    const m = new Map<string, SessionWithCounts[]>();
    for (const s of sessions) {
      const arr = m.get(s.date);
      if (arr) arr.push(s);
      else m.set(s.date, [s]);
    }
    return m;
  });

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<div class="month-grid" role="grid" aria-label="Month view">
  <div class="weekdays" role="row">
    {#each weekdayLabels as d (d)}
      <div class="weekday" role="columnheader">{d}</div>
    {/each}
  </div>
  <div class="days">
    {#each cells as date (date.toISOString())}
      {@const iso = format(date, 'yyyy-MM-dd')}
      <CalendarCell
        {date}
        {iso}
        inCurrentMonth={isSameMonth(date, month)}
        isToday={isSameDay(date, today)}
        sessions={sessionsByDate.get(iso) ?? []}
      />
    {/each}
  </div>
</div>

<style>
  .month-grid {
    display: flex;
    flex-direction: column;
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid var(--color-border-default);
  }

  .weekday {
    padding: var(--space-2) var(--space-3);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    /* Cells handle their own borders to avoid double lines */
    gap: 0;
  }

  /* Mobile: drop the 7-col grid in favor of an agenda list.
     A 7-col grid on a 375 px phone gives ~50 px columns — useless for the
     amount of info per day. Single-column list with horizontal day rows
     is the canonical mobile pattern (Google Calendar Agenda, Notion). */
  @media (max-width: 640px) {
    .weekdays { display: none; }
    .days { grid-template-columns: 1fr; }
  }
</style>
