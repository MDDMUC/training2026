# Session Protocol — READ FIRST

> **Rule #1 for every assistant, every session.** Read this file before any Training 2026 work.
> Do not skip even if the user jumps straight into a task.

---

## 1. Session START (mandatory read order)

Read these **in order** before writing or editing application code:

| Step | File | Why |
|------|------|-----|
| 1 | **This file** (`memory/SESSION_PROTOCOL.md`) | How we work |
| 2 | [`SESSION_LOG.md`](SESSION_LOG.md) | Recent sessions — last 3–5 entries |
| 3 | [`SESSION_HANDOFF.md`](SESSION_HANDOFF.md) | Where we left off |
| 4 | [`PROJECT.md`](../PROJECT.md) | Hub + folder map |
| 5 | [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md) | Durable project state |
| 6 | [`DECISIONS.md`](DECISIONS.md) | Locks — never contradict |

**Then by task type:**

| Task | Also read |
|------|-----------|
| Code / UI | `CLAUDE.md` · `design-system/tokens/tokens.css` · files you will change |
| Visual / layout | `design-system/01-principles.md` + tokens |
| Methodology / plan | `context/synthesis.md` first, then the matching `context/research_*.md` |
| Schema / queries | `src/lib/db/schema.postgres.sql` · `src/lib/db/index.ts` · `queries.ts` |

**Then load skill:** `/training2026`, `/training2026-code`, or `/training2026-plan`.

Also `memory_search` for "training2026" if memory tools are available.

---

## 2. Current project state (pointers)

Do not guess — read live files:

| Area | Status file |
|------|-------------|
| Open focus | `SESSION_HANDOFF.md` |
| Durable facts | `PROJECT_MEMORY.md` |
| Locks | `DECISIONS.md` |
| Architecture | `CLAUDE.md` (note stale accent color — tokens.css wins) |
| Plan | `plan/00-overview.md` |
| Uncommitted work | `git status` |

---

## 3. How we do things

### Coding

- Smallest diff. Match the file. Svelte 5 runes, scoped CSS, design tokens.
- Every query filters `user_id`.
- Confirm before deps or destructive DB work.
- UI: verify in the browser, desktop + mobile, related routes too.
- `main` deploys. Do not push unless asked.

### Training advice

- Martin is the domain expert.
- `context/synthesis.md` before any protocol recommendation.
- Live metrics over May 2026 snapshots.

### Autonomy

- Keep going through the open list.
- Confirm only for destructive / irreversible actions.
- Do not end with "what should I build next?"

### Memory dual-write

When something durable changes (tenancy, brand, stack, plan dates, collaboration rules):

1. Update repo memory (`PROJECT_MEMORY.md`, `DECISIONS.md` as needed)
2. Update Grok workspace memory (`~/.grok/memory/training2026-*/MEMORY.md`) if tools are available
3. Mention it in the session-end log

---

## 4. Session END (mandatory)

Before closing or switching projects:

1. **Append** one entry to [`SESSION_LOG.md`](SESSION_LOG.md): date, focus, what shipped, open questions, next action
2. **Rewrite** [`SESSION_HANDOFF.md`](SESSION_HANDOFF.md) so the next session can start cold
3. Update [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md) if durable state changed
4. If Grok memory is on: ensure critical facts are searchable in workspace MEMORY.md

Do **not** leave progress only in chat.

---

## 5. Safety

- Seeded test passwords live in memory for local login only. Do not paste `DATABASE_URL`, service-role keys, or `SESSION_SECRET` into chat logs or commits.
- `.env.local` is gitignored. Never commit it.
- No telemetry. Do not add analytics.
- Production data is live on the same Supabase the dev server uses — treat writes as real.
