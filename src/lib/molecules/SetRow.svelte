<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ExerciseSet } from '$lib/domain/types';
  import { restTimer } from '$lib/stores/restTimer.svelte';

  type Props = { set: ExerciseSet; sessionId: number };
  let { set, sessionId }: Props = $props();

  // Reactive copies so the inputs update optimistically.
  let completed = $state(set.completed === 1);
  let reps = $state<number | null>(set.reps);
  let loadKg = $state<number | null>(set.load_kg);
  let loadAdded = $state<number | null>(set.load_kg_added);
  let holdSec = $state<number | null>(set.hold_seconds);
  let rpe = $state<number | null>(set.rpe);

  // Whether to show the load_kg vs load_kg_added column
  const showLoadAdded = $derived(loadAdded !== null);
  const showLoadKg = $derived(loadKg !== null && !showLoadAdded);
  const showHold = $derived(holdSec !== null);
  const showReps = $derived(reps !== null);
  const showRpe = $derived(set.kind !== 'checklist');

  const isChecklist = $derived(set.kind === 'checklist');
  const kindClass = $derived(`kind-${set.kind}`);

  // Optimistic save: flash ✓ on blur. Default enhance behaviour resets the
  // form, which two-way-binds null back into our local $state — so the
  // typed value visually disappears until the page reloads. Returning a
  // callback (without calling update()) suppresses the reset and the
  // page-data invalidation; local state is the source of truth here.
  let savedField = $state<string | null>(null);
  let savedTimer: ReturnType<typeof setTimeout> | null = null;
  function trackSave(field: string) {
    return () => {
      savedField = field;
      if (savedTimer) clearTimeout(savedTimer);
      savedTimer = setTimeout(() => (savedField = null), 1200);
      return ({ result }: { result: { type: string } }) => {
        if (result.type !== 'success') {
          if (savedTimer) clearTimeout(savedTimer);
          savedField = null;
        }
      };
    };
  }
</script>

