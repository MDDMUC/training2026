<script lang="ts">
  import { enhance } from '$app/forms';
  import Tag from '$lib/molecules/Tag.svelte';
  import Button from '$lib/atoms/Button.svelte';
  import ExerciseBlock from '$lib/organisms/ExerciseBlock.svelte';
  import SessionMeta from '$lib/molecules/SessionMeta.svelte';
  import BodyWeightLog from '$lib/molecules/BodyWeightLog.svelte';
  import TindeqQuickLog from '$lib/organisms/TindeqQuickLog.svelte';
  import PullupQuickLog from '$lib/organisms/PullupQuickLog.svelte';
  import ClimbingLog from '$lib/organisms/ClimbingLog.svelte';
  import RunningLog from '$lib/organisms/RunningLog.svelte';
  import { SESSION_TYPE_LABELS } from '$lib/domain/types';
  import { computeSessionLoad, formatTonnage, formatHoldTime } from '$lib/domain/load';

  let { data } = $props();

  let newExerciseName = $state('');
  let showAddExercise = $state(false);

  function resetAddExercise() {
    newExerciseName = '';
    showAddExercise = false;
  }

  const totalSets = $derived(
    data.prescription.reduce((acc, ex) => acc + ex.sets.length, 0)
  );
  const doneSets = $derived(
    data.prescription.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed === 1).length,
      0
    )
  );
  const progressPct = $derived(totalSets ? (doneSets / totalSets) * 100 : 0);

  const sessionLoad = $derived.by(() => {
    const allSets = data.prescription.flatMap((ex) => ex.sets);
    return computeSessionLoad(allSets, data.session?.body_weight_kg ?? null);
  });
</script>

