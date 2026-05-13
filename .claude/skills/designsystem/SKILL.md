---
name: designsystem
description: >
  Use this skill whenever building, editing, or reviewing any UI component, screen, page, or
  artifact for the SproutAIGarden project or any Sprout internal tool. Triggers include: building
  new components, adding UI to the garden app, editing existing JSX/TSX, creating modals, cards,
  buttons, badges, chips, filters, or any visual element. Also triggers on phrases like
  "add a component", "build a screen", "make it look consistent", "use the design system",
  or any request to change how something looks inside SproutAIGarden. Do NOT skip this skill
  for "small" UI changes — every pixel should use Sprout tokens.
---

# Sprout Design System Skill

When building any UI for Sprout tools, Claude **must** follow the Sprout Design System (design-system-next).
Never invent colors, fonts, radii, or shadows from scratch. Always derive from the tokens below,
and (when the MCP server is available) query it first for component contracts.

---

## 0. MCP-First Lookup (when available)

If the `design-system-next` MCP server is connected:

1. **Before writing any component**, call `list_components` to see what already exists.
2. For each component you plan to use or extend, call `get_component` to get its exact prop
   contract, emits, composable signature, and usage example.
3. Implement exactly to that contract — do not rename props, do not add undocumented props without noting the deviation.

If the MCP is not connected, fall back to the hardcoded token reference below. Flag to the user
that the live component library wasn't consulted and offer to add it.

---

## 1. Design Token Reference

These are extracted directly from `SproutAIGarden_v9.jsx`. Treat them as ground truth until
superseded by a `get_component` call.

### Colors (`DS.colors` / `C`)

| Scale        | 50        | 100       | 200       | 300       | 400       | 500       | 600       | 700       | 800       | 900       |
|-------------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| kangkong    | #f0faf0   | #d6f0d6   | #aadcaa   | #77c277   | #4aaa4a   | **#2d8c2d** | #1f6e1f | #165216   | #0e380e   | #082008   |
| mushroom    | #fafaf8   | #f2f1ed   | #e4e2da   | #ccc9bc   | #b0ac9c   | #928e7c   | #736f5e   | #565244   | #3a372e   | #201e18   |
| tomato      | —         | #fed7d7   | —         | —         | —         | #e53e3e   | #c53030   | —         | —         | —         |
| mango       | —         | #fefcbf   | —         | —         | —         | #d69e2e   | #b7791f   | —         | —         | —         |
| carrot      | —         | #feebc8   | —         | —         | —         | #dd6b20   | —         | —         | —         | —         |
| wintermelon | —         | #e6fffa   | —         | —         | #38b2ac   | #2c7a7b   | —         | —         | —         | —         |
| blueberry   | —         | #ebf8ff   | —         | —         | #63b3ed   | #3182ce   | —         | —         | —         | —         |
| ubas        | —         | #faf5ff   | —         | —         | #9f7aea   | #805ad5   | —         | —         | —         | —         |

**One-offs:** `white: #ffffff`, `gold: #c8960c`, `mushroom950: #111009`

