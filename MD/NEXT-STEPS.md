# Grove — What To Do Next

Working backlog, ordered by what will hurt most if left alone.
Baseline: `master` @ `3964903`, 2026-08-25.

---

## P0 — Verify before building anything else

These are unknowns, not tasks. Each one can invalidate work you do on top of it.

### 1. Confirm what is actually deployed in Supabase

There is no migration runner and no applied-state tracking. Nobody can currently answer "is migration 24 live?" without looking.

Run this in the Supabase SQL editor and save the output into this folder as `SCHEMA-ACTUAL.md`:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'projects'
order by ordinal_position;
```

Specifically check for: `has_backend`, `target_users`, `data_sensitivity`, `auth_type`, `approval_token`, and everything migration `22` adds. If `approval_token` is missing, **the email approve/reject links in `handle-approval.js` are silently broken in production right now.**

### 2. Confirm `is_admin()` reads the right column

Migration `04` renamed `profiles.is_gardener` → `is_admin`. The `is_admin()` function in `schema.sql` still selects `is_gardener`. If the deployed function was never rewritten, every admin-only RLS policy evaluates against a column that no longer exists — meaning admin deletes fail, or fail open, depending on how Postgres resolved it.

```sql
select prosrc from pg_proc where proname = 'is_admin';
```

Fix and redeploy the function if it is stale. This is a security check, not a cleanup.

### 3. Confirm `auth_type` column type

Migration `18` declares it `text`. `db.js` reads and writes it as an array. Either widen the column to `text[]` or collapse the client to a single value — right now multi-value auth types may be silently truncated on write.

---

## P1 — Fix the drift that makes the codebase lie

### 4. Rewrite `supabase/schema.sql`

It declares stages `sprout / growing / blooming / thriving`. The app uses `seedling / nursery / sprout / bloom / thriving`. It predates roughly twenty migrations. As it stands it cannot recreate a working database and actively misleads anyone reading it.

Regenerate it from the live schema and mark it as generated, not hand-maintained.

Also: migration `01-stage-rename.sql` exists only inside `.claude/worktrees/grove-v2/`. Either move it into `supabase/migrations/` or note in the folder README that numbering starts at `02` on purpose.

### 5. Update `CLAUDE.md`

Three sections are stale and will produce wrong code if followed:

| Section | Says | Actually |
|---|---|---|
| §5 tier matrix | no-backend + external → Tier 2 | Tier 1 — no backend is always T1 (`0b19e1b`) |
| §11 stages | `sprout / growing / blooming / thriving` | `seedling / nursery / sprout / bloom / thriving` |
| §2 hosting | Auto-deploy from `main` | Deploys from `master`; `origin/main` is an unrelated orphan commit |

Point it at [PRD.md](PRD.md) and [TECHNICAL.md](TECHNICAL.md) rather than restating the details in a third place.

### 6. Delete the scratch files

133 tracked `*.txt` files and 9 `mockup-*.html` files sit in the repo root — `push-out.txt`, `commit-log.txt`, `rebase-continue2.txt` and so on. They are committed build logs. Remove them and extend `.gitignore` so they cannot come back.

The mockups may still have design value; if so move them under `docs/mockups/`.

---

## P2 — Cover the logic that governs everything

### 7. Test the gate, the permissions, and the tier derivation

Unit coverage today reaches `utils.js`, the `db.js` transforms, and approver logic. It does **not** reach the three functions that decide what users are allowed to do:

- `getStageGate(project)` — every stage × tier × completeness combination
- `handleMoveStage` — non-builder blocked, non-adjacent blocked, `nursery` entry/exit rules, admin bypass, release-review reset
- Tier derivation — all six `has_backend` × `target_users` combinations, plus both nulls

`getStageGate` is already pure. Lift it into `src/lib/` and it is trivially testable. The tier expression is duplicated in three places ([App.jsx:4215](../src/App.jsx#L4215), [App.jsx:9357](../src/App.jsx#L9357), and the classification save) — extract it to one exported function and test that.

### 8. Harden the Jira status mapping

`JIRA_COLS` matches Jira status names by exact string. Renaming a status in Jira makes tickets vanish from every Tool Shed column with no error. Add a fallback column for unmatched statuses so tickets surface instead of disappearing.

---

## P3 — Worth doing, no urgency

### 9. De-hardcode the Release Manager

`cbasis@sprout.ph` is hardcoded in `api/handle-approval.js` and `api/send-release-review-email.js`. Move it to an env var so the role can change hands without a deploy.

### 10. Refactor the monolith

`src/App.jsx` is ~10,250 lines. It is not currently a problem — everything is inline-styled, the tokens are local, and splitting it would create import churn for no functional gain.

Split it when one of these becomes true:
- More than one person is regularly editing it at the same time (merge conflicts on a 10k-line file are miserable)
- Build or HMR times become noticeable
- You want component-level tests

If you do split, go by view boundary — `OverviewDashboard`, `GardenHub`, `WishlistView`, `ProjectDetailPage`, `AdminDashboard`, `DevopsBoard` — and keep `DS`/`C`/`FF` in a shared `theme.js` that everything imports. Do not split the icon set; it is small and cohesive.

### 11. Branch hygiene

All six `feature/*` branches are fully merged into `master` (0 commits ahead). Delete them locally and on the remote.

`origin/main` is a single orphan "Initial commit" unrelated to `master`. Either delete it or document why it exists — right now it makes `CLAUDE.md`'s deploy instruction look correct when it isn't.

---

## Product backlog (needs owner input, not on the critical path)

Nothing here is decided. Listed so it isn't lost:

- **Rooting flow depth** — `rooting_reviews` is a separate table from the Jira integration. Is the intent to unify them or keep Grove-internal reviews distinct?
- **Notification reach** — email works; the `notifications` table is loaded but its UI surface is thin.
- **Country scope** — PH and TH only. A third domain requires a product decision, not a config change.

Still explicitly out of scope per the PRD: realtime subscriptions, pg_cron, Sentry, Slack/Teams, mobile layouts.

---

## Suggested order

1. Run the three P0 verifications and write down what you find (half a day)
2. Fix whatever they turn up — especially `approval_token` and `is_admin()`
3. Regenerate `schema.sql`, update `CLAUDE.md`, delete the scratch files (one session)
4. Extract `getStageGate` and the tier function, then test them
5. Everything else as capacity allows