<div class="page">
  <header class="head">
    <p class="eyebrow">{data.dateLabel}</p>

    {#if data.phase}
      <div class="phase-line">
        <Tag variant="filled">{data.phase.short_name}</Tag>
        <span class="phase-name">{data.phase.name}</span>
      </div>
    {/if}

    {#if data.session}
      {#if data.sessionsForDate.length > 1}
        <div class="session-picker" role="tablist" aria-label="Sessions on this date">
          {#each data.sessionsForDate as s (s.id)}
            <a
              role="tab"
              aria-selected={s.id === data.session.id}
              class="picker-chip"
              class:active={s.id === data.session.id}
              href="/log/by-date/{data.dateISO}?session={s.id}"
            >
              {s.title ?? SESSION_TYPE_LABELS[s.type]}
              {#if !s.scheduled}<span class="free-badge">free</span>{/if}
            </a>
          {/each}
        </div>
      {/if}
      <h2 class="title">{data.session.title ?? SESSION_TYPE_LABELS[data.session.type]}</h2>
      <p class="meta">
        <span>{SESSION_TYPE_LABELS[data.session.type]}</span>
        {#if data.session.scheduled}<span> · scheduled</span>{:else}<span> · free</span>{/if}
        {#if data.session.completed}<span> · completed</span>{:else}<span> · in progress</span>{/if}
      </p>

      <div class="session-progress">
        <div class="progress-track">
          <div class="progress-fill" style="width: {progressPct}%"></div>
        </div>
        <div class="progress-label">{doneSets} / {totalSets} sets</div>
      </div>

      {#if sessionLoad.completed_work_sets > 0}
        <div class="load-row">
          {#if sessionLoad.tonnage_kg > 0}
            <span class="load-stat">
              <span class="load-label">Tonnage</span>
              <span class="load-value">{formatTonnage(sessionLoad.tonnage_kg)}</span>
            </span>
          {/if}
          {#if sessionLoad.isometric_seconds > 0}
            <span class="load-stat">
              <span class="load-label">Time under tension</span>
              <span class="load-value">{formatHoldTime(sessionLoad.isometric_seconds)}</span>
            </span>
          {/if}
          <span class="load-stat">
            <span class="load-label">Work sets done</span>
            <span class="load-value">{sessionLoad.completed_work_sets}</span>
          </span>
        </div>
      {/if}
    {:else}
      <h2 class="title">No session here yet</h2>
      <p class="meta">Nothing scheduled or logged for this date.</p>
    {/if}
  </header>

  <div class="back-row">
    {#if data.prevDate}
      <Button variant="ghost" size="sm" href="/log/by-date/{data.prevDate}">&laquo; Prev day</Button>
    {/if}
    <Button variant="ghost" size="sm" href="/calendar">Calendar</Button>
    <Button variant="ghost" size="sm" href="/log">All sessions</Button>
    {#if data.nextDate}
      <Button variant="ghost" size="sm" href="/log/by-date/{data.nextDate}">Next day &raquo;</Button>
    {/if}
  </div>

  {#if data.session && data.prescription.length > 0}
    <BodyWeightLog
      sessionId={data.session.id}
      currentWeight={data.session.body_weight_kg}
      previousWeight={data.previousWeight?.body_weight_kg ?? null}
      previousDate={data.previousWeight?.date ?? null}
    />

    <div class="prescription">
      {#each data.prescription as exercise (exercise.id)}
        <ExerciseBlock {exercise} sessionId={data.session.id} context={data.exerciseContexts[exercise.id]} />
      {/each}

      <div class="add-exercise">
        {#if showAddExercise}
          <form
            method="POST"
            action="?/addExercise"
            use:enhance={() => async ({ update }) => {
              await update({ reset: false });
              resetAddExercise();
            }}
          >
            <input
              type="text"
              name="name"
              bind:value={newExerciseName}
              placeholder="Exercise name (e.g. Cable face pulls)"
              autofocus
              required
            />
            <button type="submit" class="primary">Add</button>
            <button type="button" class="ghost" onclick={resetAddExercise}>Cancel</button>
          </form>
        {:else}
          <button type="button" class="open-add" onclick={() => (showAddExercise = true)}>
            + Add an ad-hoc exercise
          </button>
        {/if}
      </div>
    </div>

    {#if data.isTest}
      <div class="quick-logs-row">
        <TindeqQuickLog recentR={data.recentTindeqR} recentL={data.recentTindeqL} />
        <PullupQuickLog />
      </div>
    {/if}

    {#if data.isClimb}
      <ClimbingLog
        sessionId={data.session.id}
        attempts={data.climbingAttempts}
        isOutdoor={data.session.type === 'climb-outdoor'}
      />
    {/if}

    {#if data.isRun}
      <RunningLog sessionId={data.session.id} runs={data.runs} />
    {/if}

    <SessionMeta session={data.session} />
  {:else if data.session}
    <p class="empty">This session has no prescribed exercises yet.</p>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
  }

  .head {
    padding-bottom: var(--space-5);
    border-bottom: 1px solid var(--color-border-default);
  }

  .eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-3);
  }

  .phase-line {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .phase-name {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .title {
    font: var(--text-h1-weight) var(--text-h1-size)/var(--text-h1-line) var(--font-sans);
    letter-spacing: var(--text-h1-tracking);
    margin-bottom: var(--space-3);
  }

  .meta {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-muted);
    margin-bottom: var(--space-5);
  }

  .session-picker {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .picker-chip {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    font: var(--weight-medium) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .picker-chip:hover {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
    text-decoration: none;
  }
  .picker-chip.active {
    background: var(--color-bg-inverse);
    color: var(--color-fg-inverse);
    border-color: var(--color-bg-inverse);
  }

  .free-badge {
    font: var(--text-micro-weight) 9px/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    padding: 2px 4px;
    border: 1px solid currentColor;
    border-radius: 2px;
    opacity: 0.7;
  }

  .session-progress {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .progress-track {
    flex: 1;
    height: 4px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
    max-width: 360px;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-bg-accent);
    transition: width var(--motion-default) var(--ease-standard);
  }

  .progress-label {
    font: var(--weight-medium) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }

  .load-row {
    display: flex;
    gap: var(--space-5);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  .load-stat { display: flex; flex-direction: column; gap: 2px; }

  .load-label {
    font: var(--text-micro-weight) 10px/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .load-value {
    font: var(--weight-semibold) 18px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .back-row { display: flex; gap: var(--space-3); }

  .prescription {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    align-items: start;
  }

  /* The add-exercise affordance spans the full grid width */
  .prescription > .add-exercise { grid-column: 1 / -1; }

  /* Quick-logs (Tindeq + Pull-up) sit side-by-side on test days */
  .quick-logs-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    align-items: start;
  }

  @media (max-width: 1280px) {
    .prescription { grid-template-columns: 1fr; }
    .quick-logs-row { grid-template-columns: 1fr; }
  }

  .empty {
    color: var(--color-fg-muted);
    font: var(--text-body-weight) var(--text-body-size)/1.5 var(--font-sans);
  }

  .add-exercise {
    margin-top: var(--space-3);
    padding: var(--space-3);
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-2);
  }

  .add-exercise form {
    display: flex;
    gap: var(--space-2);
  }
  .add-exercise input[type='text'] {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/1.4 var(--font-sans);
  }
  .add-exercise input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .add-exercise .primary {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-fg-default);
    border-radius: var(--radius-2);
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    cursor: pointer;
  }

  .add-exercise .ghost {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--color-fg-muted);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    cursor: pointer;
  }

  .open-add {
    width: 100%;
    padding: var(--space-3);
    border: 0;
    background: transparent;
    color: var(--color-fg-muted);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    cursor: pointer;
  }
  .open-add:hover { color: var(--color-fg-default); }

  /* Phone: the add-exercise form (input + Add + Cancel side-by-side) crushes
     the input below readable width. Stack vertically. */
  @media (max-width: 640px) {
    .add-exercise form {
      flex-direction: column;
      align-items: stretch;
    }
    .add-exercise .primary,
    .add-exercise .ghost {
      width: 100%;
    }
  }
</style>
