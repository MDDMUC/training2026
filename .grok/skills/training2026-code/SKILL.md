---
name: training2026-code
description: >
  Make a scoped code change in the Training 2026 SvelteKit app without
  rewriting architecture. Use when Martin asks for a coding task, bugfix,
  UI/CSS tweak, schema change, query, route work, or /training2026-code.
  Do not use for methodology advice — that is /training2026-plan.
---

# Training 2026 scoped coding

Claude Code established this codebase. You extend it with the smallest diff that matches neighboring files.

## Before the first edit

Read, in this order:

1. `CLAUDE.md` — surfaces, stack, data model, open items
2. `design-system/tokens/tokens.css` — visual source of truth (accent is magenta `#FF00FF`)
3. `design-system/01-principles.md` if the change is visual
4. The files you will change, plus one neighboring example of the same pattern

If the task is methodology (loads, hangs, periodization), stop and use `/training2026-plan`.

## How to write here

- **Svelte 5 runes:** `$props()`, `$state`, `$derived` / `$derived.by`. No Svelte 4 stores for new UI state.
- **Scoped `<style>`** + CSS custom properties from `tokens.css`. No Tailwind, no UI kit.
- **No emoji in UI** unless Martin asks.
- **Numeric data is tabular monospace.** Labels: uppercase + tracking at small sizes.
- **Cards, boxes, shadows** are not the default. Hairline rules and whitespace separate.
- **Dark mode is a peer.** If you add a color, add the dark-theme override in `tokens.css`.
- **Queries:** every function in `src/lib/db/queries.ts` takes `(sql, userId, …)` and filters by `user_id`. Coerce Postgres booleans to `0|1` at the query layer — components expect numbers.
- **Dates are ISO strings**, not `Date` objects. `src/lib/db/index.ts` overrides OID 1082/1114/1184.
- **Forms:** SvelteKit form actions + `enhance`. Saves are silent; the visible state change is the feedback. Optimistic badges already exist on several fields — match that pattern.
- **Comments:** short, factual, only for non-obvious constraints.

## Do not

- Rewrite a working page or restyle "while we're here"
- Add a second accent color
- Introduce Chart.js, D3, Tailwind, or a component library
- Use the Direct Supabase URL on port 5432 (IPv6-only). Transaction pooler, port 6543
- Push to `main` unless asked (Vercel auto-deploys)
- Install dependencies or drop tables without confirmation
- Touch the uncommitted AM/PM work in `ExerciseBlock.svelte` / `timeOfDay.ts` unless that is the task

## Validate

```bash
npm run check
```

UI changes: exercise the feature in the browser the way a user would (desktop + mobile). Visit every route that shares the state or component you touched. Hunt regressions; a single screenshot is not verification.

Schema: edit `src/lib/db/schema.postgres.sql` and add an idempotent ALTER under `scripts/`. Apply with `npx tsx -r dotenv/config scripts/apply-pg-schema.ts`.

## Ship shape

- Smallest diff. Match comment and naming conventions already in the file.
- Prefer a branch unless the change is a one-file copy/CSS fix.
- Session log at end: outcomes, files, validation, open items.
