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

## P1 — The one real remaining gap

### 1. Build a bootstrap schema that actually works

Neither file in `supabase/` can recreate the database:

| File | Stages | Role column | Column coverage |
|---|---|---|---|
| `schema.sql` | ❌ old (`sprout/growing/blooming/thriving`) | ❌ `is_gardener` | ~20 migrations behind |
| `schema-staging.sql` | ✅ correct | ✅ `is_admin` | 32 of the 76 columns the app writes — stops around migration `12` |

So there is no way to stand up a new environment, and no single file that describes the current shape. That is also why the `auth_type` drift went unnoticed for so long.

**Do this:** dump the live schema and commit it as the generated bootstrap.

```bash
pg_dump --schema-only --no-owner --no-privileges "$SUPABASE_DB_URL" > supabase/schema.sql
```

The connection string is in Supabase → Project Settings → Database. It needs the DB password, not the anon key — that is why this could not be done from the CLI session that produced these docs. Delete `schema-staging.sql` once `schema.sql` is authoritative, and mark the new file **generated — do not hand-edit**.

While you are in there, move `01-stage-rename.sql` out of `.claude/worktrees/grove-v2/` into `supabase/migrations/`, or note in a folder README that numbering starts at `02` deliberately.

---

## P2 — Cover the logic that governs everything

### 2. Extract and test the gate and the tier function

Unit coverage reaches `utils.js`, the `db.js` transforms, and approver logic. It does **not** reach the three functions that decide what users are allowed to do:

- `getStageGate(project)` — every stage × tier × completeness combination
- `handleMoveStage` — non-builder blocked, non-adjacent blocked, `nursery` entry/exit rules, admin bypass, release-review reset
- Tier derivation — all six `has_backend` × `target_users` combinations, plus both nulls

`getStageGate` is already pure — lift it into `src/lib/` as-is and it is trivially testable.

The tier expression is duplicated in **three** places ([App.jsx:4215](../src/App.jsx#L4215), [App.jsx:9357](../src/App.jsx#L9357), and the classification save). That duplication has already caused one production bug: `0b19e1b` fixed the no-backend → Tier 1 mapping, and a stale copy of the same rule is still sitting in `CLAUDE.md`'s history. Extract it to one exported function, test the truth table, and delete the copies.

This is the highest-value code change on the list.

### 3. Harden the Jira status mapping

`JIRA_COLS` matches Jira status names by exact string. Renaming a status in Jira makes tickets vanish from every Tool Shed column with no error. Add a fallback column for unmatched statuses so tickets surface instead of disappearing.

---

## P3 — Worth doing, no urgency

### 4. De-hardcode the Release Manager
`cbasis@sprout.ph` is hardcoded in `api/handle-approval.js` and `api/send-release-review-email.js`. Move it to an env var so the role can change hands without a deploy.

### 5. Branch hygiene
All six `feature/*` branches are fully merged into `master` (0 commits ahead) — delete them locally and on the remote. `origin/main` is a single orphan "Initial commit" unrelated to `master`; delete it or document why it exists.

### 6. Refactor the monolith
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

1. Run `25-auth-type-array.sql` in the SQL editor (no-op, but marks it applied)
2. Dump the live schema → real `schema.sql`, retire `schema-staging.sql` (**P1 #1**)
3. Extract `getStageGate` and the tier function, test the truth table (**P2 #2**)
4. Everything else as capacity allows
