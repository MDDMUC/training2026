<script lang="ts">
  import { enhance } from '$app/forms';
  import { CLIMB_STYLE_LABELS } from '$lib/domain/types';
  import type { ClimbingAttempt, ClimbStyle } from '$lib/domain/types';

  type Props = {
    sessionId: number;
    attempts: ClimbingAttempt[];
    isOutdoor: boolean;
  };
  let { sessionId, attempts, isOutdoor }: Props = $props();

  let grade = $state('');
  let style = $state<ClimbStyle>(isOutdoor ? 'redpoint' : 'flash');
  let routeName = $state('');
  let notes = $state('');

  function resetForm() {
    grade = '';
    routeName = '';
    notes = '';
    style = isOutdoor ? 'redpoint' : 'flash';
  }

  const styles: ClimbStyle[] = ['onsight', 'flash', 'redpoint', 'repeat', 'attempt', 'project'];
</script>

<section class="climb-log">
  <header>
    <h3>Routes / Boulders</h3>
    <p class="subtitle">{isOutdoor ? 'Log each route attempted today' : 'Log notable problems'}</p>
  </header>

  {#if attempts.length > 0}
    <table>
      <thead>
        <tr>
          <th class="col-grade">Grade</th>
          <th class="col-style">Style</th>
          <th class="col-name">Name</th>
          <th class="col-notes">Notes</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>
        {#each attempts as a (a.id)}
          <tr>
            <td class="grade">{a.grade}</td>
            <td class="style style-{a.style}">{CLIMB_STYLE_LABELS[a.style]}</td>
            <td>{a.route_name ?? '—'}</td>
            <td class="notes">{a.notes ?? ''}</td>
            <td>
              <form method="POST" action="?/deleteClimb" use:enhance>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" class="del" aria-label="Delete">×</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="empty">No routes logged yet.</p>
  {/if}

  <form
    method="POST"
    action="?/recordClimb"
    class="add-form"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
        resetForm();
      };
    }}
  >
    <input type="hidden" name="sessionId" value={sessionId} />
    <label class="f-grade">
      <span>Grade</span>
      <input
        type="text"
        name="grade"
        bind:value={grade}
        placeholder={isOutdoor ? '7a, 7b+, 8a' : 'V4, V6, 7B+'}
        required
      />
    </label>
    <label class="f-style">
      <span>Style</span>
      <select name="style" bind:value={style}>
        {#each styles as s (s)}
          <option value={s}>{CLIMB_STYLE_LABELS[s]}</option>
        {/each}
      </select>
    </label>
    <label class="f-name">
      <span>Route name</span>
      <input type="text" name="route_name" bind:value={routeName} placeholder="optional" />
    </label>
    <label class="f-notes">
      <span>Notes</span>
      <input type="text" name="notes" bind:value={notes} placeholder="optional — beta, takes, conditions" />
    </label>
    <button type="submit" class="add-btn">Add</button>
  </form>
</section>

<style>
  .climb-log {
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

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--space-4);
  }

  th {
    text-align: left;
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }

  tr:last-child td { border-bottom: 0; }

  .grade {
    font: var(--weight-bold) 15px/1 var(--font-mono);
    color: var(--color-fg-default);
  }

  .style {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .style-onsight, .style-flash, .style-redpoint { color: var(--color-fg-default); }
  .style-onsight { color: var(--color-fg-accent); }
  .style-attempt, .style-project { color: var(--color-fg-subtle); font-style: italic; }

  .col-grade  { width: 80px; }
  .col-style  { width: 100px; }
  .col-name   { width: 25%; }
  .col-action { width: 30px; }

  .notes {
    color: var(--color-fg-muted);
    font-size: 12px;
  }

  .empty {
    color: var(--color-fg-subtle);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    margin-bottom: var(--space-4);
  }

  .del {
    width: 24px;
    height: 24px;
    border: 1px solid transparent;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-fg-subtle);
    font: var(--weight-bold) 16px/1 var(--font-sans);
    cursor: pointer;
  }
  .del:hover {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
  }

  .add-form {
    display: grid;
    grid-template-columns: 100px 130px 1fr 1fr auto;
    gap: var(--space-2);
    align-items: end;
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  .add-form label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .add-form input, .add-form select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    text-transform: none;
    letter-spacing: 0;
  }

  .add-form .f-grade input {
    font: var(--weight-bold) 16px/1 var(--font-mono);
    text-align: center;
  }

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
  .add-btn:hover {
    background: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
  }

  @media (max-width: 768px) {
    .add-form {
      grid-template-columns: 1fr 1fr;
    }
    .add-form .f-notes, .add-form .add-btn {
      grid-column: 1 / -1;
    }

    table { font-size: 12px; }
    .col-notes, .notes { display: none; }
    .col-name, .name { font-size: 12px; }
  }
</style>
