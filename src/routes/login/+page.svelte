<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import type { ActionData, PageData } from './$types';
  import Logo from '$lib/atoms/Logo.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let pending = $state(false);
  let bgVideo = $state<HTMLVideoElement | null>(null);

  // Pick one source in JS — <source media> is unreliable on <video>, and
  // CSS filter:brightness on a looping video forces per-frame recomposite
  // (the usual cause of login-bg stutter). Darkening is a static veil instead.
  onMount(() => {
    const el = bgVideo;
    if (!el) return;

    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const src = mobile ? '/bg-mobile.mp4' : '/bg-desktop.mp4';
    if (el.dataset.src !== src) {
      el.dataset.src = src;
      el.src = src;
      el.load();
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const tryPlay = () => {
      if (reduce.matches) {
        el.pause();
        return;
      }
      el.muted = true;
      void el.play().catch(() => {
        /* Autoplay can fail until a gesture; muted+playsinline usually works. */
      });
    };

    const onVis = () => {
      if (document.hidden) el.pause();
      else tryPlay();
    };

    tryPlay();
    el.addEventListener('canplay', tryPlay, { once: true });
    document.addEventListener('visibilitychange', onVis);
    reduce.addEventListener('change', tryPlay);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      reduce.removeEventListener('change', tryPlay);
      el.pause();
    };
  });
</script>

<svelte:head><title>Sign in · Biceps 2026</title></svelte:head>

