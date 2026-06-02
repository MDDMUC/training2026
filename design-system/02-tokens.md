# Design Tokens

The complete token taxonomy for Training 2026. All values live in [`tokens/tokens.json`](./tokens/tokens.json) and are exported to CSS custom properties in [`tokens/tokens.css`](./tokens/tokens.css).

## Three-tier architecture

| Tier | Purpose | Example | May components use it? |
|---|---|---|---|
| **Primitive** | Raw values, context-free | `gray.950 = #0A0A0A` | ❌ Never directly |
| **Semantic** | Names a primitive by intent | `color.fg.default → gray.950` | ✅ Yes, default choice |
| **Component** | One component's override | `button.primary.bg → color.fg.default` | ✅ Yes, when needed |

A primitive change rolls through every layer automatically. A semantic change reshapes the whole theme. A component change touches one component. This is the whole point.

---

## 1. Color

### Primitives (light theme palette)

```
gray.0    #FFFFFF   pure white
gray.50   #FAFAFA   page background
gray.100  #F4F4F4   subtle surface
gray.200  #E8E8E8   hairline rules, dividers
gray.300  #D4D4D4   disabled fg, chart gridlines
gray.400  #A3A3A3   placeholder, muted fg
gray.500  #737373   secondary fg, axis labels
gray.600  #525252   body fg low emphasis
gray.700  #404040   body fg
gray.800  #262626   high emphasis fg
gray.900  #171717   strongest fg
gray.950  #0A0A0A   near-black, default fg
gray.1000 #000000   pure black, reserved
```

### Primitives (dark theme — separately tuned, not inverted)

```
night.0    #000000   pure black, reserved
night.50   #050505   page background
night.100  #0A0A0A   subtle surface
night.200  #141414   hairline rules
night.300  #1F1F1F   raised surfaces (modals)
night.400  #3A3A3A   muted fg
night.500  #6B6B6B   secondary fg
night.600  #8F8F8F   body fg low
night.700  #B5B5B5   body fg
night.800  #D6D6D6   high emphasis fg
night.900  #EAEAEA   strongest fg
night.950  #F5F5F5   near-white default fg
night.1000 #FFFFFF   pure white, reserved
```

### Accent (single chromatic primitive)

```
accent.500  #E85D04   signal-orange (default)
accent.600  #C24A00   pressed
accent.100  #FFE7D6   accent-tint surface (used rarely, e.g. selected calendar cell bg)
```

> **Why signal-orange?** Editorial; reads as "performance" without being aggressive; climbing-adjacent (rope, tape, chalk-bag); WCAG AA against both black and white at the chosen 500. **Swap it whenever you want** — change one primitive and every semantic role updates.

### Semantic color tokens

| Token | Light → | Dark → |
|---|---|---|
| `color.bg.canvas` | `gray.50` | `night.50` |
| `color.bg.surface` | `gray.0` | `night.100` |
| `color.bg.subtle` | `gray.100` | `night.200` |
| `color.bg.raised` | `gray.0` (with shadow) | `night.300` |
| `color.bg.inverse` | `gray.950` | `night.950` |
| `color.bg.accent` | `accent.500` | `accent.500` |
| `color.bg.accent.tint` | `accent.100` | `accent.500` @ 16% |
| `color.fg.default` | `gray.950` | `night.950` |
| `color.fg.muted` | `gray.500` | `night.500` |
| `color.fg.subtle` | `gray.400` | `night.400` |
| `color.fg.disabled` | `gray.300` | `night.300` |
| `color.fg.inverse` | `gray.0` | `night.0` |
| `color.fg.accent` | `accent.500` | `accent.500` |
| `color.border.default` | `gray.200` | `night.200` |
| `color.border.strong` | `gray.400` | `night.400` |
| `color.border.accent` | `accent.500` | `accent.500` |
| `color.focus.ring` | `gray.950` | `night.950` |

### Status (used sparingly — see Principle 1)

| Token | Resolves to | Use |
|---|---|---|
| `color.signal.warning` | `accent.500` | Overload / missed deload warnings |
| `color.signal.success` | `color.fg.default` | Successful sessions inherit default; no green |
| `color.signal.error` | `gray.1000` on `gray.100` | Form-validation errors — bold text, no red |

The signal palette intentionally avoids red/green. The accent does double duty as warning; success is the default state, so it shouldn't draw the eye.

