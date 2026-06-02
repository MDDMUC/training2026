<script lang="ts">
  type Props = {
    label: string;
    value: string;
    unit?: string;
    delta?: string;
    deltaIsPR?: boolean;
  };
  let { label, value, unit, delta, deltaIsPR = false }: Props = $props();
</script>

<div class="stat">
  <div class="stat-label">{label}</div>
  <div class="stat-value">
    <span class="stat-number">{value}</span>{#if unit}<span class="stat-unit">{unit}</span>{/if}
  </div>
  {#if delta}
    <div class="stat-delta" class:pr={deltaIsPR}>{delta}</div>
  {/if}
</div>

<style>
  .stat {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .stat-label {
    font: var(--text-micro-weight) var(--text-micro-size)/var(--text-micro-line) var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .stat-value {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    font: var(--text-data-lg-weight) var(--text-data-lg-size)/var(--text-data-lg-line) var(--font-mono);
    letter-spacing: var(--text-data-lg-tracking);
    font-variant-numeric: tabular-nums lining-nums;
    color: var(--color-fg-default);
  }

  .stat-unit {
    font-size: 0.55em;
    color: var(--color-fg-muted);
    font-weight: var(--weight-medium);
  }

  .stat-delta {
    font: var(--text-caption-weight) var(--text-caption-size)/var(--text-caption-line) var(--font-sans);
    color: var(--color-fg-muted);
  }

  .stat-delta.pr {
    color: var(--color-fg-accent);
    font-weight: var(--weight-semibold);
  }
</style>
