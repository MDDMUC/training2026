<script lang="ts">
  /**
   * Pure-monochrome perspective grid receding to a horizon vanishing point.
   * Horizontal lines flow infinitely toward the viewer (TRON / Outrun / Far
   * Cry: Blood Dragon vibe). Decorative sun arc sits at the horizon.
   *
   * Implementation notes:
   *   - All animation is CSS keyframes (no SMIL) — robust on older iOS Safari.
   *   - Vertical lines fan out from the vanishing point and are static.
   *   - Horizontal lines repeat: animating translateY by exactly one tile
   *     height makes the loop seamless.
   *   - Respects prefers-reduced-motion: the grid stays, the motion stops.
   *   - Pointer-events disabled so this never steals taps.
   */

  type Props = {
    /** Foreground line color. Default white. */
    color?: string;
    /** Background fill. Default black. */
    bg?: string;
    /** Show the horizon sun arc. Default true. */
    sun?: boolean;
    /** Animation cycle duration in seconds. Default 4. */
    speed?: number;
  };

  let { color = '#fff', bg = '#000', sun = true, speed = 4 }: Props = $props();

  // Vertical lines: 13 lines fanning from the vanishing point at (500, 500)
  // down to the bottom edge (y=1000). Evenly spaced on the bottom edge.
  const verticalLines = Array.from({ length: 13 }, (_, i) => {
    const xBottom = (1000 / 12) * i;
    return { x1: 500, y1: 500, x2: xBottom, y2: 1000 };
  });

  // Horizontal lines at perspective-correct depths.
  // Eye height is at y=500 (horizon). Each line at perspective depth d.
  // y_screen = horizon + (focalLength * d / (d + cameraDist))
  // Use a simple geometric series so spacing widens as lines approach.
  const focalLength = 500;
  const horizontalLines = Array.from({ length: 12 }, (_, i) => {
    // depth grows so the line moves down the screen — use 1/x mapping
    const t = (i + 1) / 12;
    const y = 500 + 500 * (t * t); // quadratic ease — perspective-ish
    return { y };
  });

  // Reduced motion: still render the grid (decorative), just don't animate.
  const animationDuration = `${speed}s`;
</script>

<svg
  class="synthwave"
  viewBox="0 0 1000 1000"
  preserveAspectRatio="xMidYMid slice"
  role="presentation"
  aria-hidden="true"
  style="--anim-dur:{animationDuration}; --grid-color:{color}; --grid-bg:{bg};"
>
  <!-- Background -->
  <rect width="1000" height="1000" fill="var(--grid-bg)" />

  <!-- Subtle vignette so the edges feel deeper -->
  <defs>
    <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="var(--grid-bg)" stop-opacity="0" />
      <stop offset="100%" stop-color="var(--grid-bg)" stop-opacity="0.85" />
    </radialGradient>
    <!-- Mask to clip the moving grid to the lower half (below horizon) -->
    <clipPath id="floor-clip">
      <rect x="0" y="500" width="1000" height="500" />
    </clipPath>
  </defs>

  <!-- ── Sun arc (horizon) ────────────────────────────────────────────── -->
  {#if sun}
    <g class="sun" stroke="var(--grid-color)" fill="none" stroke-width="2.5">
      <!-- Upper half of a circle sitting on the horizon -->
      <path d="M 380 500 A 120 120 0 0 1 620 500" />
      <!-- Horizontal slits cutting through the sun (synthwave classic) -->
      <line x1="390" y1="455" x2="610" y2="455" stroke-width="1.5" />
      <line x1="395" y1="425" x2="605" y2="425" stroke-width="1.5" />
      <line x1="408" y1="400" x2="592" y2="400" stroke-width="1.5" />
      <line x1="425" y1="380" x2="575" y2="380" stroke-width="1.5" />
    </g>
  {/if}

  <!-- ── The grid floor ──────────────────────────────────────────────── -->
  <g clip-path="url(#floor-clip)">
    <!-- Static vertical lines (fanning from vanishing point) -->
    <g stroke="var(--grid-color)" stroke-width="1.5" fill="none" opacity="0.95">
      {#each verticalLines as v (v.x2)}
        <line x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2} />
      {/each}
    </g>

    <!-- Horizontal lines — animated. Duplicated so the seam is invisible
         as the first set scrolls off the bottom while the second set
         covers the same space. -->
    <g class="hlines" stroke="var(--grid-color)" stroke-width="1.5" fill="none">
      {#each horizontalLines as h, i (i)}
        <line x1="0" y1={h.y} x2="1000" y2={h.y} opacity={0.4 + 0.6 * (i / 11)} />
      {/each}
    </g>
    <g class="hlines hlines-offset" stroke="var(--grid-color)" stroke-width="1.5" fill="none">
      {#each horizontalLines as h, i (i)}
        <line x1="0" y1={h.y - 500} x2="1000" y2={h.y - 500} opacity={0.4 + 0.6 * (i / 11)} />
      {/each}
    </g>

    <!-- Horizon line itself, brighter -->
    <line x1="0" y1="500" x2="1000" y2="500" stroke="var(--grid-color)" stroke-width="2.5" />
  </g>

  <!-- Vignette overlay -->
  <rect width="1000" height="1000" fill="url(#vignette)" />

  <!-- Scanlines: subtle horizontal stripe overlay using a tiled pattern.
       Adds the CRT/VHS texture that sells the era. -->
  <defs>
    <pattern id="scanlines" patternUnits="userSpaceOnUse" width="1" height="3">
      <rect width="1" height="3" fill="var(--grid-bg)" opacity="0" />
      <rect width="1" height="1" fill="var(--grid-color)" opacity="0.06" />
    </pattern>
  </defs>
  <rect width="1000" height="1000" fill="url(#scanlines)" />
</svg>

<style>
  .synthwave {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  /* The grid floor flows toward the viewer. We translate two copies of the
     horizontal-line group so that as one finishes its travel, the offset
     copy has filled in seamlessly behind it. */
  .hlines {
    animation: hflow var(--anim-dur) linear infinite;
    will-change: transform;
  }
  .hlines-offset {
    animation: hflow var(--anim-dur) linear infinite;
    animation-delay: calc(var(--anim-dur) / -2);
    will-change: transform;
  }
  @keyframes hflow {
    from { transform: translateY(0); }
    to   { transform: translateY(500px); }
  }

  /* Subtle sun pulse — a single breathing motion, slow, hypnotic. */
  .sun {
    transform-origin: 500px 500px;
    animation: pulse 6s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.9; }
    50%      { opacity: 1; }
  }

  /* Hard accessibility commitment: if the user opts out of motion, halt all
     animation but keep the scenery in place. */
  @media (prefers-reduced-motion: reduce) {
    .hlines, .hlines-offset, .sun { animation: none; }
  }
</style>
