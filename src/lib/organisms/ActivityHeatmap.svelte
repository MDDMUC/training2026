<script lang="ts">
  import type { SessionWithCounts } from '$lib/db/queries';
  import { SESSION_TYPE_LABELS } from '$lib/domain/types';
  import { parseISO, format, isSameDay } from 'date-fns';

  type Props = {
    sessions: SessionWithCounts[];
    todayISO: string;
  };
  let { sessions, todayISO }: Props = $props();

  const today = $derived(parseISO(todayISO));

  // Build a 7-row × 12-col grid (rows = day-of-week starting Mon, cols = week 1..12)
  const MACRO_START = '2026-06-10';
  const WEEKS = 12;
  const DAYS = 7;

  function dateAddDays(iso: string, days: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
  }

  // Index sessions by date
  const sessionsByDate = $derived.by(() => {
    const m = new Map<string, SessionWithCounts>();
    for (const s of sessions) {
      // Pick the first/primary session per date (most days have one)
      if (!m.has(s.date)) m.set(s.date, s);
    }
    return m;
  });

  // 0 = no scheduled, 1 = scheduled-not-touched, 2 = partial, 3 = full, 4 = rest
  function levelOf(date: string): { level: number; session: SessionWithCounts | null } {
    const s = sessionsByDate.get(date) ?? null;
    if (!s) return { level: 0, session: null };
    if (s.type === 'rest') return { level: 4, session: s };
    if (s.completed === 1) return { level: 3, session: s };
    if (s.sets_completed > 0) return { level: 2, session: s };
    return { level: 1, session: s };
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
</script>

<section class="heatmap-card">
  <header>
    <h3>Activity heatmap</h3>
    <p class="subtitle">Each square is one day across the 12-week macrocycle.</p>
  </header>

  <div class="grid-wrap">
    <div class="grid" style="grid-template-columns: 16px repeat({WEEKS}, 1fr);">
      <!-- Empty corner -->
      <div></div>
      <!-- Week numbers -->
      {#each Array(WEEKS) as _, i (i)}
        <div class="week-label">W{i + 1}</div>
      {/each}

      <!-- Day rows -->
      {#each Array(DAYS) as _, row (row)}
        <div class="day-label">{dayLabels[row]}</div>
        {#each Array(WEEKS) as _, col (col)}
          {@const date = dateAddDays(MACRO_START, col * 7 + row)}
          {@const { level, session } = levelOf(date)}
          {@const todayCell = isSameDay(parseISO(date), today)}
          <a
            href="/log/by-date/{date}"
            class="cell level-{level}"
            class:today={todayCell}
            title="{format(parseISO(date), 'EEE MMM d')}{session ? ' · ' + SESSION_TYPE_LABELS[session.type] : ''}{session && session.sets_total > 0 ? ' · ' + session.sets_completed + '/' + session.sets_total + ' sets' : ''}"
            aria-label="{date}"
          ></a>
        {/each}
      {/each}
    </div>
  </div>

  <footer class="legend">
    <span>Less</span>
    <span class="key key-1"></span>
    <span class="key key-2"></span>
    <span class="key key-3"></span>
    <span>More</span>
    <span class="sep">·</span>
    <span class="key key-4"></span>
    <span>Rest</span>
    <span class="sep">·</span>
    <span class="key today-key"></span>
    <span>Today</span>
  </footer>
</section>

<style>
  .heatmap-card {
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }
  h3 {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .subtitle { display: none; }

  .grid-wrap { overflow-x: auto; }

  .grid {
    display: grid;
    grid-template-rows: 10px repeat(7, 1fr);
    gap: 2px;
    min-width: 480px;
  }

  .week-label {
    font: var(--text-micro-weight) 9px/1 var(--font-mono);
    color: var(--color-fg-subtle);
    text-align: center;
    grid-row: 1;
  }

  .day-label {
    font: var(--text-micro-weight) 9px/1 var(--font-sans);
    color: var(--color-fg-subtle);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cell {
    aspect-ratio: 1;
    min-height: 12px;
    background: var(--color-bg-subtle);
    border-radius: 2px;
    display: block;
    border: 1px solid transparent;
    transition: transform var(--motion-default) var(--ease-standard), border-color var(--motion-default) var(--ease-standard);
  }
  .cell:hover {
    transform: scale(1.15);
    border-color: var(--color-fg-default);
  }

  .cell.level-0 { background: var(--color-bg-subtle); }
  .cell.level-1 { background: var(--color-gray-200); }
  .cell.level-2 { background: var(--color-gray-500); }
  .cell.level-3 { background: var(--color-fg-default); }
  .cell.level-4 {
    background: transparent;
    border: 1px dashed var(--color-border-default);
  }

  /* Dark theme variants */
  :global([data-theme='dark']) .cell.level-1 { background: var(--color-night-300); }
  :global([data-theme='dark']) .cell.level-2 { background: var(--color-night-500); }
  :global([data-theme='dark']) .cell.level-3 { background: var(--color-night-950); }

  .cell.today {
    border: 1.5px solid var(--color-border-accent);
  }

  .legend {
    display: none;
  }

  .key {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    display: inline-block;
  }
  .key-1 { background: var(--color-gray-200); }
  .key-2 { background: var(--color-gray-500); }
  .key-3 { background: var(--color-fg-default); }
  .key-4 {
    background: transparent;
    border: 1px dashed var(--color-border-default);
  }
  .today-key {
    background: var(--color-bg-subtle);
    border: 1.5px solid var(--color-border-accent);
  }

  :global([data-theme='dark']) .key-1 { background: var(--color-night-300); }
  :global([data-theme='dark']) .key-2 { background: var(--color-night-500); }
  :global([data-theme='dark']) .key-3 { background: var(--color-night-950); }

  .sep { color: var(--color-fg-subtle); margin: 0 var(--space-1); }
</style>
