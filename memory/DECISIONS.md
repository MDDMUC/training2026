# Decisions — Training 2026

Locked choices. Do not contradict without an explicit new decision entry.

---

## 2026-06-02 — Cloud + multi-tenant re-platform

**Decision:** Move off local SQLite / adapter-node to Vercel + Supabase Postgres. Two users (`martin`, `antonia`). Custom HMAC cookie auth. Tenancy enforced in `queries.ts`, not RLS.

**Implications:**
- `DATABASE_URL` is the Transaction pooler (port 6543). Direct 5432 is IPv6-only.
- Local `npm run dev` talks to production Supabase.
- Push to `main` auto-deploys.
- Legacy `db/training.db` is unused backup.

---

## 2026-05-28 — Autonomy mode

**Decision:** On this project, work through the open list without asking between features. Confirm only for destructive / irreversible actions. "Keep going" or silence = continue.

Source: Martin, 2026-05-28 — "can you put yourself into auto mode meaning that you don't need confirmation from me again?"

---

## 2026-05-28 — Methodology synthesis

**Decision:** Nelson for tissue/rehab finger work; Lattice for max-strength finger work and pull benchmarks; Hooper for mobility / running / knee; 3 × 4-week mesocycles. Tindeq peak as per-session reference; Lattice 7s hang as cross-cycle benchmark.

Canonical write-up: `context/synthesis.md`.

---

## 2026-05-28 — Plan start shifted +2 days

**Decision:** Macrocycle is Wed Jun 10 → Tue Sep 1 2026, not Mon Jun 8. Block sequence and 72 h spacing preserved.

---

## 2026-05-28 — No-hangs as separate morning session

**Decision:** Abrahangs (~40% MVC, 10×10s/50s) run in the morning, ≥6 h from heavy hangs. Collagen 15 g + vitamin C 500 mg, 30–60 min before finger loading. Rubber-band extensors until a FlexBar / Tindeq-extensor exists.

---

## 2026-06 (brand) — Magenta accent, BICEPS wordmark

**Decision:** Single chromatic role is magenta `#FF00FF` (`--color-accent-500` in `tokens.css`). Login / hero wordmark is BICEPS (80s action-title, DM Serif Display + Russo One, `physical.mp4` background). `CLAUDE.md` still says signal-orange `#E85D04` — that is stale. Tokens win.

---

## 2026-08 — Spine reset: archive H2 2026, do not delete

**Decision:** Misaligned back joint, being adjusted. Cannot fully train. Archive every Martin session/phase as cycle `H2 2026`. Seed a new Reset cycle (HOLD 14d + RESTORE 28d) of walk / rest / unloaded mobility only. No hangs, pull-ups, climbing, running, loaded spinal work. Next climbing block is designed after clearance.

**Superseded 2026-08-28** by the re-entry cycle below. Archive-don't-delete still holds. HOLD/RESTORE was never seeded.

**Implications:**
- Never DELETE old workouts. Log → Previous plan.
- Antonia untouched.
- `archived` + `cycle_name` on phases and sessions. Today/Calendar show current cycle only.
- Analysis, PR, exercise library keep lifetime data.

## 2026-08-28 — Re-entry cycle (Pull / Push / Run)

**Decision:** Doctor cleared training (blood flow, keep the joint seated). Start a 4-week conservative re-entry **Mon 31 Aug → Sun 27 Sep 2026**, not a continuation of H2 Phase 3 and not the HOLD walk plan. Weekly order: Pull A → Push A → Run → Pull B → Push B → Run → Rest. Imitate H2 session DNA at ~60% of Phase 1 Week 1 loads. No hangboard, no climbing, no Abrahangs, no added pull-up weight. Legs: Bulgarian split squat on Push A; box-pistol skill on the two run days (before the run). Surgical (R) side first. Stop if the joint speaks.

**Implications:**
- Archive H2 (and HOLD if it ever existed) in place. Seed cycle_name `Re-entry`, phase short_name `REENTRY`.
- Antonia untouched.
- Next performance / hangboard / climbing block is a new decision after Week 4.
- Not clinical advice.
- **Dates superseded 2026-09-01** — cycle is now Tue 1 Sep → Mon 28 Sep (whole block +1 day). Sequence unchanged.

## 2026-09-01 — Re-entry start shifted +1 day

**Decision:** Start the live Re-entry cycle today. Shift every Martin Re-entry session and the REENTRY phase **+1 day**: **Tue 1 Sep → Mon 28 Sep 2026**. Pull A is the first session (was Mon 31 Aug). Weekly order unchanged; weekdays slide (rest is now Monday).

**Implications:**
- Live DB already updated (28 sessions, no logged sets). Antonia and archived H2 untouched.
- `REENTRY_START` / `REENTRY_END` in `src/lib/domain/reentryPlan.ts` are the source of truth.
- **Dates superseded 2026-09-01 (later same day)** — cycle is now Wed 2 Sep → Tue 29 Sep, with chest/delt looks work on push days.

## 2026-09-01 — Re-entry looks work + start tomorrow

**Decision:** Add chest + side-delt isolation on both push days for looks (not a hypertrophy mesocycle). Shift the live cycle so the first session is **Wed 2 Sep → Tue 29 Sep**. Sequence unchanged. Rest is Tuesday.

