<script lang="ts">
  import { formGuideFor } from '$lib/domain/antoniaFormGuides';

  type Props = { exerciseName: string };
  let { exerciseName }: Props = $props();

  const guide = $derived(formGuideFor(exerciseName));
</script>

{#if guide}
  <details class="guide" open>
    <summary>How to perform</summary>
    <div class="body">
      <div class="figures">
        {#each guide.images as img (img.src)}
          <figure>
            <img src={img.src} alt={img.alt} loading="lazy" />
            <figcaption>{img.caption}</figcaption>
          </figure>
        {/each}
      </div>

      <div class="copy">
        <h4>Setup</h4>
        <ol>
          {#each guide.setup as line}<li>{line}</li>{/each}
        </ol>
        <h4>The movement</h4>
        <ol>
          {#each guide.movement as line}<li>{line}</li>{/each}
        </ol>
        <h4>Cues</h4>
        <ul>
          {#each guide.cues as line}<li>{line}</li>{/each}
        </ul>
        <h4>Stop if</h4>
        <ul>
          {#each guide.avoid as line}<li>{line}</li>{/each}
        </ul>
      </div>
    </div>
  </details>
{/if}

<style>
  .guide {
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }

  summary {
    cursor: pointer;
    list-style: none;
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    padding: var(--space-2) 0;
  }
  summary::-webkit-details-marker { display: none; }
  summary::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    margin-right: var(--space-2);
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 6px solid currentColor;
    vertical-align: 1px;
    transition: transform var(--motion-default) var(--ease-standard);
  }
  .guide[open] summary::before {
    transform: rotate(90deg);
  }
  summary:hover { color: var(--color-fg-default); }
  summary:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-3) 0 var(--space-1);
  }

  .figures {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-3);
  }

  figure { margin: 0; }

  img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }

  figcaption {
    margin-top: var(--space-2);
    color: var(--color-fg-muted);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 42rem;
  }

  h4 {
    margin: 0 0 var(--space-2);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  ol, ul {
    margin: 0;
    padding-left: 1.2em;
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.5 var(--font-sans);
  }

  li + li { margin-top: var(--space-2); }

  @media (max-width: 640px) {
    .figures { grid-template-columns: 1fr 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    summary::before { transition: none; }
  }
</style>