---

## 2. Typography

### Font stacks

```
font.sans   "Inter", -apple-system, "Segoe UI", Roboto, system-ui, sans-serif
font.serif  "Newsreader", "Source Serif Pro", Georgia, serif
font.mono   "JetBrains Mono", "Cascadia Code", Consolas, Menlo, monospace
```

Self-host Inter, Newsreader, JetBrains Mono locally (no CDN). All other characters fall back to system fonts.

### Type scale (modular, ratio 1.25 — Major Third)

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `text.display` | 48 px | 1.1 | 700 | Page titles, hero numbers |
| `text.h1` | 36 px | 1.15 | 700 | Surface titles |
| `text.h2` | 28 px | 1.2 | 600 | Section heads |
| `text.h3` | 22 px | 1.25 | 600 | Subsection heads |
| `text.body.lg` | 18 px | 1.5 | 400 | Lead paragraphs |
| `text.body` | 16 px | 1.5 | 400 | Default body |
| `text.body.sm` | 14 px | 1.45 | 400 | Secondary body |
| `text.caption` | 13 px | 1.4 | 500 | Labels, meta |
| `text.micro` | 11 px | 1.3 | 600 | All-caps eyebrow, tracking +6% |
| `text.code` | 14 px mono | 1.45 | 500 | Numeric data, tabular |

### Tabular numeric variant

All numeric data uses `font-feature-settings: "tnum" 1, "lnum" 1;`. Defined as `text.data` token across body/caption sizes.

---

## 3. Spacing

8-point grid. 4 px is the half-step.

```
space.0     0
space.1     4 px
space.2     8 px
space.3     12 px
space.4     16 px
space.5     24 px
space.6     32 px
space.7     48 px
space.8     64 px
space.9     96 px
space.10    128 px
```

**Rule:** the only legal spacing values are these tokens. No `padding: 13px`. Ever.

---

## 4. Radii

```
radius.0     0       (default — flat, sharp)
radius.1     2 px    (inputs, small chips)
radius.2     4 px    (cards, buttons)
radius.3     8 px    (modals, popovers)
radius.full  9999 px (pills, dots)
```

Default radius is **0** to reinforce the editorial / brutalist feel. Round only where it functionally helps (focusable controls).

---

## 5. Elevation (shadows)

Used only for **transient overlays.** Never on default surfaces.

```
elevation.0  none
elevation.1  0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)   /* hover lift */
elevation.2  0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)   /* popover */
elevation.3  0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)  /* modal */
elevation.4  0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04) /* dialog */
```

Dark theme uses the same offsets with reduced alpha or none — drop a 1 px hairline border instead of a shadow where contrast suffices.

---

## 6. Motion

```
motion.duration.fast       100 ms
motion.duration.default    120 ms
motion.duration.slow       240 ms
motion.duration.calm       400 ms
motion.ease.enter          cubic-bezier(0.2, 0.0, 0.0, 1.0)
motion.ease.exit           cubic-bezier(0.4, 0.0, 1.0, 1.0)
motion.ease.standard       cubic-bezier(0.4, 0.0, 0.2, 1.0)
```

All durations × 0 when `prefers-reduced-motion: reduce`.

---

## 7. Breakpoints (desktop-first, single-user app)

```
bp.sm    480 px   (phone, fallback)
bp.md    768 px   (tablet, fallback)
bp.lg    1024 px  (default — laptop)
bp.xl    1440 px  (large desktop)
bp.2xl   1920 px  (24"+ desktop)
```

Target is `bp.lg`. Calendar week-grid optimises for 1024 px+; mobile is a graceful read-only fallback.

---

## 8. Z-index

```
z.base          0
z.raised        10
z.dropdown      100
z.sticky        200
z.overlay       1000
z.modal         1100
z.popover       1200
z.toast         1300
z.tooltip       1400
```

---

## 9. Layout grid

```
grid.columns        12
grid.gutter         space.4 (16 px)
grid.margin         space.6 (32 px)
grid.container.max  1280 px
```

A 12-column grid with a max-width of 1280 px works for both the calendar week-view and the analysis dashboard.

---

## 10. Iconography

- 24 × 24 px artboard, **1.5 px stroke**, lucide / phosphor / heroicons-style — pick one library, stick to it.
- Icons inherit `currentColor`.
- **Icons never appear without a text label** except in well-known affordances (× to close).
