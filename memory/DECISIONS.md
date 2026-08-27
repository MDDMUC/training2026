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

**Implications:**
- Never DELETE old workouts. Log → Previous plan.
- Antonia untouched.
- `archived` + `cycle_name` on phases and sessions. Today/Calendar show current cycle only.
- Analysis, PR, exercise library keep lifetime data.

## 2026-08-27 — Grok installed as coding agent

**Decision:** Grok Build is installed in this repo (skills, rules, in-repo memory, dual-write) to cover Claude Code for a stretch. Do not redesign architecture. App source was not changed as part of the install.

**Implications:**
- Session protocol is mandatory (same pattern as Bewerbungen / Midnight / GhostSignal).
- Skills: `/training2026`, `/training2026-code`, `/training2026-plan`.
- Claude Code memory harvested from `~/.claude/projects/C--Users-heyma/memory/` into this `memory/` tree.
