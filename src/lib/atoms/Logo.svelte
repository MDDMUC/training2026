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
    aria-label="Training 2026"
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
      <!-- T (halftone) -->
      <text
        x="6"
        y="48"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="56"
        font-weight="400"
        fill={`url(#${dotsId})`}
        mask={`url(#${maskId})`}
      >T</text>
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
        <!-- Accent dot — single signal-orange punctuation -->
        <circle cx="40" cy="48" r="3" fill="var(--color-fg-accent, #E85D04)" />
      {/if}
    </g>
  </svg>
{:else}
  <svg
    viewBox="0 0 360 200"
    width={size}
    height={(size * 200) / 360}
    class="logo wordmark {klass}"
    role="img"
    aria-label="Training 2026"
  >
    <defs>
      <pattern id={dotsId} patternUnits="userSpaceOnUse" width="5" height="5">
        <circle cx="2.5" cy="2.5" r="1.35" fill="currentColor" />
      </pattern>
      <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="55%" stop-color="white" stop-opacity="0.95" />
        <stop offset="100%" stop-color="white" stop-opacity="0.4" />
      </linearGradient>
      <mask id={maskId}>
        <rect width="360" height="200" fill={`url(#${fadeId})`} />
      </mask>
    </defs>

    <!-- TRAINING (top, italic, halftone) -->
    <g transform="translate(180 70) skewX(-12) translate(-180 -70)">
      <text
        x="180"
        y="92"
        text-anchor="middle"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="78"
        letter-spacing="2"
        fill={`url(#${dotsId})`}
        mask={`url(#${maskId})`}
      >TRAINING</text>
    </g>

    <!-- horizontal rule between the two lines -->
    <line x1="40" y1="118" x2="320" y2="118" stroke="currentColor" stroke-width="2.5" />
    {#if accent}
      <circle cx="180" cy="118" r="4" fill="var(--color-fg-accent, #E85D04)" />
    {/if}

    <!-- 2026 (bottom, solid, wide-tracked) -->
    <g transform="translate(180 158) skewX(-12) translate(-180 -158)">
      <text
        x="180"
        y="172"
        text-anchor="middle"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="44"
        letter-spacing="16"
        fill="currentColor"
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
