<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { NutritionEntry, NutritionTotals, DailyNutritionTargets } from '$lib/domain/nutrition';

  type Props = {
    entries: NutritionEntry[];
    totals: NutritionTotals;
    targets: DailyNutritionTargets;
    activityCalories: number;
    bodyWeightKg: number;
  };
  let { entries, totals, targets, activityCalories, bodyWeightKg }: Props = $props();

  let description = $state('');
  let parsing = $state(false);
  let parseError = $state<string | null>(null);
  let pendingParse = $state<{
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    items: { food: string; qty?: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[];
  } | null>(null);

  let burnInput = $state<number | null>(activityCalories || null);

  async function parse() {
    if (!description.trim()) return;
    parsing = true;
    parseError = null;
    pendingParse = null;
    try {
      const res = await fetch('/api/nutrition/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description: description.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        parseError = data?.error ?? `HTTP ${res.status}`;
      } else {
        pendingParse = data.parsed;
      }
    } catch (e) {
      parseError = String(e);
    } finally {
      parsing = false;
    }
  }

  function cancelPending() {
    pendingParse = null;
    parseError = null;
  }

  function pct(value: number, goal: number): number {
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  }

  const calorieDelta = $derived(totals.calories - targets.goal_kcal);
  const proteinDelta = $derived(totals.protein_g - targets.protein_goal_g);

  // Ring geometry — single donut for calories
  const RING_SIZE = 132;
  const RING_STROKE = 12;
  const ringRadius = (RING_SIZE - RING_STROKE) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const caloriePct = $derived(Math.min(1, totals.calories / Math.max(1, targets.goal_kcal)));
  const calorieDash = $derived(ringCircumference * caloriePct);
  const calorieOver = $derived(totals.calories > targets.goal_kcal * 1.1);
  const calorieHit = $derived(
    targets.goal_kcal > 0 &&
      Math.abs(totals.calories - targets.goal_kcal) / targets.goal_kcal <= 0.1
  );
  const proteinHit = $derived(totals.protein_g >= targets.protein_goal_g);
</script>

<section class="nutrition" aria-label="Nutrition">
  <header>
    <h3>Nutrition</h3>
    <p class="subtitle">
      Goal {targets.goal_kcal.toLocaleString()} kcal
      <span class="dim">·</span>
      baseline {targets.baseline_kcal.toLocaleString()}
      <span class="dim">+</span>
      burn {targets.activity_kcal.toLocaleString()}
    </p>
  </header>

  <div class="dash">
    <!-- Calorie donut -->
    <div class="ring-wrap">
      <svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 {RING_SIZE} {RING_SIZE}" class="ring">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={ringRadius}
          fill="none"
          stroke="var(--color-bg-subtle)"
          stroke-width={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={ringRadius}
          fill="none"
          stroke={calorieOver ? 'var(--color-fg-accent)' : 'var(--color-fg-default)'}
          stroke-width={RING_STROKE}
          stroke-linecap="butt"
          stroke-dasharray="{calorieDash} {ringCircumference}"
          transform="rotate(-90 {RING_SIZE / 2} {RING_SIZE / 2})"
        />
      </svg>
      <div class="ring-label">
        <span class="ring-value">{Math.round(totals.calories).toLocaleString()}</span>
        <span class="ring-unit">/ {targets.goal_kcal.toLocaleString()} kcal</span>
        <span class="ring-delta" class:over={calorieDelta > 0} class:hit={calorieHit}>
          {calorieDelta > 0 ? '+' : ''}{Math.round(calorieDelta).toLocaleString()}
          {calorieHit ? '· on target' : calorieDelta > 0 ? '· over' : '· remaining'}
        </span>
      </div>
    </div>

    <!-- Macro bars -->
    <div class="macros">
      <div class="macro priority">
        <div class="macro-head">
          <span class="macro-label">Protein</span>
          <span class="macro-value">
            <b>{Math.round(totals.protein_g)}</b><span class="dim">/{targets.protein_goal_g}</span> g
          </span>
        </div>
        <div class="bar">
          <div class="bar-fill" class:hit={proteinHit} style="width: {pct(totals.protein_g, targets.protein_goal_g)}%;"></div>
        </div>
        <span class="macro-meta">
          {proteinHit ? `on target (${(totals.protein_g / bodyWeightKg).toFixed(1)} g/kg)` : `${(Math.max(0, targets.protein_goal_g - totals.protein_g)).toFixed(0)} g to go`}
        </span>
      </div>

      <div class="macro">
        <div class="macro-head">
          <span class="macro-label">Carbs</span>
          <span class="macro-value">
            <b>{Math.round(totals.carbs_g)}</b><span class="dim">/{targets.carbs_goal_g}</span> g
          </span>
        </div>
        <div class="bar">
          <div class="bar-fill subtle" style="width: {pct(totals.carbs_g, targets.carbs_goal_g)}%;"></div>
        </div>
      </div>

      <div class="macro">
        <div class="macro-head">
          <span class="macro-label">Fat</span>
          <span class="macro-value">
            <b>{Math.round(totals.fat_g)}</b><span class="dim">/{targets.fat_goal_g}</span> g
          </span>
        </div>
        <div class="bar">
          <div class="bar-fill subtle" style="width: {pct(totals.fat_g, targets.fat_goal_g)}%;"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Workout burn input -->
  <form
    method="POST"
    action="?/updateActivityCalories"
    use:enhance
    class="burn-row"
  >
    <label class="burn-label">
      <span>Workout burn (from watch)</span>
      <div class="burn-input">
        <input
          type="number"
          name="activity_calories"
          step="1"
          min="0"
          max="5000"
          inputmode="numeric"
          bind:value={burnInput}
          placeholder="0"
          onchange={(e) => (e.currentTarget.closest('form') as HTMLFormElement).requestSubmit()}
        />
        <span class="unit">kcal</span>
      </div>
    </label>
    <span class="burn-hint">Adds to today's calorie goal.</span>
  </form>

  <!-- Entries list -->
  {#if entries.length > 0}
    <ul class="entries">
      {#each entries as e (e.id)}
        <li class="entry">
          <div class="entry-main">
            <span class="entry-desc">{e.description}</span>
            <span class="entry-macros">
              <b>{Math.round(e.calories)}</b> kcal
              <span class="dim">·</span>
              {Math.round(e.protein_g)}p
              <span class="dim">/</span>
              {Math.round(e.carbs_g)}c
              <span class="dim">/</span>
              {Math.round(e.fat_g)}f
            </span>
          </div>
          <form method="POST" action="?/deleteNutritionEntry" use:enhance>
            <input type="hidden" name="entryId" value={e.id} />
            <button type="submit" class="del" aria-label="Delete entry">×</button>
          </form>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">Nothing logged yet today.</p>
  {/if}

  <!-- Parse + save flow -->
  {#if pendingParse}
    <form
      method="POST"
      action="?/saveNutritionEntry"
      class="confirm"
      use:enhance={() => async ({ update }) => {
        await update({ reset: false });
        pendingParse = null;
        description = '';
        await invalidateAll();
      }}
    >
      <header class="confirm-head">
        <span class="confirm-label">Estimated</span>
        <span class="confirm-totals">
          <b>{Math.round(pendingParse.calories)}</b> kcal
          <span class="dim">·</span>
          {Math.round(pendingParse.protein_g)}p
          <span class="dim">/</span>
          {Math.round(pendingParse.carbs_g)}c
          <span class="dim">/</span>
          {Math.round(pendingParse.fat_g)}f
        </span>
      </header>
      <ul class="items">
        {#each pendingParse.items as item}
          <li>
            <span class="item-food">{item.food}{item.qty ? ` — ${item.qty}` : ''}</span>
            <span class="item-kcal">{Math.round(item.calories)} kcal</span>
          </li>
        {/each}
      </ul>
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="calories" value={pendingParse.calories} />
      <input type="hidden" name="protein_g" value={pendingParse.protein_g} />
      <input type="hidden" name="carbs_g" value={pendingParse.carbs_g} />
      <input type="hidden" name="fat_g" value={pendingParse.fat_g} />
      <input type="hidden" name="items_json" value={JSON.stringify(pendingParse.items)} />
      <div class="confirm-actions">
        <button type="button" class="ghost" onclick={cancelPending}>Discard</button>
        <button type="submit" class="primary">Save entry</button>
      </div>
    </form>
  {:else}
    <div class="input-row">
      <textarea
        bind:value={description}
        placeholder="e.g. 2 eggs scrambled, 2 slices sourdough toast with butter, large coffee with oat milk"
        rows="2"
        disabled={parsing}
      ></textarea>
      <button type="button" class="primary" onclick={parse} disabled={parsing || !description.trim()}>
        {parsing ? 'Estimating…' : 'Estimate'}
      </button>
    </div>
    {#if parseError}
      <p class="error">{parseError}</p>
    {/if}
  {/if}
</section>

<style>
  .nutrition {
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
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin: 0;
  }

  .subtitle {
    font: var(--text-body-sm-weight) 12px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
    margin: 0;
  }

  .dim { color: var(--color-fg-subtle); }

  /* ---------- Dash row: ring + macros ---------- */
  .dash {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-5);
    align-items: center;
  }

  .ring-wrap { position: relative; width: 132px; height: 132px; }
  .ring { display: block; }
  .ring-label {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
  }
  .ring-value {
    font: var(--weight-bold) 26px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }
  .ring-unit {
    font: var(--text-body-sm-weight) 11px/1 var(--font-mono);
    color: var(--color-fg-muted);
    margin-top: 4px;
  }
  .ring-delta {
    font: var(--weight-semibold) 10px/1 var(--font-mono);
    color: var(--color-fg-muted);
    margin-top: 6px;
    letter-spacing: 0.02em;
  }
  .ring-delta.over { color: var(--color-fg-accent); }
  .ring-delta.hit { color: var(--color-fg-default); }

  .macros { display: flex; flex-direction: column; gap: var(--space-3); min-width: 0; }
  .macro { display: flex; flex-direction: column; gap: 4px; }
  .macro-head { display: flex; align-items: baseline; justify-content: space-between; }
  .macro-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .macro.priority .macro-label { color: var(--color-fg-default); }
  .macro-value {
    font: var(--weight-medium) 13px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }
  .macro-value b { color: var(--color-fg-default); font-weight: var(--weight-bold); }
  .macro-meta {
    font: var(--text-body-sm-weight) 11px/1 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .bar {
    height: 6px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: var(--color-fg-default);
    transition: width 200ms ease;
  }
  .bar-fill.subtle { background: var(--color-border-strong); }
  .bar-fill.hit { background: var(--color-fg-default); }

  /* ---------- Burn row ---------- */
  .burn-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    border-top: 1px solid var(--color-border-default);
    border-bottom: 1px solid var(--color-border-default);
  }
  .burn-label {
    display: flex; flex-direction: column; gap: 4px;
  }
  .burn-label > span {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .burn-input { display: inline-flex; align-items: baseline; gap: var(--space-2); }
  .burn-input input {
    width: 90px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--weight-bold) 18px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .burn-input .unit { color: var(--color-fg-muted); font: var(--weight-medium) 12px/1 var(--font-mono); }
  .burn-input input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }
  .burn-hint {
    font: var(--text-body-sm-weight) 11px/1 var(--font-sans);
    color: var(--color-fg-subtle);
  }

  /* ---------- Entries list ---------- */
  .entries { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .entry {
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
  }
  .entry:last-child { border-bottom: 0; }
  .entry-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
  .entry-desc {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-default);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .entry-macros {
    font: var(--weight-medium) 11px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }
  .entry-macros b { color: var(--color-fg-default); font-weight: var(--weight-bold); }
  .del {
    width: 24px; height: 24px;
    border: 1px solid transparent; border-radius: var(--radius-1);
    background: transparent; color: var(--color-fg-subtle);
    font: var(--weight-bold) 16px/1 var(--font-sans);
    cursor: pointer;
  }
  .del:hover { color: var(--color-fg-default); border-color: var(--color-border-strong); }

  .empty {
    color: var(--color-fg-subtle);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    margin: 0;
  }

  /* ---------- Input + confirm ---------- */
  .input-row { display: flex; gap: var(--space-2); align-items: stretch; }
  .input-row textarea {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.45 var(--font-sans);
    resize: vertical;
    min-height: 56px;
  }
  .input-row textarea:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .primary, .ghost {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-2);
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    cursor: pointer;
  }
  .primary {
    background: var(--color-fg-default);
    color: var(--color-fg-inverse);
    border: 1px solid var(--color-fg-default);
  }
  .primary:hover:not(:disabled) {
    background: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
  }
  .primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .ghost {
    background: transparent;
    color: var(--color-fg-default);
    border: 1px solid var(--color-border-strong);
  }
  .ghost:hover { background: var(--color-bg-subtle); }

  .error {
    color: var(--color-fg-accent);
    font: var(--text-body-sm-weight) 12px/1 var(--font-sans);
    margin: 0;
  }

  /* ---------- Confirm block ---------- */
  .confirm {
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    padding: var(--space-3) var(--space-4);
    display: flex; flex-direction: column; gap: var(--space-3);
    background: var(--color-bg-subtle);
  }
  .confirm-head { display: flex; justify-content: space-between; align-items: baseline; }
  .confirm-label {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .confirm-totals {
    font: var(--weight-medium) 13px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }
  .confirm-totals b { color: var(--color-fg-default); font-weight: var(--weight-bold); }
  .items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .items li {
    display: flex; justify-content: space-between;
    font: var(--text-body-sm-weight) 13px/1.3 var(--font-sans);
    color: var(--color-fg-default);
  }
  .item-kcal {
    font: var(--weight-medium) 12px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }
  .confirm-actions { display: flex; justify-content: flex-end; gap: var(--space-2); }

  @media (max-width: 640px) {
    .dash { grid-template-columns: 1fr; justify-items: center; }
    .macros { width: 100%; }
    .input-row { flex-direction: column; }
  }
</style>
