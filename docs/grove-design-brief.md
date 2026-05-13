# Grove — Design Direction Brief
**For Claude chat collaboration — March 2026**

> **Your job:** Help the product owner choose and refine a design direction for Grove, then produce a spec sheet detailed enough for Claude Code to implement without follow-up questions.

---

## 1. What Grove Is

Grove is an internal AI project tracker for Sprout — a company with offices in the **Philippines (PH)** and **Thailand (TH)**. It tracks AI initiatives from seed idea → prototype → production.

It is a **React + Vite single-page app** (`src/App.jsx`, ~4500 lines). All styling is done with **inline styles** using a shared design token system (see Section 4). No Tailwind, no CSS files, no CSS-in-JS libraries. Every pixel uses the token constants.

---

## 2. The Three User Types

These are the three people who use Grove daily. Design decisions should serve all three.

### Planter (most common user)
Any Sprout employee. They:
- Submit Seeds (ideas they want to see built)
- Claim Seeds and build them into Plants
- Track their own projects through 5 stages
- Browse what others are building across PH and TH

**Mental model:** "What's happening across the garden? Where is my project? What should I work on next?"

### Approver (~2–3 people per office)
Senior leaders who review projects before they advance past Nursery. They:
- Review projects stuck in Nursery stage
- Approve or decline advancement
- Need a fast, scannable view of "what needs my attention"

**Mental model:** "What needs my review? How healthy is the overall pipeline?"

### Admin (~1–2 people total)
Full power users. They:
- Can edit / delete any project or seed
- Can skip stages
- Need oversight of the whole garden
- Manage data quality

**Mental model:** "Is the data clean? Is anything stuck? Do I need to intervene?"

---

## 3. Current App Structure

### Navigation tabs
```
[ Board ]  [ Seeds ]  [ Yours ]
```

- **Board** — Kanban view. 5 columns (Seedling → Nursery → Sprout → Bloom → Thriving). Cards show project title, builder, country badge, days active, capabilities.
- **Seeds** — Wishlist of ideas not yet claimed. Cards show idea title, description, upvotes, claimer status.
- **Yours** — Filtered view of the current user's own projects and seeds.

### Overlays / panels
- **Welcome Modal** — Shown on first login (or until dismissed). Explains roles + stages.
- **Help Panel** — Slide-over from FAB (bottom right). Tabs: Stages | Feedback | Roles | FAQ.
- **Add/Edit Plant modal** — Form to create or edit a project.
- **Add/Edit Seed modal** — Form to create or edit a seed idea.
- **Plant Detail modal** — Full view of a project card with history and notes.

### Top navigation bar
```
[🌿 Grove logo]  [Board][Seeds][Yours]  [PH/TH toggle]  [User name + role badge]  [?Help FAB]
```

---

## 4. Design Token System (must use in spec)

All colors, spacing, typography, and shadows are defined in a `DS` constant in `App.jsx`. The spec **must** reference tokens by name, not raw hex values.

### Color tokens (`C.` prefix)

**Kangkong (green — primary brand)**
```
kangkong50:#f0faf0  kangkong100:#d6f0d6  kangkong200:#aadcaa
kangkong300:#77c277 kangkong400:#4aaa4a  kangkong500:#2d8c2d
kangkong600:#1f6e1f kangkong700:#165216  kangkong800:#0e380e
kangkong900:#082008
```

**Mushroom (neutral — backgrounds, borders, muted text)**
```
mushroom50:#fafaf8   mushroom100:#f2f1ed  mushroom200:#e4e2da
mushroom300:#ccc9bc  mushroom400:#b0ac9c  mushroom500:#928e7c
mushroom600:#736f5e  mushroom700:#565244  mushroom800:#3a372e
mushroom900:#201e18  mushroom950:#111009
```

**Accent colors**
```
tomato500:#e53e3e    tomato100:#fed7d7    tomato600:#c53030
mango50:#fffff0      mango100:#fefcbf     mango500:#d69e2e    mango600:#b7791f
carrot500:#dd6b20    carrot100:#feebc8
wintermelon500:#2c7a7b  wintermelon100:#e6fffa  wintermelon400:#38b2ac
blueberry500:#3182ce    blueberry100:#ebf8ff    blueberry400:#63b3ed
ubas500:#805ad5         ubas100:#faf5ff         ubas400:#9f7aea
white:#ffffff  gold:#c8960c
```

