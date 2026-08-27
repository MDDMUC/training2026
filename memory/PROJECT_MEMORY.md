# Project Memory — Training 2026

Durable state. Update when facts change; do not put ephemeral chat noise here.

Harvested 2026-08-27 from Claude Code memory at `~/.claude/projects/C--Users-heyma/memory/` (`project_training2026.md`, `reference_training2026_urls.md`, `reference_training_methodology.md`, `feedback_training2026_autonomy.md`, `user_climbing.md`) plus live repo inspection.

## Identity

| Field | Value |
|-------|-------|
| Path | `C:\Users\heyma\training2026` |
| Purpose | Plan, log, analyze climbing training (H2 2026) |
| Owner | Martin Drexler (`martin`) + Antonia (`antonia`) |
| Production | https://training2026-xi.vercel.app |
| GitHub | https://github.com/MDDMUC/training2026 |
| Brand in UI | **BICEPS** (repo name stays training2026) |

## Users

- `martin` — hello@martindrexler.com — owns the H2 2026 plan (migrated from local SQLite).
- `antonia` — placeholder email — plan crafted separately.
- Seeded password for both: `apple` (bcrypt in DB). Login accepts user id or email. Change after first login if not already.

## Stack

- SvelteKit 2 + Svelte 5 runes, TypeScript strict
- Postgres on Supabase via **postgres.js** (async)
- Custom HMAC-signed cookie `t26_session` (`src/lib/server/auth.ts` + `hooks.server.ts`) — no Auth.js, no Supabase Auth
- adapter-vercel
- date-fns, custom SVG charts
- No Tailwind, no UI kit
- Nutrition NL parse uses Anthropic (`ANTHROPIC_API_KEY` in `.env.local`)

## Infra

- **Supabase project ref:** `gohqxsbqswyomyfeuipt`
- Dashboard: https://supabase.com/dashboard/project/gohqxsbqswyomyfeuipt
- Region: eu-west-1, Postgres 17.6
- Always **Transaction pooler port 6543**. Direct 5432 is IPv6-only.
- Vercel env vars mirror local `.env.local`
- Tenancy: every table has `user_id` or inherits via `sessions.user_id`. No RLS.

## Martin as athlete (baseline 2026-05-28 — verify live before quoting)

- Age 43, BW ~82 kg, sport ~8a, target beyond
- Tindeq 20 mm one-arm: R 55 / L 52 kg (left A2 healed)
- Pull-up: +18 kg × 5; estimated 1RM ~+30–35 kg added
- Knee: ACL reconstruction + meniscus stitch Jan 22 2024
- **Back joint misaligned (2026-08), being adjusted. Cannot fully train.**
- Tools: Tindeq Progressor, hangboard, weights
- Outdoor window: Aug–early Sep 2026 — paused for the joint
- No FlexBar / Tindeq extensor — bands for extensors

## Plan

- **Active:** spine reset — see `plan/07-reset-spine.md`. HOLD 14 days (walk/rest) then RESTORE 28 days (same constraint, longer walks). No hangs, pull-ups, climbing, running.
- **Archived (not deleted):** H2 2026 Wed 2026-06-10 → Tue 2026-09-01. `sessions.archived` + `cycle_name='H2 2026'`. Log → Previous plan.
- Next performance block is a new decision after clearance. Do not auto-resume Phase 3.
- Schema: `phases.archived`, `sessions.archived`, `cycle_name`. Current surfaces filter `archived=false`. Analysis/PR/exercise library still read lifetime rows.

## Product (beyond the original CLAUDE.md catalog)

Shipped after the charter was written, still live:

- Nutrition on Today + Analysis (profile, manual entry, NL parse, consistency card)
- Sessionless daily check-in
- Free-form log (`/log/free`)
- Rest-timer chime, optimistic save badges, category tints on Today
- BICEPS login (video bg, magenta, wordmark)

## Collaboration

- Autonomy mode (see `DECISIONS.md`)
- Martin pastes context from other chatbots — treat as authoritative
- He pushes back directly; respond with root-cause, not hedging
- Grok is coding agent here for now. Do not redesign. Permission style: routine edits yes; deps/destructive/push = confirm

## Claude Code sources (acquired, not duplicated as working copies)

| File | Role |
|------|------|
| `~/.claude/projects/C--Users-heyma/memory/project_training2026.md` | Project fact sheet |
| `reference_training2026_urls.md` | URLs / Supabase |
| `reference_training_methodology.md` | Pointers into `context/` |
| `feedback_training2026_autonomy.md` | Autonomy |
| `user_climbing.md` | Martin as domain expert |
| `CLAUDE.md` (repo) | Architecture charter |

No project-local Claude skills existed (only `.claude/settings.local.json` permission allow-list). Claude sessions for this work lived under the home project `C--Users-heyma`, not a dedicated `training2026` session folder — `session_reader` against this cwd returned none.

## Known doc drift

- `README.md` still says local SQLite / no auth
- `CLAUDE.md` still says accent `#E85D04` (actual: magenta `#FF00FF`)
- `CLAUDE.md` "What this project is" still says "single-user local app"
