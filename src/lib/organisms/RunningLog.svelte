<script lang="ts">
  import { enhance } from '$app/forms';
  import type { RunningLog } from '$lib/domain/types';

  type Props = {
    sessionId: number;
    runs: RunningLog[];
  };
  let { sessionId, runs }: Props = $props();

  let distance = $state<number | null>(null);
  let duration = $state<number | null>(null);
  let surface = $state<string>('road');
  let notes = $state<string>('');

  const previewPace = $derived(
    distance !== null && duration !== null && distance > 0
      ? duration / distance
      : null
  );

  function formatPace(min: number): string {
    const mins = Math.floor(min);
    const secs = Math.round((min - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  }

  function resetForm() {
    distance = null;
    duration = null;
    notes = '';
    surface = 'road';
  }
</script>

<section class="running-log">
  <header>
    <h3>Run log</h3>
    <p class="subtitle">Easy pace, conversational — sub-focus per plan.</p>
  </header>

  {#if runs.length > 0}
    <ul class="runs">
      {#each runs as r (r.id)}
        <li>
          <div class="r-row">
            <div class="r-stat">
              <span class="r-label">Distance</span>
              <span class="r-value">{r.distance_km.toFixed(2)} km</span>
            </div>
            <div class="r-stat">
              <span class="r-label">Duration</span>
              <span class="r-value">{r.duration_min.toFixed(0)} min</span>
            </div>
            <div class="r-stat">
              <span class="r-label">Pace</span>
              <span class="r-value">{r.pace_min_per_km !== null ? formatPace(r.pace_min_per_km) : '—'}</span>
            </div>
            {#if r.surface}
              <div class="r-stat">
                <span class="r-label">Surface</span>
                <span class="r-value-sm">{r.surface}</span>
              </div>
            {/if}
            <form method="POST" action="?/deleteRun" use:enhance>
              <input type="hidden" name="id" value={r.id} />
              <button type="submit" class="del" aria-label="Delete">×</button>
            </form>
          </div>
          {#if r.notes}<p class="r-notes">{r.notes}</p>{/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">No runs logged for this session yet.</p>
  {/if}

  <form
    method="POST"
    action="?/recordRun"
    class="add-form"
    use:enhance={() => async ({ update }) => {
      await update({ reset: false });
      resetForm();
    }}
  >
    <input type="hidden" name="sessionId" value={sessionId} />
    <label class="f">
      <span>Distance</span>
      <div class="ir">
        <input type="number" name="distance_km" step="0.01" min="0" inputmode="decimal" bind:value={distance} required />
        <span class="u">km</span>
      </div>
    </label>
    <label class="f">
      <span>Duration</span>
      <div class="ir">
        <input type="number" name="duration_min" step="0.5" min="0" inputmode="decimal" bind:value={duration} required />
        <span class="u">min</span>
      </div>
    </label>
    <label class="f">
      <span>Surface</span>
      <select name="surface" bind:value={surface}>
        <option value="road">Road</option>
        <option value="trail">Trail</option>
        <option value="treadmill">Treadmill</option>
        <option value="grass">Grass / track</option>
      </select>
    </label>
    <label class="f f-notes">
      <span>Notes</span>
      <input type="text" name="notes" bind:value={notes} placeholder="HR, feel, conditions" />
    </label>
    <button type="submit" class="add-btn">Add run</button>

    {#if previewPace !== null}
      <div class="pace-preview">Pace: {formatPace(previewPace)}</div>
    {/if}
  </form>
</section>

<style>
  .running-log {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header { margin-bottom: var(--space-4); }
  h3 { font: var(--text-h3-weight) var(--text-h3-size)/1 var(--font-sans); }
  .subtitle {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
    margin-top: var(--space-1);
  }

  .runs { list-style: none; padding: 0; margin: 0 0 var(--space-4) 0; }
  .runs li {
    border-bottom: 1px solid var(--color-border-default);
    padding: var(--space-3) 0;
  }
  .runs li:last-child { border-bottom: 0; }

  .r-row {
    display: flex;
    gap: var(--space-5);
    align-items: end;
    flex-wrap: wrap;
  }

  .r-stat { display: flex; flex-direction: column; gap: 2px; }
  .r-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .r-value {
    font: var(--weight-semibold) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }
  .r-value-sm {
    font: var(--weight-medium) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-default);
  }

  .r-notes {
    margin-top: var(--space-2);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-muted);
    font-style: italic;
  }

  .del {
    margin-left: auto;
    width: 24px;
    height: 24px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-fg-subtle);
    cursor: pointer;
    font: var(--weight-bold) 16px/1 var(--font-sans);
  }
  .del:hover { color: var(--color-fg-accent); border-color: var(--color-border-accent); }

  .empty {
    color: var(--color-fg-subtle);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    margin-bottom: var(--space-4);
  }

  .add-form {
    display: grid;
    grid-template-columns: 110px 110px 140px 1fr auto;
    gap: var(--space-3);
    align-items: end;
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  .f {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .ir { display: flex; align-items: baseline; gap: 4px; }

  .f input, .f select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    text-transform: none;
    letter-spacing: 0;
  }
  .f input[type='number'] {
    font: var(--weight-medium) 15px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    width: 70px;
    text-align: right;
  }
  .u { color: var(--color-fg-muted); font-size: 11px; }

  .add-btn {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-fg-default);
    border-radius: var(--radius-2);
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    cursor: pointer;
    height: 36px;
  }
  .add-btn:hover { background: var(--color-bg-accent); border-color: var(--color-bg-accent); }

  .pace-preview {
    grid-column: 1 / -1;
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    color: var(--color-fg-accent);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-accent-tint);
    border-radius: var(--radius-1);
  }

  @media (max-width: 640px) {
    .add-form { grid-template-columns: 1fr 1fr; }
    .f-notes, .add-btn { grid-column: 1 / -1; }
    .r-row { gap: var(--space-3); }
  }
</style>
