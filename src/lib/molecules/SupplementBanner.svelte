<script lang="ts">
  // Persistent reminder of the Baar tendon-collagen synthesis stack — shown on
  // Today every day. Timing matters: take 30–60 min before any finger load
  // (no-hangs, density hangs, asymmetry isos, climbing) so collagen building
  // blocks are circulating when the tendon is stimulated.
</script>

<aside class="supp" aria-label="Daily supplementation stack">
  <span class="supp-label">Stack</span>
  <div class="supp-body">
    <p class="supp-line">
      <strong>15 g hydrolysed collagen</strong> + <strong>500 mg vitamin C</strong>
      <span class="supp-timing">— 30–60 min before any finger loading</span>
    </p>
    <p class="supp-foot">
      Keith Baar tendon-collagen synthesis protocol. Applies to no-hangs, density hangs, asymmetry isos, and climbing.
    </p>
  </div>
</aside>

<style>
  .supp {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-left: 2px solid var(--color-fg-accent);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }

  .supp-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .supp-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .supp-line {
    font: var(--text-body-weight) var(--text-body-size)/1.3 var(--font-sans);
    color: var(--color-fg-default);
    margin: 0;
  }

  .supp-line strong {
    font-weight: var(--weight-semibold);
  }

  .supp-timing {
    color: var(--color-fg-muted);
    font-weight: var(--weight-medium);
  }

  .supp-foot {
    font: var(--text-body-sm-weight) 11px/1.4 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0;
  }
</style>
