// api/send-classification-nudge.js — Vercel serverless function
// Emails project builders about records that need their attention (no tier set,
// or no update in a long time).
//
// Projects are grouped by builder, so someone with 11 flagged projects gets ONE
// digest email listing all 11, not 11 separate emails.
//
// The admin can supply their own subject and body copy. The body is PLAIN TEXT —
// blank-line-separated paragraphs — which the server escapes and wraps in the Grove
// email shell. Admins edit words, never markup, so the branding can't be broken and
// nothing they type can inject HTML.
//
// Body: {
//   projects:        [{ projectId, projectName, builderName, builderEmail, note? }], // required
//   adminName:       string,   // optional — From display name and {{adminName}}
//   adminEmail:      string,   // optional — Reply-To
//   deadline:        string,   // optional — ISO date. Default DEFAULT_DEADLINE. null = omit.
//   subjectTemplate: string,   // optional — defaults to DEFAULT_SUBJECT
//   bodyTemplate:    string,   // optional — defaults to DEFAULT_BODY
//   heading:         string,   // optional — the coloured header line. Default DEFAULT_HEADING.
//   testEmail:       string,   // optional — redirect every email here, subject prefixed [TEST]
//   dryRun:          boolean,  // optional — render but send nothing; returns previews
// }
//
// Returns { results: [{ projectId, ok, error? }], groups, emailsSent, previews? } so the
// caller's per-project "Notified ✓" markers keep working unchanged.
//
// Vercel env vars needed: GMAIL_USER, GMAIL_APP_PASSWORD

import nodemailer from "nodemailer";
import { CLASSIFICATION_TEMPLATE } from "../src/lib/nudgeTemplates.js";

const GROVE_URL = "https://grove.sprout.solutions";

// Change this when the current push moves to a new target date.
const DEFAULT_DEADLINE = "2026-09-25";

// Fallbacks for callers that send no template of their own. The Admin composer always
// sends explicit copy, so these only apply to direct/scripted calls.
const DEFAULT_HEADING = CLASSIFICATION_TEMPLATE.heading;
const DEFAULT_SUBJECT = CLASSIFICATION_TEMPLATE.subject;
const DEFAULT_BODY = CLASSIFICATION_TEMPLATE.body;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const firstNameOf = (builderName, builderEmail) => {
  const n = (builderName || "").trim();
  if (n) return n.split(/\s+/)[0];
  return builderEmail.split("@")[0];
};

// "2026-09-25" → "Friday 25 September". Returns null if unparseable.
function formatDeadline(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString("en-PH", { weekday: "long", timeZone: "UTC" });
  const month = d.toLocaleDateString("en-PH", { month: "long", timeZone: "UTC" });
  return `${weekday} ${d.getUTCDate()} ${month}`;
}

function tokensFor({ firstName, projects, adminName, deadlineLabel }) {
  const n = projects.length;
  const many = n > 1;
  // projectPhrase keeps copy grammatical at any count: "your project" / "11 of your projects".
  const phrase = many ? `${n} of your projects` : "your project";
  return {
    firstName,
    adminName: adminName || "the Grove admin team",
    projectCount: String(n),
    projectWord: many ? "projects" : "project",
    projectPhrase: phrase,
    ProjectPhrase: phrase.charAt(0).toUpperCase() + phrase.slice(1),
    needWord: many ? "need" : "needs",
    hasWord: many ? "have" : "has",
    them: many ? "them" : "it",
    deadline: deadlineLabel || "",
  };
}

const fillTokens = (tpl, tokens) =>
  String(tpl ?? "").replace(/\{\{(\w+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));

// The linked project table that replaces {{projectList}} in the body.
function renderProjectList(projects) {
  const rows = projects
    .map((p) => {
      const url = `${GROVE_URL}/?project=${encodeURIComponent(p.projectId)}`;
      return `
          <tr>
            <td style="padding:9px 0;border-bottom:1px solid #e4e2da;">
              <a href="${url}" style="color:#2c7a7b;font-size:14px;font-weight:600;text-decoration:none;">${esc(
                p.projectName
              )}</a>${
                p.note
                  ? `<div style="color:#928e7c;font-size:12px;margin-top:2px;">${esc(p.note)}</div>`
                  : ""
              }
            </td>
            <td style="padding:9px 0;border-bottom:1px solid #e4e2da;text-align:right;white-space:nowrap;vertical-align:top;">
              <a href="${url}" style="color:#736f5e;font-size:12px;font-weight:600;text-decoration:none;">Open &rarr;</a>
            </td>
          </tr>`;
    })
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:4px 0 18px;">${rows}</table>`;
}

// Plain-text body → escaped HTML paragraphs, with {{projectList}} expanded to the table.
// A paragraph that is exactly {{projectList}} becomes the table; inline uses are replaced too.
function renderBody(bodyText, projects, tokens) {
  const listHtml = renderProjectList(projects);
  const filled = fillTokens(bodyText, tokens);

  return filled
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      if (para === "{{projectList}}") return listHtml;
      const html = esc(para).replace(/\n/g, "<br>").replace(/\{\{projectList\}\}/g, listHtml);
      return `<p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.65;">${html}</p>`;
    })
    .join("\n      ");
}

