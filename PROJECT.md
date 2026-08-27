# Training 2026 — Project Hub

Cloud-hosted climbing-training log for Martin and Antonia. Grok Build project install: 2026-08-27.

**Production:** https://training2026-xi.vercel.app (auto-deploys from `main`)
**GitHub:** https://github.com/MDDMUC/training2026
**Local:** `npm run dev` talks to production Supabase.

The product is branded **BICEPS** on the login / wordmark. Repo and URLs stay `training2026`.

---

## What it is

Martin trains. The app holds the H2 2026 plan, captures every set, and makes the data legible. Antonia is a second tenant with her own plan.

Not a generic fitness tracker. Vocabulary is climbing: grades, projects, fingerboard, RPE, density hangs, Tindeq, A2, MVC.

---

## Folder map

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Product charter (surfaces, stack, data model) — Claude-era, still canonical for architecture |
| `src/routes/` | SvelteKit surfaces |
| `src/lib/atoms/` `molecules/` `organisms/` | UI — atomic design |
| `src/lib/domain/` | types, prescriptions, goals, insights, load, schedule, nutrition, timeOfDay |
| `src/lib/db/` | postgres.js client, queries, schema |
| `src/lib/server/auth.ts` | HMAC cookie auth |
| `design-system/` | Principles + tokens (W3C DTCG). `tokens/tokens.css` is visual source of truth |
| `context/` | Methodology research. **Read `synthesis.md` first** |
| `plan/` | 12-week plan. Start at `00-overview.md` |
| `scripts/` | One-shot DB / seed / migrate scripts |
| `memory/` | Session protocol, handoff, decisions, project memory |
| `.grok/skills/` | `/training2026`, `/training2026-code`, `/training2026-plan` |

`README.md` still describes the pre-cloud local-SQLite app. Trust `CLAUDE.md` + this file + live code over it.

---

## Skills

| Command | What it does |
|---------|----------------|
| `/training2026` | Orient: status, handoff, next action |
| `/training2026-code` | Scoped SvelteKit / Postgres / token-aware code change |
| `/training2026-plan` | Methodology and prescription work — Martin is the expert |

---

## Surfaces (live)

| Route | Purpose |
|-------|---------|
| `/` | Today — check-in, nutrition, insights, current session, week, goals |
| `/calendar`, `/calendar/week`, `/calendar/phase/[1\|2\|3]` | Month / week / phase |
| `/log`, `/log/by-date/[date]`, `/log/free` | History, day editor, free-form log |
| `/exercise`, `/exercise/[name]` | Library + drill-down |
| `/pr` | Lifetime peaks |
| `/analysis` | Charts, load, climbing, nutrition consistency |
| `/settings` | Stats, ICS + JSON export/restore |
| `/login` `/logout` | Cookie auth |
| `/api/calendar.ics` `/api/backup.json` `/api/restore` `/api/nutrition/parse` | APIs |

---

## Stack (current)

SvelteKit 2 + Svelte 5 runes · TypeScript strict · Postgres on Supabase via postgres.js (Transaction pooler, port 6543) · custom HMAC cookie auth · adapter-vercel · date-fns · custom SVG charts · no Tailwind.

Local `.env.local` (gitignored). Template: `.env.example`.

---

## Status

See [`memory/PROJECT_MEMORY.md`](memory/PROJECT_MEMORY.md) and [`memory/SESSION_HANDOFF.md`](memory/SESSION_HANDOFF.md).
