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

  let mode = $state<'estimate' | 'manual'>('estimate');
  let manualDescription = $state('');
  let manualCalories = $state<number | null>(null);
  let manualProtein = $state<number | null>(null);
  let manualCarbs = $state<number | null>(null);
  let manualFat = $state<number | null>(null);
  const manualValid = $derived(
    manualCalories !== null && manualCalories > 0 && manualDescription.trim().length > 0
  );

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

  <!-- Workout burn + today's balance -->
  <div class="metrics-row">
    <form
      method="POST"
      action="?/updateActivityCalories"
      use:enhance
      class="burn-cell"
    >
      <label class="cell-label">
        <span>Workout burn (from watch)</span>
        <div class="num-row">
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
      <span class="cell-hint">Adds to today's calorie goal.</span>
    </form>

    <div class="balance-cell">
      <span class="cell-label-text">Today's balance</span>
      <span class="balance-value" class:over={calorieDelta > 0} class:hit={calorieHit}>
        {calorieDelta > 0 ? '+' : ''}{Math.round(calorieDelta).toLocaleString()}
        <span class="balance-unit">kcal</span>
      </span>
      <span class="cell-hint">
        {calorieHit ? 'on target' : calorieDelta > 0 ? 'over goal' : 'remaining today'}
      </span>
    </div>
  </div>

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
    <div class="mode-tabs" role="tablist" aria-label="Entry mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'estimate'}
        class="mode-tab"
        class:active={mode === 'estimate'}
        onclick={() => (mode = 'estimate')}
      >
        Estimate from text
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'manual'}
        class="mode-tab"
        class:active={mode === 'manual'}
        onclick={() => (mode = 'manual')}
      >
        Enter values
      </button>
    </div>
    {#if mode === 'estimate'}
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
    {:else}
      <form
        method="POST"
        action="?/saveNutritionEntry"
        class="manual-form"
        use:enhance={() => async ({ update }) => {
          await update({ reset: false });
          manualDescription = '';
          manualCalories = null;
          manualProtein = null;
          manualCarbs = null;
          manualFat = null;
          await invalidateAll();
        }}
      >
        <label class="manual-desc">
          <span>Label</span>
          <input
            type="text"
            name="description"
            bind:value={manualDescription}
            placeholder="e.g. day total, lunch, post-session shake"
            maxlength="200"
          />
        </label>
        <div class="manual-grid">
          <label class="manual-field">
            <span>Calories</span>
            <div class="num-input">
              <input
                type="number"
                name="calories"
                step="1"
                min="0"
                max="10000"
                inputmode="numeric"
                bind:value={manualCalories}
                placeholder="0"
                required
              />
              <span class="unit">kcal</span>
            </div>
          </label>
          <label class="manual-field">
            <span>Protein</span>
            <div class="num-input">
              <input
                type="number"
                name="protein_g"
                step="1"
                min="0"
                max="1000"
                inputmode="numeric"
                bind:value={manualProtein}
                placeholder="0"
              />
              <span class="unit">g</span>
            </div>
          </label>
          <label class="manual-field">
            <span>Carbs</span>
            <div class="num-input">
              <input
                type="number"
                name="carbs_g"
                step="1"
                min="0"
                max="2000"
                inputmode="numeric"
                bind:value={manualCarbs}
                placeholder="0"
              />
              <span class="unit">g</span>
            </div>
          </label>
          <label class="manual-field">
            <span>Fat</span>
            <div class="num-input">
              <input
                type="number"
                name="fat_g"
                step="1"
                min="0"
                max="500"
                inputmode="numeric"
                bind:value={manualFat}
                placeholder="0"
              />
              <span class="unit">g</span>
            </div>
          </label>
        </div>
        <div class="manual-actions">
          <span class="manual-hint">Adds an entry to today's totals.</span>
          <button type="submit" class="primary" disabled={!manualValid}>Add entry</button>
        </div>
      </form>
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

  /* ---------- Metrics row: burn + balance ---------- */
  .metrics-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-5);
    padding: var(--space-3) 0;
    border-top: 1px solid var(--color-border-default);
    border-bottom: 1px solid var(--color-border-default);
  }
  .burn-cell, .balance-cell { display: flex; flex-direction: column; gap: 6px; }
  .balance-cell { align-items: flex-end; text-align: right; }
  .cell-label { display: flex; flex-direction: column; gap: 4px; }
  .cell-label > span,
  .cell-label-text {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .num-row { display: inline-flex; align-items: baseline; gap: var(--space-2); }
  .num-row input {
    width: 90px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--weight-bold) 18px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .num-row input::-webkit-inner-spin-button,
  .num-row input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .num-row input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }
  .num-row .unit { color: var(--color-fg-muted); font: var(--weight-medium) 12px/1 var(--font-mono); }

  .balance-value {
    font: var(--weight-bold) 22px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }
  .balance-value.over { color: var(--color-fg-accent); }
  .balance-unit {
    font: var(--weight-medium) 12px/1 var(--font-mono);
    color: var(--color-fg-muted);
  }
  .cell-hint {
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

  /* ---------- Mode tabs ---------- */
  .mode-tabs {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border-default);
  }
  .mode-tab {
    appearance: none;
    background: transparent;
    border: 0;
    padding: var(--space-2) var(--space-3);
    margin-bottom: -1px;
    border-bottom: 2px solid transparent;
    color: var(--color-fg-muted);
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    cursor: pointer;
  }
  .mode-tab:hover { color: var(--color-fg-default); }
  .mode-tab.active {
    color: var(--color-fg-default);
    border-bottom-color: var(--color-fg-default);
  }

  /* ---------- Manual entry ---------- */
  .manual-form { display: flex; flex-direction: column; gap: var(--space-3); }
  .manual-desc { display: flex; flex-direction: column; gap: 4px; }
  .manual-desc > span {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .manual-desc input[type="text"] {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
  }
  .manual-desc input[type="text"]:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }

  .manual-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
  }
  .manual-field { display: flex; flex-direction: column; gap: 4px; }
  .manual-field > span {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .num-input { display: inline-flex; align-items: baseline; gap: var(--space-2); }
  .num-input input {
    width: 100%;
    min-width: 0;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    color: var(--color-fg-default);
    font: var(--weight-bold) 18px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .num-input input::-webkit-inner-spin-button,
  .num-input input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .num-input input:focus { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }
  .num-input .unit { color: var(--color-fg-muted); font: var(--weight-medium) 12px/1 var(--font-mono); }

  .manual-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .manual-hint {
    font: var(--text-body-sm-weight) 11px/1 var(--font-sans);
    color: var(--color-fg-subtle);
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

  @media (max-width: 768px) {
    .nutrition { padding: var(--space-4); gap: var(--space-3); }
    .dash { grid-template-columns: 1fr; justify-items: center; gap: var(--space-4); }
    .macros { width: 100%; }
    .metrics-row { grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .entry-desc { font-size: 13px; }
    .mode-tab { padding: var(--space-2); font-size: 10px; }
  }

  @media (max-width: 640px) {
    .input-row { flex-direction: column; }
    .input-row .primary { width: 100%; }
    .manual-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
    .manual-actions { flex-direction: column; align-items: stretch; gap: var(--space-2); }
    .metrics-row { grid-template-columns: 1fr; gap: var(--space-3); }
    .balance-cell { align-items: flex-start; text-align: left; }
    .balance-value { font-size: 20px; }
    .entry { flex-wrap: wrap; }
    .entry-macros { font-size: 10px; }
    /* Larger tap target for delete on phone */
    .del { width: 32px; height: 32px; font-size: 18px; }
  }
</style>
