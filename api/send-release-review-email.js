// api/send-release-review-email.js — Vercel serverless function
// Handles two email directions for the Release Review flow:
//   action:"submit"   → notify Release Manager a review was submitted
//   action:"decision" → notify builder of the RM's decision (approved/rejected/changes_requested)

import nodemailer from "nodemailer";

const RELEASE_MANAGER_EMAIL = "cbasis@sprout.ph";
const GROVE_URL = "https://grove.sprout.solutions";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const shell = (headerBg, eyebrow, title, body) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden;">
    <div style="background:${headerBg};padding:24px 28px;">
      <div style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">${eyebrow}</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">${title}</div>
    </div>
    <div style="padding:28px;">${body}</div>
    <div style="background:#fafaf8;border-top:1px solid #e4e2da;padding:14px 28px;">
      <div style="color:#b0ac9c;font-size:11px;">Sent via Grove — Sprout's internal AI project tracker</div>
    </div>
  </div>
</body>
</html>`;

const p  = (txt) => `<p style="margin:0 0 14px;color:#3a372e;font-size:15px;line-height:1.6;">${txt}</p>`;
const sm = (txt) => `<p style="margin:0 0 14px;color:#565244;font-size:13px;line-height:1.6;">${txt}</p>`;
const cta = (href, label, bg="#2d8c2d") =>
  `<a href="${href}" style="display:inline-block;margin-top:6px;padding:10px 22px;background:${bg};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">${label}</a>`;
const infoBox = (labelColor, label, content) =>
  `<div style="background:#fafaf8;border:1px solid #e4e2da;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
     <div style="color:${labelColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">${label}</div>
     <div style="color:#565244;font-size:14px;line-height:1.6;">${content}</div>
   </div>`;
const alertBox = (bg, border, label, labelColor, content) =>
  `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:12px 14px;margin-bottom:16px;">
     <div style="color:${labelColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">${label}</div>
     <div style="color:#3a372e;font-size:14px;line-height:1.5;">${content}</div>
   </div>`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    action,
    projectName,
    builderName,
    builderEmail,
    stage,
    tier,
    demoLink,
    description,
    // decision fields
    decisionType,
    reviewerName,
    comment,
  } = req.body;

  if (!action || !projectName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const nextStage   = stage === "sprout" ? "Bloom" : "Thriving";
  const tierLabel   = tier === 3 ? "Tier 3 — External-Facing"
                    : tier === 2 ? "Tier 2 — Internal App"
                    : tier === 1 ? "Tier 1 — Static / Internal"
                    : "Unclassified";

  // ── Notify Release Manager when builder submits ─────────────────────────────
  if (action === "submit") {
    const body = [
      p(`<strong>${builderName}</strong> has submitted <strong>${projectName}</strong> for Release Review and is requesting sign-off to advance to <strong>${nextStage}</strong>.`),
      infoBox("#928e7c", "Project details",
        `<strong>Stage transition:</strong> ${stage.charAt(0).toUpperCase()+stage.slice(1)} → ${nextStage}<br>
         <strong>Tier:</strong> ${tierLabel}<br>
         <strong>Builder:</strong> ${builderName} (${builderEmail})`
      ),
      description ? infoBox("#928e7c", "About the project", description) : "",
      demoLink    ? infoBox("#928e7c", "Demo / prototype", `<a href="${demoLink}" style="color:#1f6e1f;word-break:break-all;">${demoLink}</a>`) : "",
      sm("Please review the project on Grove and approve or reject the release."),
      cta(GROVE_URL, "Review on Grove →"),
    ].join("");

    try {
      await transporter.sendMail({
        from:    `"Grove by Sprout" <${process.env.GMAIL_USER}>`,
        to:      RELEASE_MANAGER_EMAIL,
        replyTo: builderEmail,
        subject: `[Release Review] ${projectName} → ${nextStage}`,
        html:    shell("#1f6e1f", "Grove by Sprout — Release Review", `Release Review: ${projectName}`, body),
      });
    } catch (e) {
      console.error("Release review submission email error:", e);
      return res.status(500).json({ error: e.message });
    }

    return res.status(200).json({ success: true });
  }

  // ── Notify builder of the RM's decision ────────────────────────────────────
  if (action === "decision") {
    if (!builderEmail || !decisionType) {
      return res.status(400).json({ error: "Missing builderEmail or decisionType" });
    }

    let headerBg, eyebrow, title, body;

    if (decisionType === "approved") {
      headerBg = "#1f6e1f";
      eyebrow  = "Grove by Sprout — Release Review";
      title    = "Release Review Approved";
      body = [
        p(`Great news! <strong>${projectName}</strong> has been approved by <strong>${reviewerName}</strong>. You can now advance the project to <strong>${nextStage}</strong>.`),
        sm("Open Grove and click the stage advance button in your project's Release Gate section."),
        cta(GROVE_URL, "Advance on Grove →"),
      ].join("");
    } else if (decisionType === "rejected") {
      headerBg = "#c05621";
      eyebrow  = "Grove by Sprout — Release Review";
      title    = "Release Review Rejected";
      body = [
        p(`Your release review for <strong>${projectName}</strong> was rejected by <strong>${reviewerName}</strong>.`),
        comment ? alertBox("#fff5f5", "#fc8181", "Reason", "#c53030", comment) : "",
        sm("Please address the feedback, update your project, and resubmit for review."),
        cta(GROVE_URL, "Open Grove →", "#c05621"),
      ].join("");
    } else if (decisionType === "changes_requested") {
      headerBg = "#b7791f";
      eyebrow  = "Grove by Sprout — Release Review";
      title    = "Changes Requested";
      body = [
        p(`<strong>${reviewerName}</strong> has reviewed <strong>${projectName}</strong> and is requesting changes before it can advance to ${nextStage}.`),
        comment ? alertBox("#fefcbf", "#d69e2e", "What needs to change", "#744210", comment) : "",
        sm("Make the requested updates and resubmit your project for review on Grove."),
        cta(GROVE_URL, "Open Grove →", "#b7791f"),
      ].join("");
    } else {
      return res.status(400).json({ error: "Unknown decisionType" });
    }

    try {
      await transporter.sendMail({
        from:    `"Grove by Sprout" <${process.env.GMAIL_USER}>`,
        to:      builderEmail,
        subject: `[Grove] Release Review ${decisionType === "approved" ? "Approved" : decisionType === "rejected" ? "Rejected" : "— Changes Requested"}: ${projectName}`,
        html:    shell(headerBg, eyebrow, title, body),
      });
    } catch (e) {
      console.error("Release review decision email error:", e);
      return res.status(500).json({ error: e.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: "Unknown action" });
}
