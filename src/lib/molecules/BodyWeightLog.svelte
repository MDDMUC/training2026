<script lang="ts">
  import { enhance } from '$app/forms';
  import { parseISO, format } from 'date-fns';

  type Props = {
    sessionId: number;
    currentWeight: number | null;
    previousWeight: number | null;
    previousDate: string | null;
  };
  let { sessionId, currentWeight, previousWeight, previousDate }: Props = $props();

  let weight = $state<number | null>(currentWeight);

  const delta = $derived(
    weight !== null && previousWeight !== null
      ? Math.round((weight - previousWeight) * 10) / 10
      : null
  );

  const deltaSign = $derived(delta === null ? '' : delta > 0 ? '+' : delta < 0 ? '−' : '±');
  const deltaAbs = $derived(delta === null ? 0 : Math.abs(delta));

  function submitForm(e: Event) {
    const form = (e.currentTarget as HTMLElement).closest('form') as HTMLFormElement | null;
    form?.requestSubmit();
  }
</script>

<section class="bw">
  <div class="left">
    <span class="label">Today's body weight</span>
    {#if previousWeight !== null && previousDate}
      <span class="prev">Prev: {previousWeight.toFixed(1)} kg · {format(parseISO(previousDate), 'MMM d')}</span>
    {/if}
  </div>

  <div class="right">
    <form method="POST" action="?/updateSession" use:enhance>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input
        type="number"
        name="body_weight_kg"
        step="0.1"
        inputmode="decimal"
        bind:value={weight}
        placeholder="—"
        onchange={submitForm}
      />
      <span class="unit">kg</span>
    </form>

    {#if delta !== null && weight !== null}
      <span class="delta" class:up={delta > 0} class:down={delta < 0}>
        {deltaSign}{deltaAbs.toFixed(1)} kg
      </span>
    {/if}
  </div>
</section>

<style>
  .bw {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-4);
    align-items: center;
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  .left {
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

  .prev {
    font: var(--text-body-sm-weight) 12px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-subtle);
  }

  .right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  form { display: inline-flex; align-items: baseline; gap: var(--space-2); }

  input[type='number'] {
    width: 120px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--weight-bold) 28px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
    letter-spacing: -0.01em;
  }

  input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .unit { color: var(--color-fg-muted); font: var(--weight-medium) 14px/1 var(--font-mono); }

  .delta {
    font: var(--weight-semibold) var(--text-data-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    padding: 4px var(--space-2);
    border-radius: var(--radius-1);
    color: var(--color-fg-muted);
    border: 1px solid var(--color-border-default);
  }

  .delta.up   { color: var(--color-fg-accent); border-color: var(--color-border-accent); }
  .delta.down { color: var(--color-fg-default); }

  @media (max-width: 640px) {
    .bw {
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }
    .right { justify-content: flex-end; }
    input[type='number'] { width: 100px; font-size: 24px; }
  }
</style>
