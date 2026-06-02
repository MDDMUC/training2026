<script lang="ts">
  import { SESSION_TYPE_LABELS, type SessionType } from '$lib/domain/types';
  import Tag from '$lib/molecules/Tag.svelte';
  import { parseISO, format, isSameDay } from 'date-fns';

  let { data } = $props();

  const today = $derived(parseISO(data.todayISO));

  // Group sessions by ISO week (Monday-anchored)
  const grouped = $derived.by(() => {
    type Group = { weekStart: string; items: typeof data.sessions };
    const map = new Map<string, Group>();
    for (const s of data.sessions) {
      // Use local-time methods consistently — parseISO returns a Date at
      // local midnight, so UTC accessors drift by the TZ offset in CEST.
      const d = parseISO(s.date);
      const dow = (d.getDay() + 6) % 7; // Mon=0
      const monday = new Date(d);
      monday.setDate(d.getDate() - dow);
      const key = format(monday, 'yyyy-MM-dd');
      const g = map.get(key) ?? { weekStart: key, items: [] };
      g.items.push(s);
      map.set(key, g);
    }
    // Chronological — Jun 8 first, Aug 30 last
    return Array.from(map.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  });

  const types: SessionType[] = [
    'pull-heavy',
    'pull-light',
    'push',
    'climb-indoor',
    'climb-outdoor',
    'mobility',
    'rest',
    'test'
  ];

  function filterHref(filter: string): string {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (data.typeFilter) params.set('type', data.typeFilter);
    const q = params.toString();
    return q ? `/log?${q}` : '/log';
  }

  function typeHref(t: SessionType | null): string {
    const params = new URLSearchParams();
    if (data.filter !== 'all') params.set('filter', data.filter);
    if (t) params.set('type', t);
    const q = params.toString();
    return q ? `/log?${q}` : '/log';
  }
</script>

<div class="log-page">
  <header class="head">
    <div class="left">
      <h2>Session history</h2>
      <p class="subtitle">{data.sessions.length} sessions match · click any day to open</p>
    </div>
    <div class="right">
      <a class="free-cta" href="/log/free">+ Log free session</a>
    </div>
  </header>

  <div class="filters">
    <div class="filter-group">
      <span class="filter-label">View</span>
      <a class="chip" class:active={data.filter === 'all'} href={filterHref('all')}>All</a>
      <a class="chip" class:active={data.filter === 'today-and-back'} href={filterHref('today-and-back')}>Past + today</a>
      <a class="chip" class:active={data.filter === 'upcoming'} href={filterHref('upcoming')}>Upcoming</a>
      <a class="chip" class:active={data.filter === 'completed'} href={filterHref('completed')}>Completed</a>
      <a class="chip" class:active={data.filter === 'pending'} href={filterHref('pending')}>Pending</a>
    </div>
    <div class="filter-group">
      <span class="filter-label">Type</span>
      <a class="chip" class:active={!data.typeFilter} href={typeHref(null)}>Any</a>
      {#each types as t (t)}
        <a class="chip" class:active={data.typeFilter === t} href={typeHref(t)}>{SESSION_TYPE_LABELS[t]}</a>
      {/each}
    </div>
  </div>

  {#if data.sessions.length === 0}
    <p class="empty">No sessions match these filters.</p>
  {:else}
    <div class="weeks">
      {#each grouped as g (g.weekStart)}
        <section class="week">
          <header class="week-head">
            <span>Week of {format(parseISO(g.weekStart), 'MMM d, yyyy')}</span>
            <span class="week-count">
              {g.items.filter((s) => s.completed === 1).length}/{g.items.length} done
            </span>
          </header>
          <ul>
            {#each g.items as s (s.id)}
              {@const isToday = isSameDay(parseISO(s.date), today)}
              <li class:today={isToday} class:completed={s.completed === 1}>
                <a href="/log/by-date/{s.date}" class="row">
                  <span class="date">
                    <span class="dow">{format(parseISO(s.date), 'EEE')}</span>
                    <span class="dom">{format(parseISO(s.date), 'MMM d')}</span>
                  </span>
                  <span class="phase">
                    {#if s.phase_short_name}<Tag>{s.phase_short_name}</Tag>{/if}
                  </span>
                  <span class="info">
                    <span class="type">{SESSION_TYPE_LABELS[s.type]}</span>
                    <span class="title">{s.title ?? SESSION_TYPE_LABELS[s.type]}</span>
                  </span>
                  <span class="counts">
                    {#if s.completed === 1}
                      <span class="check">✓ Completed</span>
                    {:else if s.sets_total > 0}
                      <span class="prog">{s.sets_completed}/{s.sets_total} sets</span>
                    {:else}
                      <span class="prog faint">no sets</span>
                    {/if}
                  </span>
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .log-page { display: flex; flex-direction: column; gap: var(--space-5); width: 100%; }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }

  .free-cta {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-fg-default);
    border-radius: var(--radius-2);
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    text-decoration: none;
  }
  .free-cta:hover {
    background: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
    text-decoration: none;
  }
  h2 { font: var(--text-h2-weight) var(--text-h2-size)/1 var(--font-sans); letter-spacing: var(--text-h2-tracking); }
  .subtitle {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
    margin-top: var(--space-2);
  }

  .filters { display: flex; flex-direction: column; gap: var(--space-2); }
  .filter-group { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
  .filter-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    min-width: 50px;
  }
  .chip {
    padding: 4px var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    text-decoration: none;
    cursor: pointer;
  }
  .chip:hover { color: var(--color-fg-default); border-color: var(--color-border-strong); text-decoration: none; }
  .chip.active {
    background: var(--color-bg-inverse);
    color: var(--color-fg-inverse);
    border-color: var(--color-bg-inverse);
  }

  .weeks {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
    align-items: start;
  }

  @media (max-width: 1024px) {
    .weeks { grid-template-columns: 1fr; }
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
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .week-count { color: var(--color-fg-default); font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

  ul { list-style: none; padding: 0; margin: 0; }

  li { border-bottom: 1px solid var(--color-border-default); }
  li:last-child { border-bottom: 0; }
  li.today { background: var(--calendar-cell-bg-today); border-left: 3px solid var(--color-border-accent); }
  li.completed .row { opacity: 0.75; }

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

  .info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .type {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .title {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.3 var(--font-sans);
    color: var(--color-fg-default);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .counts {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    white-space: nowrap;
  }
  .check { color: var(--color-fg-accent); }
  .prog { color: var(--color-fg-muted); }
  .prog.faint { color: var(--color-fg-subtle); }

  .empty {
    text-align: center;
    color: var(--color-fg-muted);
    padding: var(--space-7);
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-2);
  }

  @media (max-width: 640px) {
    .row {
      grid-template-columns: 80px 1fr;
      grid-template-rows: auto auto;
      gap: var(--space-2);
    }
    .phase, .counts { grid-column: 2; }
  }
</style>
