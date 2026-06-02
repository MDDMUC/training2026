# Component Inventory

Visual specs and behaviour for every component in the system. Spec format: composition, tokens used, states, accessibility notes.

## Quick spec key

- **Tokens** lists the semantic tokens a component depends on. Changing those tokens reshapes the component.
- **States** lists every interactive state. `default`, `hover`, `focus`, `active`, `disabled` are the baseline; some components add more (e.g. `error`, `today`).
- **A11y** lists the non-obvious accessibility requirements.

---

## ATOMS

### Button

- **Variants:** `primary`, `secondary`, `ghost`, `destructive`
- **Sizes:** `sm` (28 px h), `md` (36 px h, default), `lg` (44 px h)
- **Tokens:** `--button-primary-*`, `--space-2/4`, `--radius-2`, `--text-body-sm-*`
- **States:** default, hover (background shifts by one gray step), focus (2 px inset focus ring), active (background `--color-accent-600` if primary, else darken one step), disabled (`--color-fg-disabled`, no hover)
- **A11y:** every button has a text label; icon-only buttons require `aria-label`; focus ring is always visible via `:focus-visible`.

### Input

- **Variants:** `underline` (default, no box), `boxed` (form contexts)
- **Sizes:** `md` (36 px h), `lg` (44 px h)
- **Tokens:** `--input-*`, `--text-body-*`, `--space-2`
- **States:** default, focus (border becomes `--color-fg-default`, 2 px), invalid (border stays default, helper text is bold default fg — no red), disabled
- **A11y:** always paired with a `<label>` (the `Field` molecule does this); `aria-describedby` for helper / error.

### Text

- **Variants:** `display`, `h1`, `h2`, `h3`, `body-lg`, `body`, `body-sm`, `caption`, `micro`, `code`, `data`, `data-lg`
- **Renders as:** semantic HTML inferred from variant (`display→h1`, `h1→h1`, `h2→h2`, `body→p`, `caption→span`, `data→span` with `font-variant-numeric: tabular-nums`).
- **A11y:** every page has exactly one h1. Headings cannot skip levels.

### Rule

- **Variants:** horizontal (default), vertical
- **Tokens:** `--color-border-default` at 1 px
- **No shadows, no doubled lines.**

---

## MOLECULES

### Field

```
┌──────────────────────────────────────┐
│ LABEL (micro, uppercase)              │
│ ──────────────────────────────────── │  ← Input (underline)
│ helper text or error                  │
└──────────────────────────────────────┘
```

- Label is always uppercase micro variant.
- Error state replaces helper text with bold body-sm in default fg (no red).
- Tokens: `--space-1` between label and input, `--space-1` between input and helper.

### Stat

```
┌─────────────────────────────┐
│ MAX HANG R / 20MM            │   micro, muted
│ 55.0 kg                      │   data-lg, default fg
│ ↑ 3.2 kg vs last test        │   caption, muted (accent if PR)
└─────────────────────────────┘
```

- Three rows: micro label, large mono value, optional delta caption.
- Delta caption gets accent color **only when the value is a personal record**, otherwise stays muted.
- Tokens: `--space-1` between rows.

### Tag

- Hairline-bordered pill or filled pill, micro typography.
- Used for phase labels ("BASE", "MAX STRENGTH"), session types, RPE chips.
- Filled variant uses `--color-bg-inverse` + `--color-fg-inverse` for emphasis; no other fills.

### Toolbar

- Horizontal flex row, `gap: var(--space-2)`.
- Optional vertical Rule between logical groups.
- Sits above content with a `--space-5` margin below.

### Tabs

- Underline tab style: tab text + 2 px underline on the active tab in `--color-fg-default`.
- The accent color is **not** used for tab underlines — that's reserved for "today" and "primary action."

### MetricCell

- Single mono numeric value + caption label.
- Used in dense tables, chart axes, and the analysis stat grids.
- Tokens: `--text-data-*` for the value, `--text-micro-*` for the label.

### DatePicker

- Input + popover with a `MonthGrid` inside.
- Popover uses `--elevation-2`, `--radius-3`, 1 px hairline border.
- Selected date inverts (black bg, white fg); today gets `--calendar-cell-bg-today` + accent border.

---

## ORGANISMS

### CalendarHeader

