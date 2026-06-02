<script lang="ts">
  import { page } from '$app/state';

  type NavItem = { href: string; label: string };

  const items: NavItem[] = [
    { href: '/', label: 'Today' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/log', label: 'Log' },
    { href: '/exercise', label: 'Exercises' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/settings', label: 'Settings' }
  ];

  function isActive(href: string): boolean {
    if (href === '/') return page.url.pathname === '/';
    return page.url.pathname.startsWith(href);
  }
</script>

<aside class="app-nav" aria-label="Primary navigation">
  <a href="/" class="brand" aria-label="Training 2026 — home">
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="20" height="20">
        <rect x="6"  y="17" width="4" height="10" rx="0.5" fill="currentColor"/>
        <rect x="14" y="11" width="4" height="16" rx="0.5" fill="currentColor"/>
        <rect x="22" y="5"  width="4" height="22" rx="0.5" fill="currentColor"/>
      </svg>
    </span>
    <span class="brand-name">Training 2026</span>
  </a>

  <nav>
    <ul>
      {#each items as item (item.href)}
        <li>
          <a
            href={item.href}
            class:active={isActive(item.href)}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            {item.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="footer-meta">
    <span>v0.1</span>
    <span>·</span>
    <span>local</span>
  </div>
</aside>

<style>
  .app-nav {
    grid-area: nav;
    display: flex;
    flex-direction: column;
    gap: var(--space-7);
    width: 220px;
    padding: var(--space-5) var(--space-4);
    border-right: 1px solid var(--color-border-default);
    background: var(--color-bg-surface);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    color: var(--color-fg-default);
    border-radius: var(--radius-1);
    padding: 2px 4px;
    margin: -2px -4px;
    transition: background var(--motion-default) var(--ease-standard);
  }

  .brand:hover {
    background: var(--color-bg-subtle);
    text-decoration: none;
  }

  .brand:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .brand-mark {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-inverse);
    color: var(--color-fg-inverse);
    border-radius: var(--radius-1);
    flex-shrink: 0;
  }

  .brand-name {
    font: var(--weight-semibold) 15px/1 var(--font-sans);
    letter-spacing: -0.01em;
  }

  nav ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  nav a {
    display: block;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-2);
    color: var(--color-fg-muted);
    text-decoration: none;
    font: var(--weight-medium) var(--text-body-sm-size)/1 var(--font-sans);
    transition:
      background var(--motion-default) var(--ease-standard),
      color var(--motion-default) var(--ease-standard);
  }

  nav a:hover {
    color: var(--color-fg-default);
    background: var(--color-bg-subtle);
    text-decoration: none;
  }

  nav a.active {
    color: var(--color-fg-default);
    background: var(--color-bg-subtle);
    font-weight: var(--weight-semibold);
  }

  nav a.active::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    background: var(--color-bg-accent);
    margin-right: var(--space-2);
    vertical-align: middle;
    border-radius: 1px;
  }

  .footer-meta {
    margin-top: auto;
    display: flex;
    gap: var(--space-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-subtle);
  }

  /* Mobile: horizontal bar at the top */
  @media (max-width: 768px) {
    .app-nav {
      width: 100%;
      flex-direction: row;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-4);
      border-right: 0;
      border-bottom: 1px solid var(--color-border-default);
    }

    .brand-name { display: none; }

    nav { flex: 1; overflow-x: auto; }
    nav ul {
      flex-direction: row;
      gap: var(--space-1);
    }

    nav a {
      padding: var(--space-2) var(--space-3);
      white-space: nowrap;
    }

    nav a.active::before {
      width: 4px;
      height: 4px;
    }

    .footer-meta { display: none; }
  }
</style>
