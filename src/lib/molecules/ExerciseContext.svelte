<script lang="ts">
  import type { ExerciseContext, ExerciseSnapshot } from '$lib/db/queries';
  import type { ExerciseSet } from '$lib/domain/types';
  import { parseISO, format } from 'date-fns';

  type Props = { context: ExerciseContext; currentTopSet?: ExerciseSet | null };
  let { context, currentTopSet = null }: Props = $props();

  function setScore(s: { load_kg_added: number | null; load_kg: number | null; hold_seconds: number | null }): number {
    return s.load_kg_added ?? s.load_kg ?? s.hold_seconds ?? 0;
  }

  // PR detection: current top set strictly exceeds previous instance's top set
  // AND at least one set is completed (so we don't flag a not-yet-attempted prescription as a PR).
  const isNewPR = $derived.by(() => {
    if (!currentTopSet || !context.previous?.top_set) return false;
    if (currentTopSet.completed !== 1) return false;
    const cur = setScore(currentTopSet);
    const prev = setScore(context.previous.top_set);
    return prev > 0 && cur > prev;
  });

  function summarizeTopSet(snap: ExerciseSnapshot): string {
    const t = snap.top_set;
    if (!t) return '—';

    const parts: string[] = [];
    if (t.load_kg_added !== null) parts.push(`+${t.load_kg_added} kg`);
    else if (t.load_kg !== null) parts.push(`${t.load_kg} kg`);
    if (t.reps !== null) parts.push(`× ${t.reps}`);
    if (t.hold_seconds !== null) parts.push(`${t.hold_seconds}s`);
    if (snap.work_set_count > 1 && t.reps !== null) {
      parts.push(`(${snap.work_set_count} sets)`);
    }
    return parts.length > 0 ? parts.join(' ') : '—';
  }

  function relativeDate(iso: string): string {
    const d = parseISO(iso);
    return format(d, 'EEE MMM d');
  }
</script>

{#if context.previous || context.next}
  <div class="ctx" class:pr={isNewPR}>
    <div class="col col-prev" class:empty={!context.previous}>
      <span class="label">Prev</span>
      {#if context.previous}
        <span class="date">{relativeDate(context.previous.session_date)}</span>
        <span class="value">{summarizeTopSet(context.previous)}</span>
      {:else}
        <span class="empty-text">— no prior session yet —</span>
      {/if}
    </div>

    {#if isNewPR}
      <div class="pr-badge" aria-label="New personal record">↑ NEW PR</div>
    {:else}
      <div class="arrow" aria-hidden="true">→</div>
    {/if}

    <div class="col col-next" class:empty={!context.next}>
      <span class="label">Next</span>
      {#if context.next}
        <span class="date">{relativeDate(context.next.session_date)}</span>
        <span class="value">{summarizeTopSet(context.next)}</span>
      {:else}
        <span class="empty-text">— no future session —</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  .ctx {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-1);
    margin-bottom: var(--space-3);
  }

  .col {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    min-width: 0;
  }

  .col-next { justify-content: flex-end; }

  .label {
    font: var(--text-micro-weight) 10px/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-subtle);
    flex-shrink: 0;
  }

  .date {
    font: var(--weight-medium) 11px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    flex-shrink: 0;
  }

  .value {
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-text {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-subtle);
    font-style: italic;
  }

  .arrow {
    color: var(--color-fg-subtle);
    font-size: 14px;
    line-height: 1;
  }

  .col.empty .value { color: var(--color-fg-subtle); }

  .ctx.pr {
    background: var(--color-bg-accent-tint);
    border: 1px solid var(--color-border-accent);
  }

  .pr-badge {
    font: var(--weight-bold) 11px/1 var(--font-sans);
    letter-spacing: 0.08em;
    color: var(--color-fg-accent);
    padding: 4px var(--space-2);
    border: 1px solid var(--color-border-accent);
    border-radius: var(--radius-1);
    white-space: nowrap;
  }
</style>
