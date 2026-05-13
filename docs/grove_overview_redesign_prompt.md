# Claude Code Task: Grove Overview Dashboard Redesign

## Before you write a single line of code — read everything first

1. Read `AGENTS.md` completely
2. Read `CLAUDE.md` if it exists
3. Read `src/App.jsx` in full — find the Dashboard/Overview component and understand:
   - What is the current component name and what line does it start at?
   - What data does it consume and from where (props, Supabase queries, local state)?
   - What design system tokens does it use (the DS or C object, color constants)?
   - Which role checks does it use (isAdmin, isExCom, is_gardener, etc.)?
   - How does the current layout differ between roles?
4. Open `grove-overview-redesign.html` — this is the visual reference mockup.
   - Do NOT copy its HTML/CSS structure into React
   - DO extract the SVG code for: the garden scene, the stage tile illustrations, and the page watermark — these are complex enough to reuse directly as inline JSX SVGs
   - Use it to understand layout intent, color usage, and component behaviour

After reading, confirm your findings before touching anything. Report:
- Component name and line number
- Current data sources
- Existing DS color token names (kangkong, mushroom, mango, ubas, blueberry, wintermelon, etc.)
- Current role-based layout differences in the Overview

---

## What you are doing

Redesigning the Overview/Dashboard view only. No other views, no routing, no auth, no Supabase schema changes.

---

## Unified layout — all 3 roles see the same page

Previously the app showed different layouts per role (Admin, ExCom/Approver, Employee). **This changes to one unified layout for everyone.** The only role-based difference is a single button state (see Role Differences below).

### Main column (left, ~75% width) — top to bottom

**1. Greeting**
- "Good [morning/afternoon/evening], [firstName]!" — time of day derived from `new Date().getHours()`
  - 5–11: morning, 12–17: afternoon, 18–4: evening
- Subtitle: "X AI projects across PH & TH · Y plants, Z seeds"

**2. Stage tiles** — 6 tiles in a row
Each tile shows: large count number (top-left) + stage name with colored dot + description text.
Each tile has:
- A 3px colored top bar (use `::before` pseudo-element or an absolutely positioned div)
- A small botanical SVG illustration, `position: absolute; bottom: 8px; right: 8px; opacity: 0.18`
- Stage colors using existing DS tokens:
  - Seed: mango (amber)
  - Seedling: wintermelon (teal)
  - Nursery: mango, highlight background
  - Sprout: kangkong (green)
  - Bloom: blueberry (blue)
  - Thriving: ubas (purple), highlight background

Extract the SVG illustration code for each stage from `grove-overview-redesign.html` (look for the 6 stage tile SVGs inside `.stage-tile` elements).

**3. Spotlight card**
Full-width card. Left side: text content. Right side: a Philippine garden SVG scene.

The garden scene is built as a single inline SVG with `position: absolute; inset: 0; width: 100%; height: 100%` using `preserveAspectRatio="xMidYMid slice"`. Extract the full SVG from `grove-overview-redesign.html` (the `<svg>` inside `#sp-card`).

**Time-of-day sky** — JS runs after mount to set sky colors and show/hide elements by ID:

| Time | Sky fill | What's active |
|---|---|---|
| 5am–11am | `#fffbf0` | Sun orb near horizon + 2 pulsing rings + warm glow haze |
| 12pm–5:59pm | `#f0fffd` | Clouds drifting slowly (30s animation). No orb. |
| 6pm–4:59am | `#1a1730` | Moon + glow ring + 8 twinkling stars. Grass darkens to silhouette. Seeds glow lavender. |

Text overlaid on left side adapts color:
- Morning/afternoon: `color: #111009` (name), `#3a372e` (desc), `#565244` (meta), eyebrow `#1f6e1f`
- Evening: `color: #f9fafb` (name), `#d1fae5` (desc), `#a7f3d0` (meta), eyebrow `#86efac`

Extract the full time-of-day JS logic from `grove-overview-redesign.html` (the `<script>` block at the bottom) and convert it to a `useEffect` hook that runs once on mount.

**4. AI Adoption Intelligence card**
4 tabs: AI Assistant · Builder Tools · Frameworks · Data Sources

Each tab has two columns:
- Left: horizontal bar chart showing usage counts, derived from project data
- Right: contextual insight column
  - AI Assistant tab: adoption trend (growing/declining/new/stable per tool)
  - Builder Tools tab: adoption trend
  - Frameworks tab: build complexity (how many tools per project: simple/moderate/advanced) + most common combos
  - Data Sources tab: shared vs unique (sources used by 3+ teams = shared, shown as teal tags)

Above each left column: a quiet insight callout — `border-left: 2.5px solid` blueberry color, no background fill, muted text. Not an alert box.

Data derivation (no new DB fields needed):
- `tool_used` array on each project → split into AI Assistants vs Builder Tools using this frontend classification:
  - AI Assistants: Claude, ChatGPT, Gemini, Copilot
  - Builder Tools: Claude Code, Cursor, Cowork, Bolt, n8n, and everything else
- `agentic_framework` array → Frameworks tab
- `data_sources` array → Data Sources tab

**5. Building Momentum card**
3 tabs: Divisions · Departments · Builders

**Divisions tab (default)**
Uses a static frontend mapping — no database change needed:

