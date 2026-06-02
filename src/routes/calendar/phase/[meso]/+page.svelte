<script lang="ts">
  import Button from '$lib/atoms/Button.svelte';
  import Tag from '$lib/molecules/Tag.svelte';
  import PhaseSummaryCard from '$lib/organisms/PhaseSummaryCard.svelte';
  import { SESSION_TYPE_LABELS } from '$lib/domain/types';
  import { parseISO, format, isSameDay } from 'date-fns';

  let { data } = $props();

  const today = $derived(parseISO(data.todayISO));

  function dayLetter(iso: string): string {
    return format(parseISO(iso), 'EEEEE'); // M, T, W, T, F, S, S
  }
</script>

<div class="phase-page">
  <header class="head">
    <div class="controls">
      {#if data.prevMeso}
        <Button variant="ghost" size="sm" href="/calendar/phase/{data.prevMeso}">&laquo; Phase {data.prevMeso}</Button>
      {/if}
      <Button variant="ghost" size="sm" href="/calendar">Month view</Button>
      <Button variant="ghost" size="sm" href="/calendar/week">Week view</Button>
      {#if data.nextMeso}
        <Button variant="ghost" size="sm" href="/calendar/phase/{data.nextMeso}">Phase {data.nextMeso} &raquo;</Button>
      {/if}
    </div>
    <div class="phase-tabs">
      {#each data.allPhases as p (p.id)}
        <a
          href="/calendar/phase/{p.mesocycle_num}"
          class="phase-tab"
          class:current={p.id === data.phase.id}
        >{p.short_name}</a>
      {/each}
    </div>
  </header>

  <PhaseSummaryCard phase={data.phase} progress={data.progress} todayISO={data.todayISO} />

  <section class="weeks">
    {#each data.weeks as week (week.weekInPhase)}
      <article class="week">
        <header class="week-head">
          <span class="week-num">Week {week.weekInPhase}</span>
          <span class="week-dates">{format(parseISO(week.start), 'MMM d')} – {format(parseISO(week.end), 'MMM d')}</span>
        </header>
        <div class="days">
          {#each week.sessions as s (s.id)}
            {@const isToday = isSameDay(parseISO(s.date), today)}
            <a class="day" class:today={isToday} class:completed={s.completed === 1} href="/log/by-date/{s.date}">
              <div class="day-meta">
                <span class="dow">{dayLetter(s.date)}</span>
                <span class="dom">{format(parseISO(s.date), 'd')}</span>
              </div>
              <div class="day-body">
                <span class="type-label">{SESSION_TYPE_LABELS[s.type]}</span>
                <span class="title">{s.title ?? SESSION_TYPE_LABELS[s.type]}</span>
                {#if s.sets_total > 0}
                  <span class="counts">{s.sets_completed}/{s.sets_total} sets</span>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      </article>
    {/each}
  </section>
</div>

<style>
  .phase-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    width: 100%;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }

  .controls { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  .phase-tabs {
    display: flex;
    gap: var(--space-1);
  }

  .phase-tab {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    text-decoration: none;
  }

  .phase-tab:hover {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
    text-decoration: none;
  }

  .phase-tab.current {
    background: var(--color-bg-inverse);
    color: var(--color-fg-inverse);
    border-color: var(--color-bg-inverse);
  }

  .weeks {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .week {
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    overflow: hidden;
    background: var(--color-bg-surface);
  }

  .week-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
  }

  .week-num {
    font: var(--weight-bold) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-default);
  }

  .week-dates {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    color: var(--color-fg-muted);
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0;
  }

  .day {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    border-right: 1px solid var(--color-border-default);
    color: var(--color-fg-default);
    text-decoration: none;
    transition: background var(--motion-default) var(--ease-standard);
    min-height: 100px;
  }

  .day:last-child { border-right: 0; }
  .day:hover { background: var(--color-bg-subtle); text-decoration: none; }

  .day.today {
    background: var(--color-bg-accent-tint);
    border-top: 2px solid var(--color-border-accent);
  }

  .day.completed {
    opacity: 0.75;
  }

  .day-meta {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .dow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .dom {
    font: var(--weight-bold) 18px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .day-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .type-label {
    font: var(--text-micro-weight) 10px/1 var(--font-sans);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .title {
    font: var(--text-body-sm-weight) 12px/1.3 var(--font-sans);
    color: var(--color-fg-default);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .counts {
    font: var(--weight-medium) 11px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    margin-top: 2px;
  }

  .day.completed .counts {
    color: var(--color-fg-accent);
  }

  @media (max-width: 768px) {
    .days { grid-template-columns: repeat(2, 1fr); }
    .day { border-right: 1px solid var(--color-border-default); border-bottom: 1px solid var(--color-border-default); }
  }
</style>
