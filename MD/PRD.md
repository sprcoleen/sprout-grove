# Grove — Product Requirements Document

**Product:** Grove (SproutAIGarden)
**Owner:** Belle Asis · Sprout Product Team
**Status:** Live in production
**Live URL:** https://grove.sprout.solutions
**Repo:** https://github.com/sprcoleen/sprout-grove
**Last reviewed:** 2026-08-25 (reconstructed from `master` @ `3964903`)

> This document describes what Grove *actually is today*, derived from the shipped code — not the prototype-era `SproutAIGarden_PRD.docx`, which it supersedes. Where the two disagree, this file wins.

---

## 1. Problem

AI projects at Sprout were being built everywhere and tracked nowhere. Three symptoms:

1. **Duplicate effort.** Two teams solving the same problem with no way to find each other.
2. **No governance.** Tools touching payroll or customer data shipped without anyone reviewing auth, data sensitivity, or where that data was being sent.
3. **Invisible good work.** Genuinely useful internal tools stayed inside one team.

Grove is the single shared surface for every AI initiative across the Philippines (PH) and Thailand (TH) offices — from a one-line idea through to a production system with a sign-off trail.

## 2. Users

| Persona | Who | What they need |
|---|---|---|
| **Gardener** | Any Sprout employee | Post an idea, claim one, document what they built, move it forward |
| **Groundskeeper** | Raffy, Coleen, Nikki, Blaise (Project Support & DevOps) | See what needs infrastructure help; work it in Jira |
| **Release Manager / Admin** | Belle Asis, Diane Litan | Review Tier 2/3 releases, moderate records, approve deletions, chase unclassified projects |
| **Approver** | Leadership / ExCom (`is_approver`) | Approve projects at the Rooting gate |

Access is domain-locked. `@sprout.ph` → PH, `@sproutsolutions.io` → TH. Everything else is rejected at sign-in and signed straight back out.

## 3. Core objects

### Seed (`wishes` table)
An idea, posted by anyone. Title, a "why", target teams, upvotes, optional claimer. A Seed is *not* a project and has no stage. When someone builds it, the Seed is marked `fulfilled_by` and stays visible forever. **Fulfilled Seeds are never deleted.**

### Plant (`projects` table)
A real initiative someone is building. Owned by `builder_email`, scoped to one country, always sitting at exactly one of five stages.

## 4. The five stages

| Stage (DB value) | Label shown | Meaning |
|---|---|---|
| `seedling` | Seedling | Someone's building it |
| `nursery` | **Rooting** | Leadership review |
| `sprout` | Sprout | Readying to go live |
| `bloom` | Bloom | Live & used |
| `thriving` | Thriving | Making an impact |

> ⚠️ DB values and UI labels diverge: `nursery` displays as "Rooting". Historical, and `nursery` is the persisted value everywhere.

**Movement rules:**

- Only the builder or an Admin can move a project.
- Non-admins: adjacent stages only. Admins: any stage, any direction.
- **Rooting cannot be entered by drag or direct move** — entry is form-only, via submit-for-approval.
- **Rooting cannot be exited by a non-admin** — an approver decision moves it out.
- Every move appends a milestone (`"Sprout — Aug 2026"`) and stamps `last_updated`.
- Advancing past `sprout` or `bloom` with an approved release review resets `release_review_status` to `null` — the next gate needs its own review.

## 5. Tier classification

Two questions determine everything downstream. Tier is **always derived, never set by hand**.

| `has_backend` | `target_users` | Tier |
|---|---|---|
| `false` | any | **1 — Static / Internal** |
| `true` | `internal` | **2 — Internal App** |
| `true` | `external` or `both` | **3 — External-Facing** |

If either answer is missing, `tier` is `null` and the project is **Unclassified**.

> A project with no backend is Tier 1 regardless of audience — corrected in commit `0b19e1b`. The older matrix in `CLAUDE.md` (no-backend + external → Tier 2) is out of date and should be fixed there.

**What each tier means operationally:**

| | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| Hosting | Markup — owner uploads directly | Sprout Vercel / Azure | Sprout Vercel / Azure |
| Groundskeeper support | Not needed | Yes | Yes |
| IS / ExCom approval | No | Required before going live | Required before going live |
| Release review | Never | Before Bloom and Thriving | Before Bloom and Thriving; full sign-off before Thriving |
| DPO / privacy review | No | No | Required |
| Auto Jira ticket on review submit | No | No | **Yes** |

