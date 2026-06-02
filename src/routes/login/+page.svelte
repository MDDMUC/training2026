<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';
  import SynthwaveGrid from '$lib/atoms/SynthwaveGrid.svelte';
  import Logo from '$lib/atoms/Logo.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let pending = $state(false);
</script>

<svelte:head><title>Sign in · Training 2026</title></svelte:head>

<div class="stage">
  <!-- Full-bleed perspective grid behind everything -->
  <SynthwaveGrid color="#fff" bg="#000" speed={5} />

  <!-- Foreground content sits above the grid -->
  <div class="content">
    <header class="hero">
      <Logo variant="wordmark" size={320} accent={true} />
      <p class="tagline">
        <span class="dash" aria-hidden="true"></span>
        <span>Phase Plan · Track · Crush</span>
        <span class="dash" aria-hidden="true"></span>
      </p>
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
        <span>Identifier</span>
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
        {pending ? 'Authenticating…' : 'Enter the System'}
        <span class="caret" aria-hidden="true">→</span>
      </button>

      <p class="fineprint">SECURE TRANSMISSION · COOKIE 30D · NO TRACKING</p>
    </form>
  </div>
</div>

<style>
  /* Black background as the canvas; the SynthwaveGrid sits on top of this
     and the content card floats above the grid. */
  .stage {
    position: relative;
    min-height: 100dvh;
    width: 100%;
    background: #000;
    color: #fff;
    overflow: hidden;
    isolation: isolate;
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

  .hero {
    grid-row: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.75rem, 2vh, 1.25rem);
    animation: heroIn 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* Force the Logo color to white on this dark background */
  .hero :global(.logo) {
    color: #fff;
    width: clamp(240px, 60vw, 360px);
    height: auto;
    /* The text-shadow gives the wordmark a faint backlight halo —
       1980s arcade marquee energy. */
    filter: drop-shadow(0 0 22px rgba(255, 255, 255, 0.15));
  }

  .tagline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font: 400 11px/1 var(--font-mono, monospace);
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
  .tagline .dash {
    display: inline-block;
    width: 28px;
    height: 1px;
    background: rgba(255, 255, 255, 0.55);
  }

  /* The form card — minimal, sits centered, has a subtle hairline border
     and a backdrop so the grid stays visible without hurting legibility. */
  .card {
    grid-row: 3;
    align-self: start;
    width: min(360px, 100%);
    padding: 1.75rem 1.5rem 1.25rem;
    display: grid;
    gap: 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: cardIn 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
    /* Corner accents — four small italic ticks at the corners, like an
       80s flight-sim HUD. Done via background-image so they stay sharp. */
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.55) 0 14px, transparent 14px 100%),
      linear-gradient(to left,  rgba(255, 255, 255, 0.55) 0 14px, transparent 14px 100%),
      linear-gradient(to right, rgba(255, 255, 255, 0.55) 0 14px, transparent 14px 100%),
      linear-gradient(to left,  rgba(255, 255, 255, 0.55) 0 14px, transparent 14px 100%);
    background-size: 14px 1px, 14px 1px, 14px 1px, 14px 1px;
    background-position: 0 0, 100% 0, 0 100%, 100% 100%;
    background-repeat: no-repeat;
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

  .fineprint {
    margin: 0;
    font: 400 9px/1 var(--font-mono, monospace);
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
    text-align: center;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
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
