<script lang="ts">
  import Stat from '$lib/molecules/Stat.svelte';
  import Tag from '$lib/molecules/Tag.svelte';
  import Button from '$lib/atoms/Button.svelte';
  import ThisWeekCard from '$lib/organisms/ThisWeekCard.svelte';
  import MorningCheckIn from '$lib/molecules/MorningCheckIn.svelte';
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
  <!-- ============================== HERO ============================== -->
  <section class="hero">
    <!-- LEFT — current status -->
    <div class="hero-status">
      <p class="hero-eyebrow">{data.todayLabel}</p>

      {#if data.phase}
        <div class="hero-phase">
          <Tag variant="filled">{data.phase.short_name}</Tag>
          <span class="hero-phase-name">{data.phase.name}</span>
        </div>
      {/if}

      {#if data.todaySession}
        <h1 class="hero-title">{data.todaySession.title ?? SESSION_TYPE_LABELS[data.todaySession.type]}</h1>
        <p class="hero-subtitle">{SESSION_TYPE_LABELS[data.todaySession.type]}</p>
        <div class="hero-actions">
          <Button variant="primary" href="/log/by-date/{data.todayISO}">Log this session</Button>
          <Button variant="ghost" href="/log/free">Log free session</Button>
        </div>
      {:else}
        <h1 class="hero-title">No session today</h1>
        <p class="hero-subtitle">Today is unscheduled. The plan starts Wed Jun 10.</p>
        <div class="hero-actions">
          <Button variant="primary" href="/log/free">Log a free session</Button>
          <Button variant="ghost" href="/calendar">Open calendar</Button>
        </div>
      {/if}
    </div>

    <!-- DIVIDER -->
    <div class="hero-divider" aria-hidden="true"></div>

    <!-- RIGHT — next session card (always shown when there's a next) -->
    {#if data.nextSession}
      <a class="hero-next" href="/log/by-date/{data.nextSession.date}">
        <span class="next-eyebrow">Up next</span>
        <span class="next-date">{format(parseISO(data.nextSession.date), 'EEEE, MMM d')}</span>
        <span class="next-type">{SESSION_TYPE_LABELS[data.nextSession.type]}</span>
        <span class="next-title">{data.nextSession.title ?? SESSION_TYPE_LABELS[data.nextSession.type]}</span>
        <span class="next-arrow">Open <span aria-hidden="true">→</span></span>
      </a>
    {/if}
  </section>

  <!-- ============================ SUPPLEMENT REMINDER ============================ -->
  <SupplementBanner />

  <!-- ============================ BENCHMARKS ============================ -->
  <section class="benchmarks">
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
  </section>

  <!-- ============================ DASHBOARD ============================ -->
  <section class="dashboard">
    <div class="col">
      {#if data.todaySession}
        <MorningCheckIn
          sessionId={data.todaySession.id}
          bodyWeight={data.todaySession.body_weight_kg}
          sleepHours={data.todaySession.sleep_hours}
          readiness={data.todaySession.readiness}
          prevBodyWeight={data.bodyweight?.body_weight_kg ?? null}
        />
      {/if}

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
    </div>

    <div class="col">
      <InsightsCard insights={data.insights} />
      <NutritionCard
        entries={data.nutrition.entries}
        totals={data.nutrition.totals}
        targets={data.nutrition.targets}
        activityCalories={data.nutrition.activityCalories}
        bodyWeightKg={data.nutrition.bodyWeightKg}
      />
    </div>
  </section>
</div>

<style>
  .today-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    /* No max-width — fill the full main-content width on any monitor */
    width: 100%;
  }

  /* ============================== HERO ============================== */
  .hero {
    display: grid;
    grid-template-columns: 1fr 1px minmax(340px, 1fr);
    gap: var(--space-6);
    padding: var(--space-6);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
    align-items: stretch;
  }

  .hero-status {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .hero-eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-3);
  }

  .hero-phase {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .hero-phase-name {
    font: var(--text-body-sm-weight) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-muted);
  }

  .hero-title {
    font: var(--text-h1-weight) var(--text-h1-size)/var(--text-h1-line) var(--font-sans);
    letter-spacing: var(--text-h1-tracking);
    color: var(--color-fg-default);
    margin: 0 0 var(--space-2) 0;
  }

  .hero-subtitle {
    font: var(--text-body-weight) var(--text-body-size)/1.4 var(--font-sans);
    color: var(--color-fg-muted);
    margin: 0 0 auto 0; /* push actions to bottom */
    padding-bottom: var(--space-5);
    max-width: 48ch;
  }

  .hero-actions {
    display: flex;
    gap: var(--space-2);
  }

  .hero-divider {
    width: 1px;
    background: var(--color-border-default);
    align-self: stretch;
  }

  /* --- RIGHT side: next session as a clickable card --- */
  .hero-next {
    display: grid;
    grid-template-rows: auto auto auto 1fr auto;
    gap: var(--space-2);
    color: var(--color-fg-default);
    text-decoration: none;
    padding: var(--space-4) var(--space-5);
    margin: calc(var(--space-2) * -1);
    border-radius: var(--radius-2);
    transition: background var(--motion-default) var(--ease-standard);
  }
  .hero-next:hover {
    background: var(--color-bg-subtle);
    text-decoration: none;
  }

  .next-eyebrow {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .next-date {
    font: var(--weight-semibold) 22px/1.1 var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--color-fg-default);
    letter-spacing: -0.01em;
  }

  .next-type {
    font: var(--text-micro-weight) var(--text-micro-size)/1 var(--font-sans);
    letter-spacing: var(--text-micro-tracking);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  .next-title {
    font: var(--text-body-weight) var(--text-body-size)/1.4 var(--font-sans);
    color: var(--color-fg-default);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .next-arrow {
    font: var(--weight-semibold) var(--text-body-sm-size)/1 var(--font-sans);
    color: var(--color-fg-accent);
    margin-top: var(--space-2);
  }
  .next-arrow span { margin-left: 4px; }

  /* ============================ BENCHMARKS ============================ */
  .benchmarks {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-2);
    background: var(--color-bg-surface);
  }
  .bm-cell { min-width: 0; }
  .benchmarks :global(.stat-value) { font-size: 24px !important; }
  .benchmarks :global(.stat-label) { font-size: 10px !important; }
  .benchmarks :global(.stat-delta) { font-size: 11px; }

  /* ============================ DASHBOARD ============================ */
  .dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    align-items: stretch;
  }

  .col {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  /* Stretch the single child in col-b so Insights matches col-a's height */
  .col > :global(*:only-child) { height: 100%; }

  /* ============================ RESPONSIVE ============================ */
  @media (max-width: 1280px) {
    .benchmarks { grid-template-columns: repeat(4, 1fr); row-gap: var(--space-4); }
    .hero { grid-template-columns: 1fr; }
    .hero-divider { display: none; }
    .hero-next { margin: 0; padding: var(--space-3) 0 0 0; border-top: 1px solid var(--color-border-default); }
  }

  @media (max-width: 768px) {
    .benchmarks { grid-template-columns: repeat(2, 1fr); }
    .dashboard { grid-template-columns: 1fr; }
  }
</style>
