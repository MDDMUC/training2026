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
        <!-- Accent dot — single magenta punctuation -->
        <circle cx="40" cy="48" r="3" fill="var(--color-fg-accent, #FF00FF)" />
      {/if}
    </g>
  </svg>
{:else}
  <!-- 80s action-title wordmark — three stacked text layers per word:
         1) MAGENTA solid drop shadow, offset (+10, +10) — the deep back layer
         2) WHITE outline-only echo,   offset (+5,  +5)  — intermediate ghost
         3) HALFTONE-DOT face,         offset (0,   0)   — the hero front

       This is the visual move every 80s action poster makes: a contrasting
       colored drop shadow + a hard-offset white outline + the actual word in
       a textured fill. Magenta is the brand's single chromatic role; it sells
       the "TOP GUN / COBRA / LETHAL WEAPON" feeling without any extra colors.

       viewBox is 540×240 to accommodate the bottom-right shadow overhang. -->
  <svg
    viewBox="0 0 540 240"
    width={size}
    height={(size * 240) / 540}
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
        <stop offset="60%" stop-color="white" stop-opacity="0.95" />
        <stop offset="100%" stop-color="white" stop-opacity="0.4" />
      </linearGradient>
      <mask id={maskId}>
        <rect width="540" height="240" fill={`url(#${fadeId})`} />
      </mask>
    </defs>

    <!-- ─── TRAINING ─── -->
    <g transform="translate(270 90) skewX(-12) translate(-270 -90)">
      <!-- Layer 1: magenta back shadow -->
      {#if accent}
        <text
          x="280"
          y="120"
          text-anchor="middle"
          font-family="Russo One, Arial Black, sans-serif"
          font-size="86"
          letter-spacing="2"
          fill="var(--color-fg-accent, #FF00FF)"
        >TRAINING</text>
      {/if}
      <!-- Layer 2: white outline ghost -->
      <text
        x="275"
        y="115"
        text-anchor="middle"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="86"
        letter-spacing="2"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        opacity="0.55"
      >TRAINING</text>
      <!-- Layer 3: halftone hero face -->
      <text
        x="270"
        y="110"
        text-anchor="middle"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="86"
        letter-spacing="2"
        fill={`url(#${dotsId})`}
        mask={`url(#${maskId})`}
      >TRAINING</text>
    </g>

    <!-- ─── 2026 — two layers (magenta shadow + solid front) ─── -->
    <g transform="translate(270 200) skewX(-12) translate(-270 -200)">
      {#if accent}
        <text
          x="276"
          y="210"
          text-anchor="middle"
          font-family="Russo One, Arial Black, sans-serif"
          font-size="46"
          letter-spacing="16"
          fill="var(--color-fg-accent, #FF00FF)"
        >2026</text>
      {/if}
      <text
        x="270"
        y="205"
        text-anchor="middle"
        font-family="Russo One, Arial Black, sans-serif"
        font-size="46"
        letter-spacing="16"
        fill="currentColor"
      >2026</text>
    </g>

    <!-- ─── Sparkle stars — 4 twinkling shimmers placed at the wordmark's
         compositional anchor points. Asynchronous delays so they read as
         organic, not synced. Path is centered on origin per sparkle, then
         translated into position. ─── -->
    <g class="sparkle s1" transform="translate(465 48)">
      <path d="M 0 -10 L 1.6 -1.6 L 10 0 L 1.6 1.6 L 0 10 L -1.6 1.6 L -10 0 L -1.6 -1.6 Z" fill="currentColor"/>
    </g>
    <g class="sparkle s2" transform="translate(82 56)">
      <path d="M 0 -7 L 1.2 -1.2 L 7 0 L 1.2 1.2 L 0 7 L -1.2 1.2 L -7 0 L -1.2 -1.2 Z" fill="currentColor"/>
    </g>
    <g class="sparkle s3" transform="translate(435 188)">
      <path d="M 0 -5.5 L 1 -1 L 5.5 0 L 1 1 L 0 5.5 L -1 1 L -5.5 0 L -1 -1 Z" fill="currentColor"/>
    </g>
    <g class="sparkle s4" transform="translate(105 142)">
      <path d="M 0 -8 L 1.4 -1.4 L 8 0 L 1.4 1.4 L 0 8 L -1.4 1.4 L -8 0 L -1.4 -1.4 Z" fill="var(--color-fg-accent, #FF00FF)"/>
    </g>
  </svg>
{/if}

<style>
  .logo {
    display: block;
    height: auto;
    color: var(--logo-color, currentColor);
  }

  /* Sparkle twinkles — each star fades from invisible to full opacity on
     its own offset clock so the four reads as four independent shimmers
     rather than a synchronized strobe. */
  .sparkle {
    transform-origin: center;
    transform-box: fill-box;
    animation: twinkle 2.6s ease-in-out infinite;
  }
  .s1 { animation-delay: 0s;    }
  .s2 { animation-delay: 0.7s;  }
  .s3 { animation-delay: 1.3s;  }
  .s4 { animation-delay: 1.9s;  }

  @keyframes twinkle {
    0%, 100% { opacity: 0; }
    8%       { opacity: 1; }
    28%      { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sparkle { animation: none; opacity: 0.55; }
  }
</style>
