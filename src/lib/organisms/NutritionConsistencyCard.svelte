<script lang="ts">
  type DayRow = {
    date: string;
    calories: number;
    protein_g: number;
    goal_kcal: number;
    protein_goal_g: number;
    calorieHit: boolean;
    proteinHit: boolean;
  };

  type Props = {
    days: DayRow[];               // chronological, oldest → newest
    calorieStreak: number;        // trailing
    calorieLongest: number;
    proteinStreak: number;
    proteinLongest: number;
    bothStreak: number;
    daysLogged: number;
    daysInRange: number;          // total span (incl. unlogged)
  };
  let {
    days,
    calorieStreak,
    calorieLongest,
    proteinStreak,
    proteinLongest,
    bothStreak,
    daysLogged,
    daysInRange
  }: Props = $props();

  // Last 28 days as a heat-strip (most recent on the right).
  const strip = $derived(days.slice(-28));
</script>

<section class="card">
  <header>
    <h3>Nutrition consistency</h3>
    <p class="subtitle">Last {daysInRange} days · {daysLogged} logged</p>
  </header>

  <div class="streaks">
    <div class="streak">
      <span class="streak-label">Calories</span>
      <span class="streak-value">{calorieStreak}</span>
      <span class="streak-meta">
        day{calorieStreak === 1 ? '' : 's'} in a row
        <span class="dim">· best {calorieLongest}</span>
      </span>
    </div>

    <div class="streak priority">
      <span class="streak-label">Protein</span>
      <span class="streak-value">{proteinStreak}</span>
      <span class="streak-meta">
        day{proteinStreak === 1 ? '' : 's'} in a row
        <span class="dim">· best {proteinLongest}</span>
      </span>
    </div>

    <div class="streak">
      <span class="streak-label">Both</span>
      <span class="streak-value">{bothStreak}</span>
      <span class="streak-meta">
        day{bothStreak === 1 ? '' : 's'} together
      </span>
    </div>
  </div>

  <div class="strip-wrap">
    <span class="strip-label">Last 28 days</span>
    <div class="strip" role="img" aria-label="Daily goal hits over the last 28 days">
      {#each strip as d (d.date)}
        <div
          class="cell"
          class:cal-hit={d.calorieHit}
          class:pro-hit={d.proteinHit}
          title="{d.date} · {Math.round(d.calories)}/{d.goal_kcal} kcal · {Math.round(d.protein_g)}/{d.protein_goal_g} g protein"
        ></div>
      {/each}
    </div>
    <div class="legend">
      <span class="lg-item"><span class="lg-sq both"></span> both</span>
      <span class="lg-item"><span class="lg-sq cal"></span> calories</span>
      <span class="lg-item"><span class="lg-sq pro"></span> protein</span>
      <span class="lg-item"><span class="lg-sq miss"></span> missed</span>
    </div>
  </div>
</section>

<style>
  .card {
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  header { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
  h3 {
    font: var(--text-h3-weight) var(--text-h3-size)/1 var(--font-sans);
    margin: 0;
    color: var(--color-fg-default);
  }
  .subtitle {
    font: var(--text-body-sm-weight) 12px/1 var(--font-mono);
    color: var(--color-fg-muted);
    margin: 0;
  }
  .dim { color: var(--color-fg-subtle); }

  /* ---------- Streak figures ---------- */
  .streaks {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }
  .streak {
    display: flex; flex-direction: column; gap: 4px;
    padding: var(--space-3);
    border-left: 2px solid var(--color-border-default);
  }
  .streak.priority { border-left-color: var(--color-fg-default); }
  .streak-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .streak-value {
    font: var(--weight-bold) 36px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
    letter-spacing: -0.02em;
  }
  .streak-meta {
    font: var(--text-body-sm-weight) 11px/1.2 var(--font-sans);
    color: var(--color-fg-muted);
  }

  /* ---------- Heat strip ---------- */
  .strip-wrap { display: flex; flex-direction: column; gap: var(--space-2); }
  .strip-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .strip {
    display: grid;
    grid-template-columns: repeat(28, 1fr);
    gap: 3px;
  }
  .cell {
    height: 22px;
    background: var(--color-bg-subtle);
    border-radius: 2px;
  }
  .cell.cal-hit { background: var(--color-border-strong); }
  .cell.pro-hit { background: var(--color-gray-600); }
  .cell.cal-hit.pro-hit { background: var(--color-fg-default); }

  .legend {
    display: flex; gap: var(--space-3);
    font: var(--text-body-sm-weight) 11px/1 var(--font-sans);
    color: var(--color-fg-muted);
  }
  .lg-item { display: inline-flex; align-items: center; gap: 6px; }
  .lg-sq {
    width: 10px; height: 10px;
    border-radius: 2px;
    background: var(--color-bg-subtle);
  }
  .lg-sq.both { background: var(--color-fg-default); }
  .lg-sq.cal  { background: var(--color-border-strong); }
  .lg-sq.pro  { background: var(--color-gray-600); }
  .lg-sq.miss { background: var(--color-bg-subtle); border: 1px solid var(--color-border-default); }

  @media (max-width: 768px) {
    .streaks { grid-template-columns: 1fr; }
  }
</style>