<div class="set-row {kindClass}" class:done={completed}>
  <!-- Tick box (form posts, no nav) -->
  <form method="POST" action="?/toggleSet" use:enhance>
    <input type="hidden" name="setId" value={set.id} />
    <button
      type="submit"
      class="tick"
      aria-pressed={completed}
      aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      onclick={() => {
        const willComplete = !completed;
        completed = willComplete;
        if (willComplete && set.rest_seconds && set.rest_seconds > 0) {
          restTimer.start(set.rest_seconds, set.label ?? `Set ${set.set_num}`);
        }
      }}
    >
      {#if completed}
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"
          ><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg
        >
      {/if}
    </button>
  </form>

  <!-- Set number / label -->
  <div class="label">
    <span class="num">{set.set_num}</span>
    {#if set.label}<span class="label-text">{set.label}</span>{/if}
  </div>

  <!-- Editable numeric inputs -->
  {#if isChecklist}
    <div class="checklist-note">{set.notes ?? ''}</div>
  {:else}
    <div class="fields">
      {#if showReps}
        <label class="field">
          <span>Reps</span>
          <form method="POST" action="?/updateSet" use:enhance={trackSave('reps')}>
            <input type="hidden" name="setId" value={set.id} />
            <input type="hidden" name="field" value="reps" />
            <input
              type="number"
              name="value"
              inputmode="numeric"
              min="0"
              bind:value={reps}
              onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
            />
            <span class="saved-badge" class:visible={savedField === 'reps'}>✓</span>
          </form>
        </label>
      {/if}

      {#if showHold}
        <label class="field">
          <span>Hold</span>
          <form method="POST" action="?/updateSet" use:enhance={trackSave('hold_seconds')}>
            <input type="hidden" name="setId" value={set.id} />
            <input type="hidden" name="field" value="hold_seconds" />
            <input
              type="number"
              name="value"
              inputmode="numeric"
              min="0"
              bind:value={holdSec}
              onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
            />
            <span class="unit">s</span>
            <span class="saved-badge" class:visible={savedField === 'hold_seconds'}>✓</span>
          </form>
        </label>
      {/if}

      {#if showLoadAdded}
        <label class="field">
          <span>Added</span>
          <form method="POST" action="?/updateSet" use:enhance={trackSave('load_kg_added')}>
            <input type="hidden" name="setId" value={set.id} />
            <input type="hidden" name="field" value="load_kg_added" />
            <input
              type="number"
              name="value"
              inputmode="decimal"
              step="0.5"
              bind:value={loadAdded}
              onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
            />
            <span class="unit">kg</span>
            <span class="saved-badge" class:visible={savedField === 'load_kg_added'}>✓</span>
          </form>
        </label>
      {/if}

      {#if showLoadKg}
        <label class="field">
          <span>Load</span>
          <form method="POST" action="?/updateSet" use:enhance={trackSave('load_kg')}>
            <input type="hidden" name="setId" value={set.id} />
            <input type="hidden" name="field" value="load_kg" />
            <input
              type="number"
              name="value"
              inputmode="decimal"
              step="0.5"
              bind:value={loadKg}
              onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
            />
            <span class="unit">kg</span>
            <span class="saved-badge" class:visible={savedField === 'load_kg'}>✓</span>
          </form>
        </label>
      {/if}

      {#if showRpe}
        <label class="field rpe">
          <span>RPE</span>
          <form method="POST" action="?/updateSet" use:enhance={trackSave('rpe')}>
            <input type="hidden" name="setId" value={set.id} />
            <input type="hidden" name="field" value="rpe" />
            <input
              type="number"
              name="value"
              inputmode="numeric"
              min="1"
              max="10"
              bind:value={rpe}
              placeholder="–"
              onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
            />
            <span class="saved-badge" class:visible={savedField === 'rpe'}>✓</span>
          </form>
        </label>
      {/if}

      {#if set.rest_seconds !== null}
        <div class="rest">rest {set.rest_seconds}s</div>
      {/if}

      <form method="POST" action="?/deleteSet" use:enhance class="del-form">
        <input type="hidden" name="setId" value={set.id} />
        <input type="hidden" name="sessionId" value={sessionId} />
        <button type="submit" class="del-btn" title="Delete set" aria-label="Delete set">×</button>
      </form>
    </div>
  {/if}
</div>

<style>
  .set-row {
    display: grid;
    grid-template-columns: 32px 200px 1fr;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
    transition: opacity var(--motion-default) var(--ease-standard);
  }

  @media (max-width: 640px) {
    .set-row {
      grid-template-columns: 32px 1fr;
      grid-template-rows: auto auto;
      gap: var(--space-1) var(--space-3);
    }
    .set-row .label { grid-column: 2; }
    .set-row .fields, .set-row .checklist-note { grid-column: 1 / -1; }
    .set-row .del-btn { opacity: 1; }
  }

  .set-row:last-child { border-bottom: 0; }

  .set-row.done { opacity: 0.55; }
  .set-row.done .num,
  .set-row.done .label-text { text-decoration: line-through; }

  .tick {
    width: 22px;
    height: 22px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-inverse);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    transition: background var(--motion-default) var(--ease-standard);
  }

  .set-row.done .tick {
    background: var(--color-bg-inverse);
    border-color: var(--color-bg-inverse);
  }

  .label {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }

  .num {
    font: var(--weight-semibold) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    min-width: 1.5ch;
  }

  .label-text { color: var(--color-fg-default); }

  .fields {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    align-items: center;
  }

  .field {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .field form {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .field input[type='number'] {
    width: 56px;
    padding: 4px var(--space-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-data-weight) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .field input:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 1px;
  }

  .field .unit { color: var(--color-fg-muted); font-size: 11px; }

  .field .saved-badge {
    opacity: 0;
    transition: opacity 160ms ease;
    color: var(--color-fg-accent);
    font: var(--weight-bold) 11px/1 var(--font-sans);
    width: 10px;
    text-align: center;
    pointer-events: none;
  }
  .field .saved-badge.visible { opacity: 1; }

  .field.rpe input { width: 40px; }

  .rest {
    font: var(--text-micro-weight) 10px/1 var(--font-mono);
    color: var(--color-fg-subtle);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .del-form { display: inline-flex; }
  .del-btn {
    width: 22px;
    height: 22px;
    border: 0;
    background: transparent;
    color: var(--color-fg-subtle);
    font: var(--weight-medium) 14px/1 var(--font-sans);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--motion-default) var(--ease-standard);
  }
  .set-row:hover .del-btn { opacity: 1; }
  .del-btn:hover { color: var(--color-fg-accent); }

  .checklist-note {
    color: var(--color-fg-muted);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }

  .kind-warmup .label-text { color: var(--color-fg-muted); font-style: italic; }
  .kind-backoff .label-text { color: var(--color-fg-muted); }
</style>
