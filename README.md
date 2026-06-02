# Training 2026

Local web app for planning, logging, and analyzing my climbing training for the second half of 2026.

Single user. Local-only (SQLite). No cloud, no auth, no telemetry. Runs at `http://localhost:5173` with `npm run dev`.

## Quick start

```bash
npm install            # one time
npm run db:init        # one time — schema + 12-week plan + baselines
npm run dev            # opens http://localhost:5173
```

Data lives in `db/training.db`. Back up by copying that file (or use Settings → Download .json).

## What it does

**Surfaces:**

| Route | Purpose |
|---|---|
| `/` | Today landing — morning check-in, current session, this-week snapshot, goals, insights, next session |
| `/calendar` | 12-week month view with phase strip |
| `/calendar/week` | Single-week vertical list |
| `/calendar/phase/[1\|2\|3]` | One phase, four weeks at a glance |
| `/log` | All sessions, filterable by view (past/upcoming/completed/pending) and type |
| `/log/by-date/[YYYY-MM-DD]` | The session editor — prescription, ticks, weight, climbs, runs, tests |
| `/exercise` | Library index — every distinct exercise with instance counts |
| `/exercise/[name]` | Drill-down — trend chart + every appearance + athlete notes |
| `/pr` | Personal records — lifetime peaks across every metric |
| `/analysis` | Phase summary, goals, asymmetry, charts, weekly load, weekly volume, climbing summary, climbing progression, activity heatmap |
| `/settings` | DB stats, ICS / JSON export, JSON restore, about |
| `/api/calendar.ics` | iCal export (importable to Google / Apple / Outlook) |
| `/api/backup.json` | Full DB snapshot |
| `/api/restore?confirm=true` | POST a backup back (guarded) |

**Keyboard:**

- `⌘K` / `Ctrl+K` — command palette
- `?` — help overlay
- `t · c · w · l · e · a · p · s` — Today / Calendar / Week / Log / Exercises / Analysis / PR / Settings
- `Esc` — close overlays

## Tech stack

- **SvelteKit 2** + **Svelte 5** (runes)
- **TypeScript**
- **better-sqlite3** — single-file local DB
- **date-fns**
- **Custom SVG charts** — no Chart.js, no D3
- **No Tailwind, no UI kit** — Svelte scoped `<style>` + the design system tokens in `design-system/tokens/tokens.css`

## Project layout

```
training2026/
├── CLAUDE.md                              Charter + AI guidance for this project
├── README.md                              This file
├── package.json · svelte.config.js · vite.config.ts · tsconfig.json
├── db/                                    SQLite DB (gitignored)
├── scripts/
│   ├── init-db.ts                         Idempotent: schema + seed + migrations
│   └── reset-db.ts                        Destructive: nukes db/training.db
├── context/                               Research + integrated coaching position
│   ├── synthesis.md                       ← read first
│   ├── research_lattice.md
│   ├── research_camp4hp_nelson.md
│   ├── research_hoopers_beta.md
│   ├── research_periodization.md
│   └── jetgpt_dump.md                     Original ChatGPT context dump
├── plan/                                  The 12-week training plan
│   ├── 00-overview.md                     ← read first
│   ├── 01-weekly-template.md
│   ├── 02-phase1-base-tendon-prep.md      ← fully detailed
│   ├── 03-phase2-max-strength.md          skeleton (calibrated after Week 4 retest)
│   ├── 04-phase3-power-peak.md            skeleton (calibrated after Week 8 retest)
│   ├── 05-testing-protocol.md
│   └── 06-exercise-library.md
├── design-system/                         Token system + atomic-design + component specs
│   ├── README.md
│   ├── 01-principles.md                   10 visual rules
│   ├── 02-tokens.md                       Three-tier token taxonomy
│   ├── 03-atomic-design.md
│   ├── 04-components.md
│   └── tokens/
│       ├── tokens.json                    W3C DTCG source of truth
│       └── tokens.css                     CSS custom properties
└── src/
    ├── app.html · app.css · app.d.ts
    ├── lib/
    │   ├── atoms/                         Text · Button · Rule
    │   ├── molecules/                     Stat · Tag · Field-style entries (SetRow, SessionMeta, etc.)
    │   ├── organisms/                     24 components (charts, lists, overlays, summaries)
    │   ├── stores/                        Svelte 5 runes-based shared state (rest timer, palette, help)
    │   ├── domain/                        types · prescriptions · goals · insights · load · schedule
    │   ├── utils/                         markdown · grade-ranking
    │   └── db/                            schema.sql · index.ts · queries.ts
    └── routes/                            +layout, +page, and the 9 surfaces above
```

## Key data model

- `phases` — 3 mesocycles (BASE, MAX, PEAK)
- `sessions` — 84 scheduled days, with status fields for `completed`, `body_weight_kg`, `sleep_hours`, `readiness`, `notes`
- `exercises` — per-session entries; `notes` is the prescription, `athlete_notes` is the user's own annotations
- `exercise_sets` — atomic unit; `kind` is `warmup|work|backoff|checklist`, plus `completed`, `load_kg`, `load_kg_added`, `hold_seconds`, `rest_seconds`, `rpe`
- `tindeq_tests` · `pullup_tests` — separate tables for benchmark records
- `climbing_attempts` — per-route logs on climbing days (grade, style, notes)
- `running_logs` — per-run logs with computed pace

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on :5173, opens browser |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript + Svelte type checks |
| `npm run db:init` | Initialise + idempotent seed + migrations |
| `npm run db:reset` | Delete `db/training.db` (destructive) |

## Backup / restore

- **Easiest backup**: copy `db/training.db` anywhere
- **Portable backup**: Settings → `Download .json` → ~220 kB structured snapshot of every table
- **Restore**: Settings → upload `.json` → confirms in browser → wipes and replaces in a transaction (guarded against empty payloads)

## Print

`⌘P` / `Ctrl+P` on any day-detail page produces a gym-ready paper sheet (serif typography, hidden chrome, set tick boxes as outlined squares).
