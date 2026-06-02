<script lang="ts">
  import { parseISO, format, differenceInCalendarDays } from 'date-fns';

  let { data } = $props();

  const today = $derived(parseISO(data.todayISO));

  function daysFromNow(iso: string): string {
    const diff = differenceInCalendarDays(parseISO(iso), today);
    if (diff === 0) return 'today';
    if (diff > 0) return `in ${diff}d`;
    return `${-diff}d ago`;
  }
</script>

<div class="ex-index">
  <header class="head">
    <div>
      <h2>Exercise library</h2>
      <p class="subtitle">
        {data.rows.length} {data.q ? `match${data.rows.length === 1 ? '' : 'es'} for "${data.q}"` : `exercise${data.rows.length === 1 ? '' : 's'}`}
        {#if data.q && data.rows.length !== data.totalCount}<span> · {data.totalCount} total</span>{/if}
      </p>
    </div>

    <form method="GET" class="search">
      <input
        type="text"
        name="q"
        value={data.q}
        placeholder="Filter by name…"
        aria-label="Filter exercises"
        autofocus
      />
    </form>
  </header>

  {#if data.rows.length === 0}
    <p class="empty">No exercises match.</p>
  {:else}
    <ul class="list">
      {#each data.rows as row (row.name)}
        <li>
          <a href="/exercise/{encodeURIComponent(row.name)}" class="row">
            <span class="name">{row.name}</span>
            <span class="counts">
              <span class="done">{row.completed}</span><span class="sep">/</span><span class="total">{row.instances}</span>
              <span class="label">done</span>
            </span>
            <span class="dates">
              <span class="last-label">Last</span>
              <span class="date">{format(parseISO(row.last_date), 'MMM d')}</span>
              <span class="relative">{daysFromNow(row.last_date)}</span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .ex-index { display: flex; flex-direction: column; gap: var(--space-5); max-width: 960px; }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--space-4);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }

  h2 {
    font: var(--text-h2-weight) var(--text-h2-size)/1 var(--font-sans);
    letter-spacing: var(--text-h2-tracking);
  }

  .subtitle {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
    margin-top: var(--space-2);
  }

  .search input {
    width: 260px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
  }
  .search input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .empty {
    text-align: center;
    padding: var(--space-7);
    color: var(--color-fg-muted);
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-2);
  }

  .list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; border: 1px solid var(--color-border-default); border-radius: var(--radius-2); background: var(--color-bg-surface); overflow: hidden; }
  li { border-bottom: 1px solid var(--color-border-default); }
  li:last-child { border-bottom: 0; }

  .row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-5);
    align-items: center;
    padding: var(--space-3) var(--space-5);
    color: var(--color-fg-default);
    text-decoration: none;
    transition: background var(--motion-default) var(--ease-standard);
  }
  .row:hover { background: var(--color-bg-subtle); text-decoration: none; }

  .name {
    font: var(--weight-semibold) var(--text-body-size)/1.3 var(--font-sans);
    color: var(--color-fg-default);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .counts {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
  }
  .done { color: var(--color-fg-default); }
  .sep { color: var(--color-fg-subtle); }
  .total { color: var(--color-fg-muted); }
  .label {
    margin-left: var(--space-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .dates {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    color: var(--color-fg-muted);
  }
  .last-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
  }
  .date { color: var(--color-fg-default); }
  .relative { color: var(--color-fg-subtle); font-size: 11px; }

  @media (max-width: 640px) {
    .head { flex-direction: column; align-items: stretch; }
    .search input { width: 100%; }
    .row { grid-template-columns: 1fr; gap: var(--space-2); }
  }
</style>
