<script lang="ts">
  import Button from '$lib/atoms/Button.svelte';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();

  let restoring = $state(false);
  let restoreMessage = $state<string | null>(null);
  let restoreError = $state<string | null>(null);

  async function handleRestoreFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const confirmed = confirm(
      `Restore from "${file.name}"?\n\nThis WIPES every row in every table and replaces them with the file's contents. The current database is overwritten. Continue?`
    );
    if (!confirmed) {
      input.value = '';
      return;
    }

    restoring = true;
    restoreMessage = null;
    restoreError = null;
    try {
      const text = await file.text();
      const res = await fetch('/api/restore?confirm=true', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: text
      });
      const data = await res.json();
      if (!res.ok) {
        restoreError = data?.error ?? `HTTP ${res.status}`;
      } else {
        restoreMessage =
          'Restored: ' +
          Object.entries(data.counts ?? {})
            .map(([k, v]) => `${k}=${v}`)
            .join(', ');
        await invalidateAll();
      }
    } catch (err) {
      restoreError = String(err);
    } finally {
      restoring = false;
      input.value = '';
    }
  }
</script>

<div class="settings-page">
  <!-- Top row: logged-data stats as a horizontal strip -->
  <section class="card stats-strip">
    <header class="card-head">
      <h3>Logged data</h3>
      <span class="db-path"><code>{data.dbPath}</code></span>
    </header>
    <div class="stats">
      <div class="stat">
        <span class="stat-label">Sessions</span>
        <span class="stat-value">{data.counts.sessions}</span>
        <span class="stat-meta">{data.counts.sessions_completed} done</span>
      </div>
      <div class="stat">
        <span class="stat-label">Exercises</span>
        <span class="stat-value">{data.counts.exercises}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Sets</span>
        <span class="stat-value">{data.counts.sets}</span>
        <span class="stat-meta">{data.counts.sets_completed} done</span>
      </div>
      <div class="stat">
        <span class="stat-label">Tindeq tests</span>
        <span class="stat-value">{data.counts.tindeq}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Pull-up tests</span>
        <span class="stat-value">{data.counts.pullup}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Climbs logged</span>
        <span class="stat-value">{data.counts.climbs}</span>
      </div>
    </div>
  </section>

  <!-- Three-column main row: Export · Restore · About -->
  <section class="main-grid">
    <article class="card">
      <header class="card-head">
        <h3>Export</h3>
      </header>
      <div class="export-list">
        <div class="export-row">
          <div class="export-text">
            <h4>Calendar (.ics)</h4>
            <p>Import to Google · Apple · Outlook calendars. All sessions become events with the full prescription in the description.</p>
          </div>
          <Button variant="secondary" href="/api/calendar.ics">Download</Button>
        </div>
        <div class="export-row">
          <div class="export-text">
            <h4>Full backup (.json)</h4>
            <p>Snapshot of every row across all tables. Future-proof archive — save one per phase.</p>
          </div>
          <Button variant="secondary" href="/api/backup.json">Download</Button>
        </div>
      </div>
    </article>

    <article class="card danger">
      <header class="card-head">
        <h3>Restore</h3>
      </header>
      <p class="warn">
        Restoring <strong>wipes every row</strong> in every table and replaces them with the file's contents. Back up first with the .json download.
      </p>
      <div class="restore-row">
        <label class="file-button" class:disabled={restoring}>
          <input type="file" accept=".json,application/json" onchange={handleRestoreFile} disabled={restoring} />
          <span>{restoring ? 'Restoring…' : 'Restore from .json file'}</span>
        </label>
      </div>
      {#if restoreMessage}<p class="success">{restoreMessage}</p>{/if}
      {#if restoreError}<p class="error">Error: {restoreError}</p>{/if}
    </article>

    <article class="card">
      <header class="card-head">
        <h3>About</h3>
      </header>
      <dl>
        <dt>Stack</dt>
        <dd>SvelteKit · TypeScript · better-sqlite3 · date-fns</dd>
        <dt>Storage</dt>
        <dd>Local SQLite. No external services, no telemetry.</dd>
        <dt>Design</dt>
        <dd>Atomic design system, achromatic + signal-orange accent. Tokens in <code>design-system/tokens/</code>.</dd>
        <dt>Plan</dt>
        <dd>Mon Jun 8 → Sun Aug 30 2026. Three 4-week mesocycles. See <code>plan/00-overview.md</code>.</dd>
      </dl>
    </article>
  </section>

  <!-- Bottom strip: commands reference -->
  <section class="card commands">
    <header class="card-head">
      <h3>Commands</h3>
    </header>
    <div class="cmd-grid">
      <div class="cmd">
        <code>npm run dev</code>
        <span>Start dev server on :5173</span>
      </div>
      <div class="cmd">
        <code>npm run db:init</code>
        <span>Apply schema + seed (idempotent)</span>
      </div>
      <div class="cmd">
        <code>npm run db:reset</code>
        <span>Delete the local DB file (destructive)</span>
      </div>
      <div class="cmd">
        <code>npm run check</code>
        <span>Type-check Svelte + TypeScript</span>
      </div>
      <div class="cmd">
        <code>npm run build</code>
        <span>Production build</span>
      </div>
    </div>
  </section>
</div>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  /* ---------- Card primitive ---------- */
  .card {
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    min-width: 0;
  }

  .card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }

  h3 {
    font: var(--weight-semibold) 14px/1 var(--font-sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-fg-default);
    margin: 0;
  }

  .db-path {
    font: var(--weight-medium) 12px/1 var(--font-mono);
    color: var(--color-fg-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 50%;
    white-space: nowrap;
  }

  code {
    font: var(--text-code-weight) var(--text-code-size)/1 var(--font-mono);
    background: var(--color-bg-subtle);
    padding: 2px var(--space-2);
    border-radius: var(--radius-1);
    color: var(--color-fg-default);
  }

  /* ---------- Stats strip (top row) ---------- */
  .stats-strip { padding: var(--space-4) var(--space-5); }
  .stats {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--space-4);
  }
  .stat { display: flex; flex-direction: column; gap: var(--space-1); }
  .stat-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .stat-value {
    font: var(--weight-bold) 28px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }
  .stat-meta {
    font: var(--weight-medium) 11px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }

  /* ---------- Main 3-col grid ---------- */
  .main-grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1.2fr;
    gap: var(--space-4);
    align-items: stretch;
  }
  .main-grid .card { display: flex; flex-direction: column; }

  /* ---------- Export ---------- */
  .export-list { display: flex; flex-direction: column; gap: var(--space-3); }
  .export-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-1);
  }
  .export-text { min-width: 0; }
  .export-text h4 {
    font: var(--weight-semibold) var(--text-body-size)/1.2 var(--font-sans);
    color: var(--color-fg-default);
    margin: 0 0 var(--space-1) 0;
  }
  .export-text p {
    font: var(--text-body-sm-weight) 12px/1.4 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0;
  }

  /* ---------- Restore (danger) ---------- */
  .danger { border-color: var(--color-border-accent); }
  .warn {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.5 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0 0 var(--space-4) 0;
  }
  .restore-row { display: flex; }
  .file-button {
    display: inline-block;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-fg-accent);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-accent);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    cursor: pointer;
    transition: background var(--motion-default) var(--ease-standard);
  }
  .file-button:hover { background: var(--color-bg-accent-tint); }
  .file-button.disabled { opacity: 0.5; cursor: wait; }
  .file-button input[type='file'] { display: none; }
  .success {
    margin-top: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-1);
    font: var(--text-body-sm-weight) 12px/1.4 var(--font-mono);
    color: var(--color-fg-default);
  }
  .error {
    margin-top: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-1);
    font: var(--weight-semibold) 12px/1.4 var(--font-sans);
    color: var(--color-fg-accent);
  }

  /* ---------- About ---------- */
  dl {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: var(--space-2) var(--space-3);
    margin: 0;
  }
  dt {
    font: var(--text-micro-weight) var(--text-micro-size)/1.4 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  dd {
    font: var(--text-body-sm-weight) 12px/1.4 var(--font-sans);
    color: var(--color-fg-default);
    margin: 0;
  }

  /* ---------- Commands strip (bottom row) ---------- */
  .commands { padding: var(--space-3) var(--space-5); }
  .commands .card-head { margin-bottom: var(--space-3); padding-bottom: var(--space-2); }
  .cmd-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-3);
  }
  .cmd {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .cmd code {
    font: var(--weight-semibold) 12px/1 var(--font-mono);
    background: var(--color-bg-subtle);
    padding: var(--space-2);
    border-radius: var(--radius-1);
  }
  .cmd span {
    font: var(--text-body-sm-weight) 11px/1.3 var(--font-sans);
    color: var(--color-fg-muted);
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 1280px) {
    .stats { grid-template-columns: repeat(3, 1fr); row-gap: var(--space-4); }
    .main-grid { grid-template-columns: 1fr 1fr; }
    .cmd-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .main-grid { grid-template-columns: 1fr; }
    .cmd-grid { grid-template-columns: 1fr; }
  }
</style>