Composition: `Text(h2, "May 2026")` + `Toolbar([Today button, ‹ ›, View tabs])`.

- "Today" jumps to the current date and highlights the cell.
- View tabs: Month / Week / Phase.

### MonthGrid

A 7 × 5–6 grid of `CalendarCell`. Each cell:
- Date number top-left, mono.
- Session glyphs (up to 3) as 8 × 8 filled squares — different fill levels (empty rule, half-fill, full-fill) for RPE 1–3, 4–6, 7–10. No color used for RPE — only fill level.
- "Today" cell: accent-tint background + accent border.
- Days in other months: foreground falls to `--calendar-cell-fg-other-month`.
- Hover (desktop): subtle bg shift.

### WeekStrip

7-column horizontal lane; each lane is a column with timeline-positioned session blocks. Mono day labels at the top.

### PhaseStrip

Horizontal bar 12 weeks wide. Three mesocycle segments separated by rules. Each segment colour-matched to its **density** (more sessions → darker tint of gray, not accent). Today marker is a 2 px vertical accent line.

### Chart

- One y-axis, one x-axis.
- Axis colour `--chart-axis` (gray 200).
- Line in `--chart-line` (default fg).
- Optional secondary line in `--chart-line-muted`.
- **Current data point** is a 6 × 6 dot in `--chart-point-current` (accent). All other points are 4 × 4 in default fg.
- No gridlines unless ratio chart; if used, 8% alpha.
- Hover/focus reveals a vertical crosshair (1 px dashed) + tooltip with mono numbers.

### SessionLogForm

Two-column on desktop:

```
LEFT (form)                  | RIGHT (live preview)
─────────────────────────────|───────────────────────
Date · Phase · Type           | Session card preview
Duration · RPE · Body weight  | (reflects values as
Exercises (repeatable rows)   |  you type them)
Notes (markdown)              |
[Cancel] [Save]               |
```

- Autosave to localStorage every 500 ms.
- Save button is `primary`; Cancel is `ghost`.
- `Ctrl+S` saves; `Esc` cancels (with dirty-state confirm if unsaved).

### TindeqQuickLog

Specialised entry for finger peak-force tests:

- Two big mono inputs side by side: **R** and **L**.
- Edge selector (20 mm default), grip selector (half / open / full).
- Auto-computes asymmetry % beneath the inputs.
- One-click history of last 5 tests in a sparkline strip.

### AsymmetryGauge

```
R   ████████████████████      55.0 kg
L   ██████████████████░░      52.0 kg
                              ─5.5% L
```

- Horizontal bars at scale; mono values right-aligned.
- Asymmetry % below in caption; if > 7%, accent color + warning glyph.

### CommandPalette (⌘K)

- Centred overlay, `--elevation-3`, max-width 560 px.
- Single input on top; results below in a flat list.
- Categories: Pages, Quick log, Recent sessions.

---

## TEMPLATES (layout skeletons)

### SurfaceTemplate

```
┌────────────┬────────────────────────────────────────┐
│            │ TopBar                                  │
│  AppNav    ├────────────────────────────────────────┤
│  (220 px)  │                                         │
│            │  main (content area)                    │
│            │                                         │
└────────────┴────────────────────────────────────────┘
```

- AppNav collapses to icons under `--bp-md`.
- TopBar sticky, 56 px tall.

### CalendarTemplate

SurfaceTemplate `main` is replaced by:

```
CalendarHeader
─────────────────────────────────────
MonthGrid / WeekStrip / PhaseStrip
─────────────────────────────────────
Today's session summary card (optional)
```

### LoggingTemplate

```
SessionLogForm (2-col)
─────────────────────
Recent sessions list (organism: SessionList)
```

### AnalysisTemplate

```
PhaseSummaryCard (today's context)
─────────────────────────────────
Chart  | Chart       (responsive 2-col on lg+)
Stat   | Stat   | Stat
TrendTable (full width)
```

---

## States and patterns common to all components

- **Loading** — never spinners. Use **skeletal mono dashes** that pulse at `--motion-calm` to indicate pending data.
- **Empty** — `EmptyState` molecule with icon + h3 + body-sm + optional ghost button.
- **Error (network)** — inline strip at top of view, body-sm bold default fg, dismissable.
- **Optimistic UI** — saves render immediately in muted state until persisted; rollback on failure with a Toast.
