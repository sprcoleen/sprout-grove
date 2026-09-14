// src/lib/nudgeTemplates.js
// Single source of truth for the admin nudge email copy. Imported by both the
// Admin composer UI (to prefill the editor) and api/send-classification-nudge.js
// (as the fallback when a caller sends no template), so the two can't drift.
//
// Bodies are PLAIN TEXT. Blank lines separate paragraphs. The server escapes every
// character before wrapping it in the Grove email shell, so nothing typed here — or
// typed by an admin in the composer — can inject markup.
//
// Prefer {{projectPhrase}} over "{{projectCount}} of your {{projectWord}}": it reads
// correctly at any count ("your project" / "11 of your projects"), where the raw
// count produces "1 of your project".

/** Tokens usable in the heading, subject and body. */
export const NUDGE_TOKENS = [
  { token: "{{firstName}}",     desc: "Recipient's first name" },
  { token: "{{projectPhrase}}", desc: '"your project" or "11 of your projects"' },
  { token: "{{ProjectPhrase}}", desc: "Same, capitalised — use at the start of a sentence" },
  { token: "{{projectList}}",   desc: "The linked list of their projects (body only)" },
  { token: "{{projectCount}}",  desc: "Just the number" },
  { token: "{{projectWord}}",   desc: '"project" or "projects"' },
  { token: "{{needWord}}",      desc: '"needs" or "need"' },
  { token: "{{hasWord}}",       desc: '"has" or "have"' },
  { token: "{{them}}",          desc: '"it" or "them"' },
  { token: "{{deadline}}",      desc: "Deadline date, blank if none set" },
  { token: "{{adminName}}",     desc: "Your name" },
];

export const CLASSIFICATION_TEMPLATE = {
  id: "classification",
  label: "Classification nudge",
  blurb: "For projects with no tier set.",
  heading: "Could you set the tier on {{projectPhrase}}?",
  subject: "[Grove] Could you set the tier on {{projectPhrase}}?",
  body: `Hi {{firstName}},

We're filling in the gaps in Grove's records this month. {{ProjectPhrase}} {{needWord}} a tier set:

{{projectList}}

It's two questions — does it have a backend, database, or server-side logic, and are the target users internal, external, or both? Grove works out the tier from your answers, so there's nothing for you to look up or decide.

The tier tells us what kind of application has been submitted and whether it needs further review and checking. Once it's set we can route all of that for you without coming back to ask.

If you can get to {{them}} by {{deadline}} that would be a big help — that's when we're closing out this round.

Each link opens straight to that project, and the questions are on the Seedling tab. If something in that list is finished with, a duplicate, or never really started, just reply and say so — we'll tidy it up rather than make you classify it.

Thanks,
{{adminName}}`,
};

export const STALE_TEMPLATE = {
  id: "stale",
  label: "Stale check-in",
  blurb: "For projects with no update in a long time.",
  heading: "A quick check on {{projectPhrase}}",
  subject: "[Grove] Quick check on {{projectPhrase}}",
  body: `Hi {{firstName}},

We're doing a pass over Grove to see which projects are still active. {{ProjectPhrase}} {{hasWord}} not been updated in a while:

{{projectList}}

No need to write anything up — just open {{them}} and check the stage and details still match reality. If a project has moved on, drag it to its current stage; that alone brings the record back up to date.

If any of this is finished with, parked, or never really started, reply and tell us and we'll tidy the record up for you.

Thanks,
{{adminName}}`,
};

export const COMBINED_TEMPLATE = {
  id: "combined",
  label: "Both issues",
  blurb: "For people with a mix of untiered and stale projects.",
  heading: "{{ProjectPhrase}} {{needWord}} a moment",
  subject: "[Grove] Could you update {{projectPhrase}}?",
  body: `Hi {{firstName}},

We're tidying up Grove's records this month, and {{projectPhrase}} {{needWord}} a little attention. The note under each one says what's missing:

{{projectList}}

Where it says no tier set, that's two questions on the Seedling tab — does it have a backend, database, or server-side logic, and are the target users internal, external, or both? Grove works out the tier from your answers.

Where it says no recent update, just check the stage and details still match reality. Dragging a project to its current stage is enough to bring the record up to date.

If you can get to {{them}} by {{deadline}} that would be a big help.

If anything in that list is finished with, a duplicate, or never really started, reply and say so — we'll tidy it up rather than make you do it.

Thanks,
{{adminName}}`,
};

export const NUDGE_TEMPLATES = [CLASSIFICATION_TEMPLATE, STALE_TEMPLATE, COMBINED_TEMPLATE];
