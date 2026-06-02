# Atomic Design Taxonomy

Brad Frost's atomic design methodology, mapped to Training 2026's three surfaces: **Calendar**, **Logging**, and **Analysis**. The five levels are a mental model — not a folder structure dogma. We use them to keep components small, composable, and named consistently.

## The five levels (recap)

```
Atoms       — irreducible UI primitives (text, button, input, icon, rule)
Molecules   — small compounds of atoms (field, stat, tag, breadcrumb)
Organisms   — distinct sections (calendar grid, session-log form, chart)
Templates   — page-level layout skeletons, no real content yet
Pages       — templates filled with real data and state
```

The rule of thumb: a thing is an **atom** if you can't usefully split it. A thing is a **molecule** if you'd reuse it without modification. A thing is an **organism** if it owns a section of a screen.

---

## Atoms

The smallest pieces. They never know about app state or domain concepts.

| Atom | Description | Notes |
|---|---|---|
| **Text** | A single styled string (uses `--text-*` tokens) | All text passes through a single Text atom that takes a `variant` (display, h1, body, caption, micro, data) |
| **Button** | Pressable, variants: `primary`, `secondary`, `ghost`, `destructive` | No icon-only buttons except `×` close |
| **Icon** | 24 × 24, 1.5 px stroke, inherits `currentColor` | Single library (lucide) |
| **Input** | Single-line text/number input | Underline style by default; boxed only inside `Form` |
| **Textarea** | Multi-line | Same underline style |
| **Select** | Native `<select>` styled to match Input | No custom listbox unless we hit a wall |
| **Checkbox** | 16 × 16, sharp corners, black/white | |
| **Radio** | 16 × 16, circle | |
| **Toggle** | 32 × 18 pill | Pill is the one place radius-full is used |
| **Slider** | Range input | Mono numeric value label |
| **Label** | Form-field label, micro typography | Uppercase tracking +6% |
| **Rule** | 1 px hairline divider | Horizontal or vertical, opacity 12% |
| **Spacer** | Token-driven empty box | Only when flex/grid won't do |
| **Avatar** | Optional, single-user app — likely unused | |
| **Logo** | Mark + wordmark | |

---

## Molecules

Compound components that combine 2–4 atoms. Domain-neutral.

| Molecule | Composition | Example use |
|---|---|---|
| **Field** | Label + Input (+ optional helper text) | Forms |
| **Stat** | Micro-label + large data value + optional delta | "MAX HANG +18kg ↑3kg" |
| **Tag** | Micro text in a hairline-bordered or filled pill | Phase tag, RPE tag |
| **Breadcrumb** | Text → Text → Text with separators | Top of nested pages |
| **Pagination** | Prev / page / next | Long log lists |
| **DatePicker** | Input + popover calendar | Logging form |
| **Toolbar** | Group of Buttons with separators | Calendar top bar |
| **Tabs** | Tab list + active indicator | Switching weeks / months / phases |
| **Tooltip** | Hover/focus disclosure | Chart points |
| **MetricCell** | Mono number + label, tabular | Used in Stat grids and chart axes |
| **EmptyState** | Icon + heading + body + optional action | "No sessions logged yet this week" |
| **Toast** | Inline confirmation strip | "Saved." |

---

## Organisms

Self-contained sections of a screen. They own layout and may bind to data.

### Calendar surface organisms
- **CalendarHeader** — month/year + prev/next + view-switcher (Month / Week / Phase)
- **MonthGrid** — 7 × 5–6 grid of CalendarCell
- **WeekStrip** — single-week view with vertical hour or session lanes
- **PhaseStrip** — horizontal bar showing the 3 × 4-week phases + deload markers + today indicator
- **CalendarCell** — date number + session glyphs + RPE dot

### Logging surface organisms
- **SessionLogForm** — the full session entry form (type, duration, exercises, RPE, notes)
- **ExerciseRowEditor** — repeatable row for an exercise (name, sets × reps × load, RPE)
- **TindeqQuickLog** — specialised entry for finger peak-force tests (R/L, edge, position)
- **NotesPanel** — markdown notes with autosave

### Analysis surface organisms
- **Chart** — line/area/bar with tokenised axes, single accent point
- **StatBlock** — vertically stacked Stats with rules between
- **TrendTable** — tabular numeric data, sorted, mono-aligned
- **PhaseSummaryCard** — phase title + dates + key metrics summary
- **PRTracker** — personal-record list with date and delta
- **AsymmetryGauge** — bilateral comparison (R vs L) for fingers/limbs

### Cross-cutting organisms
- **AppNav** — left sidebar with the three surface links + settings
- **TopBar** — page title, date jump, today button, theme toggle
- **CommandPalette** — keyboard-first jump-to / quick-log (⌘K)

---

## Templates

Layout skeletons. They define grid + slots, not content.

| Template | Slots |
|---|---|
| **SurfaceTemplate** | `AppNav` + `TopBar` + `main` content area |
| **CalendarTemplate** | SurfaceTemplate + `CalendarHeader` + grid-area for `MonthGrid` / `WeekStrip` |
| **LoggingTemplate** | SurfaceTemplate + 2-column split: form left, history right |
| **AnalysisTemplate** | SurfaceTemplate + responsive 12-col grid of Chart / StatBlock slots |
| **ModalTemplate** | Overlay + centred panel + dismissable affordance |

---

## Pages

Templates with real data. These are what live at routes.

| Route | Page | Template |
|---|---|---|
| `/` | Today | LoggingTemplate (focused on today's session) |
| `/calendar` | Calendar — Month | CalendarTemplate |
| `/calendar/week/:weekId` | Calendar — Week | CalendarTemplate |
| `/calendar/phase/:phaseId` | Phase detail | CalendarTemplate |
| `/log/:sessionId` | Session detail | LoggingTemplate |
| `/log/new` | New session | LoggingTemplate |
| `/analysis` | Analysis dashboard | AnalysisTemplate |
| `/analysis/fingers` | Finger strength deep-dive | AnalysisTemplate |
| `/analysis/pull` | Pull-up strength deep-dive | AnalysisTemplate |
| `/analysis/load` | Weekly/phase load deep-dive | AnalysisTemplate |
| `/settings` | Settings | SurfaceTemplate |

---

## Naming + organisation

When we pick a framework, the folder structure mirrors this taxonomy:

```
src/
  atoms/
  molecules/
  organisms/
    calendar/
    logging/
    analysis/
    chrome/
  templates/
  pages/
  tokens/         (CSS only — JSON lives at design-system/)
  lib/            (data + utilities)
```

A component **only imports from its own level or lower.** An atom never imports a molecule. An organism never imports a page. This is the second rule that keeps the system small and maintainable.
