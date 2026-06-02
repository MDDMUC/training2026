<script lang="ts">
  /**
   * Synthwave horizon scene.
   *
   * The floor is a real CSS-perspective plane (rotateX 60° + perspective),
   * not a fake fan-from-vanishing-point. That gives mathematically correct
   * convergence to the horizon, automatic perspective compression of the
   * horizontal lines, and a seamless flow animation when we translate the
   * grid texture by exactly one cell.
   *
   * Sun is an SVG circle with horizontal slit chords in its lower half
   * (1980s Outrun "sun setting through pixels" motif). Mountains are
   * optional triangular wireframe peaks flanking the sun.
   *
   * Reduced motion honoured: scenery stays, motion stops.
   */
  type Props = {
    color?: string;
    bg?: string;
    sun?: boolean;
    mountains?: boolean;
    /** Seconds per full flow cycle. Larger = slower drift. Default 20. */
    speed?: number;
  };
  let {
    color = '#ffffff',
    bg = '#000000',
    sun = true,
    mountains = true,
    speed = 11
  }: Props = $props();

  // Starfield: deterministic pseudo-random dots placed once at module level
  // so they don't reshuffle on every render. Uses a small LCG.
  const stars = (() => {
    let seed = 1379;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: 70 }, () => ({
      cx: rand() * 100,
      cy: rand() * 46, // upper portion only (above horizon area)
      r: 0.15 + rand() * 0.55,
      o: 0.3 + rand() * 0.6
    }));
  })();

  // Sun geometry — slits in the lower half, clipped to the circle's chord.
  const sunR = 100;
  const sunCx = 100;
  const sunCy = 100;
  // Y positions of horizontal slits — denser near bottom, sparser higher up.
  const slitYs = [108, 122, 138, 156, 174, 188];
  function chordX(y: number): { x1: number; x2: number } {
    const dy = y - sunCy;
    const half = Math.sqrt(Math.max(0, sunR * sunR - dy * dy));
    return { x1: sunCx - half + 2, x2: sunCx + half - 2 };
  }
</script>

<div
  class="scene"
  style="--c-line:{color}; --c-bg:{bg}; --speed:{speed}s;"
  role="presentation"
  aria-hidden="true"
