<script lang="ts">
  /**
   * Training 2026 wordmark/mark.
   *
   * Two variants:
   *   - mark     compact "T·26" monogram — used in nav, favicon
   *   - wordmark stacked "TRAINING / 2026" — used on /login hero
   *
   * The fill is a halftone dot pattern (Ben-Day vibe), with an optional
   * top-to-bottom alpha gradient mask to give the dots a fade. The text is
   * italic-skewed to lean into the 90s action-title aesthetic. The signal-
   * orange accent appears as a single dot — used sparingly, once per surface.
   */
  type Variant = 'mark' | 'wordmark';

  type Props = {
    variant?: Variant;
    /** Width in px. Height scales from viewBox aspect ratio. */
    size?: number;
    /** Show the signal-orange accent dot. Default true. */
    accent?: boolean;
    /** Class hook for parent styling. */
    class?: string;
  };

  let { variant = 'mark', size = 96, accent = true, class: klass = '' }: Props = $props();

  // Stable id per instance so SVG <defs> don't collide when multiple logos
  // render on the same page (e.g. nav mark + login wordmark).
  const uid = $props.id();
  const dotsId = `tx-dots-${uid}`;
  const fadeId = `tx-fade-${uid}`;
  const maskId = `tx-mask-${uid}`;
</script>

{#if variant === 'mark'}
  <svg
    viewBox="0 0 120 64"
    width={size}
    height={(size * 64) / 120}
    class="logo {klass}"
    role="img"
    aria-label="Biceps 2026"
  >
    <defs>
      <pattern id={dotsId} patternUnits="userSpaceOnUse" width="4" height="4">
        <circle cx="2" cy="2" r="1.05" fill="currentColor" />
      </pattern>
      <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="55%" stop-color="white" stop-opacity="0.92" />
        <stop offset="100%" stop-color="white" stop-opacity="0.35" />
      </linearGradient>
      <mask id={maskId}>
        <rect width="120" height="64" fill={`url(#${fadeId})`} />
      </mask>
    </defs>

    <!-- italic skew on a centered pivot -->
    <g transform="translate(60 32) skewX(-12) translate(-60 -32)">
      <!-- B (halftone) -->
      <text
        x="6"
        y="48"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="56"
        font-weight="400"
        fill={`url(#${dotsId})`}
        mask={`url(#${maskId})`}
      >B</text>
      <!-- 26 (solid) -->
      <text
        x="44"
        y="48"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="56"
        font-weight="400"
        fill="currentColor"
      >26</text>
      <!-- Underline rule (the action-title flourish) -->
      <line x1="6" y1="56" x2="114" y2="56" stroke="currentColor" stroke-width="2.5" />
      {#if accent}
        <!-- Accent dot — single magenta punctuation -->
        <circle cx="40" cy="48" r="3" fill="var(--color-fg-accent, #FF00FF)" />
      {/if}
    </g>
  </svg>
{:else}
  <!-- Wordmark — same italic-uppercase Russo One treatment used by the
       in-app page titles (TopBar h1: "Today"). font-style:italic +
       skewX(-6deg) compound for the action-title lean; magenta fill
       and the stacked bloom glow (in /login CSS) preserve the prior
       Stranger Things treatment. Falls back to currentColor when
       accent is disabled. -->
  <svg
    viewBox="0 0 540 230"
    width={size}
    height={(size * 230) / 540}
    class="logo wordmark {klass}"
    role="img"
    aria-label="Biceps 2026"
  >
    <!-- ─── BICEPS — italic uppercase Russo One, magenta -->
    <g transform="translate(270 140) skewX(-6) translate(-270 -140)">
      <text
        x="270"
        y="140"
        text-anchor="middle"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="118"
        font-weight="400"
        font-style="italic"
        letter-spacing="2"
        fill={accent ? 'var(--color-fg-accent, #FF00FF)' : 'currentColor'}
      >BICEPS</text>
    </g>

    <!-- ─── 2026 — same family, smaller, tracked-out, white -->
    <g transform="translate(270 200) skewX(-6) translate(-270 -200)">
      <text
        x="270"
        y="200"
        text-anchor="middle"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="32"
        font-weight="400"
        font-style="italic"
        letter-spacing="14"
        fill="currentColor"
        opacity="0.92"
      >2026</text>
    </g>
  </svg>
{/if}

<style>
  .logo {
    display: block;
    height: auto;
    color: var(--logo-color, currentColor);
  }

</style>
