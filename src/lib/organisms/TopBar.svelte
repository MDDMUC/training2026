<script lang="ts">
  import { format } from 'date-fns';
  import { commandPalette } from '$lib/stores/commandPalette.svelte';
  import { help } from '$lib/stores/help.svelte';

  type Props = {
    title: string;
    subtitle?: string;
    user?: { id: string; display_name: string } | null;
  };
  let { title, subtitle, user }: Props = $props();

  let theme = $state<'light' | 'dark'>('light');

  function toggleTheme() {
    if (typeof document === 'undefined') return;
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('training2026.theme', theme);
    } catch {
      /* localStorage may be unavailable; ignore */
    }
  }

  $effect(() => {
    if (typeof document === 'undefined') return;
    const stored = (() => {
      try {
        return localStorage.getItem('training2026.theme');
      } catch {
        return null;
      }
    })();
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
      document.documentElement.setAttribute('data-theme', stored);
    }
  });

  const today = format(new Date(), 'EEE, MMM d, yyyy');
</script>

<header class="topbar">
  <div class="title-block">
    <h1>{title}</h1>
    {#if subtitle}
      <p class="subtitle">{subtitle}</p>
    {/if}
  </div>

  <div class="meta">
    <span class="today">{today}</span>
    <button class="kbd-trigger" onclick={() => commandPalette.show()} aria-label="Open command palette">
      <kbd>⌘</kbd><kbd>K</kbd>
    </button>
    <button class="kbd-trigger help-btn" onclick={() => help.show()} aria-label="Open keyboard shortcuts">
      <kbd>?</kbd>
    </button>
    <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
    {#if user}
      <form method="POST" action="/logout" class="signout-form">
        <span class="who">{user.display_name}</span>
        <button type="submit" class="theme-toggle" aria-label="Sign out">Sign out</button>
      </form>
    {/if}
  </div>
</header>

<style>
  .topbar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-canvas);
    min-height: 56px;
  }

  .title-block h1 {
    font: var(--weight-semibold) 18px/1.2 var(--font-sans);
    letter-spacing: -0.01em;
  }

  .subtitle {
    font: var(--text-micro-weight) var(--text-micro-size)/1.2 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-top: 2px;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .today {
    font: var(--text-data-weight) var(--text-data-size)/1 var(--font-mono);
    color: var(--color-fg-muted);
    font-variant-numeric: tabular-nums;
  }

  .theme-toggle {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    transition:
      background var(--motion-default) var(--ease-standard),
      color var(--motion-default) var(--ease-standard);
  }

  .theme-toggle:hover {
    background: var(--color-bg-subtle);
    color: var(--color-fg-default);
  }

  .kbd-trigger {
    display: inline-flex;
    gap: 2px;
    padding: 4px 6px;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .kbd-trigger kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    font: var(--weight-semibold) 11px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }

  .kbd-trigger:hover kbd {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
  }

  .signout-form {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
  }

  .who {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  @media (max-width: 640px) {
    .topbar { padding: var(--space-3) var(--space-4); }
    .today { display: none; }
    .kbd-trigger { display: none; }
    .who { display: none; }
  }
</style>
