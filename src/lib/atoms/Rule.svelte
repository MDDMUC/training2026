<script lang="ts">
  type Props = {
    orientation?: 'horizontal' | 'vertical';
    class?: string;
  };
  let { orientation = 'horizontal', class: extraClass }: Props = $props();
</script>

<div
  class="rule rule-{orientation} {extraClass ?? ''}"
  role="separator"
  aria-orientation={orientation}
></div>

<style>
  .rule { background: var(--color-border-default); }
  .rule-horizontal { width: 100%; height: 1px; }
  .rule-vertical   { width: 1px; height: 100%; }
</style>
