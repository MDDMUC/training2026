<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SessionWithPhase } from '$lib/domain/types';

  type Props = { session: SessionWithPhase };
  let { session }: Props = $props();

  let duration = $state<number | null>(session.duration_min);
  let rpe = $state<number | null>(session.rpe);
  let sleep = $state<number | null>(session.sleep_hours);
  let readiness = $state<number | null>(session.readiness);
  let notes = $state<string>(session.notes ?? '');
  let completed = $state(session.completed === 1);

  // Tracks which field most recently saved successfully — drives the ✓ Saved badge.
  let savedField = $state<string | null>(null);
  let savedTimer: ReturnType<typeof setTimeout> | null = null;

  function flashSaved(field: string) {
    savedField = field;
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      savedField = null;
    }, 1500);
  }

  // Pass the field name in; enhance returns the post-submit callback that flips the badge.
  function trackSave(field: string) {
    return () => {
      return ({ result }: { result: { type: string } }) => {
        if (result.type === 'success') flashSaved(field);
      };
    };
  }

  function submitForm(e: Event) {
    const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    form?.requestSubmit();
  }
</script>

<section class="meta">
  <h3 class="title">Session</h3>

  <div class="grid">
    <label class="field">
      <span>Duration</span>
      <form method="POST" action="?/updateSession" use:enhance={trackSave('duration_min')}>
        <input type="hidden" name="sessionId" value={session.id} />
        <input
          type="number"
          name="duration_min"
          inputmode="numeric"
          min="0"
          bind:value={duration}
          placeholder="min"
          onchange={submitForm}
        />
        <span class="unit">min</span>
        <span class="saved-badge" class:visible={savedField === 'duration_min'}>✓ Saved</span>
      </form>
    </label>

    <label class="field">
      <span>RPE</span>
      <form method="POST" action="?/updateSession" use:enhance={trackSave('rpe')}>
        <input type="hidden" name="sessionId" value={session.id} />
        <input
          type="number"
          name="rpe"
          inputmode="numeric"
          min="1"
          max="10"
          bind:value={rpe}
          placeholder="1–10"
          onchange={submitForm}
        />
        <span class="saved-badge" class:visible={savedField === 'rpe'}>✓ Saved</span>
      </form>
    </label>

    <label class="field">
      <span>Sleep (last night)</span>
      <form method="POST" action="?/updateSession" use:enhance={trackSave('sleep_hours')}>
        <input type="hidden" name="sessionId" value={session.id} />
        <input
          type="number"
          name="sleep_hours"
          inputmode="decimal"
          step="0.25"
          min="0"
          max="14"
          bind:value={sleep}
          placeholder="hrs"
          onchange={submitForm}
        />
        <span class="unit">h</span>
        <span class="saved-badge" class:visible={savedField === 'sleep_hours'}>✓ Saved</span>
      </form>
    </label>

    <label class="field">
      <span>Readiness</span>
      <form method="POST" action="?/updateSession" use:enhance={trackSave('readiness')}>
        <input type="hidden" name="sessionId" value={session.id} />
        <input
          type="number"
          name="readiness"
          inputmode="numeric"
          min="1"
          max="10"
          bind:value={readiness}
          placeholder="1–10"
          onchange={submitForm}
        />
        <span class="saved-badge" class:visible={savedField === 'readiness'}>✓ Saved</span>
      </form>
    </label>

    <label class="field complete-toggle">
      <span>Status</span>
      <form method="POST" action="?/updateSession" use:enhance>
        <input type="hidden" name="sessionId" value={session.id} />
        <input type="hidden" name="completed" value={completed ? 'false' : 'true'} />
        <button
          type="submit"
          class="status-btn"
          class:on={completed}
          onclick={() => (completed = !completed)}
        >
          {completed ? '✓ Completed' : 'Mark complete'}
        </button>
      </form>
    </label>
  </div>

  <label class="notes-field">
    <span>
      Session notes
      <span class="saved-badge inline" class:visible={savedField === 'notes'}>✓ Saved</span>
    </span>
    <form method="POST" action="?/updateSession" use:enhance={trackSave('notes')}>
      <input type="hidden" name="sessionId" value={session.id} />
      <textarea
        name="notes"
        rows="3"
        bind:value={notes}
        placeholder="How it felt. Surprises. Things to remember."
        onblur={submitForm}
      ></textarea>
    </form>
  </label>
</section>

<style>
  .meta {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  .title {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-4);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .field form {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .field input[type='number'] {
    width: 90px;
    padding: 6px var(--space-2);
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

  .unit { color: var(--color-fg-muted); font-size: 11px; }

  .saved-badge {
    font: var(--weight-semibold) 10px/1 var(--font-sans);
    letter-spacing: 0.04em;
    color: var(--color-fg-accent);
    opacity: 0;
    transform: translateY(-1px);
    transition: opacity 180ms var(--ease-standard), transform 180ms var(--ease-standard);
    pointer-events: none;
    white-space: nowrap;
  }

  .saved-badge.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .saved-badge.inline {
    margin-left: var(--space-2);
  }

  .status-btn {
    padding: 6px var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-default);
    background: var(--color-bg-surface);
    cursor: pointer;
    transition: all var(--motion-default) var(--ease-standard);
    text-transform: none;
    letter-spacing: 0;
  }

  .status-btn.on {
    background: var(--color-bg-accent);
    color: var(--color-fg-inverse);
    border-color: var(--color-bg-accent);
  }

  .notes-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  textarea {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/var(--text-body-line) var(--font-sans);
    resize: vertical;
    text-transform: none;
    letter-spacing: 0;
  }

  textarea:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 1px;
  }
</style>
