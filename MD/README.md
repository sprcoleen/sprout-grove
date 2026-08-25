# Grove — Documentation

Reference set for Grove (SproutAIGarden), reconstructed from the shipped code on `master` @ `3964903`, 2026-08-25.

| Document | What it covers | Read it when |
|---|---|---|
| [PRD.md](PRD.md) | Product: users, stages, tiers, the stage gate, permissions, views, hard constraints | You need to know *what the product does* or *why a rule exists* |
| [TECHNICAL.md](TECHNICAL.md) | Stack, repo layout, auth flow, data layer, database, integrations, deployment, known drift | You are about to change code |
| [NEXT-STEPS.md](NEXT-STEPS.md) | Prioritised backlog — verification tasks, drift fixes, test gaps | You are deciding what to work on |

## Precedence

When sources disagree, in order:

1. **The code** — always authoritative
2. **These three files**
3. `CLAUDE.md` — the build rulebook, but three sections are currently stale (see [NEXT-STEPS.md §5](NEXT-STEPS.md#5-update-claudemd))
4. `SproutAIGarden_PRD.docx` — prototype-era, superseded, mentions Firebase and a React artifact environment that were never used

## Start here

Never touched Grove before: [PRD.md §3–§6](PRD.md#3-core-objects) — objects, stages, tiers, gate. That is the whole product model in four sections.

Picking up work: [NEXT-STEPS.md](NEXT-STEPS.md). The three P0 items are verification tasks that can invalidate anything built on top of them.

## Keeping these current

These describe reality, not intent. When you change the stage rules, the tier matrix, the permission model, or the schema, update the corresponding section in the same commit — that is the only thing keeping this set from drifting the way `schema.sql` and `CLAUDE.md` did.
