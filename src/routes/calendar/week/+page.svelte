<script lang="ts">
  import Button from '$lib/atoms/Button.svelte';
  import Tag from '$lib/molecules/Tag.svelte';
  import { SESSION_TYPE_LABELS } from '$lib/domain/types';
  import { parseISO, format, addDays, isSameDay } from 'date-fns';

  let { data } = $props();

  const weekStart = $derived(parseISO(data.weekStartISO));
  const weekEnd = $derived(parseISO(data.weekEndISO));
  const today = $derived(parseISO(data.todayISO));

  // Group sessions by date string
  const sessionsByDate = $derived.by(() => {
    const m = new Map<string, typeof data.sessions>();
    for (const s of data.sessions) {
      const arr = m.get(s.date) ?? [];
      arr.push(s);
      m.set(s.date, arr);
    }
    return m;
  });

  const days = $derived(
    Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      return {
        date: d,
        iso: format(d, 'yyyy-MM-dd'),
        sessions: sessionsByDate.get(format(d, 'yyyy-MM-dd')) ?? []
      };
    })
  );
</script>

<div class="week-page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Week of</p>
      <h2>{format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}</h2>
    </div>
    <div class="controls">
      <Button variant="ghost" size="sm" href="/calendar/week?start={data.prevWeekStart}">&laquo; Prev</Button>
      <Button variant="ghost" size="sm" href="/calendar/week">This week</Button>
      <Button variant="ghost" size="sm" href="/calendar/week?start={data.nextWeekStart}">Next &raquo;</Button>
      <Button variant="ghost" size="sm" href="/calendar">Month view</Button>
      <Button variant="ghost" size="sm" href="/calendar/phase/1">Phase view</Button>
    </div>
  </header>

  <div class="days">
    {#each days as day (day.iso)}
      {@const isToday = isSameDay(day.date, today)}
      <a href="/log/by-date/{day.iso}" class="day-row" class:today={isToday}>
        <div class="day-meta">
          <div class="dow">{format(day.date, 'EEE')}</div>
          <div class="dom">{format(day.date, 'd')}</div>
          {#if isToday}<div class="today-tag">Today</div>{/if}
        </div>

        <div class="day-content">
          {#if day.sessions.length === 0}
            <span class="empty">—</span>
          {:else}
            {#each day.sessions as s (s.id)}
              <div class="session">
                <div class="session-head">
                  {#if s.phase_short_name}<Tag>{s.phase_short_name}</Tag>{/if}
                  <span class="session-type">{SESSION_TYPE_LABELS[s.type]}</span>
                  {#if s.completed}
                    <span class="completed">✓ Completed</span>
                  {:else if s.sets_completed > 0}
                    <span class="partial">{s.sets_completed}/{s.sets_total} sets</span>
                  {:else if s.sets_total > 0}
                    <span class="prescribed">{s.sets_total} sets prescribed</span>
                  {/if}
                </div>
                <div class="session-title">{s.title ?? SESSION_TYPE_LABELS[s.type]}</div>
              </div>
            {/each}
          {/if}
        </div>
      </a>
    {/each}
  </div>
</div>

<style>
  .week-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    gap: var(--space-4);
  }

  .eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-2);
  }

  h2 {
    font: var(--text-h2-weight) var(--text-h2-size)/1 var(--font-sans);
    letter-spacing: var(--text-h2-tracking);
  }

  .controls {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .days {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    overflow: hidden;
    background: var(--color-bg-surface);
  }

  .day-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border-default);
    color: var(--color-fg-default);
    text-decoration: none;
    transition: background var(--motion-default) var(--ease-standard);
  }

  .day-row:last-child { border-bottom: 0; }

  .day-row:hover {
    background: var(--color-bg-subtle);
    text-decoration: none;
  }

  .day-row.today {
    background: var(--calendar-cell-bg-today);
    border-left: 3px solid var(--color-border-accent);
    padding-left: calc(var(--space-5) - 3px);
  }

  .day-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .dow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .dom {
    font: var(--weight-bold) 28px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .today-tag {
    font: var(--text-micro-weight) 10px/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-accent);
  }

  .day-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-top: var(--space-1);
  }

  .empty { color: var(--color-fg-subtle); }

  .session-head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: 2px;
  }

  .session-type {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .completed {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-accent);
  }

  .partial, .prescribed {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .session-title {
    font: var(--text-body-weight) var(--text-body-size)/1.4 var(--font-sans);
    color: var(--color-fg-default);
  }
</style>
