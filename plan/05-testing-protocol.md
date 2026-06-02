# Testing Protocol

Run this protocol **at the end of each mesocycle** (Sat Jul 4, Sat Jul 31, Wed Aug 26). Same conditions every time so the numbers are comparable. ~60 minutes total.

## Conditions

- **Fully rested.** At least 48 h since the last hard session.
- **Same time of day** (target: late morning, 10:30–11:30).
- **Pre-test:** 1 cup of coffee, 200 ml of water, no big meal in the preceding 2 h.
- **Same hangboard, same Tindeq position.** Document the setup once with a photo and replicate it every time.
- **Same edge depth: 20 mm wood.** Half-crimp grip, fingertips fully on edge, thumb relaxed.

## Equipment checklist

- [ ] Tindeq Progressor charged, app open, ready to record
- [ ] 20 mm wood edge hangboard set up, accessible
- [ ] Pull-up bar with calibrated weight (belt + plates)
- [ ] Notebook or log app for recording

---

## Warm-up (15 min — non-negotiable)

1. **Hooper 3-step** — tendon glides, band ER + scapular retraction, recruitment pulls.
2. **Recruitment ladder on Tindeq:** L then R, 5 pulls each at 30%, 50%, 70%, 80%, 90% effort, 1 min rest each. **This wakes the system; it is not the test.**

---

## Test 1 — Tindeq Peak Force (one-arm, 20 mm half-crimp)

Goal: measure maximum voluntary contraction over a 2–4 second pull, both hands separately.

**Protocol:**

| Step | Hand | Hold | Effort | Rest after |
|---|---|---|---|---|
| 1 | L | 3 s | Maximum | 3 min |
| 2 | R | 3 s | Maximum | 3 min |
| 3 | L | 3 s | Maximum | 3 min |
| 4 | R | 3 s | Maximum | 3 min |
| 5 | L | 3 s | Maximum | 3 min |
| 6 | R | 3 s | Maximum | — |

**Recording:** keep the highest peak per hand across the 3 attempts. The Tindeq app records this automatically.

**Asymmetry %:** `(R − L) / R × 100`. Negative if L > R.

**Position notes:** Body roughly under the bar, slight engagement through shoulders and core, non-pulling arm hanging relaxed. **Do not load with bodyweight assistance** — sit/stand under the bar so only the targeted forearm produces force.

---

## Test 2 — Weighted Pull-up Estimated 1RM

Goal: estimate one-rep max from a heavy triple, not by actually attempting a true 1RM (riskier and noisier).

**Protocol:**

| Set | Added load | Reps | Rest after |
|---|---|---|---|
| 1 | BW | 5 | 2 min |
| 2 | +10 kg | 3 | 3 min |
| 3 | +20 kg | 2 | 4 min |
| 4 | +25 kg | 2 | 4 min |
| 5 | **target** | **3, full RIR 0** | — |

For the target set, pick a load you can grind through 3 clean reps with **zero reps in reserve** — the last rep should be the hardest pull you can do.

**1RM formula (Epley, validated for calisthenics):**

```
1RM_total = total_load × (1 + reps/30)
1RM_added = 1RM_total − bodyweight
```

Example: 82 kg BW + 30 kg added = 112 kg total × (1 + 3/30) = 112 × 1.1 = **123.2 kg total** → **+41.2 kg added 1RM**.

---

## Test 3 — Critical Force (Optional, only when fresh and motivated)

Only run this if there's energy left after Tests 1 and 2. It's the most informative single test for sport-climbing endurance but it's brutal.

**Protocol:**
- One-arm hang, dominant hand only (R), 20 mm half-crimp.
- 24 reps × (7 s pull / 3 s rest) — Tindeq's "Critical Force" mode runs this automatically.
- Total test duration: 4 min.

**Record:** Critical Force value (kg) and W' (the anaerobic capacity above CF).

---

## Logging template

After every test session, log into the eventual web app (and for now, into a markdown file or spreadsheet):

```
Date: YYYY-MM-DD
Bodyweight: __ kg
Tindeq peak — R: __ kg
Tindeq peak — L: __ kg
Asymmetry: __ %
Pull-up — heaviest triple total load: __ kg
Pull-up — estimated 1RM (added): __ kg
Critical Force (optional): __ kg
W' (optional): __ kg·s

Subjective notes:
- Sleep last 3 nights: __ h avg
- Pulley sensation (L middle PIP): __
- Deep-squat depth (0–10): __
- Run pace at conversational effort: __ min/km

Phase-end review:
- What worked
- What didn't
- What to change for next phase
```

---

## Interpreting the results

**Tindeq peak progressing well:** +1.5 kg or more per hand per 4 weeks.
**Plateau:** if a hand gains <0.5 kg in a phase, run an extra base week before continuing.
**Pull-up 1RM progressing well:** +2 kg added per 4 weeks.
**Asymmetry closing well:** 1–2% reduction per 4 weeks. Target by end of cycle: < 3%.

**Trigger for re-strategy:**
- Tindeq regresses on either hand → suspect under-recovery; add a recovery week.
- L hand pulley sensation returns → drop to Density Hangs only at 70% MVC for 2 weeks before retest.
- Pull-up regresses but Tindeq advances → upper-body fatigue; reduce push-day volume.
