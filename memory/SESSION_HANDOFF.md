# Session Handoff

> Rewrite this whole file at session end. Next session reads this first after the protocol.

**Last updated:** 2026-08-28 (commit + push; seed still not live)
**Session:** Re-entry plan committed and pushed. Calendar seed is **not applied** — pooler still rejects this machine.

---

## Do this first

1. **Paste the seed in Supabase SQL editor** (H2 is still the live calendar until this runs):
   - File: `scripts/archive-h2-and-seed-reentry.sql`
   - Dashboard: https://supabase.com/dashboard/project/gohqxsbqswyomyfeuipt/sql/new
   - Do **not** paste `archive-h2-and-seed-reset.sql` (HOLD/RESTORE, superseded)
   - Local fallback if `DATABASE_URL` ever connects: `npx tsx -r dotenv/config scripts/archive-h2-and-seed-reentry.ts`
2. Verify: Today this weekend = no session, next = Mon 31 Pull A; Calendar Sep = Pull/Push/Run; **Log → Previous** still has H2; no hangs/climbing on the current cycle. Collagen banner hidden on REENTRY once the deploy is up.

## Current focus

- Re-entry cycle locked: Mon 31 Aug → Sun 27 Sep. Pull A → Push A → Run → Pull B → Push B → Run → Rest. See `plan/08-reentry.md`.
- Doctor cleared training. Conservative loads, no hangboard, no climbing. Box pistol on run days; split squat on Push A.
- H2 stays Previous. HOLD/RESTORE never seeded.
- Antonia untouched. AM/PM badges still uncommitted (`ExerciseBlock.svelte`, `timeOfDay.ts`).

## Blockers / watchouts

- This machine: pooler `tenant/user postgres.gohqxsbqswyomyfeuipt not found`; `*.supabase.co` REST DNS fail. Same as 2026-08-27.
- Do not resume Phase 3. Next performance block is after Week 4.
