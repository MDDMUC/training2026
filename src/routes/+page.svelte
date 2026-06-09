<script lang="ts">
  import Stat from '$lib/molecules/Stat.svelte';
  import Tag from '$lib/molecules/Tag.svelte';
  import Button from '$lib/atoms/Button.svelte';
  import ThisWeekCard from '$lib/organisms/ThisWeekCard.svelte';
  import DailyCheckIn from '$lib/molecules/DailyCheckIn.svelte';
  import SupplementBanner from '$lib/molecules/SupplementBanner.svelte';
  import InsightsCard from '$lib/organisms/InsightsCard.svelte';
  import NutritionCard from '$lib/organisms/NutritionCard.svelte';
  import { SESSION_TYPE_LABELS } from '$lib/domain/types';
  import { parseISO, format } from 'date-fns';

  let { data } = $props();

  const paceMins = $derived(
    data.latestRun?.pace_min_per_km !== null && data.latestRun?.pace_min_per_km !== undefined
      ? Math.floor(data.latestRun.pace_min_per_km)
      : null
  );
  const paceSecs = $derived(
    data.latestRun?.pace_min_per_km !== null && data.latestRun?.pace_min_per_km !== undefined
      ? Math.round((data.latestRun.pace_min_per_km - Math.floor(data.latestRun.pace_min_per_km)) * 60)
      : null
  );
</script>