function buildHtml({ heading, bodyHtml, isTest, realRecipient }) {
  const testBanner = isTest
    ? `<div style="background:#fed7d7;border-bottom:1px solid #c53030;padding:10px 28px;color:#c53030;font-size:12px;font-weight:700;">
         TEST SEND &middot; in a real send this would go to ${esc(realRecipient)}
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden;">
    ${testBanner}
    <div style="background:#1f6e1f;padding:24px 28px;">
      <div style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:5px;">Grove &middot; tidying up the records</div>
      <div style="color:#ffffff;font-size:21px;font-weight:700;line-height:1.3;">${esc(heading)}</div>
    </div>

    <div style="padding:26px 28px 28px;">
      ${bodyHtml}

      <a href="${GROVE_URL}/?view=garden"
         style="display:inline-block;margin-top:4px;padding:12px 26px;background:#2d8c2d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Open Grove</a>
    </div>

    <div style="background:#fafaf8;border-top:1px solid #e4e2da;padding:14px 28px;">
      <div style="color:#b0ac9c;font-size:11px;">Grove &mdash; Sprout's internal AI project tracker</div>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    projects,
    adminName,
    adminEmail,
    deadline,
    subjectTemplate,
    bodyTemplate,
    heading,
    testEmail,
    dryRun,
  } = req.body || {};

  if (!Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: "projects array is required" });
  }

  const SPROUT_ADDR = /^[^@\s]+@(sprout\.ph|sproutsolutions\.io)$/;
  if (testEmail && !SPROUT_ADDR.test(testEmail)) {
    return res.status(400).json({ error: "testEmail must be a Sprout address" });
  }
  if (adminEmail && !SPROUT_ADDR.test(adminEmail)) {
    return res.status(400).json({ error: "adminEmail must be a Sprout address" });
  }

  const subjectTpl = (subjectTemplate ?? "").trim() || DEFAULT_SUBJECT;
  const bodyTpl = (bodyTemplate ?? "").trim() || DEFAULT_BODY;
  const headingTpl = (heading ?? "").trim() || DEFAULT_HEADING;

  // `deadline: null` means "no deadline"; omitting it entirely uses the default.
  const deadlineIso = deadline === undefined ? DEFAULT_DEADLINE : deadline;
  const deadlineLabel = formatDeadline(deadlineIso);

  // Group by builder so one person gets one email.
  const groups = new Map();
  const results = [];

  for (const p of projects) {
    if (!p?.builderEmail || !p?.projectName || !p?.projectId) {
      results.push({
        projectId: p?.projectId ?? null,
        ok: false,
        error: "Missing projectId, projectName, or builderEmail",
      });
      continue;
    }
    const key = p.builderEmail.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { builderEmail: p.builderEmail, builderName: p.builderName, projects: [] });
    }
    const g = groups.get(key);
    if (!g.builderName && p.builderName) g.builderName = p.builderName;
    g.projects.push({
      projectId: String(p.projectId),
      projectName: p.projectName,
      note: p.note || "",
    });
  }

  const isTest = Boolean(testEmail);
  // Gmail won't let us send as anyone else, so the address stays the Grove mailbox and
  // only the display name and Reply-To carry the admin's identity.
  const fromName = adminName ? `${adminName} (via Grove)` : "Grove by Sprout";
  const previews = [];

  for (const g of groups.values()) {
    g.projects.sort((a, b) => a.projectName.localeCompare(b.projectName));

    const tokens = tokensFor({
      firstName: firstNameOf(g.builderName, g.builderEmail),
      projects: g.projects,
      adminName,
      deadlineLabel,
    });

    const html = buildHtml({
      heading: fillTokens(headingTpl, tokens),
      bodyHtml: renderBody(bodyTpl, g.projects, tokens),
      isTest,
      realRecipient: g.builderEmail,
    });

    const subject = `${isTest ? "[TEST] " : ""}${fillTokens(subjectTpl, tokens)}`;
    const to = testEmail || g.builderEmail;

    if (dryRun) {
      previews.push({
        to,
        realRecipient: g.builderEmail,
        from: `"${fromName}" <${process.env.GMAIL_USER || "GMAIL_USER"}>`,
        replyTo: adminEmail || null,
        subject,
        projectCount: g.projects.length,
        html,
      });
      g.projects.forEach((p) => results.push({ projectId: p.projectId, ok: true, dryRun: true }));
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"${fromName}" <${process.env.GMAIL_USER}>`,
        ...(adminEmail ? { replyTo: adminEmail } : {}),
        to,
        subject,
        html,
      });
      g.projects.forEach((p) => results.push({ projectId: p.projectId, ok: true }));
    } catch (e) {
      console.error(`Grove nudge error for ${to}:`, e.message);
      g.projects.forEach((p) => results.push({ projectId: p.projectId, ok: false, error: e.message }));
    }
  }

  const allOk = results.every((r) => r.ok);
  return res.status(allOk ? 200 : 207).json({
    results,
    groups: groups.size,
    emailsSent: dryRun ? 0 : groups.size,
    ...(dryRun ? { previews } : {}),
  });
}
