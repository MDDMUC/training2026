<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'outline' | 'filled' | 'accent';

  type Props = {
    variant?: Variant;
    children: Snippet;
  };
  let { variant = 'outline', children }: Props = $props();
</script>

<span class="tag tag-{variant}">
  {@render children()}
</span>

<style>
  .tag {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--space-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    border-radius: var(--radius-1);
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .tag-outline {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
    background: transparent;
  }

  .tag-filled {
    color: var(--color-fg-inverse);
    background: var(--color-bg-inverse);
  }

  .tag-accent {
    color: var(--color-fg-inverse);
    background: var(--color-bg-accent);
  }
</style>
