# Grove — What To Do Next

Working backlog, ordered by what will hurt most if left alone.
Baseline: `docs/grove-reference` off `master` @ `3964903`. Last worked 2026-08-25.

---

## ✅ Done on this branch

### P0 verification — all three cleared

The original P0 items were unknowns that could have invalidated work built on top of them. All three were checked directly against the live database on 2026-08-25. **None were live defects.**

| Suspicion | Finding |
|---|---|
| Migration `24` (`approval_token`) may not be applied — would silently break the email approve/reject links | **Applied.** Column present. Links work |
| `is_admin()` may still select `is_gardener`, breaking admin RLS | **Deployed function is correct.** `profiles.is_gardener` no longer exists, and the `is_admin()` RPC returns `false` cleanly instead of raising `42703` — which it would if the body still named the dropped column. Only the repo's `schema.sql` is stale |
| `auth_type` declared `text` but used as an array — multi-value auth types may be truncated | **Production is `text[]`.** The array-contains operator succeeds and scalar equality throws `malformed array literal`. `db.js` was right; migration `18` is the file that is wrong |

Also confirmed applied: every column from migrations `11`–`24`, and the tables created by `11`, `13`, `17`, `20`.

Method, for repeating this later: PostgREST validates column names before RLS, so `GET /rest/v1/<table>?select=<col>&limit=1` with the anon key returns `200` if the column exists and `400 / 42703` if it does not. Array vs scalar: `?col=cs.{x}` succeeds only on arrays.

### Cleanup shipped

- **`25-auth-type-array.sql`** — records the undocumented `text → text[]` widening. Guarded by an `information_schema` check, so it is a no-op on production and repairs any environment built from migration `18` as written. **Still needs to be run in the SQL editor** to be marked applied, though it will do nothing.
- **`CLAUDE.md` corrected** — stage names, tier matrix, `is_gardener` → `is_admin`, deploy branch (`master`, not `main`), auth method, `auth_type` as an array, and the now-resolved "pending migration" note. It now points at this MD set rather than restating detail.
- **130 scratch `*.txt` files removed** from the repo root; `.gitignore` extended to `*.txt` with a `docs/**` exception so they cannot come back.
- **9 `mockup-*.html`** moved to `docs/mockups/`; `extracted_text.txt` (a real Help Feature spec) moved to `docs/specs/grove-help-feature-spec.txt`.

---

### Bootstrap schema rebuilt

`supabase/schema.sql` is now generated from the live database (2026-08-25) via [`tools/dump-schema.sql`](../supabase/tools/dump-schema.sql), and `schema-staging.sql` is deleted. All 76 columns the app writes are present, verified against `fromProject`.

`pg_dump` was not usable: this machine has neither `pg_dump` nor Docker, and `supabase db dump` shells `pg_dump` into a container. The catalog script sidesteps both and needs no database password. It does not capture triggers, grants or extensions — for full fidelity, `winget install PostgreSQL.PostgreSQL.17` then `pg_dump --schema-only --no-owner --no-privileges "$SUPABASE_DB_URL"`.

Regenerating the dump also surfaced everything in P0 and P1 below — none of which was visible from the migration files alone.

---

## P0 — Two RLS policies do not do what their names say

Both are live in production. Neither is exploitable from the UI, but RLS is the layer that is supposed to hold when the UI is bypassed, and these do not.

### 1. Any authenticated user can update any rooting review

```sql
create policy "Service role update" on rooting_reviews
  for update to public using (true);
```

Named "Service role update", but scoped `to public` with `using (true)` — so every signed-in employee can rewrite any rooting review, including flipping `status` to `approved` and clearing `rejection_reason`. Rooting is the leadership review gate; this policy makes its record editable by the people it gates.

**Fix:** scope it to the service role, or to `is_admin() or is_approver()`, matching who is actually meant to resolve a review.

### 2. Builders can hard-delete their own seedling projects

```sql
create policy "Builder delete own seedling" on projects
  for delete to public using (auth.email() = builder_email and stage = 'seedling');
```

This bypasses the `delete_requests` queue entirely and contradicts `claude.md` §3 ("Delete anything ❌") and the documented flow where only an admin approving a request performs a hard delete.

It may well be deliberate — letting someone remove a project they just created by mistake is reasonable. But it is undocumented, and it is a hard delete with no audit row. **Decide:** keep it and document it, or drop the policy and route seedling deletes through the queue like everything else.

### 3. Approvers can update any project

`"Own or admin update"` on `projects` resolves to `builder OR is_admin() OR is_approver()`. The name and all the docs say builder-or-admin. Approvers needing to act at the Rooting gate is plausible, but the policy grants them every column on every project at every stage, not just the review fields. Confirm the scope is intended.

---

## P1 — Drift the migration files cannot see

### 4. `approval_token` is `uuid`, migration 24 says `text`

The second undocumented dashboard change, same shape as the `auth_type` one. Production is `uuid`; the migration that created it declares `text`. Anything built from the migrations gets the wrong type. Fold this into `26-*.sql` alongside a fix for #5.

