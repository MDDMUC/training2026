<script lang="ts">
  import type { Insight } from '$lib/domain/insights';

  type Props = { insights: Insight[] };
  let { insights }: Props = $props();
</script>

<section class="card">
  <header class="card-head">
    <h3>Insights</h3>
    <span class="count">{insights.length}</span>
  </header>

  {#if insights.length === 0}
    <p class="empty">No active signals. The data is steady.</p>
  {:else}
    <ol class="list">
      {#each insights as i, idx (i.id)}
        <li class="insight severity-{i.severity}">
          <span class="marker">
            <span class="marker-num">{idx + 1}</span>
          </span>
          <div class="body">
            <h4 class="title">{i.title}</h4>
            <p class="detail">{i.detail}</p>
            {#if i.action}
              <a class="action" href={i.action.href}>{i.action.label} <span aria-hidden="true">→</span></a>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    height: 100%;
  }

  .card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }

  h3 {
    font: var(--weight-semibold) 14px/1 var(--font-sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-fg-default);
    margin: 0;
  }

  .count {
    font: var(--weight-medium) 13px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }

  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-fg-subtle);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.5 var(--font-sans);
    text-align: center;
    margin: 0;
    padding: var(--space-6);
  }

  /* ---------- Insight list ---------- */
  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
  }

  .insight {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: var(--space-3);
    align-items: start;
    padding: var(--space-3) var(--space-4);
    border-left: 3px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    border-radius: 0 var(--radius-1) var(--radius-1) 0;
  }

  .insight.severity-warn { border-left-color: var(--color-border-accent); }
  .insight.severity-good { border-left-color: var(--color-fg-default); }
  .insight.severity-info { border-left-color: var(--color-fg-subtle); }

  /* Numbered marker — replaces the dot + severity-redundancy */
  .marker {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-default);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .severity-warn .marker {
    border-color: var(--color-border-accent);
    background: var(--color-bg-accent-tint);
  }

  .marker-num {
    font: var(--weight-bold) 11px/1 var(--font-mono);
    color: var(--color-fg-default);
    font-variant-numeric: tabular-nums;
  }
  .severity-warn .marker-num { color: var(--color-fg-accent); }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .title {
    font: var(--weight-semibold) var(--text-body-size)/1.3 var(--font-sans);
    color: var(--color-fg-default);
    margin: 0;
  }
  .severity-warn .title { color: var(--color-fg-accent); }

  .detail {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.5 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0;
  }

  .action {
    align-self: flex-start;
    margin-top: var(--space-1);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-accent);
    text-decoration: none;
  }
  .action:hover { text-decoration: none; opacity: 0.75; }

  @media (max-width: 768px) {
    .card { padding: var(--space-4); }
    .card-head { margin-bottom: var(--space-3); padding-bottom: var(--space-3); }
    .insight { padding: var(--space-3); gap: var(--space-2); grid-template-columns: 24px 1fr; }
    .marker { width: 22px; height: 22px; }
    .title { font-size: 14px; }
    .detail { font-size: 13px; line-height: 1.4; }
  }
</style>