```js
const DIVISIONS = {
  'Growth':           ['Marketing', 'Product Marketing', 'LDU', 'SolCon', 'Sales', 'Upsell', 'RevOps'],
  'Customer Success': ['Implementation', 'MPS', 'CA', 'CSM', 'Alliance'],
  'Aurora':           ['Prd-Aurora', 'Eng-Aurora', 'DevOps'],
  'Prometheus':       ['Prd-Prometheus', 'Eng-Prometheus', 'Data'],
  'Operations':       ['Legal', 'PeopleOps', 'Finance'],
  'ExCom':            ['ExCom'],
};
```

Derive each project's division by matching its `department` field against DIVISIONS. Left column: division leaderboard with project count + stage distribution strip + plain text like "4 live · 2 building". Right column: "Which divisions are benefiting" (built_for data) + completeness bar "X of 6 divisions active". Divisions with 0 projects: faded, italic "No AI projects yet — nudge this division".

**Departments tab**
Same leaderboard format but at department level. Visually grouped under division headers using a subtle division label row. Right column: completeness bar + inactive department chips.

**Builders tab**
Individual leaderboard. Each row: avatar initials + name + division tag + department. Right column: bar chart of builders per division.

**Stage distribution strip** (used on every division/department row):
Colored segments proportional to project count per stage. All 5 stages Seed→Thriving. Use DS tokens:
- Seed: mango500 · Seedling: wintermelon400 · Sprout: kangkong400 · Bloom: blueberry400 · Thriving: ubas400

A small legend sits above the strip list: 5 tiny colored pills labeled Seed, Seedling, Sprout, Bloom, Thriving.

---

### Sidebar (right, ~25% width) — same for all roles, in this order

**1. My Corner**
- Garden Health section: Total plants, Pipeline health (%), Nursery queue count
- "View Board →" link
- My Projects section: list of logged-in user's own projects, each with project name + stage badge

**2. Recent Activity**
Feed of recent events (project added, stage moved, etc.). Colored dot per event type. Timestamp.

**3. Seeds to Claim**
Green-bordered card (kangkong border, subtle green shadow). Header with "Seeds to Claim" eyebrow + open count badge. Lists top 3 unclaimed seeds with upvote count. "Browse all Seeds →" full-width green CTA button at the bottom.

---

## Role differences — buttons only

- **Nursery stage**: ExCom and Admin (is_gardener) users see an "Approve" button next to Nursery count. Normal users do not. This is one conditional button, not a layout change.
- All other content is identical regardless of role.

---

## Do NOT touch

- Any view other than Overview/Dashboard
- Supabase schema or database queries outside the Overview component
- Auth flow, login screen, session handling
- DS token definitions (read them, use them, never redefine them)
- The nav bar structure (only the Overview content section changes)
- Add-project flow, project detail panel, modals
- Board, Garden, Seeds, Wishlist views

---

## Page background watermark

A large botanical SVG (`position: fixed; bottom: -20px; right: -20px; z-index: 0; opacity: 0.045; width: 280px; height: 280px; pointer-events: none`) sits behind all content. Extract from `grove-overview-redesign.html` (the `.page-watermark` SVG near the bottom).

---

## How to proceed — 3 phases, do not skip ahead

**Phase 1 — Read and map (zero changes to any file)**
Read `AGENTS.md`, `CLAUDE.md`, `src/App.jsx`, and `grove-overview-redesign.html`. Report:
- Overview component name and line number
- Every data source it reads
- Every sub-section it currently renders per role
- DS color token names available
- Any questions you have before starting

Wait for confirmation before Phase 2.

**Phase 2 — Propose (zero changes to any file)**
Write a complete list of every change you intend to make:
- What you will add
- What you will modify
- What you will leave exactly as-is
- Any risks or unknowns

Wait for confirmation before Phase 3.

**Phase 3 — Execute (one section at a time)**
Build in this exact order. After each section, confirm it renders without errors before continuing:
1. Unified layout structure + sidebar reorder
2. Stage tiles (top bar + bottom-right SVG illustrations)
3. Spotlight card (full garden scene + time-of-day JS as useEffect)
4. AI Adoption Intelligence card (4 tabs)
5. Building Momentum card (3 tabs + static DIVISIONS mapping)
6. Sidebar (My Corner, Activity, Seeds in correct order)
7. Page watermark SVG

---

## Done-state checklist

Before declaring this task complete, confirm every item:

- [ ] Overview renders identically for Admin, ExCom, and normal Employee
- [ ] Nursery "Approve" button appears for ExCom/Admin only — not for normal users
- [ ] All 6 stage tiles show correct live count, botanical illustration bottom-right, colored top bar
- [ ] Spotlight garden scene renders — sky color and animations match local time of day
- [ ] Evening sky (6pm+) shows white/green text — not dark text on dark background
- [ ] AI Adoption Intelligence: 4 tabs, each with bar chart + right-column insight, quiet left-border callout
- [ ] Building Momentum: 3 tabs (Divisions/Departments/Builders), DIVISIONS mapping wired to real project department data
- [ ] Stage strips show Seed→Thriving in correct DS colors with proportional widths
- [ ] Sidebar order: My Corner → Recent Activity → Seeds to Claim
- [ ] Seeds to Claim card has green border and full-width CTA button
- [ ] Page watermark SVG visible bottom-right at low opacity
- [ ] All other views (Garden, Board, Seeds, Wishlist) load without errors
- [ ] No console errors
- [ ] No TypeScript/lint errors if the project uses those
