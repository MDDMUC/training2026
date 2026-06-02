<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  import { commandPalette } from '$lib/stores/commandPalette.svelte';
  import { format, parseISO } from 'date-fns';

  interface Command {
    label: string;
    href: string;
    section: 'Pages' | 'Quick' | 'Recent';
    hint?: string;
  }

  type RecentSession = { id: number; date: string; title: string | null; type: string; completed: number };
  type Props = { recentSessions?: RecentSession[] };
  let { recentSessions = [] }: Props = $props();

  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const staticCommands: Command[] = [
    { label: 'Today', href: '/', section: 'Pages', hint: 'Home' },
    { label: 'Calendar', href: '/calendar', section: 'Pages', hint: 'Month view' },
    { label: 'Week view', href: '/calendar/week', section: 'Pages' },
    { label: 'Log', href: '/log', section: 'Pages' },
    { label: 'Exercises', href: '/exercise', section: 'Pages', hint: 'Library' },
    { label: 'Records (PR)', href: '/pr', section: 'Pages', hint: 'Lifetime peaks' },
    { label: 'Analysis', href: '/analysis', section: 'Pages' },
    { label: 'Settings', href: '/settings', section: 'Pages' },
    { label: 'Log today\'s session', href: `/log/by-date/${todayISO}`, section: 'Quick', hint: format(new Date(), 'EEE MMM d') },
    { label: 'Log a free / improvised session', href: '/log/free', section: 'Quick', hint: 'New ad-hoc' },
    { label: 'Jump to Jun 8 (Plan start)', href: '/log/by-date/2026-06-08', section: 'Quick' },
    { label: 'Phase 1 retest (Jul 4)', href: '/log/by-date/2026-07-04', section: 'Quick' },
    { label: 'Phase 2 retest (Aug 1)', href: '/log/by-date/2026-08-01', section: 'Quick' },
    { label: 'Final test (Aug 26)', href: '/log/by-date/2026-08-26', section: 'Quick' },
    { label: 'Performance day (Aug 29)', href: '/log/by-date/2026-08-29', section: 'Quick' }
  ];

  const recentCommands = $derived<Command[]>(
    recentSessions.map((s) => ({
      label: s.title ?? s.type,
      href: `/log/by-date/${s.date}`,
      section: 'Recent' as const,
      hint: `${format(parseISO(s.date), 'EEE MMM d')}${s.completed ? ' · ✓' : ''}`
    }))
  );

  const allCommands = $derived<Command[]>([...staticCommands, ...recentCommands]);

  let query = $state('');
  let activeIndex = $state(0);
  let inputEl = $state<HTMLInputElement | null>(null);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter((c) =>
      c.label.toLowerCase().includes(q) || (c.hint?.toLowerCase().includes(q) ?? false)
    );
  });

  const grouped = $derived.by(() => {
    const order: Command['section'][] = ['Pages', 'Quick', 'Recent'];
    const out: Array<{ section: Command['section']; items: Command[] }> = [];
    for (const section of order) {
      const items = filtered.filter((c) => c.section === section);
      if (items.length) out.push({ section, items });
    }
    return out;
  });

  // Flat list of items in the order they appear, for keyboard nav
  const flat = $derived(filtered);

  function handleKeydown(e: KeyboardEvent) {
    // ⌘K / Ctrl+K — toggle
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      commandPalette.toggle();
      if (commandPalette.open) tick().then(() => inputEl?.focus());
      return;
    }
    if (!commandPalette.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      commandPalette.hide();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, flat.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item) {
        commandPalette.hide();
        goto(item.href);
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function pick(c: Command) {
    commandPalette.hide();
    goto(c.href);
  }

  // Reset query and active index when opened
  $effect(() => {
    if (commandPalette.open) {
      query = '';
      activeIndex = 0;
      tick().then(() => inputEl?.focus());
    }
  });

  // Build flat -> grouped index for highlighting
  function flatIndex(section: string, idxInSection: number): number {
    let idx = 0;
    for (const g of grouped) {
      if (g.section === section) return idx + idxInSection;
      idx += g.items.length;
    }
    return -1;
  }
</script>

{#if commandPalette.open}
  <div class="backdrop" onclick={() => commandPalette.hide()} role="presentation"></div>
  <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
    <div class="input-row">
      <span class="prompt">›</span>
      <input
        bind:this={inputEl}
        bind:value={query}
        type="text"
        placeholder="Type to filter pages, sessions, actions…"
        autocomplete="off"
        spellcheck="false"
      />
      <span class="hint-key">esc</span>
    </div>

    <div class="results">
      {#if flat.length === 0}
        <div class="empty">No matches.</div>
      {:else}
        {#each grouped as g (g.section)}
          <div class="section">
            <div class="section-label">{g.section}</div>
            {#each g.items as item, i (item.label + item.href)}
              {@const idx = flatIndex(g.section, i)}
              <button
                class="item"
                class:active={idx === activeIndex}
                onclick={() => pick(item)}
                onmouseenter={() => (activeIndex = idx)}
              >
                <span class="item-label">{item.label}</span>
                {#if item.hint}<span class="item-hint">{item.hint}</span>{/if}
              </button>
            {/each}
          </div>
        {/each}
      {/if}
    </div>

    <div class="footer">
      <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
      <span><kbd>↵</kbd> select</span>
      <span><kbd>esc</kbd> close</span>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: var(--z-overlay);
  }

  .palette {
    position: fixed;
    top: 18vh;
    left: 50%;
    transform: translateX(-50%);
    width: min(560px, calc(100vw - var(--space-7)));
    max-height: 70vh;
    z-index: var(--z-modal);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-3);
    box-shadow: var(--elevation-4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border-default);
  }

  .prompt {
    font: var(--weight-bold) 20px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }

  input {
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--color-fg-default);
    font: var(--text-body-lg-weight) var(--text-body-lg-size)/1 var(--font-sans);
    outline: none;
  }

  input::placeholder { color: var(--color-fg-subtle); }

  .hint-key {
    padding: 2px var(--space-2);
    font: var(--text-micro-weight) 10px/1 var(--font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-fg-muted);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
  }

  .results {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2) 0;
  }

  .section { padding: var(--space-2) 0; }

  .section-label {
    padding: 4px var(--space-5);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-subtle);
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) var(--space-5);
    background: transparent;
    border: 0;
    color: var(--color-fg-default);
    font: var(--text-body-weight) var(--text-body-size)/1.3 var(--font-sans);
    text-align: left;
    cursor: pointer;
  }

  .item.active {
    background: var(--color-bg-subtle);
  }

  .item-label { color: var(--color-fg-default); }
  .item-hint {
    color: var(--color-fg-muted);
    font: var(--weight-medium) 12px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .empty {
    padding: var(--space-5);
    color: var(--color-fg-muted);
    text-align: center;
  }

  .footer {
    display: flex;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-5);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    font: var(--text-micro-weight) 11px/1 var(--font-sans);
    color: var(--color-fg-muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  kbd {
    display: inline-block;
    margin-right: 4px;
    padding: 1px 5px;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    font: var(--weight-medium) 10px/1 var(--font-mono);
    color: var(--color-fg-default);
  }
</style>
