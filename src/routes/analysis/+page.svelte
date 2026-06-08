<script lang="ts">
  import WeeklyLoadChart from '$lib/organisms/WeeklyLoadChart.svelte';
  import WeeklyVolumeChart from '$lib/organisms/WeeklyVolumeChart.svelte';
  import PriorityChart from '$lib/organisms/PriorityChart.svelte';
  import NutritionConsistencyCard from '$lib/organisms/NutritionConsistencyCard.svelte';
  import type { Point } from '$lib/organisms/PriorityChart.svelte';
  import { parseISO, format, differenceInCalendarDays } from 'date-fns';

  let { data } = $props();

  // Series for the three priority charts
  const weightPoints = $derived<Point[]>(
    data.bodyweightHistory.map((p) => ({ id: p.session_id, date: p.date, value: p.body_weight_kg }))
  );
  const pullPoints = $derived<Point[]>(
    data.pullupTests.map((t) => ({ id: t.id, date: t.date, value: t.estimated_1rm_added_kg }))
  );
  const tindeqRPoints = $derived<Point[]>(
    data.tindeqTests
      .filter((t) => t.hand === 'R')
      .map((t) => ({ id: t.id, date: t.date, value: t.peak_force_kg }))
  );
  const tindeqLPoints = $derived<Point[]>(
    data.tindeqTests
      .filter((t) => t.hand === 'L')
      .map((t) => ({ id: t.id, date: t.date, value: t.peak_force_kg }))
  );

  // Phase strip math
  const phaseDays = $derived(
    data.phase
      ? differenceInCalendarDays(parseISO(data.phase.end_date), parseISO(data.phase.start_date)) + 1
      : 0
  );
  const phaseElapsed = $derived(
    data.phase
      ? Math.max(
          0,
          Math.min(
            phaseDays,
            differenceInCalendarDays(parseISO(data.todayISO), parseISO(data.phase.start_date)) + 1
          )
        )
      : 0
  );
  const phaseWeek = $derived(phaseElapsed > 0 ? Math.min(4, Math.floor((phaseElapsed - 1) / 7) + 1) : 0);
</script>

<div class="analysis">
  <!-- Phase strip -->
  {#if data.phase && data.phaseProgress}
    <header class="phase-strip">
      <div class="phase-id">
        <span class="phase-tag">{data.phase.short_name}</span>
        <span class="phase-name">{data.phase.name}</span>
      </div>
      <div class="phase-dates">{format(parseISO(data.phase.start_date), 'MMM d')} – {format(parseISO(data.phase.end_date), 'MMM d')}</div>
      <div class="phase-meta">
        <span><b>Week {phaseWeek}</b>/4</span>
        <span>{data.phaseProgress.sessions_completed}/{data.phaseProgress.sessions_total} sessions</span>
        <span>{data.phaseProgress.sets_completed}/{data.phaseProgress.sets_total} sets</span>
        <span class="time-track" title="Time elapsed">
          <span class="time-fill" style="width: {(phaseElapsed / Math.max(1, phaseDays)) * 100}%;"></span>
        </span>
      </div>
    </header>
  {/if}

  <!-- Row 1: priority trio -->
  <section class="top-row">
    <PriorityChart title="Body weight" unit="kg" primary={weightPoints} yPad={2} />
    <PriorityChart title="Pull-up · est. 1RM" unit="kg" primary={pullPoints} yPad={3} />
    <PriorityChart
      title="Tindeq peak force · 20mm"
      unit="kg"
      primary={tindeqRPoints}
      secondary={tindeqLPoints}
      primaryLabel="R"
      secondaryLabel="L"
      yPad={3}
    />
  </section>

  <!-- Row 2: weekly load + volume — half each, taller -->
  <section class="bottom-row">
    <div class="card no-pad">
      <WeeklyLoadChart weeks={data.weeklyLoad} todayISO={data.todayISO} />
    </div>
    <div class="card no-pad">
      <WeeklyVolumeChart weeks={data.weeklyLoad} todayISO={data.todayISO} />
    </div>
  </section>

  <!-- Row 3: nutrition consistency -->
  <section class="nutrition-row">
    <NutritionConsistencyCard
      days={data.nutritionConsistency.days}
      calorieStreak={data.nutritionConsistency.calorieStreak}
      calorieLongest={data.nutritionConsistency.calorieLongest}
      proteinStreak={data.nutritionConsistency.proteinStreak}
      proteinLongest={data.nutritionConsistency.proteinLongest}
      bothStreak={data.nutritionConsistency.bothStreak}
      daysLogged={data.nutritionConsistency.daysLogged}
      daysInRange={data.nutritionConsistency.daysInRange}
    />
  </section>
</div>

<style>
  .analysis {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
  }

  /* ---------- Phase strip ---------- */
  .phase-strip {
    display: grid;
    grid-template-columns: auto auto 1fr;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-3) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }
  .phase-id { display: flex; align-items: center; gap: var(--space-3); }
  .phase-tag {
    font: var(--weight-bold) 12px/1 var(--font-sans);
    letter-spacing: 0.08em;
    padding: 4px var(--space-2);
    color: var(--color-fg-inverse);
    background: var(--color-bg-inverse);
    border-radius: var(--radius-1);
  }
  .phase-name {
    font: var(--weight-semibold) 14px/1 var(--font-sans);
    color: var(--color-fg-default);
  }
  .phase-dates {
    font: var(--weight-medium) 13px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }
  .phase-meta {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-4);
    font: var(--text-body-sm-weight) 12px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-muted);
  }
  .phase-meta b { color: var(--color-fg-default); font-weight: var(--weight-semibold); }
  .time-track {
    width: 120px;
    height: 4px;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    overflow: hidden;
    display: inline-block;
  }
  .time-fill { display: block; height: 100%; background: var(--color-bg-accent); }

  /* ---------- Top row ---------- */
  .top-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-3);
    align-items: stretch;
  }

  /* ---------- Bottom rows: card primitive ---------- */
  .card {
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    overflow: hidden;
    min-width: 0;
  }
  .card.no-pad { padding: 0; }

  .card :global(.weekly),
  .card :global(.vol) {
    padding: var(--space-4) var(--space-5) !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
  }
  .card :global(.weekly .chart),
  .card :global(.vol .chart) {
    height: 260px;
    min-width: 0 !important;
  }

  .bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  /* ---------- Responsive ---------- */
  @media (max-width: 1200px) {
    .top-row { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 768px) {
    .top-row { grid-template-columns: 1fr; }
    .bottom-row { grid-template-columns: 1fr; }
    .phase-strip { grid-template-columns: 1fr; }
    .phase-meta { justify-content: flex-start; }
  }
</style>
