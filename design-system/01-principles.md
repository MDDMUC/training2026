# Design Principles

These rules govern every design decision in Training 2026. They are deliberately strict — a single-user app for a serious training log should feel like a *physical* training journal, not a SaaS dashboard.

## 1. Achromatic by default, chromatic by exception

The interface is **black, white, and grays.** Color is reserved for **a single accent role**, used to mark exactly one thing per view:

- The **current** day on the calendar
- The **primary** action in any toolbar
- The **today** marker on a chart line
- The **active** tab indicator

Status states (warning, success) reuse the accent's saturated form for warnings and inherit foreground grays for success — "successful" is the default state in a training log, so it shouldn't shout.

**Rule:** if you find yourself reaching for a second color, ask whether the information could be conveyed by weight, size, position, or rule instead. The answer is almost always yes.

## 2. Typography is the interface

Most components are typographic. No icon does the work of a well-set label. We use a single type family with strong vertical rhythm, two display weights (semibold + bold for emphasis), and a monospaced family for numeric data.

- **Numeric data is always tabular monospace.** Weights, percentages, time. Aligned columns are non-negotiable for a log.
- **Labels are uppercase tracking +6%** at small sizes — borrowed from sports almanacs and editorial mastheads.
- **Body is set at 16 px, line-height 1.5**, never narrower than 50 characters, never wider than 80.

## 3. Density over decoration

This is a training log, not a marketing page. Information density is high, but managed by:

- **A strict 8-point grid** for spacing (4 px is the secondary half-step).
- **Hairline rules** (1 px, opacity 12%) instead of borders + shadows for separation.
- **Whitespace as the primary separator** between groups. Cards, boxes, and shadows are forbidden as default — they're available only where a control needs lifting (e.g., a date picker popover).

## 4. No skeuomorphism, no gradients, no shadows on flat surfaces

- Surfaces are flat. Elevation exists only for **transient overlays** (popovers, modals, tooltips).
- Buttons are text + a hairline rule, or text on a black/white fill. No raised buttons, no soft shadows.
- Inputs are an underline, not a box. A box is allowed only in the logging form where it materially aids field discoverability.

## 5. Motion is utilitarian, never decorative

- Default duration **120 ms**, easing `cubic-bezier(0.2, 0.0, 0.0, 1.0)` for enter, `cubic-bezier(0.4, 0.0, 1.0, 1.0)` for exit.
- Use motion for: state changes (tab switch, panel collapse), incoming data, focus return. **Never for delight.**
- All motion respects `prefers-reduced-motion: reduce`.

## 6. Numeric truth above all

The Analysis surface is the reason this app exists. Charts follow Tufte / Cleveland principles:

- **One y-axis per chart**, no dual scales unless mandatory.
- **No 3D, no shading, no gradients** on data marks.
- **The current data point is the accent color.** Everything else is gray.
- **Tick labels are mono.** Axes are 1 px gray, gridlines optional and at 8% opacity.
- **Sparklines** are preferred over miniature bar charts for at-a-glance trend cells.

## 7. Accessibility minimums

- All text meets **WCAG AA**: 4.5:1 for body, 3:1 for large (≥ 18 px or ≥ 14 px bold).
- All interactive elements have **visible focus rings** (not the default browser ring — a 2 px black-or-white inset depending on background).
- Color is never the only signal — pair it with weight, label, or position.
- Targets are **at least 40 × 40 px** for touch, even though this is a desktop-first app.

## 8. Local-first values

- **No telemetry, no fonts loaded from a CDN.** Self-host fonts (or use system stacks) for speed and privacy.
- **Persist user preferences** (dark/light, density) in `localStorage`.
- **The whole UI works offline** — it has to, by definition.

## 9. Dark mode is a peer, not an afterthought

We will build a light theme and a dark theme as **equally complete** experiences from day one. Dark is not "light inverted" — grays are tuned separately. The accent color is the same in both.

## 10. When in doubt, remove

The single most-applied rule. If a chart label, a tooltip, a divider, a help icon — anything — could be deleted without harming comprehension, delete it.
