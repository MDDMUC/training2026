<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'secondary' | 'ghost';
  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    variant?: Variant;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    href?: string;
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
    'aria-label'?: string;
    class?: string;
    children: Snippet;
  };

  let {
    variant = 'secondary',
    size = 'md',
    type = 'button',
    href,
    disabled,
    onclick,
    'aria-label': ariaLabel,
    class: extraClass,
    children
  }: Props = $props();
</script>

{#if href}
  <a
    {href}
    class="btn btn-{variant} btn-{size} {extraClass ?? ''}"
    aria-label={ariaLabel}
    aria-disabled={disabled ? 'true' : undefined}
  >
    {@render children()}
  </a>
{:else}
  <button
    {type}
    class="btn btn-{variant} btn-{size} {extraClass ?? ''}"
    {disabled}
    {onclick}
    aria-label={ariaLabel}
  >
    {@render children()}
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-2);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    font-weight: var(--weight-medium);
    cursor: pointer;
    text-decoration: none;
    transition:
      background var(--motion-default) var(--ease-standard),
      color var(--motion-default) var(--ease-standard),
      border-color var(--motion-default) var(--ease-standard);
    white-space: nowrap;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  /* sizes */
  .btn-sm { padding: var(--space-1) var(--space-3); height: 28px; }
  .btn-md { padding: var(--space-2) var(--space-4); height: 36px; }
  .btn-lg { padding: var(--space-3) var(--space-5); height: 44px; }

  /* primary */
  .btn-primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-fg);
    border-color: var(--button-primary-border);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-500);
    border-color: var(--color-accent-500);
  }

  /* secondary */
  .btn-secondary {
    background: var(--button-secondary-bg);
    color: var(--button-secondary-fg);
    border-color: var(--button-secondary-border);
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-bg-subtle);
  }

  /* ghost */
  .btn-ghost {
    background: var(--button-ghost-bg);
    color: var(--button-ghost-fg);
    border-color: var(--button-ghost-border);
  }
  .btn-ghost:hover:not(:disabled) {
    background: var(--color-bg-subtle);
  }

  .btn:disabled,
  .btn[aria-disabled='true'] {
    color: var(--color-fg-disabled);
    border-color: var(--color-border-default);
    background: transparent;
    cursor: not-allowed;
  }
</style>
