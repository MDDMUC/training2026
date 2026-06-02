<script lang="ts">
  import { restTimer } from '$lib/stores/restTimer.svelte';
  import { onMount } from 'svelte';

  let now = $state(Date.now());

  onMount(() => {
    restTimer.hydrate();
    const id = setInterval(() => (now = Date.now()), 250);
    return () => clearInterval(id);
  });

  const remainingMs = $derived(restTimer.endTime ? Math.max(0, restTimer.endTime - now) : 0);
  const remainingSec = $derived(Math.ceil(remainingMs / 1000));
  const isActive = $derived(restTimer.endTime !== null && remainingMs > 0);
  const isOverrun = $derived(restTimer.endTime !== null && remainingMs <= 0);

  const total = $derived(restTimer.totalSec ?? 1);
  const progressPct = $derived(
    restTimer.endTime
      ? Math.min(100, Math.max(0, ((total * 1000 - remainingMs) / (total * 1000)) * 100))
      : 0
  );

  function format(s: number): string {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }

  // ─── Audio alert when the timer expires ───
  // Plays a two-tone ascending chime via Web Audio API (no asset file
  // needed). The browser autoplay rules require a prior user gesture to
  // start an AudioContext — which we have, since the timer was launched
  // by a tap. We synthesise the tones with oscillators + a gain envelope
  // so they don't click on attack/release.
  //
  // alertedFor tracks the endTime we've already alerted on, so we only
  // chime once per timer cycle (not every render after it overruns).
  let alertedFor = $state<number | null>(null);

  $effect(() => {
    if (isOverrun && restTimer.endTime !== null && restTimer.endTime !== alertedFor) {
      alertedFor = restTimer.endTime;
      playAlert();
    }
  });

  function playAlert(): void {
    if (typeof window === 'undefined') return;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime;

      // Two-tone chime: A5 (880 Hz) → D6 (1175 Hz), 180ms apart
      const tones: Array<{ freq: number; startOffset: number; durSec: number }> = [
        { freq: 880,  startOffset: 0.0,  durSec: 0.18 },
        { freq: 1175, startOffset: 0.18, durSec: 0.22 }
      ];

      for (const tone of tones) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = tone.freq;
        osc.connect(gain).connect(ctx.destination);

        const start = t0 + tone.startOffset;
        const peak = start + 0.015;
        const end = start + tone.durSec;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.28, peak);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        osc.start(start);
        osc.stop(end + 0.02);
      }

      // Release AudioContext after the tones have finished
      window.setTimeout(() => ctx.close().catch(() => {}), 600);
    } catch {
      /* audio failure is non-fatal — timer still works visually */
    }
  }
</script>

{#if isActive || isOverrun}
  <aside class="timer" class:overrun={isOverrun} aria-live="polite">
    <div class="timer-inner">
      <div class="meta">
        <span class="label">{restTimer.label ?? 'Rest'}</span>
        <span class="total">target {format(total)}</span>
      </div>
      <div class="big">
        {#if isOverrun}
          +{format(Math.abs(Math.floor(remainingMs / 1000)) || 1)}
        {:else}
          {format(remainingSec)}
        {/if}
      </div>
      <div class="bar"><div class="fill" style="width: {progressPct}%;"></div></div>
      <div class="controls">
        <button onclick={() => restTimer.extend(30)} class="ctrl">+30s</button>
        <button onclick={() => restTimer.stop()} class="ctrl primary">Done</button>
      </div>
    </div>
  </aside>
{/if}

<style>
  .timer {
    position: fixed;
    right: var(--space-5);
    bottom: var(--space-5);
    z-index: var(--z-toast);
    width: 240px;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    box-shadow: var(--elevation-3);
  }

  .timer.overrun {
    border-color: var(--color-border-accent);
  }

  .timer-inner {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .label { color: var(--color-fg-default); }
  .total { font-family: var(--font-mono); }

  .big {
    font: var(--weight-bold) 40px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    text-align: center;
    color: var(--color-fg-default);
  }

  .timer.overrun .big { color: var(--color-fg-accent); }

  .bar {
    height: 3px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--color-fg-default);
    transition: width 250ms linear;
  }

  .timer.overrun .fill { background: var(--color-bg-accent); }

  .controls {
    display: flex;
    gap: var(--space-2);
  }

  .ctrl {
    flex: 1;
    padding: 6px 0;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    background: var(--color-bg-surface);
    color: var(--color-fg-muted);
    font: var(--weight-medium) 12px/1 var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all var(--motion-default) var(--ease-standard);
  }

  .ctrl:hover {
    color: var(--color-fg-default);
    border-color: var(--color-border-strong);
  }

  .ctrl.primary {
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    border-color: var(--color-fg-default);
  }
  .ctrl.primary:hover {
    background: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
    color: var(--color-fg-inverse);
  }
</style>
