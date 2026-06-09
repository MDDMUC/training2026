<script lang="ts">
  import { enhance } from '$app/forms';

  type Props = {
    bodyWeight: number | null;
    sleepHours: number | null;
    readiness: number | null;
    prevBodyWeight: number | null;
    dateLabel: string;
  };
  let { bodyWeight, sleepHours, readiness, prevBodyWeight, dateLabel }: Props = $props();

  let bw = $state<number | null>(bodyWeight);
  let sleep = $state<number | null>(sleepHours);
  let read = $state<number | null>(readiness);

  let savedField = $state<string | null>(null);
  let savedTimer: ReturnType<typeof setTimeout> | null = null;
  function markSaved(field: string) {
    savedField = field;
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (savedField = null), 1500);
  }

  const bwDelta = $derived(
    bw !== null && prevBodyWeight !== null && Math.abs(bw - prevBodyWeight) >= 0.05
      ? Math.round((bw - prevBodyWeight) * 10) / 10
      : null
  );
  const sleepHint = $derived(
    sleep === null ? null : sleep < 7 ? 'below 7h target' : 'on target'
  );
  const readyHint = $derived(
    read === null
      ? null
      : read >= 8
        ? 'fresh'
        : read >= 6
          ? 'workable'
          : 'consider modifying'
  );

  function trackSave(field: string) {
    return () => {
      // Optimistic — show the ✓ the instant the input blurs. The server
      // upsert is small; failures would require an auth-level problem.
      // Re-running the heavy Today load inline would delay the badge 1–2s.
      markSaved(field);
      return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
        await update({ reset: false });
      };
    };
  }

  function submitForm(e: Event) {
    const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    form?.requestSubmit();
  }
</script>

<section class="daily" aria-label="Daily check-in">
  <header>
    <div>
      <h2>Daily check-in</h2>
      <p class="subtitle">{dateLabel} · log every day, session or rest</p>
    </div>
  </header>

  <div class="grid">
    <label class="cell">
      <span class="label">Body weight</span>
      <form method="POST" action="?/updateDailyCheckIn" use:enhance={trackSave('body_weight_kg')}>
        <div class="input-row">
          <input
            type="number"
            name="body_weight_kg"
            step="0.1"
            min="30"
            max="200"
            inputmode="decimal"
            bind:value={bw}
            placeholder="—"
            onchange={submitForm}
          />
          <span class="unit">kg</span>
          <span class="saved-badge" class:visible={savedField === 'body_weight_kg'}>✓</span>
        </div>
      </form>
      {#if bwDelta !== null}
        <span class="delta" class:up={bwDelta > 0}>
          {bwDelta > 0 ? '+' : '−'}{Math.abs(bwDelta).toFixed(1)} kg vs last
        </span>
      {/if}
    </label>

    <label class="cell">
      <span class="label">Sleep (last night)</span>
      <form method="POST" action="?/updateDailyCheckIn" use:enhance={trackSave('sleep_hours')}>
        <div class="input-row">
          <input
            type="number"
            name="sleep_hours"
            step="0.25"
            min="0"
            max="14"
            inputmode="decimal"
            bind:value={sleep}
            placeholder="—"
            onchange={submitForm}
          />
          <span class="unit">h</span>
          <span class="saved-badge" class:visible={savedField === 'sleep_hours'}>✓</span>
        </div>
      </form>
      {#if sleepHint !== null}
        <span class="hint" class:warn={sleep !== null && sleep < 7}>{sleepHint}</span>
      {/if}
    </label>

    <label class="cell">
      <span class="label"><span class="label-full">How I feel · readiness</span><span class="label-short">How I feel</span></span>
      <form method="POST" action="?/updateDailyCheckIn" use:enhance={trackSave('readiness')}>
        <div class="input-row">
          <input
            type="number"
            name="readiness"
            min="1"
            max="10"
            inputmode="numeric"
            bind:value={read}
            placeholder="1–10"
            onchange={submitForm}
          />
          <span class="unit">/10</span>
          <span class="saved-badge" class:visible={savedField === 'readiness'}>✓</span>
        </div>
      </form>
      {#if readyHint !== null}
        <span class="hint" class:warn={read !== null && read <= 5}>{readyHint}</span>
      {/if}
    </label>
  </div>
</section>

<style>
  .daily {
    padding: var(--space-5) var(--space-6);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  h2 {
    font: var(--weight-bold) 20px/1 var(--font-sans);
    letter-spacing: -0.01em;
    color: var(--color-fg-default);
    margin: 0 0 4px 0;
  }

  .subtitle {
    font: var(--text-body-sm-weight) 12px/1 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5);
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .input-row {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  input[type='number'] {
    width: 100px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--weight-bold) 24px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .unit { color: var(--color-fg-muted); font: var(--weight-medium) 13px/1 var(--font-mono); }

  .saved-badge {
    opacity: 0;
    transition: opacity 180ms ease;
    color: var(--color-fg-default);
    font: var(--weight-bold) 14px/1 var(--font-sans);
  }
  .saved-badge.visible { opacity: 1; }

  .delta {
    font: var(--weight-medium) 11px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }
  .delta.up { color: var(--color-fg-accent); }

  .hint {
    font: var(--text-body-sm-weight) 11px/1 var(--font-sans);
    color: var(--color-fg-muted);
  }
  .hint.warn { color: var(--color-fg-accent); }

  /* Hide/show label variants based on viewport */
  .label-short { display: none; }

  @media (max-width: 768px) {
    .daily { padding: var(--space-4); }
    .grid { grid-template-columns: 1fr; gap: var(--space-3); }
    h2 { font-size: 18px; }
    .subtitle { font-size: 11px; }
    /* Each cell becomes a horizontal row so the form stays scannable */
    .cell {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 4px;
    }
    .label { flex: 1; min-width: 0; }
    .input-row { flex-shrink: 0; }
    input[type='number'] {
      width: 88px;
      font-size: 22px;
      padding: 10px var(--space-3);
    }
    .delta, .hint { flex-basis: 100%; text-align: right; }
    .label-full { display: none; }
    .label-short { display: inline; }
  }

  @media (max-width: 380px) {
    .daily { padding: var(--space-3) var(--space-4); }
    input[type='number'] { width: 78px; font-size: 20px; }
  }
</style>