**Looks add-ons (3–4 RIR, seated/supported):**
- Push A: DB fly 8 kg + seated lateral raise 6 kg (7 kg week 3)
- Push B: incline DB press 10 kg (12 kg week 3) + seated laterals (fewer sets)
- Drop 2 kg laterals from antagonist — activation, not a training stimulus. Face pulls + reverse fly stay.

**Implications:**
- Rebuild via `scripts/rebuild-reentry.ts` (aborts if any set was logged).
- Antonia and archived H2 untouched.
- Still no hangboard, no climbing, no added pull-up weight. Stop if the joint speaks.
- **Structure superseded same day** by option A below (laterals before fly; Push B trimmed).

## 2026-09-01 — Looks overlay cleaned (option A)

**Decision:** Keep Pull / Push / Run. Do not add a hypertrophy split. Clean the looks overlay after Israetel / Schoenfeld / RP-app review.

- Push A: compounds first, **laterals then fly**, then antagonist, then BSS.
- Push B: push-ups + incline + laterals + Y-T-W. Drop SA press and tempo dips (overlap).
- Isolation 10–15 reps, 3–4 RIR. Side-delt hard sets ~6 week 1, ~8 weeks 2–3.
- No front raises, no 0 RIR, no extra press stack.

**Implications:** Live cycle rebuilt. Dates unchanged (Wed 2 Sep → Tue 29 Sep).
- **Dates superseded 2026-09-04** — cycle is now Fri 4 Sep → Thu 1 Oct (Day 1 = Pull A).

## 2026-09-04 — Nutrition untethered from Anthropic

**Decision:** Stop using Anthropic for food estimates. Martin tells the coding agent what he ate; the agent researches a brief estimate and writes `nutrition_entries`. Today UI is manual macros only.

**Implications:**
- `/api/nutrition/parse` returns 410; `NutritionCard` has no “Estimate from text” mode.
- Do not call Anthropic from log scripts for nutrition.
- `@anthropic-ai/sdk` may remain installed unused until a deliberate uninstall.

## 2026-09-04 — Re-entry Day 1 = today (Pull A)

**Decision:** After Wed adjustment + outdoor climbing, Thu soreness, and a rest day, start the block today. Shift the live Re-entry cycle so **Fri 4 Sep is Day 1 Pull A**: **Fri 4 Sep → Thu 1 Oct 2026**. Sequence unchanged; weekdays slide (rest is Thursday).

**Implications:**
- Live DB rebuilt from `reentryPlan.ts`. Scheduled template only — Sep 1 ad-hoc log preserved.
- `REENTRY_START` / `REENTRY_END` are the source of truth.
- Antonia and archived H2 untouched.
- Still no hangboard, no climbing, no added pull-up weight. Stop if the joint speaks.

## 2026-09-11 — Bent-arm floor fly replaces long-lever DB fly

**Decision:** Therapist flagged long-lever chest flies (arms extended) for chest-knob / sternum pressure. Prefer elbows fixed ~90° and a short lever. Replace Push A **DB fly** with **bent-arm floor fly** (floor stops the open). Same load ramp anchor (8 kg). Mid-chest on flat floor; low incline (~20–30°) if upper chest is the priority.

**Implications:**
- `reentryPlan.ts` `looksFly()` now seeds Bent-arm floor fly.
- Live future Push A patched via `scripts/replace-db-fly-with-bent-arm-floor-fly.ts`.
- Fri 11 Sep Pull A got an ad-hoc bent-arm floor fly block (`scripts/add-2026-09-11-bent-arm-fly.ts`).
- Do not re-add soft-elbow / long-lever flies without therapist clear.

## 2026-09-04 — Drop OHP from Re-entry Push A

**Decision:** Remove overhead press from Push A for the rest of re-entry. Suspected slip-joint aggravator. Keep bodyweight dips with full rest; laterals/fly stay for side delts.

**Implications:**
- `reentryPlan.ts` Push A is dips-only (no Dips+OHP superset). Title: `Push A — dips, chest, delts, split squat`.
- Live Push A sessions patched via `scripts/remove-ohp-from-reentry-push-a.ts` (does not wipe logged Pull A).
- Do not re-add OHP until Martin clears it after the joint is quiet.

## 2026-09-04 — Hypertrophy Base meso (load ramp)

**Decision:** Reframe the current 4-week block as **Meso 1 — Hypertrophy Base** of a new macrocycle. Keep Pull / Push / Run. Expand to the full size menu (chest, side delts, biceps, forearms). Ramp loads ~**50% → ~90%** of H2 Phase 1 Week-1 normals. Week 4 is a **volume** deload. Still no hangboard / climbing / OHP / weighted pulls. 3–4 RIR.

**Implications:**
- Supersedes “looks overlay only; full hypertrophy deferred until after Week 4.”
- DB `cycle_name` stays `Re-entry`; phase display name becomes Hypertrophy Base.
- Future sessions reseeded via `scripts/reseed-future-reentry.ts` (preserves logged Pull A).
- Meso 2 (continued hypertrophy vs strength/hangboard) decided after Week 4.

## 2026-08-27 — Grok installed as coding agent

**Decision:** Grok Build is installed in this repo (skills, rules, in-repo memory, dual-write) to cover Claude Code for a stretch. Do not redesign architecture. App source was not changed as part of the install.

**Implications:**
- Session protocol is mandatory (same pattern as Bewerbungen / Midnight / GhostSignal).
- Skills: `/training2026`, `/training2026-code`, `/training2026-plan`.
- Claude Code memory harvested from `~/.claude/projects/C--Users-heyma/memory/` into this `memory/` tree.