<div class="today-page">
  <!-- ============================== HEADER STRIP ============================== -->
  <header class="page-head">
    <div class="head-left">
      <p class="eyebrow">{data.todayLabel}</p>
      {#if data.phase}
        <div class="phase-row">
          <Tag variant="filled">{data.phase.short_name}</Tag>
          <span class="phase-name">{data.phase.name}</span>
        </div>
      {/if}
    </div>
    {#if data.nextSession}
      <a class="next-pill" href="/log/by-date/{data.nextSession.date}">
        <span class="next-eyebrow">Up next</span>
        <span class="next-date">{format(parseISO(data.nextSession.date), 'EEE MMM d')}</span>
        <span class="next-type">{SESSION_TYPE_LABELS[data.nextSession.type]}</span>
        <span class="next-arrow" aria-hidden="true">→</span>
      </a>
    {/if}
  </header>

  <SupplementBanner />

  <!-- ============================== 1 · DAILY CHECK-IN (always present) ============================== -->
  <DailyCheckIn
    bodyWeight={data.dailyCheckIn.body_weight_kg}
    sleepHours={data.dailyCheckIn.sleep_hours}
    readiness={data.dailyCheckIn.readiness}
    prevBodyWeight={data.bodyweight?.body_weight_kg ?? null}
    dateLabel={data.todayLabel}
  />

  <!-- ============================== 2 · NUTRITION ============================== -->
  <NutritionCard
    entries={data.nutrition.entries}
    totals={data.nutrition.totals}
    targets={data.nutrition.targets}
    activityCalories={data.nutrition.activityCalories}
    bodyWeightKg={data.nutrition.bodyWeightKg}
  />

  <!-- ============================== 3 · TODAY'S SESSION STRIP ============================== -->
  <section class="session-strip" class:has-session={!!data.todaySession}>
    {#if data.todaySession}
      <div class="session-info">
        <span class="session-eyebrow">Today's session</span>
        <h2 class="session-title">{data.todaySession.title ?? SESSION_TYPE_LABELS[data.todaySession.type]}</h2>
        <span class="session-type">{SESSION_TYPE_LABELS[data.todaySession.type]}</span>
      </div>
      <div class="session-actions">
        <Button variant="primary" href="/log/by-date/{data.todayISO}">Log this session</Button>
        <Button variant="ghost" href="/log/free">Log free session</Button>
      </div>
    {:else}
      <div class="session-info">
        <span class="session-eyebrow">Today's session</span>
        <h2 class="session-title rest">Rest day</h2>
        <span class="session-type">Nothing scheduled — check-in is enough.</span>
      </div>
      <div class="session-actions">
        <Button variant="ghost" href="/log/free">Log a free session</Button>
        <Button variant="ghost" href="/calendar">Open calendar</Button>
      </div>
    {/if}
  </section>

  <!-- ============================== 4 · INSIGHTS ============================== -->
  <InsightsCard insights={data.insights} />

  <!-- ============================== 5 · THIS WEEK ============================== -->
  <ThisWeekCard
    startISO={data.week.startISO}
    endISO={data.week.endISO}
    sessionsTotal={data.week.sessionsTotal}
    sessionsCompleted={data.week.sessionsCompleted}
    setsTotal={data.week.setsTotal}
    setsCompleted={data.week.setsCompleted}
    climbs={data.week.climbs}
    sleepAvg={data.week.sleepAvg}
    tonnageKg={data.week.tonnageKg}
    isometricSeconds={data.week.isometricSeconds}
    runsCount={data.week.runsCount}
    runKm={data.week.runKm}
  />

  <!-- ============================== 6 · BENCHMARKS (reference) ============================== -->
  <section class="benchmarks" aria-label="Latest benchmarks">
    <h3 class="bm-title">Latest benchmarks</h3>
    <div class="bm-grid">
      {#if data.tindeq.R}
        <div class="bm-cell">
          <Stat label="Tindeq R · 20mm" value={data.tindeq.R.peak_force_kg.toFixed(1)} unit="kg" />
        </div>
      {/if}
      {#if data.tindeq.L}
        <div class="bm-cell">
          <Stat label="Tindeq L · 20mm" value={data.tindeq.L.peak_force_kg.toFixed(1)} unit="kg" />
        </div>
      {/if}
      {#if data.tindeqAsymmetry !== null}
        <div class="bm-cell">
          <Stat
            label="Asymmetry"
            value={data.tindeqAsymmetry.toFixed(1)}
            unit="%"
            delta={Math.abs(data.tindeqAsymmetry) < 3 ? 'within target' : 'L hand priority'}
          />
        </div>
      {/if}
      {#if data.pullup}
        <div class="bm-cell">
          <Stat
            label="Pull-up est. 1RM"
            value={`+${data.pullup.estimated_1rm_added_kg.toFixed(1)}`}
            unit="kg"
          />
        </div>
      {/if}
      {#if data.bodyweight}
        <div class="bm-cell">
          <Stat label="Body weight" value={data.bodyweight.body_weight_kg.toFixed(1)} unit="kg" />
        </div>
      {/if}
      {#if data.sleep}
        <div class="bm-cell">
          <Stat label="Sleep · last night" value={data.sleep.sleep_hours.toFixed(1)} unit="h" />
        </div>
      {/if}
      {#if data.latestRun && paceMins !== null && paceSecs !== null}
        <div class="bm-cell">
          <Stat
            label="Latest run pace"
            value={`${paceMins}:${paceSecs.toString().padStart(2, '0')}`}
            unit="/km"
          />
        </div>
      {/if}
    </div>
  </section>
</div>

<style>
  .today-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  /* ============================== HEAD STRIP ============================== */
  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--color-border-default);
  }
  .head-left { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
  .eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin: 0;
  }
  .phase-row { display: flex; align-items: center; gap: var(--space-2); }
  .phase-name {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .next-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    color: var(--color-fg-default);
    text-decoration: none;
    transition: background var(--motion-default) var(--ease-standard);
    white-space: nowrap;
  }
  .next-pill:hover { background: var(--color-bg-subtle); text-decoration: none; }
  .next-eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .next-date {
    font: var(--weight-semibold) 14px/1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
  }
  .next-type {
    font: var(--text-body-sm-weight) 12px/1 var(--font-sans);
    color: var(--color-fg-muted);
  }
  .next-arrow { color: var(--color-fg-accent); font: var(--weight-bold) 14px/1 var(--font-sans); }

  /* ============================== SESSION STRIP ============================== */
  .session-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-4) var(--space-6);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }
  .session-strip:not(.has-session) { background: var(--color-bg-subtle); }
  .session-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .session-eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }
  .session-title {
    font: var(--weight-bold) 22px/1.15 var(--font-sans);
    letter-spacing: -0.01em;
    color: var(--color-fg-default);
    margin: 0;
  }
  .session-title.rest { color: var(--color-fg-muted); }
  .session-type {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1.4 var(--font-sans);
    color: var(--color-fg-muted);
  }
  .session-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  /* ============================== BENCHMARKS ============================== */
  .benchmarks {
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }
  .bm-title {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin: 0 0 var(--space-3) 0;
  }
  .bm-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--space-3);
  }
  .bm-cell { min-width: 0; }
  .bm-grid :global(.stat-value) { font-size: 22px !important; }
  .bm-grid :global(.stat-label) { font-size: 10px !important; }
  .bm-grid :global(.stat-delta) { font-size: 11px; }

  /* ============================== RESPONSIVE ============================== */
  @media (max-width: 1280px) {
    .bm-grid { grid-template-columns: repeat(4, 1fr); row-gap: var(--space-4); }
  }
  @media (max-width: 768px) {
    .today-page { gap: var(--space-3); }
    .page-head {
      flex-direction: column;
      align-items: stretch;
      padding: var(--space-3) var(--space-4);
      gap: var(--space-3);
    }
    .next-pill {
      width: 100%;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
    }
    .session-strip {
      flex-direction: column;
      align-items: stretch;
      padding: var(--space-4) var(--space-5);
      gap: var(--space-3);
    }
    .session-title { font-size: 19px; line-height: 1.2; }
    .session-actions { gap: var(--space-2); }
    .session-actions :global(a) { flex: 1; text-align: center; }
    .benchmarks { padding: var(--space-3) var(--space-4); }
    .bm-grid { grid-template-columns: repeat(2, 1fr); row-gap: var(--space-3); }
    .bm-grid :global(.stat-value) { font-size: 20px !important; }
  }
  @media (max-width: 380px) {
    .bm-grid :global(.stat-value) { font-size: 18px !important; }
  }
</style>
