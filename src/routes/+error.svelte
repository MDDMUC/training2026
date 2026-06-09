<script lang="ts">
  import { page } from '$app/state';
</script>

<section class="err">
  <p class="eyebrow">Error · {page.status}</p>
  <h1>Something broke loading this page.</h1>
  {#if page.error?.message}
    <pre class="msg">{page.error.message}</pre>
  {/if}
  <p class="hint">
    Hard refresh the tab. If it keeps happening, screenshot this and share the message.
  </p>
  <p class="actions">
    <a href="/">Return to Today</a>
  </p>
</section>

<style>
  .err {
    max-width: 640px;
    margin: var(--space-7) auto;
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-accent);
    margin: 0;
  }
  h1 {
    font: var(--weight-bold) 22px/1.2 var(--font-sans);
    color: var(--color-fg-default);
    margin: 0;
  }
  .msg {
    padding: var(--space-3);
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-2);
    font: 12px/1.4 var(--font-mono);
    color: var(--color-fg-default);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }
  .hint {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.5 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0;
  }
  .actions a {
    font: var(--weight-semibold) var(--text-body-size)/1 var(--font-sans);
    color: var(--color-fg-accent);
  }
</style>
