<script lang="ts">
  import { parseISO, format } from 'date-fns';
  import { formatTonnage, formatHoldTime } from '$lib/domain/load';

  type Props = {
    startISO: string;
    endISO: string;
    sessionsTotal: number;
    sessionsCompleted: number;
    setsTotal: number;
    setsCompleted: number;
    climbs: number;
    sleepAvg: number | null;
    tonnageKg?: number;
    isometricSeconds?: number;
    runsCount?: number;
    runKm?: number;
  };
  let {
    startISO,
    endISO,
    sessionsTotal,
    sessionsCompleted,
    setsTotal,
    setsCompleted,
    climbs,
    sleepAvg,
    tonnageKg = 0,
    isometricSeconds = 0,
    runsCount = 0,
    runKm = 0
  }: Props = $props();

  const sessionsPct = $derived(sessionsTotal ? (sessionsCompleted / sessionsTotal) * 100 : 0);
  const setsPct = $derived(setsTotal ? (setsCompleted / setsTotal) * 100 : 0);

  // Secondary stats — uniform "—" fallback so the grid shape stays consistent
  const tonnageDisplay = $derived(tonnageKg > 0 ? formatTonnage(tonnageKg) : '—');
  const tutDisplay = $derived(isometricSeconds > 0 ? formatHoldTime(isometricSeconds) : '—');
  const runDisplay = $derived(runKm > 0 ? `${runKm.toFixed(1)} km` : '—');
  const sleepDisplay = $derived(sleepAvg !== null ? sleepAvg.toFixed(1) + ' h' : '—');
</script>

<section class="card">
  <header class="card-head">
    <h3>This Week</h3>
    <span class="dates">{format(parseISO(startISO), 'MMM d')} – {format(parseISO(endISO), 'MMM d')}</span>
  </header>

  <!-- Primary metrics — side-by-side hero pair -->
  <div class="primary">
    <div class="metric">
      <span class="metric-label">Sessions</span>
      <div class="metric-value">
        <span class="num">{sessionsCompleted}</span>
        <span class="denom">/ {sessionsTotal}</span>
      </div>
      <div class="track"><div class="fill" style="width: {sessionsPct}%;"></div></div>
    </div>

    <div class="metric">
      <span class="metric-label">Sets</span>
      <div class="metric-value">
        <span class="num">{setsCompleted}</span>
        <span class="denom">/ {setsTotal}</span>
      </div>
      <div class="track"><div class="fill" style="width: {setsPct}%;"></div></div>
    </div>
  </div>

  <!-- Secondary metrics — uniform grid with consistent cell shape -->
  <div class="secondary">
    <div class="cell">
      <span class="cell-label">Tonnage</span>
      <span class="cell-value">{tonnageDisplay}</span>
    </div>
    <div class="cell">
      <span class="cell-label">Time u/t</span>
      <span class="cell-value">{tutDisplay}</span>
    </div>
    <div class="cell">
      <span class="cell-label">Climbs</span>
      <span class="cell-value">{climbs > 0 ? climbs : '—'}</span>
    </div>
    <div class="cell">
      <span class="cell-label">Running</span>
      <span class="cell-value">{runDisplay}</span>
    </div>
    <div class="cell wide">
      <span class="cell-label">Sleep · 7-day avg</span>
      <span class="cell-value">{sleepDisplay}</span>
    </div>
  </div>
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    padding: var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    height: 100%;
  }

  .card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }

  h3 {
    font: var(--weight-semibold) 14px/1 var(--font-sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-fg-default);
    margin: 0;
  }

  .dates {
    font: var(--weight-medium) 13px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }

  /* ---------- Primary metrics ---------- */
  .primary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-5);
    margin-bottom: var(--space-5);
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .metric-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .metric-value {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .metric-value .num {
    font: var(--weight-bold) 32px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
    letter-spacing: -0.02em;
  }

  .metric-value .denom {
    font: var(--weight-medium) 16px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }

  .track {
    height: 4px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-top: var(--space-1);
  }

  .fill {
    height: 100%;
    background: var(--color-fg-default);
    transition: width var(--motion-slow) var(--ease-standard);
  }

  /* ---------- Secondary metrics: gridded cells, hairline-separated ---------- */
  .secondary {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 1px;
    background: var(--color-border-default);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-1);
    overflow: hidden;
    margin-top: auto;
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3);
    background: var(--color-bg-surface);
    min-width: 0;
  }

  .cell.wide { grid-column: 1 / -1; }

  .cell-label {
    font: var(--text-micro-weight) 10px/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .cell-value {
    font: var(--weight-semibold) 16px/1.1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    .primary { grid-template-columns: 1fr; }
    .secondary { grid-template-columns: 1fr 1fr; }
    .cell.wide { grid-column: 1 / -1; }
  }
</style>
