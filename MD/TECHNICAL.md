# Grove — Technical Documentation

Companion to [PRD.md](PRD.md). Describes how the shipped system is built.
Reconstructed from `master` @ `3964903`, 2026-08-25.

---

## 1. Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | React 19 + Vite 6 | Almost everything lives in `src/App.jsx` (~10,250 lines) |
| Styling | Inline styles only | Sprout design tokens `DS.*`, `C.*`, `FF` at the top of `App.jsx`. No Tailwind, no CSS files, no CSS-in-JS |
| Database | Supabase (Postgres) | RLS on every table |
| Auth | Supabase Auth | Google SSO, domain-locked |
| Serverless | Vercel functions (`api/`) | Jira + email; Node runtime, needs `nodemailer` |
| Edge functions | Supabase Deno (`supabase/functions/`) | Summarise, duplicate detection, notifications |
| Hosting | Vercel | Auto-deploy from the default branch (`master`) |
| Tests | Vitest + Testing Library; Playwright for E2E | `npm test` / `e2e/` |

## 2. Repository layout

```
src/
  App.jsx                  Everything — design tokens, icons, all views, root component
  main.jsx                 React root
  config/roles.js          ADMIN_EMAILS allowlist
  guide/ProcessFlowGuide.jsx
  lib/
    supabase.js            Client; exposes window.__supabase in DEV for Playwright
    db.js                  Row transforms + all read queries
    utils.js               Pure helpers — keyword overlap, related projects, activity feed
    *.test.js              Unit tests
api/                       Vercel serverless functions
server/local-api.js        Local stand-in for api/* on :3001, loads .env.local
supabase/
  schema.sql               Original bootstrap schema (STALE — see §7)
  migrations/02..24-*.sql  Incremental DDL, applied by hand in the SQL editor
  functions/               Deno edge functions
e2e/                       Playwright specs + auth setup
docs/                      Design briefs, historical specs and plans
MD/                        This documentation set
```

