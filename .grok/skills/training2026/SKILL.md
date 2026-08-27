---
name: training2026
description: >
  Orient and route work in the Training 2026 climbing-training app. Use when
  Martin asks for project status, what to do next, onboarding, session start,
  or runs /training2026. Reads protocol, handoff, and memory; points to
  /training2026-code or /training2026-plan.
---

# /training2026 — Project orient

## Steps

1. Read, in order:
   - `memory/SESSION_PROTOCOL.md`
   - last 3–5 entries of `memory/SESSION_LOG.md`
   - `memory/SESSION_HANDOFF.md`
   - `PROJECT.md`
   - `memory/PROJECT_MEMORY.md`
   - `memory/DECISIONS.md`
2. `memory_search` for "training2026" if memory tools are available.
3. Summarize in chat (short):
   - Current focus
   - Uncommitted work
   - Calendar position (which phase / week of the 12-week block)
   - Exact next action
4. Route:
   - Code / UI / schema / bug → `/training2026-code`
   - Prescriptions, methodology, plan fill-in → `/training2026-plan`
5. If the user is ending the session, run the Session END checklist from `SESSION_PROTOCOL.md`.

## Do not

- Skip the handoff files
- Change application code from this skill — only orient and route
- Treat `README.md` as current (it still describes the local-SQLite era)
