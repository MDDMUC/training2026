<script lang="ts">
  import { enhance } from '$app/forms';
  import { estimateOneRepMaxAdded } from '$lib/domain/types';

  let bw = $state<number | null>(82);
  let added = $state<number | null>(null);
  let reps = $state<number | null>(3);
  let notes = $state<string>('');

  const preview1RM = $derived(
    bw !== null && added !== null && reps !== null && reps > 0
      ? estimateOneRepMaxAdded(bw, added, reps)
      : null
  );
</script>

<section class="quicklog">
  <header>
    <h3>Pull-up 1RM Quick-log</h3>
    <p class="subtitle">Enter the heaviest clean set; 1RM is computed (Epley).</p>
  </header>

  <form method="POST" action="?/recordPullup" use:enhance>
    <div class="row">
      <label class="big-input">
        <span>Body weight</span>
        <input type="number" name="body_weight_kg" step="0.1" inputmode="decimal" min="0" bind:value={bw} required />
        <span class="unit">kg</span>
      </label>
      <label class="big-input">
        <span>Top added load</span>
        <input type="number" name="top_load_added_kg" step="0.5" inputmode="decimal" min="0" bind:value={added} required />
        <span class="unit">kg</span>
      </label>
      <label class="big-input">
        <span>Reps · 0 RIR</span>
        <input type="number" name="top_reps" inputmode="numeric" min="1" max="10" bind:value={reps} required />
      </label>
    </div>

    {#if preview1RM !== null}
      <div class="preview">
        Estimated 1RM added: <span class="num">{preview1RM.toFixed(1)}</span><span class="unit">kg</span>
      </div>
    {/if}

    <label class="notes-field">
      <span>Notes</span>
      <input type="text" name="notes" bind:value={notes} placeholder="Form notes, anything notable" />
    </label>

    <div class="submit-row">
      <button type="submit" class="submit">Save Pull-up Test</button>
    </div>
  </form>
</section>

<style>
  .quicklog {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header { margin-bottom: var(--space-5); }

  h3 { font: var(--text-h3-weight) var(--text-h3-size)/1 var(--font-sans); }

  .subtitle {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
    margin-top: var(--space-1);
  }

  .row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .big-input {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    position: relative;
  }

  .big-input input {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--weight-bold) 24px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .big-input input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .big-input .unit {
    position: absolute; right: var(--space-3); bottom: var(--space-3);
    color: var(--color-fg-muted); font: var(--weight-medium) 12px/1 var(--font-mono);
  }

  .preview {
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-1);
    margin-bottom: var(--space-4);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .preview .num {
    font: var(--weight-bold) 20px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-accent);
    margin: 0 4px;
  }
  .preview .unit { color: var(--color-fg-muted); }

  .notes-field {
    display: flex; flex-direction: column; gap: var(--space-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-4);
  }

  .notes-field input {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/1.4 var(--font-sans);
    text-transform: none; letter-spacing: 0;
  }

  .submit-row { display: flex; justify-content: flex-end; }

  .submit {
    padding: var(--space-2) var(--space-5);
    border: 1px solid var(--color-fg-default);
    border-radius: var(--radius-2);
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    cursor: pointer;
  }

  .submit:hover { background: var(--color-bg-accent); border-color: var(--color-bg-accent); }
</style>
