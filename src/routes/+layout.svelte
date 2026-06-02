<script lang="ts">
  import '../app.css';
  import AppNav from '$lib/organisms/AppNav.svelte';
  import TopBar from '$lib/organisms/TopBar.svelte';
  import RestTimer from '$lib/organisms/RestTimer.svelte';
  import CommandPalette from '$lib/organisms/CommandPalette.svelte';
  import HelpOverlay from '$lib/organisms/HelpOverlay.svelte';
  import { page } from '$app/state';

  type Props = {
    children: import('svelte').Snippet;
    data: {
      recentSessions?: Array<{ id: number; date: string; title: string | null; type: string; completed: number }>;
      user?: { id: string; email: string; display_name: string } | null;
    };
  };
  let { children, data }: Props = $props();

  const titles = $derived.by(() => {
    const path = page.url.pathname;
    if (path === '/') return { title: 'Today', subtitle: 'Current session' };
    if (path.startsWith('/calendar/phase')) return { title: 'Calendar', subtitle: 'Phase view' };
    if (path.startsWith('/calendar/week')) return { title: 'Calendar', subtitle: 'Week view' };
    if (path.startsWith('/calendar')) return { title: 'Calendar', subtitle: '12-week plan' };
    if (path.startsWith('/log')) return { title: 'Log', subtitle: 'Session entries' };
    if (path === '/exercise') return { title: 'Exercises', subtitle: 'Library index' };
    if (path.startsWith('/exercise/')) return { title: 'Exercise', subtitle: 'History and trends' };
    if (path.startsWith('/pr')) return { title: 'Records', subtitle: 'Lifetime peaks' };
    if (path.startsWith('/analysis')) return { title: 'Analysis', subtitle: 'Progress and trends' };
    if (path.startsWith('/settings')) return { title: 'Settings', subtitle: 'Backup, export, about' };
    return { title: 'Biceps 2026', subtitle: undefined };
  });
</script>

{#if data.user}
  <div class="app-shell">
    <AppNav />
    <TopBar title={titles.title} subtitle={titles.subtitle} user={data.user} />
    <main>
      {@render children()}
    </main>
  </div>

  <RestTimer />
  <CommandPalette recentSessions={data.recentSessions ?? []} />
  <HelpOverlay />
{:else}
  {@render children()}
{/if}

<style>
  .app-shell {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'nav topbar'
      'nav main';
    min-height: 100vh;
  }

  main {
    grid-area: main;
    padding: var(--space-6);
    overflow: auto;
    /* Allow grid children to shrink below their content's intrinsic size —
       essential for keeping wide content (charts, tables) from forcing
       horizontal overflow on the whole document. */
    min-width: 0;
  }

  /* Mobile: stack nav above content as a horizontal bar */
  @media (max-width: 768px) {
    .app-shell {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto auto 1fr;
      grid-template-areas:
        'nav'
        'topbar'
        'main';
    }
    main {
      padding: var(--space-4);
    }
  }

  /* Phone: tighten padding so the 320–375 px iPhones don't waste 32 px
     of horizontal real estate on margins. */
  @media (max-width: 480px) {
    main {
      padding: var(--space-3);
    }
  }
</style>