## 6. The stage gate

`getStageGate()` in [src/App.jsx:172](../src/App.jsx#L172) is the single source of truth. It blocks a move and returns a reason:

| At stage | Blocked when | Message |
|---|---|---|
| `seedling` | `tier` is null | Complete Tier Classification before your project can advance |
| `sprout` | Any of the 5 security fields unanswered | Complete Security & Data Classification before going live |
| `sprout` | `tier` is null | Tier is unclassified |
| `sprout` | Tier 2/3 and review not `approved` | Release Manager acknowledgment (T2) / full sign-off (T3) required |
| `bloom` | Tier 2/3 and review not `approved` | Release Manager final approval required before Thriving |

The five security fields that must all be non-null: `requires_auth`, `external_access`, `has_sensitive_data`, `sends_to_external_ai`, `stores_user_inputs`.

**Admins bypass the gate entirely** — the check only runs for non-admins.

Release review lifecycle: `null → pending → approved | rejected`. Submitting emails the Release Manager; a decision emails the builder back. Both are non-fatal — a mail failure never blocks the state change.

## 7. Permissions

| Action | Gardener | Admin |
|---|---|---|
| Post a Seed | ✅ | ✅ |
| Edit own Seed | ✅ | ✅ |
| Upvote a Seed (once) | ✅ | ✅ |
| Claim an unclaimed Seed | ✅ | ✅ |
| Add a Plant | ✅ | ✅ |
| Edit own Plant | ✅ | ✅ |
| Move own Plant (adjacent only, gate applies) | ✅ | ✅ |
| Edit anyone's Seed or Plant | ❌ | ✅ |
| Move any Plant, skip stages, bypass gate | ❌ | ✅ |
| Approve / reject a release review | ❌ | ✅ |
| Approve a deletion request | ❌ | ✅ |

**Nobody deletes directly.** Owners and admins file a *deletion request*; only an admin approving it performs the hard delete. Fulfilled Seeds are refused outright.

Admin identity resolves from `ADMIN_EMAILS` in [src/config/roles.js](../src/config/roles.js) and is synced into `profiles.is_admin` on login so RLS stays in lockstep. **Adding an admin is a code change, not a dashboard change.**

Country is derived from the email domain at signup and is **immutable forever**. It is never included in an update payload.

## 8. Views

| Nav tab | View id | What it does |
|---|---|---|
| Overview | `dashboard` | Momentum feed, builder spotlight rotator, pipeline funnel, tier counts |
| Garden | `garden` | Directory / grouped / board / map views of all projects, with filters |
| Seeds | `wishlist` | The idea backlog — upvote, claim, mark ready for review |
| Tool Shed | `devops` | Live Jira board (project `DEV`, label `Src-Grove`) + Rooting review tickets |
| Guide | `guide` | Process flow explainer for new users |
| — | `admin` | Admin-only: deletion queue, audit (unclassified / pending review / flagged), CSV export |
| — | `project-detail` | Full project page: overview, story, technical, classification, release gate |

Routing is URL-driven (`?view=`, `?project=`) with browser back/forward support. URL params are captured at mount because Supabase's PKCE cleanup wipes `window.location.search` asynchronously after OAuth.

The Admin audit tab surfaces two **security flags**:
- External access with no auth required
- Sends data to an external AI provider **and** holds sensitive data

## 9. Hard constraints

Violating any of these is a build failure.

1. Never use emoji flags — inline SVG only (`FlagPH`, `FlagTH`).
2. Never use external image URLs for card thumbnails — use `ProjectImage`.
3. Never make `country` editable.
4. Never allow `stage = "seed"` on a project. Seeds live in the Seeds view only.
5. Never delete a fulfilled Seed.
6. Never show the self-promote button to anyone but the claimer or an Admin.
7. Never touch `localStorage` / `sessionStorage` directly — the Supabase SDK's own session storage is the sole exception.
8. Never add `< >` stage navigation buttons to the Board view — drag-and-drop only.
9. Never skip a permission check before a mutation.
10. Never commit secrets. Enforce permissions in RLS as well as in the UI.

## 10. Out of scope

Realtime subscriptions · scheduled jobs / pg_cron · Sentry · Slack/Teams integration · mobile-specific layouts.

Refresh-to-sync is acceptable. "Days ago" is computed at query time from `last_updated` — no cron needed.
