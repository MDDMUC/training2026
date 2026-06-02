<script lang="ts">
  import { CLIMB_STYLE_LABELS } from '$lib/domain/types';
  import type { ClimbingAttempt, ClimbStyle } from '$lib/domain/types';
  import { parseISO, format } from 'date-fns';

  type AttemptWithDate = ClimbingAttempt & { date: string };

  type Props = { attempts: AttemptWithDate[] };
  let { attempts }: Props = $props();

  const total = $derived(attempts.length);

  const byStyle = $derived.by(() => {
    const map = new Map<ClimbStyle, number>();
    for (const a of attempts) map.set(a.style, (map.get(a.style) ?? 0) + 1);
    return map;
  });

  // Naive grade ranking: French sport letters + V-scale + Font. Falls back to string.
  function gradeRank(g: string): number {
    const s = g.trim().toLowerCase();
    // V-scale
    const v = s.match(/^v(\d+)/);
    if (v) return 1000 + Number(v[1]);
    // French / Font: digit letter [+]
    const m = s.match(/^(\d)([a-d])(\+)?/);
    if (m) {
      const num = Number(m[1]);
      const letter = m[2].charCodeAt(0) - 'a'.charCodeAt(0); // a=0,b=1,c=2,d=3
      const plus = m[3] ? 0.5 : 0;
      return num * 10 + letter * 2 + (plus ? 1 : 0);
    }
    return -1;
  }

  const hardest = $derived(
    [...attempts].sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade))[0] ?? null
  );

  const recent = $derived([...attempts].slice(-5).reverse());
  const styles: ClimbStyle[] = ['onsight', 'flash', 'redpoint', 'repeat', 'attempt', 'project'];
</script>

<section class="summary">
  <header>
    <h3>Climbing Summary</h3>
    <p class="subtitle">All logged routes and boulders across the macrocycle.</p>
  </header>

  {#if total === 0}
    <p class="empty">Log routes on a climbing day to see summaries here.</p>
  {:else}
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total</div>
        <div class="stat-value">{total}</div>
      </div>
      {#if hardest}
        <div class="stat">
          <div class="stat-label">Hardest</div>
          <div class="stat-value">{hardest.grade}</div>
          <div class="stat-meta">{format(parseISO(hardest.date), 'MMM d')}</div>
        </div>
      {/if}
    </div>

    <div class="styles-row">
      {#each styles as s (s)}
        {@const count = byStyle.get(s) ?? 0}
        {#if count > 0}
          <div class="style-pill">
            <span class="count">{count}</span>
            <span class="name">{CLIMB_STYLE_LABELS[s]}</span>
          </div>
        {/if}
      {/each}
    </div>

    <div class="recent">
      <div class="recent-label">Recent</div>
      <ul>
        {#each recent as a (a.id)}
          <li>
            <span class="grade">{a.grade}</span>
            <span class="style">{CLIMB_STYLE_LABELS[a.style]}</span>
            <span class="name">{a.route_name ?? '—'}</span>
            <span class="date">{format(parseISO(a.date), 'MMM d')}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .summary {
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  header { margin-bottom: var(--space-4); }
  h3 {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .subtitle {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-subtle);
    margin-top: var(--space-1);
  }

  .empty {
    color: var(--color-fg-subtle);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-5);
    margin-bottom: var(--space-4);
  }

  .stat-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-1);
  }

  .stat-value {
    font: var(--text-data-lg-weight) var(--text-data-lg-size)/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }

  .stat-meta {
    font: var(--text-body-sm-weight) 12px/1 var(--font-mono);
    color: var(--color-fg-muted);
    margin-top: var(--space-1);
  }

  .styles-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .style-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 4px var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
  }

  .style-pill .count {
    font: var(--weight-bold) 13px/1 var(--font-mono);
    color: var(--color-fg-default);
  }

  .style-pill .name {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .recent-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-subtle);
    margin-bottom: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  .recent ul { list-style: none; padding: 0; margin: 0; }

  .recent li {
    display: grid;
    grid-template-columns: 60px 100px 1fr auto;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
  }

  .recent li:last-child { border-bottom: 0; }

  .grade {
    font: var(--weight-bold) 14px/1 var(--font-mono);
    color: var(--color-fg-default);
  }

  .style {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .name {
    color: var(--color-fg-default);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .date {
    font: var(--weight-medium) 12px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }
</style>
