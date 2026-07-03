// api/send-classification-nudge.js — Vercel serverless function
// Sends a nudge email to a project builder asking them to classify their project tier.

import nodemailer from "nodemailer";

const GROVE_URL = "https://grove.sprout.solutions";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { projects, adminName } = req.body;
  // projects: [{ projectId, projectName, builderName, builderEmail }]

  if (!Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: "projects array is required" });
  }

  const results = [];

  for (const p of projects) {
    const { projectId, projectName, builderName, builderEmail } = p;
    if (!builderEmail || !projectName) {
      results.push({ projectId, ok: false, error: "Missing builderEmail or projectName" });
      continue;
    }

    const projectUrl = `${GROVE_URL}/?project=${projectId}`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden;">
    <div style="background:#b7791f;padding:24px 28px;">
      <div style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">Grove by Sprout — Action needed</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Please classify your project</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.6;">
        Hi ${builderName || builderEmail.split("@")[0]},
      </p>
      <p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.6;">
        Your project <strong>${projectName}</strong> is missing its Tier Classification on Grove.
        Classification determines hosting requirements, security review scope, and which Groundskeepers
        support your project — so it's important to complete.
      </p>
      <div style="background:#fefcbf;border:1px solid #d69e2e;border-radius:8px;padding:12px 14px;margin-bottom:20px;">
        <div style="color:#b7791f;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">What you need to do</div>
        <div style="color:#3a372e;font-size:14px;line-height:1.5;">
          Open your project on Grove, go to the <strong>Seedling tab</strong>, and answer the two
          classification questions:
          <ol style="margin:8px 0 0 16px;padding:0;color:#565244;font-size:13px;line-height:1.7;">
            <li>Does the project have a backend, database, or server-side logic?</li>
            <li>Who are the target users — internal, external, or both?</li>
          </ol>
        </div>
      </div>
      ${adminName ? `<p style="margin:0 0 20px;color:#565244;font-size:13px;line-height:1.6;">This was sent on behalf of <strong>${adminName}</strong> from the Grove admin team.</p>` : ""}
      <a href="${projectUrl}" style="display:inline-block;padding:11px 24px;background:#2d8c2d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Open project on Grove →</a>
    </div>
    <div style="background:#fafaf8;border-top:1px solid #e4e2da;padding:14px 28px;">
      <div style="color:#b0ac9c;font-size:11px;">Sent via Grove — Sprout's internal AI project tracker</div>
    </div>
  </div>
</body>
</html>`;

    try {
      await transporter.sendMail({
        from:    `"Grove by Sprout" <${process.env.GMAIL_USER}>`,
        to:      builderEmail,
        subject: `[Grove] Action needed: classify your project "${projectName}"`,
        html,
      });
      results.push({ projectId, ok: true });
    } catch (e) {
      console.error(`Classification nudge email error for ${builderEmail}:`, e.message);
      results.push({ projectId, ok: false, error: e.message });
    }
  }

  const allOk = results.every(r => r.ok);
  return res.status(allOk ? 200 : 207).json({ results });
}
