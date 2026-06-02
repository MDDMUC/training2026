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

  // Sparkle field — many shimmers scattered across the wordmark area.
  // Each has its own size, color, animation delay, and cycle length so
  // the eye reads them as a random twinkle rather than a synced strobe.
  // r = radius in viewBox units; the 4-point star inscribes a square of
  // side 2r with thin tapering arms via a 0.16r inner-corner radius.
  type Sp = { x: number; y: number; r: number; color: 'fg' | 'accent'; delay: number; dur: number; lens: boolean };
  const sparkles: Sp[] = [
    { x: 110, y: 32,  r: 8,   color: 'fg',     delay: 0.0, dur: 2.4, lens: true  },
    { x: 60,  y: 92,  r: 5,   color: 'fg',     delay: 1.3, dur: 2.7, lens: false },
    { x: 200, y: 18,  r: 4,   color: 'fg',     delay: 0.7, dur: 2.2, lens: false },
    { x: 280, y: 38,  r: 6.5, color: 'accent', delay: 1.7, dur: 2.6, lens: false },
    { x: 360, y: 14,  r: 5,   color: 'fg',     delay: 0.4, dur: 2.9, lens: false },
    { x: 450, y: 28,  r: 9,   color: 'fg',     delay: 2.1, dur: 2.5, lens: true  },
    { x: 505, y: 70,  r: 5.5, color: 'fg',     delay: 1.0, dur: 2.8, lens: false },
    { x: 25,  y: 130, r: 4.5, color: 'fg',     delay: 0.9, dur: 2.3, lens: false },
    { x: 175, y: 145, r: 5,   color: 'accent', delay: 2.4, dur: 2.6, lens: false },
    { x: 320, y: 170, r: 4,   color: 'fg',     delay: 1.5, dur: 2.4, lens: false },
    { x: 415, y: 155, r: 6.5, color: 'fg',     delay: 0.2, dur: 2.7, lens: false },
    { x: 490, y: 140, r: 5,   color: 'fg',     delay: 1.9, dur: 2.5, lens: false },
    { x: 75,  y: 50,  r: 3.5, color: 'fg',     delay: 2.7, dur: 2.3, lens: false },
    { x: 245, y: 60,  r: 3,   color: 'fg',     delay: 0.6, dur: 2.8, lens: false },
    { x: 390, y: 90,  r: 3.5, color: 'accent', delay: 1.2, dur: 2.6, lens: false }
  ];
  function starPath(r: number): string {
    const i = r * 0.18;
    return `M 0 ${-r} L ${i} ${-i} L ${r} 0 L ${i} ${i} L 0 ${r} L ${-i} ${i} L ${-r} 0 L ${-i} ${-i} Z`;
  }
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

    <!-- ─── 80s sparkle field over BICEPS.
         15 four-point shimmers scattered across the wordmark area, mixed
         sizes (3–9 px), mixed timing (delays + durations both varied so
         the cycle phases drift apart over time — reads as truly random
         after a few seconds), mixed colors (mostly white, four magenta
         to tie the brand color into the field). Two largest get a tiny
         central lens-flare dot.

         Critical: each sparkle is wrapped in TWO groups. The OUTER <g>
         holds the SVG transform attribute (position). The INNER <g>
         carries the CSS animation. This separation is required because
         CSS `transform` overrides SVG `transform` attributes (it doesn't
         compose with them) — without the wrapper, the position would
         vanish the moment the keyframe scale applied. -->
    {#each sparkles as s, i (i)}
      <g transform="translate({s.x} {s.y})">
        <g
          class="sparkle"
          style="animation-delay:{s.delay}s; animation-duration:{s.dur}s;"
        >
          <path
            d={starPath(s.r)}
            fill={s.color === 'accent' ? 'var(--color-fg-accent, #FF00FF)' : 'currentColor'}
          />
          {#if s.lens}
            <circle
              cx="0"
              cy="0"
              r={s.r * 0.18}
              fill={s.color === 'accent' ? 'var(--color-fg-accent, #FF00FF)' : 'currentColor'}
            />
          {/if}
        </g>
      </g>
    {/each}
  </svg>
{/if}

<style>
  .logo {
    display: block;
    height: auto;
    color: var(--logo-color, currentColor);
  }

  /* Sparkle twinkles — each shimmer fades from invisible to full opacity
     on its own offset clock. Five staggered delays read as five
     independent sparkles rather than a synchronized strobe. */
  .sparkle {
    transform-origin: center;
    transform-box: fill-box;
    animation: twinkle 2.4s ease-in-out infinite;
  }
  .s1 { animation-delay: 0s;    }
  .s2 { animation-delay: 0.5s;  }
  .s3 { animation-delay: 1.0s;  }
  .s4 { animation-delay: 1.5s;  }
  .s5 { animation-delay: 2.0s;  }

  @keyframes twinkle {
    0%, 100% { opacity: 0; transform: scale(0.4); }
    10%      { opacity: 1; transform: scale(1.05); }
    30%      { opacity: 0; transform: scale(0.6); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sparkle { animation: none; opacity: 0.65; transform: scale(1); }
  }
</style>
