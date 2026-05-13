# Audience Field — Design Spec
**Date:** 2026-03-27
**Status:** Approved

---

## Overview

Add an `audience` field to projects so users can specify whether a plant is built for internal Sprout employees or for external clients / the public. The field is surfaced in the "Add a Plant" form, shown on project cards, and filterable in the Garden view.

---

## 1. Data

### Database
Add column `audience` to the `projects` table:

```sql
ALTER TABLE projects
  ADD COLUMN audience text NOT NULL DEFAULT 'internal'
  CONSTRAINT chk_audience CHECK (audience IN ('internal', 'external'));
```

Apply as **migration 12** in both staging and production Supabase projects.

### DB layer (`src/lib/db.js`)
- `toProject`: add `audience: row.audience || 'internal'`
- `fromProject`: add `audience: proj.audience || 'internal'` to the update payload

The `|| 'internal'` fallback handles any legacy project objects that pre-date this field, preventing `undefined` from violating the `NOT NULL` constraint.

---

## 2. Form — ContributeModal (Add a Plant)

**Location:** Step 1, below the stage selector.

**UI:** Two-button toggle labelled "Who's this for?"
- Button 1: **Internal** — "Sprout employees only"
- Button 2: **External** — "Clients or the public"
- Default: `Internal` selected
- Style: matches existing stage selector pattern — 2px colored border + background tint on active state, using kangkong (green) tokens for the active highlight

**State:** `plant.audience` (default: `'internal'`)

### AddProjectModal (edit flow)
- Same two-button toggle
- Prefilled from the existing project's `audience` value, falling back to `'internal'`

---

## 3. Cards

**Placement:** The audience badge replaces the "for team" dept chips row at the bottom of each card. This is an intentional trade-off — dept chips are removed from card view; they remain accessible in the project detail/expanded view.

**Stage badge:** Top-right corner of the card (unchanged from current production).

**Audience badge sits in the bottom row** alongside the builder avatar and name:
`[Avatar] [Builder name] ............. [Audience badge]`

**Badge styles:**
- **Internal** — `background: #f2f1ed`, `color: #736f5e`, `border: 1px solid #ccc9bc`, dot `#928e7c` — muted, neutral
- **External** — `background: #ebf8ff`, `color: #3182ce`, `border: 1px solid #63b3ed`, dot `#3182ce` — blue, prominent

Both badges: 5px colored dot + label text, 10px / font-weight 600, border-radius full.

**Views affected:** Board (KanbanCard), Garden Directory cards — any component that renders the card footer row. Overview list rows (Spotlight, My Projects sidebar, Nursery Queue) are **excluded** — they are not card-format and do not need the badge.

---

## 4. Filter

**View:** Garden view — the existing `GardenHub` filter drawer (currently contains dept, stage, builder, country filters at lines ~2393–2474 in `App.jsx`).

**UI:** Add "Audience" filter with three options:
- **All** (default)
- **Internal**
- **External**

Uses the same pill/toggle pattern as existing filters.

**State:** `audienceFilter` (default: `'All'`)

**`activeFilterCount` update** (line ~2329 in `App.jsx`):
```js
// Add to existing expression:
+ (audienceFilter !== 'All' ? 1 : 0)
```

**"Clear all" handler** (line ~2425 in `App.jsx`):
```js
// Add:
setAudienceFilter('All')
```

---

## 5. Constraints

- `audience` is editable by the builder or an admin — existing RLS `"Own or admin update"` policy on `projects` already covers this, no RLS changes needed
- `audience` must be included in `fromProject` with a `'internal'` fallback (unlike `country` which is always excluded from updates)
- DB-level `DEFAULT 'internal'` ensures existing rows without the field are treated as Internal
- No changes to the permissions model

---

## 6. Out of Scope

- Audience-based access control (display/filter only)
- Overview dashboard stats breakdown by audience (v2 backlog)
- Audience filter on Wishlist / Seeds view
- Restoring dept chips to card view (intentionally removed in this change)