### Stage colors (`STAGE_COLORS`)
```
seedling: bg=mushroom100  text=mushroom600  border=mushroom300  dot=mushroom400
nursery:  bg=mango100     text=mango600     border=mango500     dot=mango500
sprout:   bg=wintermelon100  text=wintermelon500  border=wintermelon400  dot=wintermelon400
bloom:    bg=kangkong100  text=kangkong600  border=kangkong200  dot=kangkong500
thriving: bg=blueberry100 text=blueberry500 border=blueberry400 dot=blueberry500
```

### Typography
```
font-family: "Rubik, system-ui, sans-serif"  (token: FF)
mono: "Roboto Mono, monospace"
```

### Border radius (`DS.radius`)
```
sm:6px  md:10px  lg:14px  xl:18px  full:9999px
```

### Shadows (`DS.shadow`)
```
sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)
lg: 0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)
xl: 0 16px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)
```

---

## 5. Hard Constraints (non-negotiable)

These come from the product spec and must never be violated:

1. **No emoji flags** — PH/TH flags are always inline SVG. Never 🇵🇭 or 🇹🇭.
2. **No external image URLs** — Project thumbnails use a `ProjectImage` SVG component.
3. **`country` is immutable** — derived from email domain at signup. Never user-editable.
4. **Stage values are fixed:** `seedling | nursery | sprout | bloom | thriving`
5. **No board drag-arrow buttons** — Stage advancement via drag-and-drop only on the board.
6. **No localStorage** — Supabase SDK manages sessions. Nothing else touches storage.
7. **All styling is inline** — No CSS classes, no Tailwind, no external style files. Use DS tokens.

---

## 6. The Three Design Directions (to choose from or blend)

These were proposed in a previous conversation. The product owner liked the overall direction but wants to refine and select.

---

### Option 1 — Clean Garden
**Extends the current DS. Soft sage greens, cream tones, card-first layout. Feels like a polished internal tool.**

