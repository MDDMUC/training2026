# Training 2026 — Agent Instructions

Cloud-hosted SvelteKit app for Martin (and Antonia) to plan, log, and analyze climbing training.

Grok is the coding agent in this repo for this stretch (replacing Claude Code). Do not redesign the architecture Claude built. Smallest diff that matches neighboring files.

Product charter (surfaces, stack, data model, open items): [`CLAUDE.md`](CLAUDE.md). Visual rules: [`design-system/01-principles.md`](design-system/01-principles.md). Tokens (source of truth): [`design-system/tokens/tokens.css`](design-system/tokens/tokens.css).

---

## Rule #1 — Session protocol (never skip)

**Before any work:** read [`memory/SESSION_PROTOCOL.md`](memory/SESSION_PROTOCOL.md) and follow the Session START checklist.

**Before ending a session:** follow the Session END checklist (append `SESSION_LOG.md`, rewrite `SESSION_HANDOFF.md`, dual-write durable facts).

---

## Session start (read order)

1. [`memory/SESSION_PROTOCOL.md`](memory/SESSION_PROTOCOL.md)
2. [`memory/SESSION_LOG.md`](memory/SESSION_LOG.md) — last 3–5 entries
3. [`memory/SESSION_HANDOFF.md`](memory/SESSION_HANDOFF.md)
4. [`PROJECT.md`](PROJECT.md)
5. [`memory/PROJECT_MEMORY.md`](memory/PROJECT_MEMORY.md) + [`memory/DECISIONS.md`](memory/DECISIONS.md)
6. [`CLAUDE.md`](CLAUDE.md) if the task is product/architecture
7. Task-specific skill from the table below

Also `memory_search` for "training2026" when memory tools are available.

---

## Task routing

| Task | Skill | Primary files |
|------|-------|----------------|
| Orient / status / "what next" | `/training2026` | handoff, PROJECT.md, CLAUDE.md |
| Code, UI, schema, queries, routes | `/training2026-code` | `src/`, `design-system/tokens/tokens.css` |
| Methodology, prescriptions, periodization | `/training2026-plan` | `context/synthesis.md` first, then `plan/` |

---

## Non-negotiable rules

1. **Every data row is scoped by `user_id`.** Queries in `src/lib/db/queries.ts` take `(sql, userId, …)` and filter. Mutations on inherited tables (exercises, exercise_sets, climbing_attempts) gate via JOIN through `sessions.user_id`. No Postgres RLS — the query layer is the tenancy wall.
2. **Martin is the domain expert** on training methodology. Do not invent generic S&C frameworks. Read `context/synthesis.md` before advising.
3. **Tokens over hardcoded color.** Accent is magenta `#FF00FF` in `tokens.css` — not the orange still mentioned in `CLAUDE.md`.
4. **No Tailwind, no UI kit, no emoji in UI** unless Martin asks. Svelte scoped `<style>` + design tokens.
5. **Svelte 5 runes.** `$props`, `$state`, `$derived`. Match the file you are in.
6. **Confirm** before installing dependencies or making destructive DB changes. Routine edits do not need confirmation.
7. **`main` auto-deploys** to https://training2026-xi.vercel.app. Do not push unless Martin asks.
8. **Autonomy.** "Keep going" or silence means pick the next-best open item and ship it. Confirm only for destructive or irreversible work. Do not end with "what should I build next?"
9. **UI changes:** exercise the feature in the browser (desktop + mobile). Check every route that shares the state or component you touched.
10. Dual-write durable facts to in-repo `memory/` and Grok workspace memory.

---

## After making changes

- `npm run check` for TypeScript + Svelte.
- Schema change: update `src/lib/db/schema.postgres.sql` **and** an idempotent ALTER script under `scripts/`. Apply with `npx tsx -r dotenv/config scripts/apply-pg-schema.ts`. Always use the Transaction pooler URL (port 6543).
- UI: verify in the browser, not just a screenshot.
- **At session end:** append `SESSION_LOG.md` + rewrite `SESSION_HANDOFF.md`.

---

## Grok memory

Cross-session memory is enabled via `~/.grok/config.toml` `[memory] enabled = true`.

In-repo `memory/*` is the human-readable source of truth so progress survives a Grok memory clear. Write durable facts to both:

- Repo: `memory/PROJECT_MEMORY.md`, `SESSION_HANDOFF.md`, `DECISIONS.md`
- Grok workspace: `~/.grok/memory/training2026-*/MEMORY.md`
