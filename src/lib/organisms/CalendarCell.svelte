<script lang="ts">
  import type { SessionWithCounts } from '$lib/db/queries';
  import { SESSION_TYPE_LABELS } from '$lib/domain/types';

  type Props = {
    date: Date;
    iso: string;
    inCurrentMonth: boolean;
    isToday: boolean;
    sessions: SessionWithCounts[];
  };
  let { date, iso, inCurrentMonth, isToday, sessions }: Props = $props();

  // Strip the leading "Pull · Heavy — " from titles since the type pill already shows it
  function trimTitle(title: string | null, type: string): string {
    if (!title) return SESSION_TYPE_LABELS[type as keyof typeof SESSION_TYPE_LABELS] ?? type;
    // Take only the part after "—" if it exists
    const dashIdx = title.indexOf('—');
    if (dashIdx > 0) return title.slice(dashIdx + 1).trim();
    return title;
  }

  function typeShort(t: string): string {
    switch (t) {
      case 'pull-heavy': return 'PULL+';
      case 'pull-light': return 'PULL';
      case 'push': return 'PUSH';
      case 'climb-indoor': return 'CLIMB';
      case 'climb-outdoor': return 'OUTDOOR';
      case 'rest': return 'REST';
      case 'mobility': return 'MOB';
      case 'run': return 'RUN';
      case 'test': return 'TEST';
      default: return t;
    }
  }
</script>

<a
  class="cell"
  class:other-month={!inCurrentMonth}
  class:today={isToday}
  class:rest={sessions.length > 0 && sessions[0].type === 'rest'}
  href="/log/by-date/{iso}"
  aria-current={isToday ? 'date' : undefined}
  aria-label="{date.toDateString()}{sessions.length ? ', ' + sessions.length + ' session(s)' : ''}"
>
  <div class="head">
    <span class="num">{date.getDate()}</span>
    {#if isToday}<span class="today-pill">Today</span>{/if}
  </div>

  <div class="body">
    {#each sessions as s (s.id)}
      {@const pct = s.sets_total > 0 ? (s.sets_completed / s.sets_total) * 100 : 0}
      <div class="session" data-type={s.type} class:completed={s.completed === 1}>
        <div class="type-tag" data-type={s.type}>{typeShort(s.type)}</div>
        <div class="title">{trimTitle(s.title, s.type)}</div>
        {#if s.sets_total > 0}
          <div class="progress">
            <div class="track"><div class="fill" style="width: {pct}%;"></div></div>
            <span class="counts">{s.sets_completed}<span class="sep">/</span>{s.sets_total}</span>
          </div>
        {/if}
        {#if s.completed === 1 && s.sets_total === 0}
          <div class="completed-mark">✓ Done</div>
        {/if}
      </div>
    {/each}
  </div>
</a>

<style>
  .cell {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 128px;
    padding: var(--space-2) var(--space-3);
    background: var(--calendar-cell-bg);
    border: 1px solid var(--calendar-cell-border);
    color: var(--color-fg-default);
    text-decoration: none;
    transition: background var(--motion-default) var(--ease-standard);
    overflow: hidden;
  }

  .cell:hover {
    background: var(--color-bg-subtle);
    text-decoration: none;
  }

  .cell:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: -2px;
  }

  .cell.other-month {
    background: transparent;
  }
  .cell.other-month .num { color: var(--calendar-cell-fg-other-month); }
  .cell.other-month .title,
  .cell.other-month .type-tag { opacity: 0.45; }

  .cell.today {
    background: var(--calendar-cell-bg-today);
    border: 1px solid var(--calendar-cell-border-today);
  }

  .cell.rest { background: transparent; }
  .cell.rest:hover { background: var(--color-bg-subtle); }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .num {
    font: var(--weight-semibold) 14px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .today-pill {
    font: var(--text-micro-weight) 9px/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-accent);
    padding: 2px 5px;
    border: 1px solid var(--color-border-accent);
    border-radius: 2px;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .session {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .type-tag {
    font: var(--weight-semibold) 9px/1 var(--font-sans);
    letter-spacing: 0.08em;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    display: inline-block;
    width: fit-content;
  }
  .type-tag[data-type='climb-outdoor'] {
    color: var(--color-fg-default);
    background: var(--color-bg-inverse);
    color: var(--color-fg-inverse);
    padding: 2px 5px;
    border-radius: 2px;
  }
  .type-tag[data-type='test'] {
    color: var(--color-fg-accent);
    border: 1px solid var(--color-border-accent);
    padding: 1px 4px;
    border-radius: 2px;
  }
  .type-tag[data-type='rest'] {
    color: var(--color-fg-subtle);
  }

  .title {
    font: var(--text-body-sm-weight) 12px/1.3 var(--font-sans);
    color: var(--color-fg-default);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .session.completed .title { color: var(--color-fg-muted); }

  .progress {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: auto;
  }

  .track {
    flex: 1;
    height: 3px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--color-fg-muted);
    transition: width var(--motion-default) var(--ease-standard);
  }

  .session.completed .fill { background: var(--color-fg-accent); }

  .counts {
    font: var(--weight-medium) 10px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    white-space: nowrap;
  }
  .sep { color: var(--color-fg-subtle); margin: 0 1px; }

  .completed-mark {
    font: var(--weight-semibold) 10px/1 var(--font-sans);
    color: var(--color-fg-accent);
    margin-top: auto;
  }
</style>
