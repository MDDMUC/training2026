<script lang="ts">
  import '../app.css';
  import AppNav from '$lib/organisms/AppNav.svelte';
  import TopBar from '$lib/organisms/TopBar.svelte';
  import RestTimer from '$lib/organisms/RestTimer.svelte';
  import CommandPalette from '$lib/organisms/CommandPalette.svelte';
  import HelpOverlay from '$lib/organisms/HelpOverlay.svelte';
  import { page, navigating } from '$app/state';

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

  // Shell visibility is driven by the URL, not by the layout data. SvelteKit's
  // client-side navigation can briefly hand us a stale layout-data snapshot
  // during a transition (the new page's data lands, but the layout data hasn't
  // re-resolved yet); we'd render the no-shell branch in that gap and the
  // sidebar + topbar would disappear. Auth is enforced in hooks.server.ts —
  // if a user reaches any path besides /login they ARE logged in, full stop.
  const isLoginPath = $derived(page.url.pathname.startsWith('/login'));
  const showShell = $derived(!isLoginPath);
  // Use whatever user info is currently available, falling back to a minimal
  // placeholder if a transition stripped it. The TopBar's sign-out form still
  // works either way since the server reads the cookie, not the prop.
  const shellUser = $derived(
    data.user ?? { id: '', email: '', display_name: '' }
  );
</script>

{#if navigating.to}
  <div class="nav-progress" aria-hidden="true"></div>
{/if}

{#if showShell}
  <div class="app-shell">
    <AppNav />
    <TopBar title={titles.title} subtitle={titles.subtitle} user={shellUser} />
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
  /* Top-of-page navigation progress bar. Fires immediately when the user
     taps a link so they get instant confirmation that the click registered,
     even when the server-side load takes time. The bar's animation is
     intentionally a slow-then-fast curve so it stays visible the entire
     time a load takes (typical 200-1200ms range). */
  .nav-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--color-fg-accent) 50%,
      transparent
    );
    background-size: 50% 100%;
    background-repeat: no-repeat;
    z-index: 9999;
    pointer-events: none;
    animation: nav-progress 1s linear infinite;
    box-shadow: 0 0 8px color-mix(in oklab, var(--color-fg-accent) 60%, transparent);
  }
  @keyframes nav-progress {
    0%   { background-position: -100% 0; }
    100% { background-position:  200% 0; }
  }

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