**Semantic mapping:**
- Primary action / brand green → `kangkong500` (#2d8c2d), hover → `kangkong600`
- Page background → `mushroom50` (#fafaf8)
- Borders / dividers → `mushroom200` (#e4e2da), subtle → `mushroom300`
- Body text → `mushroom900` (#201e18)
- Muted text → `mushroom500` (#928e7c) or `mushroom600`
- Danger / error → `tomato500` / `tomato100`
- Warning → `mango500` / `mango100`
- Info → `blueberry500` / `blueberry100`
- Success → `kangkong600` / `kangkong100`
- Accent / premium → `ubas500` / `ubas100`

### Typography

```
Font family (main):  "Rubik, system-ui, sans-serif"   →  FF or DS.fonts.main
Font family (mono):  "Roboto Mono, monospace"          →  DS.fonts.mono
```

Always set `fontFamily: FF` on every styled element. Never use system-ui alone.

### Border Radius

```
sm   → 6px      (chips, small tags)
md   → 10px     (cards, inputs, dropdowns)
lg   → 14px     (panels, modals)
xl   → 18px     (large surfaces)
full → 9999px   (pills, avatars, dot indicators)
```

### Shadows

```
sm  → "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)"
md  → "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)"
lg  → "0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)"
xl  → "0 16px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)"
```

Use `DS.shadow.sm` for cards at rest, `DS.shadow.md` for hover lift, `DS.shadow.lg` for modals/drawers.

---

## 2. Core Component Patterns

These are the reusable primitives in the codebase. **Do not duplicate** — import/extend these.

### `<Chip>` — filter pill

```jsx
<Chip label="LLM" active={capFilter==="LLM"} onClick={...} color={optionalAccentColor} />
```

Style contract: `borderRadius: DS.radius.full`, active border = `kangkong500`, inactive border = `mushroom300`.
Font weight 600 when active, 400 when inactive. Transition `all 0.15s`.

### `<Badge>` — status label

```jsx
<Badge label="Active" tone="success" size="sm" />
```

Tones: `neutral` | `success` | `danger` | `pending` | `info` | `accent`
Color pairs (bg / text):
- neutral → mushroom100 / mushroom700
- success → kangkong100 / kangkong700
- danger  → tomato100  / tomato600
- pending → mango100   / mango600
- info    → blueberry100 / blueberry500
- accent  → ubas100    / ubas500

### `<CountryBadge>` — inline SVG flag + code

```jsx
<CountryBadge country="PH" size="sm" />   // sm or lg
```

**Critical:** Never use emoji flags (🇵🇭 🇹🇭) in rendered JSX. Always use the inline SVG `<FlagPH>` / `<FlagTH>` components or `<FlagSVG country={...}>`.

Size specs:
- `sm`: text 9px, flag 16×11
- `lg`: text 11px, flag 20×14

### `<ProjectImage>` — SVG project thumbnail

```jsx
<ProjectImage project={project} width="100%" height={120} style={{borderRadius: DS.radius.md}} />
```

Uses `STAGE_COLORS`, `DEPT_COLORS`, and `CAP_ICONS`. Never use `<img>` tags for project cards.

### `<ActiveFilterChip>` — removable filter with × button

```jsx
<ActiveFilterChip label="LLM" onRemove={() => setCapFilter("All")} color={optionalColor} icon={<FlagSVG .../>} />
```

### View Mode Switcher pattern

```jsx
// Background: mushroom100, borderRadius: DS.radius.md, padding: 2
// Active button: white bg + DS.shadow.sm + kangkong600 text
// Inactive button: transparent bg + mushroom500 text
```

---

## 3. Stage System

Stages are the core data model. Always use the constants — never hardcode strings.

```js
const STAGES = ["seed","sprout","growing","blooming","thriving"];
const STAGE_LABELS = { seed:"Seed", sprout:"Sprout", growing:"Growing", blooming:"Blooming", thriving:"Thriving" };
const STAGE_COLORS = {
  seed:      { bg:"#f2f1ed", border:"#ccc9bc", dot:"#928e7c", text:"#565244" },
  sprout:    { bg:"#f0faf0", border:"#aadcaa", dot:"#2d8c2d", text:"#1f6e1f" },
  growing:   { bg:"#fefcbf", border:"#d69e2e", dot:"#b7791f", text:"#744210" },
  blooming:  { bg:"#feebc8", border:"#dd6b20", dot:"#c05621", text:"#7b341e" },
  thriving:  { bg:"#ebf8ff", border:"#63b3ed", dot:"#3182ce", text:"#2c5282" },
};
```

Stage selector UI: Radio cards showing stage name + `STAGE_DESC`. Default selection: `sprout`.
**Never hardcode `stage: "sprout"`** — always use `form.stage`.

---

## 4. Department & Country Constants

```js
const DEPT_COLORS = { /* always use existing map, never add ad-hoc colors for depts */ };
const COUNTRY_MAP  = { "sprout.ph":"PH", "sproutsolutions.io":"TH" };
```

Country must always be **inferred from email domain**, never asked of the user (unless domain is unrecognised → show `FirstTimeCountryModal`).

---

## 5. Permission & Role Model

| Role     | Badge      | Can do |
|----------|-----------|--------|
| Any employee | 🌱 Planter | Submit/upvote Wishlist |
| AI Builder   | 🌾 Farmer  | Claim seeds, self-promote to Garden |
| Program lead | 🌿 Gardener | Admin — edit any project stage/metadata |

**Permission checks must happen before every mutation.** On failure: (1) do not mutate state, (2) show error to user, (3) log the action. Silent failures are not acceptable.

---

## 6. Anti-Patterns (Never Do)

| ❌ Don't | ✅ Do instead |
|---------|-------------|
| Use emoji flags (🇵🇭) in JSX | Use `<FlagSVG country="PH">` |
| Use `<img>` tags on project cards | Use `<ProjectImage project={...}>` |
| Invent new colors | Use `DS.colors` tokens |
| Use `system-ui` alone | Always include `Rubik` first |
| Skip permission check before mutation | Always check role before any write |
| Hardcode `stage:"sprout"` | Use `form.stage` |
| Use localStorage | Use React state |
| Add `<form>` tags in React artifacts | Use `onClick`/`onChange` handlers |

---

## 7. MCP Configuration Reference

To enable the design system MCP in Claude Code or `.mcp.json`:

```json
{
  "mcpServers": {
    "design-system-next": {
      "command": "npx",
      "args": ["mcp-design-system-next@latest"]
    }
  }
}
```

When the MCP is active, always call `list_components` before starting a UI task, then `get_component` for each component being used. The MCP output overrides this skill file for component-level details.
