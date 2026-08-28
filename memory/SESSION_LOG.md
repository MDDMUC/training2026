# Session Log

Append-only. Newest entries at the **bottom**.

---

## 2026-08-27 — Grok install (no app changes)

**Focus:** Replace Claude Code for a stretch. Investigate the repo. Acquire Claude skills + memory. Install Grok (skills, rules, in-repo memory, dual-write). Do not change the build.

**Investigated:**
- Product: SvelteKit 2 / Svelte 5 climbing-training log, Vercel + Supabase, tenants `martin` + `antonia`, branded BICEPS in UI
- Charter: `CLAUDE.md` (architecture) vs live code (nutrition, free log, magenta accent, sessionless check-in)
- Plan: Wed 2026-06-10 → Tue 2026-09-01; today is Phase 3 Week 12
- Git: `main` tracking `origin/main`; latest commit `a62aac0 feat(today): color-code input zones with subtle category tints`
- Uncommitted (left untouched): `ExerciseBlock.svelte` + new `src/lib/domain/timeOfDay.ts` (AM/PM badges)

**Acquired from Claude Code:**
- Memory under `~/.claude/projects/C--Users-heyma/memory/` (project, URLs, methodology pointer, autonomy, climber profile)
- No project Claude skills (only `.claude/settings.local.json` allow-list)
- `session_reader claude list --cwd training2026` returned no sessions (Claude stored this work under the home project, not a dedicated cwd)

**Shipped (agent install only):**
- `AGENTS.md`, `PROJECT.md`
- Skills `/training2026`, `/training2026-code`, `/training2026-plan`
- Rules: session-memory, autonomy
- In-repo memory protocol (Bewerbungen-style)
- Dual-write: workspace `training2026-b5e80c26` + global MEMORY.md project block

**Open:**
- AM/PM badge feature unverified, uncommitted
- README + CLAUDE.md doc drift (not fixed this session)
- Phase 2/3 prescription fill-in — durable open item from CLAUDE.md; verify against live DB before acting

**Next:** Wait for Martin. If "keep going" on the app → verify/finish time-of-day badges. If more agent setup → commit the install files.

---

## 2026-08-27 — Spine reset (archive H2, new plan)

**Focus:** Back joint misaligned, being adjusted. Scrape current workouts from active surfaces without deleting them. Start a new plan.

**Shipped (code, not live data):**
- `archived` + `cycle_name` on phases/sessions
- Queries: Today/Calendar = current cycle; Log can filter Previous; Analysis/PR still lifetime
- Reset plan: HOLD 14d + RESTORE 28d walk/rest/unloaded mobility. `plan/07-reset-spine.md`
- Log Plan chips: Current / Previous / All
- InsightsCard on Today for the spine constraint
- Seed: `scripts/archive-h2-and-seed-reset.ts` + `.sql`

**Blocked:** Could not apply to production Supabase from this machine (pooler `tenant/user not found`; `*.supabase.co` DNS fail). Run the SQL in the Supabase editor or the tsx script locally, then verify. Do not push `main` until the column exists.

**Open:**
- Apply seed
- Browser verify after seed
- AM/PM badges still uncommitted, unrelated
- Next performance block after clearance — not seeded

---

## 2026-08-28 — Session close (commit + push, seed tomorrow)

**Focus:** Log, commit, push. Martin applies the archive/seed tomorrow.

**Shipped:**
- Queries filter `archived` in JS so tonight's deploy does not 500 if the column is missing
- Commit + push of Grok install + spine-reset code (AM/PM badges left uncommitted)

**Tomorrow (remind Martin):**
1. Paste `scripts/archive-h2-and-seed-reset.sql` in the Supabase SQL editor (or run the tsx script)
2. Check Today / Calendar / Log → Previous
3. No loaded training until the joint is cleared

---

## 2026-08-28 — Re-entry cycle locked (seed not live)

**Focus:** Restart training Mon 31 Aug. Pull → Push → Run. Conservative loads. Box pistol + split squat. Discussed then coded.

**Locked:**
- Cycle: Mon 31 Aug → Sun 27 Sep (`plan/08-reentry.md`). Phase short_name `REENTRY`, cycle_name `Re-entry`.
- Week: Pull A, Push A, Run, Pull B, Push B, Run, Rest.
- No hangboard, no climbing, no added pull-up weight. Surgical (R) first on legs.
- HOLD/RESTORE superseded, never seeded. Archive-don't-delete still holds.

**Shipped (code, not live data):**
- `src/lib/domain/reentryPlan.ts` + `scripts/archive-h2-and-seed-reentry.ts` + `.sql`
- Insights + hide collagen banner on REENTRY
- `npm run check` — 0 errors

**Blocked:** Pooler still `tenant/user not found`. Calendar will not change until Martin pastes `scripts/archive-h2-and-seed-reentry.sql` in the Supabase SQL editor.

**Open:**
- Apply seed
- Browser-verify after seed
- Push UI copy if Martin wants production Today to match
- AM/PM badges still uncommitted, unrelated

---

## 2026-08-28 — Session close (commit + push re-entry)

**Focus:** Log, commit, push the re-entry plan. Martin still applies the seed in Supabase.

**Shipped:**
- Commit + push of re-entry cycle (plan, seed scripts, insights, hide collagen banner on REENTRY)
- AM/PM badges left uncommitted (`ExerciseBlock.svelte`, `timeOfDay.ts`)

**Still blocked:** live archive + seed. Paste `scripts/archive-h2-and-seed-reentry.sql` in the Supabase SQL editor. Until then production calendar is still H2.

---

## 2026-08-28 — Re-entry seed applied

**Focus:** Martin ran the SQL. Verify live data.

**Verified:**
- Martin current: 28 Re-entry sessions, 2026-08-31 → 2026-09-27, Pull/Push/Run as locked
- Martin H2: 92 sessions archived, phases BASE/MAX/PEAK
- Antonia: 36 sessions, untouched
- Mon 31: warmup, 4× BW pull-ups, curls, mobility. Zero hangboard/climb on current cycle
- Production: Today = nothing scheduled + plan starts; Sep calendar = re-entry; Log Previous = H2

**Open:** `getPhaseForDate` still returns archived H2 PEAK for Aug 28–30 (date overlap). Collagen banner on Today this weekend. Local one-line fix in `queries.ts` (skip archived). AM/PM badges still uncommitted.

---

## 2026-08-28 — Antonia form guides (commit + push)

**Focus:** Log, commit, push everything so Antonia can see how-tos on production.

**Shipped:**
- Antonia-only **How to perform** on the day log and exercise page (photos + setup / movement / cues / stop-if). All 43 prescribed names mapped. Martin unchanged.
- `getPhaseForDate` skips archived phases (this-weekend collagen/PEAK leak).
- AM/PM badges (`timeOfDay.ts` + ExerciseBlock) included in this commit as requested.

**After deploy:** Antonia → Calendar → a session → **How to perform** under each exercise.