>
  <!-- Sky gradient + atmosphere -->
  <div class="sky"></div>

  <!-- Starfield above the horizon — sells the depth/space feel -->
  <svg
    class="stars"
    viewBox="0 0 100 50"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {#each stars as s, i (i)}
      <circle
        cx={s.cx}
        cy={s.cy}
        r={s.r}
        fill="var(--c-line)"
        opacity={s.o}
      />
    {/each}
  </svg>

  <!-- Mountains (back layer) -->
  {#if mountains}
    <svg
      class="mountains"
      viewBox="0 0 200 40"
      preserveAspectRatio="xMidYMax slice"
    >
      <!-- Two staggered mountain ranges for parallax depth -->
      <path
        d="M 0 40 L 18 14 L 30 26 L 44 6 L 60 22 L 75 12 L 88 24 L 100 8 L 115 22 L 130 14 L 145 24 L 160 10 L 175 22 L 200 16 L 200 40 Z"
        fill="none"
        stroke="var(--c-line)"
        stroke-width="0.45"
        opacity="0.55"
      />
      <path
        d="M 0 40 L 10 28 L 25 34 L 38 22 L 55 32 L 72 26 L 88 34 L 105 24 L 122 32 L 140 28 L 158 34 L 175 26 L 200 32 L 200 40 Z"
        fill="none"
        stroke="var(--c-line)"
        stroke-width="0.5"
        opacity="0.85"
      />
    </svg>
  {/if}

  <!-- Sun -->
  {#if sun}
    <svg class="sun" viewBox="0 0 200 200" aria-hidden="true">
      <!-- Sun disc outline -->
      <circle
        cx={sunCx}
        cy={sunCy}
        r={sunR - 1}
        fill="none"
        stroke="var(--c-line)"
        stroke-width="2"
      />
      <!-- Horizontal slits (chords) — lower half only -->
      <g stroke="var(--c-line)" stroke-width="2.5" stroke-linecap="square">
        {#each slitYs as y (y)}
          {@const c = chordX(y)}
          <line x1={c.x1} y1={y} x2={c.x2} y2={y} />
        {/each}
      </g>
    </svg>
  {/if}

  <!-- Bright horizon line -->
  <div class="horizon"></div>

  <!-- The perspective floor -->
  <div class="floor">
    <div class="grid"></div>
    <!-- Soft fade at the far edge so the lines dissolve into the horizon
         instead of terminating with a hard line. -->
    <div class="floor-fade"></div>
  </div>
</div>

<style>
  .scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--c-bg);
    pointer-events: none;
    isolation: isolate;
  }

  /* Sky gradient — pure black at top fading slightly lighter near horizon
     for a sense of atmospheric haze. Stays monochromatic. */
  .sky {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 50%;
    background: radial-gradient(
      ellipse 80% 100% at 50% 100%,
      color-mix(in oklab, var(--c-line) 6%, var(--c-bg)) 0%,
      var(--c-bg) 70%
    );
  }

  /* Starfield — fills the sky above the horizon */
  .stars {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    width: 100%;
    pointer-events: none;
    opacity: 0.85;
    animation: twinkle 4s ease-in-out infinite;
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.7; }
    50%      { opacity: 0.95; }
  }

  /* Mountains sit just above the horizon line, between sky and horizon. */
  .mountains {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 50%;
    height: clamp(60px, 14vh, 140px);
    width: 100%;
    z-index: 1;
  }

  /* Sun — centered horizontally on the horizon, bottom edge sitting close
     to it so the disc reads as rising from / setting into the horizon. */
  .sun {
    position: absolute;
    left: 50%;
    bottom: calc(50% - 8px); /* let the slits hang slightly past the horizon */
    width: clamp(180px, 28vw, 320px);
    height: clamp(180px, 28vw, 320px);
    transform: translateX(-50%);
    z-index: 2;
    filter: drop-shadow(0 0 24px color-mix(in oklab, var(--c-line) 18%, transparent));
  }

  /* The bright horizon line itself sits on top of mountains + sun base. */
  .horizon {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    background: var(--c-line);
    box-shadow: 0 0 18px color-mix(in oklab, var(--c-line) 40%, transparent);
    z-index: 3;
    transform: translateY(-1px);
  }

  /* The perspective floor — a 3D-rotated plane occupying the bottom half. */
  .floor {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    bottom: 0;
    overflow: hidden;
    perspective: 320px;
    perspective-origin: 50% 0%;
    z-index: 2;
  }

  /* The grid plane — rotated back so its far edge lies at the horizon and
     its near edge sits at the bottom of the viewport. Each lattice line
     is rendered as TWO layers: a fat semi-transparent halo + a sharp
     bright core. That's the neon-grid signature — the line is the *thing*,
     not a thin stroke through a void. */
  .grid {
    position: absolute;
    left: -50%;
    right: -50%;
    top: 0;
    bottom: -200%;
    background-image:
      /* Halo (vertical lines) */
      linear-gradient(to right,
        color-mix(in oklab, var(--c-line) 28%, transparent) 0 4px,
        transparent 4px),
      /* Halo (horizontal lines) */
      linear-gradient(to bottom,
        color-mix(in oklab, var(--c-line) 28%, transparent) 0 4px,
        transparent 4px),
      /* Core (vertical lines) */
      linear-gradient(to right, var(--c-line) 0 1.5px, transparent 1.5px),
      /* Core (horizontal lines) */
      linear-gradient(to bottom, var(--c-line) 0 1.5px, transparent 1.5px);
    background-size: 64px 64px;
    transform-origin: 50% 0%;
    transform: rotateX(64deg);
    animation: scroll var(--speed) linear infinite;
    will-change: background-position;
  }

  @keyframes scroll {
    from { background-position: 0 0, 0 0, 0 0, 0 0; }
    to   { background-position: 0 64px, 0 64px, 0 64px, 0 64px; }
  }

  /* Fade the lines as they approach the horizon — prevents a hard top edge
     and sells the atmospheric depth. */
  .floor-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      var(--c-bg) 0%,
      transparent 22%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .grid, .stars { animation: none; }
  }
</style>