<div class="stage">
  <!-- Full-bleed looping background. Src set in onMount (mobile vs desktop).
       Muted + playsinline required for iOS autoplay; decorative → aria-hidden. -->
  <video
    bind:this={bgVideo}
    class="bg-video"
    autoplay
    muted
    loop
    playsinline
    preload="auto"
    disablepictureinpicture
    aria-hidden="true"
  ></video>
  <!-- Static darken — do not use filter:brightness on the <video> (GPU stutter). -->
  <div class="bg-veil" aria-hidden="true"></div>

  <!-- Foreground content sits above the video -->
  <div class="content">
    <header class="hero">
      <Logo variant="wordmark" size={440} accent={true} />
    </header>

    <form
      class="card"
      method="POST"
      use:enhance={() => {
        pending = true;
        return async ({ update }) => {
          await update();
          pending = false;
        };
      }}
    >
      <input type="hidden" name="next" value={data.next} />

      <label>
        <span>Name</span>
        <input
          name="identifier"
          type="text"
          autocomplete="username"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          required
          value={form?.identifier ?? ''}
        />
      </label>

      <label>
        <span>Passkey</span>
        <input name="password" type="password" autocomplete="current-password" required />
      </label>

      {#if form?.error}
        <p class="error" role="alert">⚠ {form.error}</p>
      {/if}

      <button type="submit" disabled={pending}>
        {pending ? 'Authenticating…' : 'Log in'}
        <span class="caret" aria-hidden="true">→</span>
      </button>
    </form>
  </div>
</div>

<style>
  /* Black canvas; the background video covers the whole stage, and the
     content card floats above it. */
  .stage {
    position: relative;
    min-height: 100dvh;
    width: 100%;
    background: #000;
    color: #fff;
    overflow: hidden;
    isolation: isolate;
  }

  /* Background video — own compositor layer, no CSS filters on the element. */
  .bg-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    z-index: 0;
    pointer-events: none;
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  .bg-veil {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.15);
  }

  .content {
    position: relative;
    z-index: 1;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    align-items: center;
    justify-items: center;
    padding: clamp(1rem, 4vw, 2.5rem);
    gap: clamp(1.5rem, 4vh, 3rem);
  }

  /* Phone — bulletproof "wordmark top third, form bottom third" layout.
     The previous 3-row grid (1fr 1fr 1fr) clipped the form whenever the
     form's natural height exceeded the row's allotted 33vh (which it
     does on most phones — a login form is ~280px, 33vh on iPhone SE is
     ~190px).

     Flex column with margin-bottom:auto on the hero pushes the form to
     the bottom of available space regardless of content height. The
     form ANCHORS to the bottom and the hero sits at top — automatic
     overflow protection because flex children honour their own size. */
  @media (max-width: 768px) {
    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 7vh 1rem max(2.5rem, calc(env(safe-area-inset-bottom, 0) + 2rem));
      gap: 0;
      /* Switch to small viewport unit so the layout matches the
         worst-case browser-chrome state — never overflows when toolbars
         appear. */
      min-height: 100svh;
    }
    .hero {
      flex: 0 0 auto;
      width: 100%;
      /* Eats all remaining space → pushes form to bottom */
      margin-bottom: auto;
    }
    .hero :global(.logo) {
      width: clamp(240px, 80vw, 380px);
    }
    .card {
      flex: 0 0 auto;
      width: 100%;
      max-width: 360px;
      /* Tighter than desktop so the form occupies less of bottom
         third — gives clearance from the safe-area edge */
      padding: 1rem 1.1rem 0.85rem;
      gap: 0.7rem;
    }
  }

  .hero {
    grid-row: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.75rem, 2vh, 1.25rem);
    animation: heroIn 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* Force the Logo color to white on this dark background.
     Stacked magenta bloom glow — the Stranger Things signature. Five
     layers compose into a single halo: a hard inner edge, three magenta
     blurs at increasing radius, and a black ground shadow for separation
     from the video. */
  .hero :global(.logo) {
    color: #fff;
    width: clamp(300px, 84vw, 520px);
    height: auto;
    filter:
      drop-shadow(0 0 2px rgba(255, 0, 255, 0.9))
      drop-shadow(0 0 8px rgba(255, 0, 255, 0.75))
      drop-shadow(0 0 22px rgba(255, 0, 255, 0.55))
      drop-shadow(0 0 50px rgba(255, 0, 255, 0.35))
      drop-shadow(0 6px 18px rgba(0, 0, 0, 0.65));
  }

  /* The form card — minimal, sits centered, single hairline border and a
     glass backdrop so the grid stays visible without hurting legibility. */
  .card {
    grid-row: 3;
    align-self: start;
    width: min(360px, 100%);
    padding: 1.75rem 1.5rem 1.25rem;
    display: grid;
    gap: 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.35);
    /* Solid glass stand-in — live backdrop-filter over a looping video
       re-blurs every frame and hitchs on mid-range GPUs. */
    background: rgba(0, 0, 0, 0.72);
    animation: cardIn 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
  }

  label {
    display: grid;
    gap: 0.4rem;
  }

  label span {
    font: 400 10px/1 var(--font-mono, monospace);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }

  input {
    border: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.35);
    background: transparent;
    color: #fff;
    font: 400 16px/1.2 var(--font-mono, monospace);
    padding: 0.55rem 0.1rem;
    width: 100%;
    outline: none;
    caret-color: var(--color-fg-accent, #E85D04);
    transition: border-color 200ms ease;
  }
  input:focus {
    border-bottom-color: #fff;
  }
  /* Suppress browser autofill backgrounds that would break the aesthetic */
  input:-webkit-autofill {
    -webkit-text-fill-color: #fff;
    -webkit-box-shadow: 0 0 0 1000px transparent inset;
    transition: background-color 5000s ease-in-out 0s;
  }

  .error {
    margin: 0;
    font: 600 12px/1.3 var(--font-mono, monospace);
    color: var(--color-fg-accent, #E85D04);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* The submit button — bold italic action-title vibe, full width */
  button {
    margin-top: 0.25rem;
    border: 1px solid #fff;
    background: #fff;
    color: #000;
    padding: 0.95rem 1.25rem;
    font: 400 15px/1 var(--font-display, 'Russo One', sans-serif);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-style: italic;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    transition: transform 180ms ease, box-shadow 180ms ease;
    transform: skewX(-6deg);
    box-shadow: 4px 4px 0 0 var(--color-fg-accent, #E85D04);
  }
  button:hover:not(:disabled) {
    transform: skewX(-6deg) translate(-2px, -2px);
    box-shadow: 6px 6px 0 0 var(--color-fg-accent, #E85D04);
  }
  button:active:not(:disabled) {
    transform: skewX(-6deg) translate(2px, 2px);
    box-shadow: 2px 2px 0 0 var(--color-fg-accent, #E85D04);
  }
  button:disabled {
    opacity: 0.6;
    cursor: progress;
  }
  .caret {
    display: inline-block;
    transition: transform 180ms ease;
  }
  button:hover:not(:disabled) .caret {
    transform: translateX(3px);
  }

  /* ── Entrance choreography ──────────────────────────────────────────── */
  @keyframes heroIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes cardIn {
    from {
      opacity: 0;
      transform: translateY(30px) skewX(0);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero, .card { animation: none; }
    button, button:hover { transition: none; transform: skewX(-6deg); }
  }
</style>