`src/App.jsx` is deliberately monolithic. Do not split it opportunistically — see [NEXT-STEPS.md](NEXT-STEPS.md#refactor-the-monolith) for the conditions under which that becomes worthwhile.

## 3. Running it

```bash
npm install
```

`.env.local` (gitignored, never commit):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite on :5173, proxies `/api` → :3001 |
| `npm run dev:full` | Vite **plus** `server/local-api.js` — needed for anything Jira or email |
| `npm run build` | Production build → `dist/` |
| `npm test` | Vitest unit suite |
| `npm run lint` | ESLint |

The Tool Shed's Jira board returns HTML instead of JSON when the API isn't running — the UI detects this and tells you to run via Vercel or `dev:full`.

### Server-side env vars (Vercel only, never in the client bundle)

`JIRA_EMAIL` · `JIRA_API_TOKEN` · `JIRA_HOST` (defaults `sprouthq.atlassian.net`) · `GMAIL_USER` · `GMAIL_APP_PASSWORD` · `SUPABASE_SERVICE_ROLE_KEY`

## 4. Auth flow

`supabase.auth.onAuthStateChange` drives everything ([src/App.jsx:8900](../src/App.jsx#L8900)):

1. Session arrives → extract email → look up domain in `COUNTRY_MAP`.
2. Unknown domain → `signOut()` + error message. No profile is created.
3. **`setAuthUser` fires immediately** with a provisional user — no DB round-trip blocks the UI.
4. In the background, the `profiles` row is fetched (or inserted on first login) and `authUser` is replaced with the enriched version (`profileLoaded: true`).
5. `ADMIN_EMAILS` membership is written back to `profiles.is_admin` so RLS agrees with the client.

A 5-second timeout releases `authLoading` if the auth event never fires.

**Deep links:** `initialUrlParams` is captured in a `useRef` at mount, before Supabase's PKCE cleanup asynchronously strips `window.location.search`. This is the fix in `3964903` and `22e5760` — don't read `window.location.search` later in the lifecycle.

## 5. Data layer

`src/lib/db.js` owns the boundary. Two transforms per entity:

- `toProject(row)` / `toWish(row)` — snake_case DB → camelCase app, with array coercion and `?? null` defaults for every tri-state boolean.
- `fromProject(proj)` / `fromWish(wish)` — the inverse, and it stamps `last_updated: new Date().toISOString()` on every write.

Loaders: `loadProjects`, `loadWishes`, `loadProfiles`, `loadActivityLog`, `loadNotifications`, `loadDevopsRequests`, `loadDeleteRequests`. All log and return `[]` on error rather than throwing.

Everything loads once, in parallel, when `authUser.email` changes. There are no realtime subscriptions — the user refreshes to sync, by design.

`daysAgo(ts)` converts timestamps at read time. Nothing scheduled, no cron.

### Tri-state booleans

Classification and security fields are `true | false | null`. `null` means *unanswered* and is what the stage gate checks for. Never coerce these to `false` — it silently satisfies the gate.

### Writes

Most mutations follow: optimistic `setProjects(...)` → `supabase.from(...).update(...)` → `logActivity(...)`. Notification emails and Jira calls are fire-and-forget with `.catch(warn)` so a mail outage never blocks a state change.

`handleStartProject` deliberately **bypasses `fromProject`** and sends only core columns, because v2 columns may not exist in every environment. Keep that in mind when adding creation fields.

## 6. Database

### Tables

| Table | Purpose |
|---|---|
| `profiles` | One per user. `country` immutable; `is_admin`, `is_approver`, `is_devops`, `has_dismissed_welcome` |
| `projects` | Plants. ~80 columns after 20+ migrations |
| `wishes` | Seeds. Text PK, format `"w" + integer` |
| `activity_log` | Append-only event feed |
| `notifications` | Per-user notices |
| `devops_requests` | Groundskeeper support requests, linked to a Jira key |
| `rooting_reviews` | Internal Rooting review tickets (not Jira) |
| `delete_requests` | Deletion queue — nothing is hard-deleted without an approval here |
| `help_items` | Help panel feedback / questions |

### RLS model

```sql
create or replace function is_admin() returns boolean as $$
  select coalesce((select is_gardener from profiles where id = auth.uid()), false);
$$ language sql security definer;
```

- `profiles` — public read; insert/update own row only.
- `projects` — authenticated read + insert; update if `auth.email() = builder_email` or admin; delete admin only.
- `wishes` — authenticated read + insert; update if wisher, claimer, or admin; delete admin only.

> ⚠️ The snippet above is what `schema.sql` still contains, and it is **wrong** — it reads `is_gardener`, a column migration `04` renamed to `is_admin`.
> **Production is fine.** Verified 2026-08-25: `profiles.is_gardener` no longer exists, and the `is_admin()` RPC returns `false` cleanly rather than raising `42703`, which it would if the deployed body still referenced the old column. Someone recreated the function correctly and never updated the repo file. `schema-staging.sql` has the correct version.

### Migrations

`supabase/migrations/02` … `25`, applied **by hand** in the Supabase SQL editor — the anon key cannot run DDL. There is no migration runner and no applied-state tracking.

Notable: `18` (tier v2 fields), `22` (edit form v2 / production stack fields), `23` (story + tier columns), `24` (`approval_token`, required by the email approve/reject links), `25` (reconciles `auth_type`).

**Applied state, verified against the live database 2026-08-25:** every column added by migrations `11`–`24` is present, and the tables from `11`, `13`, `17`, `20` (`activity_log`, `devops_requests`, `delete_requests`, `rooting_reviews`) all exist. Migrations `02`–`24` are live.

The verification method, if you need to repeat it: PostgREST validates column names *before* RLS, so `GET /rest/v1/<table>?select=<column>&limit=1` with the anon key returns `200` for a column that exists and `400 / 42703` for one that does not. Array vs scalar is distinguishable the same way — `?col=cs.{x}` succeeds only on an array, `?col=eq.x` fails on one with `malformed array literal`.

## 7. Known drift and gotchas

Status as of 2026-08-25. Production was checked directly; **none of the original three P0 suspicions turned out to be live defects.** What remains is repo-side drift.

| # | Issue | Status |
|---|---|---|
| 1 | **Neither bootstrap file can recreate the database.** `schema.sql` declares the old stages (`sprout/growing/blooming/thriving`) and the old `is_gardener` column. `schema-staging.sql` is correct on stages, roles and RLS but declares only 32 of the 76 columns the app writes — it stops around migration `12`. | **Open.** The highest-value remaining fix. See [NEXT-STEPS.md](NEXT-STEPS.md) |
| 2 | Migration `01-stage-rename.sql` exists only inside `.claude/worktrees/grove-v2/`, so `supabase/migrations/` starts at `02` | **Open**, cosmetic |
| 3 | `is_admin()` in `schema.sql` reads `is_gardener` | **Not a production bug.** Deployed function verified correct; repo file is stale. Fixed when #1 is |
| 4 | Migration `18` declares `auth_type text`; production is `text[]` | **Reconciled.** Someone widened it in the dashboard without a migration. `25-auth-type-array.sql` records it and is a no-op on prod |
| 5 | No record of which migrations are applied | **Open by design.** `02`–`24` now verified applied; re-verify with the PostgREST probe in §6 |
| 6 | `nursery` (DB) vs "Rooting" (UI) | **Won't fix** — renaming the column would touch every row and every query. Documented instead |
| 7 | `CLAUDE.md` stage names, tier matrix, role column, deploy branch | **Fixed** on this branch |
| 8 | 133 tracked `*.txt` scratch files and 9 root `mockup-*.html` files | **Fixed** — removed; mockups moved to `docs/mockups/`, help spec to `docs/specs/`. `.gitignore` now blocks `*.txt` outside `docs/` |
| 9 | `origin/main` is an orphan single-commit branch, unrelated to `master` | **Open** — delete it or document it; `CLAUDE.md` no longer points at it |
| 10 | The tier expression is duplicated in three places in `App.jsx` | **Open.** One of them already drifted once (`0b19e1b`) |

## 8. Integrations

### Jira (`api/create-jira-ticket.js`, `api/get-jira-tickets.js`)
Project `DEV`, label `Src-Grove`. Tickets are created for Groundskeeper support requests and automatically for Tier 3 release reviews. The Tool Shed board maps Jira statuses into four columns via `JIRA_COLS` — status names are matched by string, so a renamed Jira status silently drops tickets out of every column.

### Email (nodemailer over Gmail)
- `send-approval-email` — Rooting approval request, with magic-link approve/reject
- `handle-approval` — public token endpoint the approver clicks from that email
- `send-release-review-email` — `submit` (→ Release Manager) and `decision` (→ builder)
- `send-classification-nudge` — batch nudge from the Admin audit tab

Release Manager address is **hardcoded** as `cbasis@sprout.ph` in two API files.

### Google Chat
`notifyProjectCreated` and `notifySupportRequested` post to a webhook. These were inlined into `App.jsx` in `63aee12` to fix a production TDZ crash — leave them inline.

### Supabase edge functions
`summarize` (project summary generation), `check-duplicates` (overlap detection at creation), `send-notification`. Invoked via `callEdgeFunction`.

## 9. Testing

```bash
npm test               # vitest: utils, db transforms, approver logic
npx playwright test    # e2e: approver flow, uses e2e/auth.setup.js
```

Playwright authenticates by reaching for `window.__supabase`, which `lib/supabase.js` only exposes when `import.meta.env.DEV` is true.

Coverage today is thin: pure utils and transforms are covered; `getStageGate`, the permission checks, and the tier derivation are not. That is the highest-value gap.

## 10. Deployment

Vercel, `framework: vite`, output `dist/`. SPA rewrite sends everything except `/assets/*` and `/api/*` to `index.html`. `index.html` is served `no-cache`; hashed assets are immutable for a year.

Push to `master` → auto-deploy. Env vars are set in the Vercel dashboard; `VITE_*` vars are inlined into the client bundle, so **only put public values there**.
