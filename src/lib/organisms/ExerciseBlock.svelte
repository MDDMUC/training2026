<script lang="ts">
  import { enhance } from '$app/forms';
  import SetRow from '$lib/molecules/SetRow.svelte';
  import ExerciseContext from '$lib/molecules/ExerciseContext.svelte';
  import type { ExerciseWithSets, ExerciseContext as ExContext } from '$lib/db/queries';
  import { renderInlineMarkdown } from '$lib/utils/markdown';

  type Props = { exercise: ExerciseWithSets; sessionId: number; context?: ExContext };
  let { exercise, sessionId, context }: Props = $props();

  const total = $derived(exercise.sets.length);
  const done = $derived(exercise.sets.filter((s) => s.completed === 1).length);
  const allDone = $derived(total > 0 && done === total);

  let exerciseNotes = $state<string>(exercise.athlete_notes ?? '');
  let showNotesField = $state(Boolean(exercise.athlete_notes && exercise.athlete_notes.length > 0));

  // Current top working set — used for PR comparison vs context.previous
  const currentTopSet = $derived.by(() => {
    const work = exercise.sets.filter((s) => s.kind === 'work');
    if (work.length === 0) return null;
    return work.slice().sort((a, b) => {
      const aa = a.load_kg_added ?? a.load_kg ?? a.hold_seconds ?? 0;
      const bb = b.load_kg_added ?? b.load_kg ?? b.hold_seconds ?? 0;
      return bb - aa;
    })[0];
  });

  function submitNotesForm(e: Event) {
    const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    form?.requestSubmit();
  }
</script>

<section class="block" class:done={allDone}>
  <header>
    <div class="title-row">
      <h3><a href="/exercise/{encodeURIComponent(exercise.name)}" class="ex-link" title="View history of this exercise">{exercise.name}</a></h3>
      <div class="progress">
        <span class="progress-text">{done}/{total}</span>
        <div class="progress-bar" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
          <div class="progress-fill" style="width: {total ? (done / total) * 100 : 0}%"></div>
        </div>
        <form method="POST" action="?/markExerciseSets" use:enhance>
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="completed" value={allDone ? 'false' : 'true'} />
          <button type="submit" class="bulk-btn" title={allDone ? 'Un-tick all' : 'Tick all'}>
            {allDone ? 'Reset' : 'Tick all'}
          </button>
        </form>
        <form
          method="POST"
          action="?/deleteExercise"
          use:enhance={({ cancel }) => {
            if (!confirm(`Delete "${exercise.name}" and all its sets?`)) {
              cancel();
            }
            return async ({ update }) => update();
          }}
        >
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <input type="hidden" name="sessionId" value={sessionId} />
          <button type="submit" class="del-btn" title="Delete exercise" aria-label="Delete exercise">×</button>
        </form>
      </div>
    </div>
    {#if exercise.notes}
      <p class="ex-notes">{@html renderInlineMarkdown(exercise.notes)}</p>
    {/if}
  </header>

  {#if context}<ExerciseContext {context} currentTopSet={currentTopSet} />{/if}

  <div class="sets">
    {#each exercise.sets as set (set.id)}
      <SetRow {set} {sessionId} />
    {/each}
  </div>

  <form method="POST" action="?/addSet" use:enhance class="add-set-form">
    <input type="hidden" name="exerciseId" value={exercise.id} />
    <button type="submit" class="add-set-btn">+ Add set</button>
  </form>

  <div class="ex-notes-wrap">
    {#if showNotesField}
      <form method="POST" action="?/updateExerciseNotes" use:enhance>
        <input type="hidden" name="exerciseId" value={exercise.id} />
        <label class="ex-notes-label">
          <span>Notes for this exercise</span>
          <textarea
            name="notes"
            rows="2"
            bind:value={exerciseNotes}
            placeholder="How it felt today, form cues, anything notable"
            onblur={submitNotesForm}
          ></textarea>
        </label>
      </form>
    {:else}
      <button type="button" class="add-notes" onclick={() => (showNotesField = true)}>+ Add notes</button>
    {/if}
  </div>
</section>

<style>
  .block {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    transition: opacity var(--motion-default) var(--ease-standard);
  }

  .block.done { opacity: 0.7; }

  header {
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  h3 {
    font: var(--text-h3-weight) var(--text-h3-size)/1.25 var(--font-sans);
    margin: 0;
  }

  .ex-link {
    color: var(--color-fg-default);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color var(--motion-default) var(--ease-standard);
  }
  .ex-link:hover {
    border-bottom-color: var(--color-border-default);
    text-decoration: none;
  }

  .progress {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .progress-text {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }

  .progress-bar {
    width: 80px;
    height: 4px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-bg-inverse);
    transition: width var(--motion-default) var(--ease-standard);
  }

  .bulk-btn {
    padding: 4px var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-muted);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    cursor: pointer;
    margin-left: var(--space-2);
  }

  .bulk-btn:hover {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
  }

  .block.done .progress-fill { background: var(--color-bg-accent); }

  .ex-notes {
    margin-top: var(--space-2);
    color: var(--color-fg-muted);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.5 var(--font-sans);
  }

  .sets {
    display: flex;
    flex-direction: column;
  }

  .ex-notes-wrap {
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  .ex-notes-label {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  textarea {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    text-transform: none;
    letter-spacing: 0;
    resize: vertical;
    width: 100%;
  }
  textarea:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .add-notes {
    padding: var(--space-1) var(--space-2);
    border: 0;
    background: transparent;
    color: var(--color-fg-subtle);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    cursor: pointer;
  }
  .add-notes:hover { color: var(--color-fg-default); }

  .del-btn {
    width: 28px;
    height: 24px;
    margin-left: var(--space-1);
    border: 1px solid transparent;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-fg-subtle);
    font: var(--weight-bold) 16px/1 var(--font-sans);
    cursor: pointer;
  }
  .del-btn:hover {
    color: var(--color-fg-accent);
    border-color: var(--color-border-accent);
  }

  .add-set-form { display: flex; justify-content: flex-start; margin-top: var(--space-2); }
  .add-set-btn {
    padding: var(--space-1) var(--space-3);
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-fg-muted);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    cursor: pointer;
  }
  .add-set-btn:hover {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
    border-style: solid;
  }
</style>
