<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant =
    | 'display'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'body-lg'
    | 'body'
    | 'body-sm'
    | 'caption'
    | 'micro'
    | 'code'
    | 'data'
    | 'data-lg';

  type Tone = 'default' | 'muted' | 'subtle' | 'inverse' | 'accent';

  type Props = {
    variant?: Variant;
    tone?: Tone;
    as?: keyof HTMLElementTagNameMap;
    class?: string;
    children: Snippet;
  };

  let { variant = 'body', tone = 'default', as, class: extraClass, children }: Props = $props();

  // Default semantic element by variant
  const defaultTag = (v: Variant): keyof HTMLElementTagNameMap => {
    if (v === 'display' || v === 'h1') return 'h1';
    if (v === 'h2') return 'h2';
    if (v === 'h3') return 'h3';
    if (v === 'body' || v === 'body-lg' || v === 'body-sm') return 'p';
    return 'span';
  };

  const tag = $derived(as ?? defaultTag(variant));
</script>

<svelte:element this={tag} class="t-{variant} tone-{tone} {extraClass ?? ''}">
  {@render children()}
</svelte:element>

<style>
  /* Variant classes come from tokens.css (.t-*). Tone modifiers here. */
  .tone-default { color: var(--color-fg-default); }
  .tone-muted   { color: var(--color-fg-muted); }
  .tone-subtle  { color: var(--color-fg-subtle); }
  .tone-inverse { color: var(--color-fg-inverse); }
  .tone-accent  { color: var(--color-fg-accent); }
</style>
