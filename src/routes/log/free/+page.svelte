<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/atoms/Button.svelte';
  import { SESSION_TYPE_LABELS, type SessionType } from '$lib/domain/types';

  let { data } = $props();

  let date = $state(data.defaultDate);
  let type = $state<SessionType>('pull-heavy');
  let title = $state('');
  let query = $state('');
  let customName = $state('');

  // Picked exercises (kept in order)
  let picked = $state<string[]>([]);

  // Filtered library names by query
  const filteredLibrary = $derived(
    query.trim()
      ? data.libraryNames.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase()))
      : data.libraryNames
  );

  function togglePick(name: string) {
    if (picked.includes(name)) picked = picked.filter((n) => n !== name);
    else picked = [...picked, name];
  }

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    if (!picked.includes(name)) picked = [...picked, name];
    customName = '';
  }

  function movePick(name: string, dir: 1 | -1) {
    const idx = picked.indexOf(name);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= picked.length) return;
    const copy = [...picked];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    picked = copy;
  }

  function removePick(name: string) {
    picked = picked.filter((n) => n !== name);
  }
</script>

<div class="free-page">
  <header class="head">
    <p class="eyebrow">Improvised session</p>
    <h2>Log a free session</h2>
    <p class="subtitle">
      Pick a date and type, then build the session from the library or invent exercises on the spot.
      Creates a new unscheduled session and drops you into the editor.
    </p>
  </header>

  <form method="POST" action="?/createSession" use:enhance>
    <!-- Meta -->
    <section class="card meta">
      <div class="field">
        <label for="f-date">Date</label>
        <input id="f-date" name="date" type="date" bind:value={date} required />
      </div>

      <div class="field">
        <label for="f-type">Type</label>
        <select id="f-type" name="type" bind:value={type}>
          {#each data.sessionTypes as t (t)}
            <option value={t}>{SESSION_TYPE_LABELS[t]}</option>
          {/each}
        </select>
      </div>

      <div class="field title-field">
        <label for="f-title">Title (optional)</label>
        <input
          id="f-title"
          name="title"
          type="text"
          bind:value={title}
          placeholder="e.g. Quick boulder + abs"
          maxlength="120"
        />
      </div>
    </section>

    <!-- Picked exercises -->
    <section class="card">
      <header class="block-head">
        <h3>Exercises ({picked.length})</h3>
        <p class="hint">Order is preserved. Each exercise starts with one empty work set you can edit after.</p>
      </header>

      {#if picked.length === 0}
        <p class="empty">No exercises yet. Pick from the library below or add a custom one.</p>
      {:else}
        <ol class="picked-list">
          {#each picked as name, i (name)}
            <li>
              <span class="pick-num">{i + 1}</span>
              <span class="pick-name">{name}</span>
              <input type="hidden" name="exercise_name" value={name} />
              <span class="pick-controls">
                <button type="button" class="ctrl" disabled={i === 0} onclick={() => movePick(name, -1)} aria-label="Move up">↑</button>
                <button type="button" class="ctrl" disabled={i === picked.length - 1} onclick={() => movePick(name, 1)} aria-label="Move down">↓</button>
                <button type="button" class="ctrl del" onclick={() => removePick(name)} aria-label="Remove">×</button>
              </span>
            </li>
          {/each}
        </ol>
      {/if}
    </section>

    <!-- Library picker -->
    <section class="card">
      <header class="block-head">
        <h3>From the library</h3>
        <p class="hint">{data.libraryNames.length} distinct exercises across the cycle.</p>
      </header>

      <input
        type="search"
        class="search"
        placeholder="Search exercise names…"
        bind:value={query}
        autocomplete="off"
      />

      <ul class="lib-list">
        {#each filteredLibrary as name (name)}
          {@const isPicked = picked.includes(name)}
          <li>
            <button
              type="button"
              class="lib-row"
              class:picked={isPicked}
              onclick={() => togglePick(name)}
              aria-pressed={isPicked}
            >
              <span class="check">{isPicked ? '✓' : '+'}</span>
              <span class="lib-name">{name}</span>
            </button>
          </li>
        {/each}
        {#if filteredLibrary.length === 0}
          <li class="empty-row">No library matches for "{query}".</li>
        {/if}
      </ul>
    </section>

    <!-- Custom exercise -->
    <section class="card">
      <header class="block-head">
        <h3>Add a custom exercise</h3>
        <p class="hint">Not in the library? Type it here.</p>
      </header>

      <div class="custom-row">
        <input
          type="text"
          bind:value={customName}
          placeholder="e.g. Frenchies on jugs"
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button variant="secondary" onclick={addCustom}>Add</Button>
      </div>
    </section>

    <!-- Submit -->
    <div class="submit-row">
      <Button variant="ghost" href="/log">Cancel</Button>
      <button type="submit" class="primary-submit" disabled={picked.length === 0}>
        Create session →
      </button>
    </div>
  </form>
</div>

<style>
  .free-page { display: flex; flex-direction: column; gap: var(--space-5); max-width: 880px; }

  .head { padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-border-default); }
  .eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-2);
  }
  h2 {
    font: var(--text-h1-weight) var(--text-h1-size)/1 var(--font-sans);
    letter-spacing: var(--text-h1-tracking);
    margin-bottom: var(--space-3);
  }
  .subtitle {
    font: var(--text-body-weight) var(--text-body-size)/1.5 var(--font-sans);
    color: var(--color-fg-muted);
    max-width: 60ch;
  }

  form { display: flex; flex-direction: column; gap: var(--space-4); }

  .card {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  .meta {
    display: grid;
    grid-template-columns: 180px 220px 1fr;
    gap: var(--space-4);
  }

  .field { display: flex; flex-direction: column; gap: var(--space-2); }
  .field label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .field input, .field select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/1 var(--font-sans);
  }
  .field input:focus, .field select:focus {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 1px;
  }

  .block-head { margin-bottom: var(--space-3); }
  h3 {
    font: var(--text-h3-weight) var(--text-h3-size)/1 var(--font-sans);
    margin-bottom: var(--space-1);
  }
  .hint {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .empty {
    padding: var(--space-4);
    text-align: center;
    color: var(--color-fg-subtle);
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-2);
  }

  .picked-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
  .picked-list li {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-1);
  }
  .pick-num {
    font: var(--weight-semibold) 13px/1 var(--font-mono);
    color: var(--color-fg-muted);
    text-align: center;
  }
  .pick-name {
    font: var(--weight-medium) var(--text-body-size)/1.3 var(--font-sans);
    color: var(--color-fg-default);
  }
  .pick-controls { display: inline-flex; gap: 4px; }
  .ctrl {
    width: 26px; height: 26px;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-fg-muted);
    cursor: pointer;
    font: var(--weight-medium) 12px/1 var(--font-sans);
  }
  .ctrl:hover:not(:disabled) {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
  }
  .ctrl:disabled { opacity: 0.3; cursor: not-allowed; }
  .ctrl.del:hover { color: var(--color-fg-accent); border-color: var(--color-border-accent); }

  .search {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/1 var(--font-sans);
    margin-bottom: var(--space-3);
  }
  .search:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .lib-list {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-1);
    max-height: 360px;
    overflow-y: auto;
  }

  .lib-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 0;
    background: transparent;
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.3 var(--font-sans);
    text-align: left;
    cursor: pointer;
    border-radius: var(--radius-1);
  }
  .lib-row:hover { background: var(--color-bg-subtle); }
  .lib-row.picked {
    background: var(--color-bg-inverse);
    color: var(--color-fg-inverse);
  }
  .check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 1px solid currentColor;
    border-radius: var(--radius-1);
    font: var(--weight-semibold) 12px/1 var(--font-sans);
    flex-shrink: 0;
  }

  .empty-row {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--color-fg-subtle);
    padding: var(--space-3);
  }

  .custom-row { display: flex; gap: var(--space-2); }
  .custom-row input {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/1 var(--font-sans);
  }
  .custom-row input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .submit-row {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  .primary-submit {
    padding: var(--space-3) var(--space-5);
    border: 1px solid var(--color-fg-default);
    border-radius: var(--radius-2);
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    font: var(--weight-semibold) var(--text-body-size)/1 var(--font-sans);
    cursor: pointer;
  }
  .primary-submit:hover:not(:disabled) {
    background: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
  }
  .primary-submit:disabled {
    background: var(--color-bg-subtle);
    color: var(--color-fg-disabled);
    border-color: var(--color-border-default);
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .meta { grid-template-columns: 1fr 1fr; }
    .title-field { grid-column: 1 / -1; }
    .lib-list { grid-template-columns: 1fr; }
  }
</style>
