<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { help } from '$lib/stores/help.svelte';
  import { commandPalette } from '$lib/stores/commandPalette.svelte';

  type Shortcut = { keys: string[]; label: string };

  const groups: Array<{ title: string; items: Shortcut[] }> = [
    {
      title: 'Navigation',
      items: [
        { keys: ['t'], label: 'Go to Today' },
        { keys: ['c'], label: 'Go to Calendar' },
        { keys: ['w'], label: 'Calendar — week view' },
        { keys: ['l'], label: 'Go to Log' },
        { keys: ['e'], label: 'Go to Exercise library' },
        { keys: ['p'], label: 'Go to Personal records' },
        { keys: ['a'], label: 'Go to Analysis' },
        { keys: ['s'], label: 'Go to Settings' }
      ]
    },
    {
      title: 'Commands',
      items: [
        { keys: ['⌘', 'K'], label: 'Open command palette (Ctrl+K on Windows)' },
        { keys: ['?'], label: 'Toggle this help' },
        { keys: ['esc'], label: 'Close overlays' }
      ]
    },
    {
      title: 'In a session',
      items: [
        { keys: ['click ☐'], label: 'Tick a set — starts rest timer if rest_seconds set' },
        { keys: ['change input'], label: 'Auto-save on change / blur' },
        { keys: ['hover ×'], label: 'Reveal delete button on a set' }
      ]
    }
  ];

  function isTypingInInput(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function handleKeydown(e: KeyboardEvent) {
    // Modifier keys handled by other components (⌘K) — skip here
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Don't fire while typing
    if (isTypingInInput(e.target)) return;

    if (e.key === '?') {
      e.preventDefault();
      help.toggle();
      return;
    }

    if (help.open && e.key === 'Escape') {
      e.preventDefault();
      help.hide();
      return;
    }

    // Don't intercept letter keys if any overlay is open
    if (help.open || commandPalette.open) return;

    switch (e.key) {
      case 't': goto('/'); break;
      case 'c': goto('/calendar'); break;
      case 'w': goto('/calendar/week'); break;
      case 'l': goto('/log'); break;
      case 'e': goto('/exercise'); break;
      case 'p': goto('/pr'); break;
      case 'a': goto('/analysis'); break;
      case 's': goto('/settings'); break;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if help.open}
  <div class="backdrop" onclick={() => help.hide()} role="presentation"></div>
  <div class="overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
    <header>
      <h2>Keyboard shortcuts</h2>
      <button class="close" onclick={() => help.hide()} aria-label="Close">✕</button>
    </header>

    <div class="groups">
      {#each groups as g (g.title)}
        <section>
          <h3>{g.title}</h3>
          <dl>
            {#each g.items as item (item.label)}
              <dt>
                {#each item.keys as k, i (i)}
                  <kbd>{k}</kbd>{#if i < item.keys.length - 1}<span class="plus">+</span>{/if}
                {/each}
              </dt>
              <dd>{item.label}</dd>
            {/each}
          </dl>
        </section>
      {/each}
    </div>

    <footer>
      <span>Press <kbd>?</kbd> to toggle · <kbd>esc</kbd> to close</span>
    </footer>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: var(--z-overlay);
  }

  .overlay {
    position: fixed;
    top: 12vh;
    left: 50%;
    transform: translateX(-50%);
    width: min(720px, calc(100vw - var(--space-7)));
    max-height: 76vh;
    z-index: var(--z-modal);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-3);
    box-shadow: var(--elevation-4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border-default);
  }

  h2 { font: var(--text-h3-weight) var(--text-h3-size)/1 var(--font-sans); }

  .close {
    width: 32px; height: 32px;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-fg-muted);
    font: var(--weight-medium) 14px/1 var(--font-sans);
    cursor: pointer;
  }
  .close:hover { color: var(--color-fg-default); border-color: var(--color-border-strong); }

  .groups {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-5);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-6);
  }

  section h3 {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border-default);
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-2) var(--space-4);
    align-items: center;
  }

  dt { display: inline-flex; align-items: center; gap: 2px; }
  dd { color: var(--color-fg-default); font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans); margin: 0; }

  kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    font: var(--weight-medium) 11px/1 var(--font-mono);
    color: var(--color-fg-default);
  }

  .plus { color: var(--color-fg-subtle); margin: 0 2px; font-size: 11px; }

  footer {
    padding: var(--space-3) var(--space-5);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    font: var(--text-micro-weight) 11px/1 var(--font-sans);
    color: var(--color-fg-muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
</style>
