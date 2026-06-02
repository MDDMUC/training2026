# Training 2026

A **local-only web app** to help Martin plan, structure, analyze, and document his **climbing training for the second half of 2026**.

For a full feature catalog and route map, see `README.md`. For research notes, see `context/synthesis.md` and the four research files alongside it. For the training plan, start at `plan/00-overview.md`.

## What this project is

Single-user local app. Martin trains. The app supports the plan, captures every set, and makes the data legible.

Currently shipped surfaces:

- **Today** (`/`) — morning check-in (weight / sleep / readiness), insights, current session, this-week snapshot, goals progress, latest benchmarks, next session
- **Calendar** (`/calendar`, `/calendar/week`, `/calendar/phase/[1|2|3]`) — month + week + phase views, ICS export
- **Log** (`/log`, `/log/by-date/[date]`) — session history list with filters; full day editor with prescription, tick boxes, inline load/rep editing, body weight, climbing log, running log, Tindeq + Pull-up quick-logs on test days, exercise athlete-notes, session meta (RPE, duration, notes), prev/next day nav, add/delete ad-hoc exercises and sets, PR badge in exercise context
- **Exercises** (`/exercise`, `/exercise/[name]`) — library index + per-exercise drill-down with trend chart + every instance with athlete notes
- **PR** (`/pr`) — lifetime peaks across Tindeq, pull-up, climbing grades, run pace/distance, peak tonnage week, best top-set per exercise
- **Analysis** (`/analysis`) — phase summary card, goals, asymmetry gauge, pull-up + body weight + sleep + running pace + run distance line charts, Tindeq dual-line chart, weekly load chart, weekly volume (tonnage) chart, activity heatmap, climbing summary + progression scatter
- **Settings** (`/settings`) — DB stats, ICS + JSON exports, JSON restore (guarded)

Global: rest timer (sessionStorage-persistent), ⌘K command palette, ? help overlay, single-key shortcuts (t c w l e a p s), print stylesheet for gym sheets, dark mode, full mobile responsive layout.

## Operating principles for this project

- **Local-first.** Storage stays on disk. No external services unless explicitly requested.
- **Calendar and analysis are not separate apps.** They share one data model — every analysis view derives from logged calendar entries.
- **Climbing-specific, not generic fitness.** Vocabulary, metrics, and structures reflect climbing training (grades, projects, fingerboard, RPE, density hangs, etc.) — not weightlifting or running paradigms.
- **Martin is the only user and the domain expert.** Defer to him on training methodology. Don't invent a training philosophy — implement his.
- **H2 2026 horizon.** Data model comfortably covers ~6 months of daily logging. Don't over-engineer for multi-year history yet.
- **Autonomy mode.** "Keep going" means pick the next-best item from the open list and ship it. Don't gate further work on his answer unless it's a genuine decision point.

## Tech stack

- **SvelteKit 2** + **Svelte 5 (runes)** — see `feedback_training2026_autonomy` in memory for collaboration style
- **TypeScript** strict
- **better-sqlite3** — single-file local DB at `db/training.db`, synchronous API
- **date-fns** — date math
- **Custom SVG charts** — full token control
- **No Tailwind, no UI kit** — Svelte scoped `<style>` + `design-system/tokens/tokens.css`

## Project layout

```
training2026/
├── context/                Research notes — synthesis.md is the integrated coaching position
├── plan/                   12-week plan, phase by phase
├── design-system/          Principles, tokens (W3C DTCG), atomic-design taxonomy, component specs
├── scripts/                init-db.ts (idempotent), reset-db.ts (destructive)
├── db/                     SQLite (gitignored)
└── src/
    ├── lib/
    │   ├── atoms/          Text · Button · Rule
    │   ├── molecules/      Stat · Tag · SetRow · SessionMeta · BodyWeightLog · MorningCheckIn · ExerciseContext
    │   ├── organisms/      24 components — calendar grids, charts, overlays, summaries, logs
    │   ├── stores/         Svelte 5 runes-based shared state (rest timer, palette, help)
    │   ├── domain/         types · prescriptions · goals · insights · load · schedule
    │   ├── utils/          markdown · grade
    │   └── db/             schema.sql · index.ts · queries.ts
    └── routes/             9 surfaces + /api/{calendar.ics, backup.json, restore}
```

## Data model

`phases` (3) → `sessions` (84 seeded) → `exercises` (per-session) → `exercise_sets` (atomic unit, `kind` ∈ warmup/work/backoff/checklist, `completed`, load, reps, hold, rest, RPE).

Parallel tables for benchmark records: `tindeq_tests`, `pullup_tests`. Parallel tables for type-specific logs: `climbing_attempts`, `running_logs`.

Migration pattern: `scripts/init-db.ts` runs schema, then explicit `ensureColumn()` checks for added columns (because `CREATE TABLE IF NOT EXISTS` doesn't alter existing tables). Adding a new column? Add to `schema.sql` for fresh installs AND add an `ensureColumn(...)` line in `init-db.ts`.

## Style and design

- Black-and-white achromatic palette with a single sparse accent (signal-orange `#E85D04`). See `design-system/01-principles.md` for the 10 visual rules.
- **No emoji in UI** unless explicitly requested.
- Avoid generic AI-design tropes: avoid pastel-gradient hero sections, "Welcome to your dashboard" boilerplate, glassmorphic cards.
- Dark mode is a peer, tuned separately (not just inverted).
- All inline markdown in seeded prescription notes is rendered via `lib/utils/markdown.ts`.

## Workflow expectations

- Martin pastes context from other chatbots when it's faster than re-discussion. Treat those as authoritative — read and incorporate.
- **Confirm before installing dependencies or making destructive changes.** Routine writes/edits don't need confirmation (autonomy memory).
- He pushes back directly when output is bad. Respond with root-cause analysis, not hedging.
- See `feedback_training2026_autonomy` memory for the autonomous-continuation pattern.

## Open items (durable)

- **Phase 2 + 3 detailed prescriptions** are skeleton-only by design — they get filled in after the Week 4 (Jul 4) and Week 8 (Aug 1) test sessions reveal the new MVC and 1RM numbers.
- **Drag-to-reorder exercises** — functionality exists via delete + re-add, drag handles are pure polish.
- **Toast notifications** — saves are silent by design; the visible state change is the feedback.
