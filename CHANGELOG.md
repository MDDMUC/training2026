# Training 2026 — Change Log

Tracks plan, prescription, research, and codebase changes over time. Most recent first.

For the static feature catalog and route map, see `CLAUDE.md` and `README.md`. For the training methodology synthesis, see `context/synthesis.md`.

---

## 2026-05-28 — Antagonist balance pass

Built protagonist/antagonist balance into the plan, grounded in fresh research. Driven by the principle that a heavy pulling structure (density hangs, weighted pulls, asymmetry isos, climbing 2×/week) needs deliberate offset to stay injury-resilient and athletically rounded.

### Research saved
- **`context/research_antagonist_balance.md`** (190 lines) — Devise 2023 (climbers' flexor:extensor ratio 6.27:1 vs ~3.7:1 untrained; only isolated extensor training rebalances), Wong & Ng 2009 (climbers' ER:IR 0.79 vs 1.03 in non-climbers, p < .001), Tyler 2014 (FlexBar eccentric for medial epicondylitis), Cools 2003 (push-up plus highest-EMG serratus exercise), Hwang & Jeon 2024 (prone Y most lower-trap-selective), Schöffl 2020 (climbing injury epidemiology).
- Surfaced that the "Hörst 1:2 push:pull ratio" is climbing-media folklore — Hörst's actual guidance is "match sets per session" on antagonist days.
- Memory pointer `reference_training_methodology.md` updated.

### Prescription changes (Tuesday push)
- **`Antagonist · Shoulder Balance`** block rewritten (was `Antagonist + Prehab`):
  - Band external rotation at 0° abduction · 3 × 10 per side (strength load, not 2 kg prehab)
  - Push-up plus · 3 × 10 (serratus / scap protraction)
  - Prone Y raise · 2 × 12 @ 1 kg (lower trap)
  - Lateral raise trimmed: 4 × 14 @ 2 kg → 2 × 12 @ 2 kg
  - Reverse fly trimmed: 2 × 12 → 1 × 12
  - Face pulls dropped (replaced by ER + prone Y)
