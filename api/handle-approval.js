// api/handle-approval.js — Vercel serverless function
// Public magic-link endpoint — no auth required, approver clicks from email.
//
// GET ?token=xxx&action=approve  → approve, return success HTML
// GET ?token=xxx&action=reject   → return HTML form to enter reason
// POST { token, reason }         → record rejection, return confirmation HTML

import { createClient } from "@supabase/supabase-js";
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

async function sendEmail(to, subject, html, replyTo) {
  try {
    await transporter.sendMail({
      from:    `"Grove by Sprout" <${process.env.GMAIL_USER}>`,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
    });
  } catch (e) {
    console.error("Gmail error:", e.message);
  }
}

const page = (title, body) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Grove</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#fafaf8;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border-radius:14px;border:1px solid #e4e2da;max-width:480px;width:100%;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
    .header{background:#1f6e1f;padding:22px 28px}
    .eyebrow{color:#d6f0d6;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px}
    h1{color:#fff;font-size:18px;font-weight:700}
    .body{padding:28px}
    p{color:#3a372e;font-size:15px;line-height:1.6;margin-bottom:14px}
    .sub{color:#928e7c;font-size:13px;margin-bottom:0}
    label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#736f5e;margin-bottom:6px}
    textarea{width:100%;padding:10px 13px;border:1.5px solid #ccc9bc;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;min-height:100px;color:#3a372e;background:#fafaf8;outline:none}
    button{width:100%;padding:12px;background:#c05621;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-top:14px;font-family:inherit}
    .icon{font-size:36px;margin-bottom:12px}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="eyebrow">Grove by Sprout</div>
      <h1>${title}</h1>
    </div>
    <div class="body">${body}</div>
  </div>
</body>
</html>`;

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── POST: submit rejection reason ─────────────────────────────────────────
  if (req.method === "POST") {
    const { token, reason } = req.body || {};

    if (!token || !reason?.trim()) {
      return res.status(400).send(page("Missing info", `<p>A rejection reason is required.</p>`));
    }

    const { data: project, error } = await supabase
      .from("projects")
      .select("id, name, builder_email, builder, approver_name, approval_status")
      .eq("approval_token", token)
      .single();

    if (error || !project) {
      return res.status(404).send(page("Invalid link", `<p>This approval link is no longer valid.</p>`));
    }

    if (project.approval_status !== "pending") {
      return res.status(200).send(page("Already actioned",
        `<p>This request has already been <strong>${project.approval_status}</strong>.</p>`
      ));
    }

    const rejectedAt = new Date().toISOString();
    await supabase.from("projects").update({
      approval_status:           "rejected",
      approval_rejected_at:      rejectedAt,
      approval_rejection_reason: reason.trim(),
      approval_token:            null,
    }).eq("id", project.id);

    await supabase.from("rooting_reviews")
      .update({ status: "rejected", resolved_at: rejectedAt, rejection_reason: reason.trim() })
      .eq("project_id", String(project.id))
      .eq("status", "pending");

    if (project.builder_email) {
      await sendEmail(
        project.builder_email,
        `Approval request rejected: ${project.name}`,
        `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#fafaf8;padding:32px">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden">
          <div style="background:#c05621;padding:20px 24px"><div style="color:#fff;font-size:18px;font-weight:700">Approval Rejected</div></div>
          <div style="padding:24px">
            <p style="color:#3a372e;font-size:15px;line-height:1.6;margin-bottom:12px">Your approval request for <strong>${project.name}</strong> was rejected by <strong>${project.approver_name}</strong>.</p>
            <div style="background:#fff5f5;border:1px solid #fc8181;border-radius:8px;padding:12px 14px;margin-bottom:16px">
              <div style="color:#c53030;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:4px">Reason</div>
              <div style="color:#3a372e;font-size:14px;line-height:1.5">${reason.trim()}</div>
            </div>
            <p style="color:#928e7c;font-size:13px;line-height:1.6">Please review the feedback, update your project, and send a new approval request when ready.</p>
            <a href="${GROVE_URL}" style="display:inline-block;margin-top:16px;padding:10px 22px;background:#2d8c2d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Open Grove</a>
          </div>
        </div></body></html>`
      );
    }

    return res.status(200).send(page("Rejection recorded",
      `<div class="icon">✗</div>
       <p>You've rejected the approval request for <strong>${project.name}</strong>.</p>
       <p>The reason has been saved and <strong>${project.builder || "the project owner"}</strong> has been notified by email.</p>
       <p class="sub">You can close this tab.</p>`
    ));
  }

  // ── GET: approve or show reject form ──────────────────────────────────────
  const { token, action } = req.query;

  if (!token) {
    return res.status(400).send(page("Invalid link", `<p>No approval token found in this link.</p>`));
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, builder_email, builder, approver_name, approval_status")
    .eq("approval_token", token)
    .single();

  if (error || !project) {
    return res.status(404).send(page("Invalid link",
      `<p>This approval link is no longer valid or has already been used.</p>`
    ));
  }

  if (project.approval_status !== "pending") {
    return res.status(200).send(page("Already actioned",
      `<p>This approval request for <strong>${project.name}</strong> has already been <strong>${project.approval_status}</strong>.</p>
       <p class="sub">No further action needed.</p>`
    ));
  }

  // ── Approve ───────────────────────────────────────────────────────────────
  if (action === "approve") {
    const approvedAt = new Date().toISOString();
    await supabase.from("projects").update({
      approval_status: "approved",
      approved_at:     approvedAt,
      approval_token:  null,
    }).eq("id", project.id);

    await supabase.from("rooting_reviews")
      .update({ status: "approved", resolved_at: approvedAt })
      .eq("project_id", String(project.id))
      .eq("status", "pending");

    await sendEmail(
      RELEASE_MANAGER_EMAIL,
      `${project.name} approved — ready for Grove release review`,
      `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#fafaf8;padding:32px">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden">
        <div style="background:#1f6e1f;padding:20px 24px"><div style="color:#fff;font-size:18px;font-weight:700">Ready for Release Review</div></div>
        <div style="padding:24px">
          <p style="color:#3a372e;font-size:15px;line-height:1.6;margin-bottom:12px">
            <strong>${project.name}</strong> has received sign-off from <strong>${project.approver_name}</strong> and is ready for your release review on Grove.
          </p>
          <a href="${GROVE_URL}" style="display:inline-block;margin-top:8px;padding:10px 22px;background:#2d8c2d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Review on Grove</a>
        </div>
      </div></body></html>`,
      project.builder_email || undefined
    );

    return res.status(200).send(page("Approved!",
      `<div class="icon">✓</div>
       <p>You've approved <strong>${project.name}</strong>.</p>
       <p><strong>${project.builder || "The project owner"}</strong> can now advance this project on Grove. The Release Manager has been notified.</p>
       <p class="sub">You can close this tab.</p>`
    ));
  }

  // ── Show reject form ──────────────────────────────────────────────────────
  if (action === "reject") {
    return res.status(200).send(page("Reject Request",
      `<p>You're rejecting the approval request for <strong>${project.name}</strong>.</p>
       <p>Please provide a reason so <strong>${project.builder || "the project owner"}</strong> knows what to fix:</p>
       <form id="f">
         <label for="reason">Rejection reason</label>
         <textarea id="reason" placeholder="e.g. The project needs a data privacy review before proceeding…" required></textarea>
         <button type="submit">Submit rejection</button>
       </form>
       <script>
         document.getElementById('f').onsubmit = async (e) => {
           e.preventDefault();
           const reason = document.getElementById('reason').value.trim();
           if (!reason) return;
           const btn = e.target.querySelector('button');
           btn.textContent = 'Submitting…'; btn.disabled = true;
           const res = await fetch('/api/handle-approval', {
             method: 'POST',
             headers: {'Content-Type':'application/json'},
             body: JSON.stringify({ token: '${token}', reason })
           });
           document.open(); document.write(await res.text()); document.close();
         };
       </script>`
    ));
  }

  return res.status(400).send(page("Unknown action", `<p>Invalid link. Please check the email you received.</p>`));
}
