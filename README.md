# Grove — SproutAI Garden

Internal AI project tracker for Sprout, tracking initiatives across the **Philippines (PH)** and **Thailand (TH)** offices — from seed idea through to production.

---

## What It Does

Grove gives every Sprout employee a shared view of AI projects in flight. Anyone can submit a seed idea, claim one to build, and move their project through five stages as it grows. Approvers review projects at the Nursery gate. Admins can edit or remove anything.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 19 + Vite 6 (single file: `src/App.jsx`) |
| Styling | Inline styles only — Sprout Design System tokens (`DS.*`, `C.*`, `FF`) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth — email + password, Google SSO |
| Hosting | Vercel (auto-deploy from `main`) |

No Tailwind. No CSS files. No CSS-in-JS. All styles are inline using design tokens defined at the top of `App.jsx`.

---

## Getting Started

### Prerequisites

- Node 18+
- A Supabase project with the schema applied (see [Database Setup](#database-setup))

### Local dev

```bash
git clone https://github.com/sprcoleen/sprout-grove
cd sprout-grove
npm install
```

Create `.env.local` (never commit this):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

```bash
npm run dev        # starts at http://localhost:5173
npm run build      # production build → dist/
npm test           # unit tests (vitest)
```

### Allowed email domains

Only Sprout email addresses can sign up:

| Domain | Country |
|---|---|
| `@sprout.ph` | PH |
| `@sproutsolutions.io` | TH |

All other domains are blocked at login with a clear error.

---

## Database Setup

Run the files in order in your Supabase SQL Editor:

1. `supabase/schema.sql` — creates `profiles`, `projects`, `wishes` tables + RLS policies
2. `supabase/migrations/02-projects-new-columns.sql` — adds Nursery review fields
3. `supabase/migrations/03-execom-notifications-rls.sql` — notifications + approver RLS
4. `supabase/migrations/04-rename-role-columns.sql` — renames `is_gardener` → `is_admin`, adds `first_name`
5. `supabase/migrations/05-help-items.sql` — help panel content table
6. `supabase/migrations/06-add-has-dismissed-welcome.sql` — welcome modal flag
7. `supabase/migrations/07-collaborator-emails.sql` — collaborator list on projects
8. `supabase/migrations/08-data-sources.sql` — data sources array
9. `supabase/migrations/09-agentic-framework.sql` — agentic framework tags
10. `supabase/migrations/10-builtfor-array.sql` — built_for as array
11. `supabase/migrations/11-activity-log.sql` — immutable activity feed

### Key tables

**`profiles`** — one row per authenticated user
- `email`, `display_name`, `first_name`, `country` (PH or TH, immutable)
- `is_admin` — set manually in Supabase dashboard; never by the app
- `is_approver` — senior leaders who can review Nursery projects

**`projects`** — AI initiatives
- `stage`: `sprout | growing | blooming | thriving` (never `seed` — seeds live in `wishes`)
- `builder_email` — determines who can edit the project
- `review_status`: `pending | approved | needs_rework` — set during Nursery review
- `tier`: `1 | 2 | 3` — classification derived from three yes/no questions (see below)
- `last_updated` — updated on every mutation; used to calculate "days ago"

**`wishes`** — seed ideas
- `id` format: `"w"` + integer (e.g. `"w10"`)
- `fulfilled_by` — set when promoted to a project; fulfilled wishes are never deleted
- `upvoters` — array of display names; one vote per user

**`activity_log`** — immutable event log (project added, stage moved, approved, etc.)

---

## Project Stages

```
Seed (Wishlist only) → Sprout → Growing → Blooming → Thriving
                                    ↓
                               Nursery review
                          (submitted_at is set here)
```

| Stage | Color | Meaning |
|---|---|---|
| Sprout | Green | Just started |
| Growing | Yellow | Active development |
| Blooming | Orange | Near completion / in review |
| Thriving | Blue | Live in production |

Stage changes follow adjacency rules for normal users. Admins can skip stages.

---

## Tier Classification

Projects are classified into three tiers based on three yes/no questions:

| Question | Tier outcome |
|---|---|
| Is this UI-only (no logic / no data)? → Yes | **Tier 1 — Markup** |
| Does it call external APIs or use live data? → Yes | **Tier 3 — External App** |
| Does it require deployment infrastructure? → Yes | **Tier 2 — Internal App** |
| Does it require deployment? → No | **Tier 1 — Markup** |

Tier is editable by the project builder or an admin from the **Classification** tab on the project detail page.

---

## Roles & Permissions

### Normal User (any authenticated Sprout employee)

| Action | Rule |
|---|---|
| Submit a Seed | Always |
| Upvote any Seed | Once per seed |
| Claim an unclaimed Seed | `claimedBy === null` |
| Add a Plant | Always |
| Edit their own Plant | `builderEmail === authUser.email` |
| Change stage of their own Plant | Adjacent stages only |
| Edit someone else's Plant | Not allowed |
| Delete anything | Not allowed |

### Approver (`is_approver = true`)

Everything a normal user can do, plus:
- Approve or reject projects submitted to the Nursery review queue

### Admin (`is_admin = true`)

Everything above, plus:
- Edit or delete any Seed or Plant
- Skip stages in any direction
- Moderate duplicates and bad data

**Setting admin/approver:** Done manually in the Supabase dashboard (`profiles` table). Never by the app.

---

## Project Structure

```
sprout-grove/
├── src/
│   ├── App.jsx              # Entire UI (~7000 lines, single file)
│   ├── main.jsx             # React entry point
│   └── lib/
│       ├── supabase.js      # Supabase client init
│       ├── db.js            # Data layer: loadProjects, loadWishes, row transforms
│       ├── utils.js         # Shared helpers
│       ├── db.test.js       # Unit tests for db helpers
│       ├── utils.test.js
│       └── approver.test.js
├── supabase/
│   ├── schema.sql           # Base schema + RLS
│   ├── migrations/          # Incremental schema changes (01–11)
│   └── functions/           # Edge functions (check-duplicates, send-notification, summarize)
├── e2e/                     # Playwright E2E tests
├── docs/                    # Design briefs, specs, mockups
├── index.html
├── vite.config.js
├── playwright.config.js
├── CLAUDE.md                # Build authority for Claude Code
└── .env.local               # Local secrets (gitignored)
```

---

## Design System

All UI uses inline styles referencing constants defined at the top of `App.jsx`:

```js
// Colors
C.kangkong500   // #2d8c2d  — primary brand green
C.mushroom50    // #fafaf8  — page background
C.mushroom900   // #201e18  — body text
C.tomato500     // #e53e3e  — error/danger
C.blueberry500  // #3182ce  — info
C.ubas500       // #805ad5  — accent/premium

// Typography
FF              // "Rubik, system-ui, sans-serif"

// Spacing / radius
DS.radius.sm    // 6px
DS.radius.md    // 10px
DS.radius.lg    // 14px
DS.radius.full  // 9999px (pills)

// Shadows
DS.shadow.sm    // cards at rest
DS.shadow.md    // hover lift
DS.shadow.lg    // modals
```

**Hard rules:**
- Never use emoji flags (🇵🇭 🇹🇭) — always inline SVG `<FlagSVG country="PH"/>`
- Never use `<img>` for project cards — use `<ProjectImage project={...}/>`
- Never use `localStorage` — Supabase SDK manages sessions
- Never make `country` editable — derived from email domain, immutable forever
- Never add `<>` stage navigation buttons to the Board — drag-and-drop only

---

## Environment Variables

| Variable | Where |
|---|---|
| `VITE_SUPABASE_URL` | `.env.local` (local) / Vercel dashboard (prod) |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` (local) / Vercel dashboard (prod) |

Never commit `.env.local`. Confirm `.gitignore` includes it before any push.

---

## Deployment

Deployed to Vercel from the `main` branch. Every push to `main` triggers an automatic redeploy.

1. Connect the GitHub repo to Vercel
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel dashboard
3. Vercel auto-detects Vite and sets the build command (`vite build`) and output dir (`dist`)

---

## What's Not Built (v2 backlog)

These are explicitly out of scope for v1:

- Realtime subscriptions (page refresh to sync is fine)
- Email notifications
- Slack / Teams integration
- Custom domain
- Mobile-specific layout
- Sentry / error monitoring
- Scheduled jobs / pg_cron