- **`Forearm + Extensor Balance`** block rewritten (was `Forearm balance · Wrist curls`):
  - Wrist extensor curls 4 × 15 @ 5 kg — unchanged
  - **Rubber-band finger extensions 6 × 15** — new (Devise 2023 isolated extensor protocol)
  - **Eccentric flexor wrist curl 4 × 15 @ 7 kg with 5 s eccentric** — new (Reverse Tyler Twist mechanism for climber's elbow)
  - Generic flexor wrist curl dropped
- **`Single-leg RDL`** exercise added · 3 × 8 per side @ 5 kg DB — bilateral posterior chain + ACL maturity work (Grindem 2016)
- Same Forearm + Extensor Balance block now also applies on Thursday — gives Devise's prescribed 2×/week dose

### Constraint
- Martin has no FlexBar or Tindeq extensor attachment. Protocol scales around rubber bands (band thickness as progressive load). Flagged in research note as future kit upgrade.

### Volume delta
- 162 exercises (+4 vs prior) / 763 sets (+79 vs prior) after re-init

---

## 2026-05-28 — No-hangs (Abrahangs) protocol — Option A

Added Emil Abrahamsson's low-load, high-frequency tendon-collagen protocol after researching the science, evaluating two deployment options, and confirming the conservative choice.

### Research saved
- **`context/research_no_hangs_abrahamsson.md`** — Abrahamsson's 10-set / 10 s on / 50 s rest protocol at ~40% MVC; Keith Baar's tendon-cell refractory-period research (6-hour window, 10-min stimulus saturation, collagen + vitamin C 30–60 min before); Gilmore/Abrahamsson/Baar 2024 paper (~2.5–3.2% strength gain, Cohen's d ≈ 0.29; combining with heavy hangs is additive); Tyler Nelson's mechanism critique.
- Memory pointer updated.

### Prescription changes
- `noHangsAbrahangs(order, grip)` function added — 10 sets × (10 s on / 50 s rest), 22 kg (~40% MVC of L hand).
- Wired into 4 day types as first exercise (`display_order = 1`), grip rotation across the week:
  - Wed climb-indoor — 4-finger half-crimp · 20 mm
  - Fri mobility — 4-finger open · 20 mm
  - Sat climb-outdoor — front-3 open · 20 mm
  - Sun rest — front-2 half-crimp · 20 mm
- **Avoids refractory-period collisions** with Mon Density Hangs and Thu Asymmetry Isos by design.
- Prescription notes carry: "do first thing in the morning as a separate session," 24-h pain rule, and the collagen + vit C stack reminder.

### Runway (pre-Phase-1 calibration)
4 ad-hoc sessions seeded with `phase_id = null`, `type = 'mobility'`, `scheduled = 1`:

| Date | Day | Load | Grip | Sets |
|---|---|---|---|---|
| Sat May 30 | 1/4 | 18 kg | half-crimp 4f | 6 |
| Mon Jun 1 | 2/4 | 20 kg | half-crimp 4f | 8 |
| Wed Jun 3 | 3/4 | 22 kg | open 4f | 10 (first full protocol) |
| Fri Jun 5 | 4/4 | 22 kg | front-3 open | 10 (dress rehearsal) |

- `RUNWAY_SPECS` + `buildRunwayCalibration(day)` exported from `prescriptions.ts`.
- Idempotent runway-seed block added to `scripts/init-db.ts` — re-running `npm run db:init` won't duplicate.
- Calibration intent: dial in the true 40% MVC feel, stress-test the L A2 with the 24-h pain rule, lock the morning supplement + edge routine before Phase 1 heavy work.

### New UI
- **`SupplementBanner.svelte`** molecule on Today (between hero and benchmarks) — persistent reminder: "15 g hydrolysed collagen + 500 mg vitamin C, 30–60 min before any finger loading" with the Baar attribution.

---

## Earlier sessions — pre-compaction summary

The history before today's conversation got compressed, but the major themes are recoverable:

### Plan additions
- **Wrist-curl `forearmBalance` block** added on Tue + Thu — extensors (palm down) prioritised as climbing antagonist, flexors as secondary. *(Superseded today by the antagonist-balance pass above.)*
- **Lattice deep-squat mobility** added — Cossack squats, Horse stance, Half-split ISO, Deep-squat hold. Dedicated routine on Tue + integrated into Friday long mobility.

### UI iterations
- **Today** hero redesigned to 2-col with "Up Next" card on the right.
- **`ThisWeekCard`** + **`InsightsCard`** rebuilt with shared card-head pattern (H3 + right-aligned context line + hairline divider).
- **`PriorityChart`** organism — three priority charts on Analysis (Body weight, Pull-up, Tindeq R+L) with 36 px bold-mono headline value, viewBox 600 × 360.
- **Analysis** trimmed to phase strip + 3 priority charts + Weekly Load + Weekly Volume. Asymmetry / heatmap / sleep / run pace / run distance / climbing summary all removed per Martin's request.
- **Settings** rebuilt as one-screen 3-row dashboard (stats strip · Export / Restore / About · Commands).
- All page templates: `max-width: 1680px` removed in favour of `width: 100%` so dashboards fill the viewport on large monitors.
- **Goals card** removed from Today.

### Fixes
- DST timezone bug in week grouping (`parseISO` + UTC accessors caused 2-day drift in CEST). Resolved by using local `getDay()` / `setDate()` consistently.
- Same DST bug in `schedule.ts` seeded session dates — fixed via explicit UTC parsing with `Date.UTC(y, m-1, d)`.
- `recomputeSessionCompletion` parameter count mismatch — 1 `?` placeholder vs 2 bound params. Fixed to single param.
- `better-sqlite3` EBUSY errors during `db:reset` while dev server held the file — resolved by killing Node before reset.
- Several stale-browser-cache moments where removed UI appeared to persist until hard refresh.

### Decisions / preferences captured to memory
- **Autonomy mode** for this project: "keep going" or silence = implicit approval. Pick the next-best item from the open list and ship.
- **Avoid generic AI-design tropes** — no pastel gradients, no "Welcome to your dashboard" boilerplate, no glassmorphic cards.
- **No emoji in UI** unless explicitly requested.
- **Climbing-specific vocabulary** — not generic-fitness terminology.

---

## Open items (durable)

- **Phase 2 + 3 detailed prescriptions** — skeleton only by design. They get filled in after the Week 4 (Jul 4) and Week 8 (Aug 1) test sessions reveal the new MVC and 1RM numbers.
- **Drag-to-reorder exercises** — functionality exists via delete + re-add; drag handles are pure polish.
- **Toast notifications** — saves are silent by design; the visible state change is the feedback.
- **FlexBar / Tindeq extensor attachment** — future kit upgrade. The current rubber-band scaling of finger extensions is the right starting point but a graded device would let us hit Devise's 80% MES dose precisely.
