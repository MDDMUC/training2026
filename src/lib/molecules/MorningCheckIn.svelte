<script lang="ts">
  import { enhance } from '$app/forms';

  type Props = {
    sessionId: number;
    bodyWeight: number | null;
    sleepHours: number | null;
    readiness: number | null;
    prevBodyWeight: number | null;
  };
  let { sessionId, bodyWeight, sleepHours, readiness, prevBodyWeight }: Props = $props();

  let bw = $state<number | null>(bodyWeight);
  let sleep = $state<number | null>(sleepHours);
  let read = $state<number | null>(readiness);

  const bwDelta = $derived(
    bw !== null && prevBodyWeight !== null ? Math.round((bw - prevBodyWeight) * 10) / 10 : null
  );

  function submitForm(e: Event) {
    const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    form?.requestSubmit();
  }
</script>

<section class="check-in" aria-label="Morning check-in">
  <header>
    <h3>Morning check-in</h3>
    <p class="subtitle">Quick state before training.</p>
  </header>

  <div class="grid">
    <label class="cell">
      <span class="label">Body weight</span>
      <form method="POST" action="?/updateSession" use:enhance>
        <input type="hidden" name="sessionId" value={sessionId} />
        <div class="input-row">
          <input
            type="number"
            name="body_weight_kg"
            step="0.1"
            inputmode="decimal"
            bind:value={bw}
            placeholder="—"
            onchange={submitForm}
          />
          <span class="unit">kg</span>
        </div>
      </form>
      {#if bwDelta !== null && bwDelta !== 0}
        <span class="delta" class:up={bwDelta > 0}>{bwDelta > 0 ? '+' : '−'}{Math.abs(bwDelta).toFixed(1)} kg</span>
      {/if}
    </label>

    <label class="cell">
      <span class="label">Sleep (last night)</span>
      <form method="POST" action="?/updateSession" use:enhance>
        <input type="hidden" name="sessionId" value={sessionId} />
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
        </div>
      </form>
      {#if sleep !== null}
        <span class="hint" class:warn={sleep < 7}>{sleep < 7 ? 'below 7h target' : 'on target'}</span>
      {/if}
    </label>

    <label class="cell">
      <span class="label">Readiness</span>
      <form method="POST" action="?/updateSession" use:enhance>
        <input type="hidden" name="sessionId" value={sessionId} />
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
        </div>
      </form>
      {#if read !== null}
        <span class="hint" class:warn={read <= 5}>{read >= 8 ? 'fresh' : read >= 6 ? 'workable' : 'consider modifying'}</span>
      {/if}
    </label>
  </div>
</section>

<style>
  .check-in {
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header { margin-bottom: var(--space-3); }

  h3 {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .subtitle {
    font: var(--text-body-sm-weight) 12px/1 var(--font-sans);
    color: var(--color-fg-subtle);
    margin-top: var(--space-1);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
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
    width: 80px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--weight-bold) 22px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .unit { color: var(--color-fg-muted); font: var(--weight-medium) 13px/1 var(--font-mono); }

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

  @media (max-width: 640px) {
    .grid { grid-template-columns: 1fr; gap: var(--space-3); }
  }
</style>