Key changes from current state:
- Add a **metric strip** at the top of the Board: 4 stat pills showing counts per stage
- Improve card hierarchy: larger title, softer metadata row
- Refine nav bar: more breathing room, tighter role badge
- Welcome Modal: dark green header (#14532d = close to kangkong900), role + stage intro
- Consistent spacing scale (8px base grid)

**Palette:** kangkong range + mushroom range + stage accent colors
**Tone:** Calm, professional, approachable

ASCII preview:
```
┌─────────────────────────────────────────────────────────────────┐
│  🌿 Grove        [Board][Seeds][Yours]  [PH]  Kyla  Planter    │
├───────┬───────┬───────┬───────┬─────────────────────────────────┤
│  🌱 3 │ 🌿 2  │ 🌿 5  │ 🌸 3  │ 🌳 4   (metric strip)         │
├───────┴───────┴───────┴───────┴─────────────────────────────────┤
│  Seedling         Nursery        Sprout         Bloom    ...    │
│  ┌──────────┐    ┌──────────┐   ┌──────────┐                   │
│  │ AI Doc   │    │ SmartQ   │   │ Coda Bot │                   │
│  │ Sorter   │    │ Review   │   │          │                   │
│  │ ○PH  3d  │    │ ○TH  1d  │   │ ○PH  7d  │                   │
│  └──────────┘    └──────────┘   └──────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Option 2 — Bold & Structured
**Dark topbar, high contrast, productivity-app feel (Linear / Notion). Information-dense. For power users.**

Key changes from current state:
- **Dark topbar** using mushroom900 (#201e18) or kangkong800 (#0e380e) — white text on dark
- **Pipeline summary bar** below topbar: total plants, seeds open, review queue count + progress bar
- Card layout tightened: smaller padding, more visible stage column headers
- Stage columns get sticky headers when scrolling
- Approver/Admin role gets a highlighted "Needs review: N" badge in the topbar

**Palette:** Dark header (mushroom900) + mushroom50 body + stage accent colors
**Tone:** Efficient, serious, control-focused

ASCII preview:
```
┌─────────────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████ dark header ████████  │
│ █  GROVE  Board Seeds Yours   [PH]  Kyla  Planter  [?Help]   █ │
├─────────────────────────────────────────────────────────────────┤
│  14 Plants  ·  3 Seeds  ·  2 Awaiting review  ██████████░░ 57% │
├─────────────────────────────────────────────────────────────────┤
│  SEEDLING ──────  NURSERY ───────  SPROUT ─────  BLOOM ──────  │
│  ┌──────────┐     ┌──────────┐    ┌──────────┐                 │
│  │ AI Doc   │     │ SmartQ   │    │ Coda Bot │                 │
│  │ Ana · PH │     │ Jon · TH │    │ Ben · PH │                 │
│  │ 3d ago   │     │ 1d ago   │    │ 7d ago   │                 │
│  └──────────┘     └──────────┘    └──────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Option 3 — Warm & Story-Driven
**Earthy sage + warm cream. Leans into the garden metaphor. Conversational copy, narrative feel. Less corporate, more human.**

Key changes from current state:
- **Personalized header** — "Your garden has 14 plants growing across PH & TH."
- **Smart callout** for role-specific action — "2 plants need your review in the Nursery." (Approver) / "3 seeds are unclaimed — want to build one?" (Planter)
- Cards show a one-line description excerpt
- Stage labels use fuller names: "🌱 Seedlings · 3 growing"
- More vertical rhythm; less dense than Option 2

**Palette:** kangkong range + mango100 accents + mushroom100 backgrounds
**Tone:** Welcoming, narrative, human

ASCII preview:
```
┌─────────────────────────────────────────────────────────────────┐
│  Grove 🌿                            Kyla from PH     [Help]   │
├─────────────────────────────────────────────────────────────────┤
│  ╔══════════════════════════════════════════════════════════╗   │
│  ║  Your garden has 14 plants growing across PH & TH. 🌍   ║   │
│  ║  3 seeds are unclaimed — want to build one?             ║   │
│  ╚══════════════════════════════════════════════════════════╝   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🌱 Seedlings  🌿 Nursery    🌿 Sprouts   🌸 Blooms     │   │
│  │     3 growing     2 pending    5 building    3 live      │   │
│  │                                                          │   │
│  │  📋 AI Doc Sorter        PH · Ana · 3d ago              │   │
│  │     "Automates meeting note filing for ops"             │   │
│  │  📋 Leaves AI            TH · Ben · 12d ago             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. What the Product Owner Said

> "I like the product design direction. I want to be able to pick from 3 different look and feel options and refine before implementation."

No direction has been chosen yet. The product owner is evaluating all three.

---

## 8. What Claude Chat Should Produce

Help the product owner:

1. **Choose a direction** (or define a blend) by asking targeted questions about priorities, e.g.:
   - Who is the primary audience — Planters (most users) or Approvers (decision makers)?
   - Should Grove feel like an internal productivity tool or a branded Sprout product?
   - Is information density a priority, or is white space and clarity more important?

2. **Produce a design spec** with:
   - Chosen direction name and 2-sentence summary
   - **Top nav changes** — exact layout, colors (use DS token names), font sizes
   - **Overview / metric strip** — what metrics, where, what component style
   - **Board card redesign** — anatomy of a card with exact token references
   - **Seeds tab changes** — if any
   - **Welcome Modal changes** — if any
   - **Role-specific views** — what Approver sees differently from Planter
   - **Empty states** — what to show when a stage column is empty, when Seeds list is empty
   - **Anything that should NOT change** — explicit callouts for parts to leave alone

3. **Format the spec** so Claude Code can implement it without asking clarifying questions:
   - Reference DS tokens by exact name (e.g., `C.kangkong600`, `DS.radius.md`, `DS.shadow.sm`)
   - Specify exact inline style properties where meaningful (e.g., `fontWeight:600`, `gap:12`)
   - Call out new vs modified components explicitly
   - Note any new constants or data structures needed (e.g., new stage metric calculation)

---

## 9. Implementation Notes for Claude Code

When the spec comes back to Claude Code:
- All changes go in `.worktrees/grove-enhancements/src/App.jsx`
- Every style must use inline styles referencing `C.*`, `DS.*`, `FF`
- No new npm packages unless absolutely necessary and explicitly called out
- Changes should not break existing permission logic or RLS assumptions
- Stage color tokens already exist — use `STAGE_COLORS[stage].bg / .text / .border / .dot`
- The `DS` constant is defined at the top of App.jsx and can be extended if new tokens are needed

---

*End of brief. Share this file with Claude chat to begin the design collaboration.*