### 5. `projects.stage` still defaults to `'sprout'`

The check constraint is correct (`seedling/nursery/sprout/bloom/thriving`), but the column default was never updated from the pre-rename schema. Latent only because `handleStartProject` always sets `stage` explicitly — any insert that omits it lands a project in the middle of the pipeline. Set the default to `'seedling'`.

### 6. `withdraw_from_nursery(p_id uuid)` is dead and broken

`projects.id` is `bigint`, so the parameter type can never match a row. Nothing in `src/` calls it. Drop it, or fix the signature and wire it up — right now it is a `SECURITY DEFINER` function that cannot work.

### 7. No indexes beyond primary keys

The dump returned an empty index section. `projects.builder_email`, `delete_requests.status`, `activity_log.created_at` and `devops_requests.project_id` are all filtered or ordered on every load. Not urgent at current row counts, but the first thing to reach for if the dashboard slows.

### 8. `changelog` table is undocumented

Exists with full RLS and admin-only writes, but nothing in `src/` reads it and no migration in `supabase/migrations/` creates it. Either it predates the migration folder or it was made in the dashboard. Work out which, then document or drop it.

### 9. Migration `01-stage-rename.sql` lives only in `.claude/worktrees/grove-v2/`

Move it into `supabase/migrations/`, or note in a folder README that numbering starts at `02` deliberately.

---

## P2 — Cover the logic that governs everything

### 10. Extract and test the gate and the tier function

Unit coverage reaches `utils.js`, the `db.js` transforms, and approver logic. It does **not** reach the three functions that decide what users are allowed to do:

- `getStageGate(project)` — every stage × tier × completeness combination
- `handleMoveStage` — non-builder blocked, non-adjacent blocked, `nursery` entry/exit rules, admin bypass, release-review reset
- Tier derivation — all six `has_backend` × `target_users` combinations, plus both nulls

`getStageGate` is already pure — lift it into `src/lib/` as-is and it is trivially testable.

The tier expression is duplicated in **three** places ([App.jsx:4215](../src/App.jsx#L4215), [App.jsx:9357](../src/App.jsx#L9357), and the classification save). That duplication has already caused one production bug: `0b19e1b` fixed the no-backend → Tier 1 mapping, and a stale copy of the same rule is still sitting in `CLAUDE.md`'s history. Extract it to one exported function, test the truth table, and delete the copies.

This is the highest-value code change on the list.

### 11. Harden the Jira status mapping

`JIRA_COLS` matches Jira status names by exact string. Renaming a status in Jira makes tickets vanish from every Tool Shed column with no error. Add a fallback column for unmatched statuses so tickets surface instead of disappearing.

---

## P3 — Worth doing, no urgency

### 12. De-hardcode the Release Manager
`cbasis@sprout.ph` is hardcoded in `api/handle-approval.js` and `api/send-release-review-email.js`. Move it to an env var so the role can change hands without a deploy.

### 13. Branch hygiene
All six `feature/*` branches are fully merged into `master` (0 commits ahead) — delete them locally and on the remote. `origin/main` is a single orphan "Initial commit" unrelated to `master`; delete it or document why it exists.

### 14. Refactor the monolith
`src/App.jsx` is ~10,250 lines. Not currently a problem — everything is inline-styled, the tokens are local, and splitting it would create import churn for no functional gain.

Split it when one of these becomes true:
- More than one person is regularly editing it at once (merge conflicts on a 10k-line file are miserable)
- Build or HMR times become noticeable
- You want component-level tests

If you do split, go by view boundary — `OverviewDashboard`, `GardenHub`, `WishlistView`, `ProjectDetailPage`, `AdminDashboard`, `DevopsBoard` — and keep `DS`/`C`/`FF` in a shared `theme.js`. Do not split the icon set; it is small and cohesive.

---

## Product backlog (needs owner input, not on the critical path)

Nothing here is decided. Listed so it isn't lost:

- **Rooting flow depth** — `rooting_reviews` is a separate table from the Jira integration. Unify them, or keep Grove-internal reviews distinct?
- **Notification reach** — email works; the `notifications` table is loaded but its UI surface is thin.
- **Country scope** — PH and TH only. A third domain is a product decision, not a config change.

Still explicitly out of scope per the PRD: realtime subscriptions, pg_cron, Sentry, Slack/Teams, mobile layouts.

---

## Suggested order

1. **Decide on the two RLS policies (#1, #2) and the approver scope (#3)** — these are product calls, not cleanups. #1 in particular lets any employee approve their own rooting review
2. Write `26-*.sql` folding together the fixes for #1–#6 that you agreed, run it, then regenerate `schema.sql` from `tools/dump-schema.sql`
3. Run `25-auth-type-array.sql` (no-op, but marks it applied)
4. Extract `getStageGate` and the tier function, test the truth table (**#10**)
5. Everything else as capacity allows
