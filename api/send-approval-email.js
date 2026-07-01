// api/send-approval-email.js — Vercel serverless function
// Vercel env vars needed: GMAIL_USER, GMAIL_APP_PASSWORD,
//   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    projectId,
    projectName,
    approverName,
    approverEmail,
    builderName,
    builderEmail,
    projectDescription,
    prototypeLink,
    deckLink,
    docsLink,
  } = req.body;

  if (!projectId || !approverName || !approverEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const token  = crypto.randomUUID();
  const now    = new Date().toISOString();
  const groveUrl = "https://grove.sprout.solutions";

  const { error: dbError } = await supabase
    .from("projects")
    .update({
      approver_name:             approverName,
      approver_email:            approverEmail,
      approval_status:           "pending",
      approval_requested_at:     now,
      approval_token:            token,
      approved_at:               null,
      approval_rejected_at:      null,
      approval_rejection_reason: null,
      prototype_link:            prototypeLink || null,
      deck_link:                 deckLink      || null,
      docs_link:                 docsLink      || null,
    })
    .eq("id", projectId);

  if (dbError) {
    console.error("DB error:", dbError);
    return res.status(500).json({ error: dbError.message });
  }

  const approveUrl = `${groveUrl}/api/handle-approval?token=${token}&action=approve`;
  const rejectUrl  = `${groveUrl}/api/handle-approval?token=${token}&action=reject`;
  const projectUrl = `${groveUrl}/?project=${projectId}`;

  try {
    await transporter.sendMail({
      from:    `"Grove by Sprout" <${process.env.GMAIL_USER}>`,
      to:      approverEmail,
      replyTo: builderEmail,
      subject: `Approval needed: ${projectName} on Grove`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden;">
    <div style="background:#1f6e1f;padding:24px 28px;">
      <div style="color:#d6f0d6;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">Grove by Sprout</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Approval Request</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.6;">Hi ${approverName},</p>
      <p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.6;">
        <strong>${builderName}</strong> is requesting your approval before advancing
        <strong>${projectName}</strong> to the next stage on Grove.
      </p>
      ${projectDescription ? `
      <div style="background:#fafaf8;border:1px solid #e4e2da;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <div style="color:#928e7c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">About the project</div>
        <div style="color:#565244;font-size:14px;line-height:1.6;">${projectDescription}</div>
      </div>` : ""}
      ${(prototypeLink || deckLink || docsLink) ? `
      <div style="background:#fafaf8;border:1px solid #e4e2da;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <div style="color:#928e7c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Review materials</div>
        ${prototypeLink ? `<div style="margin-bottom:8px;"><span style="color:#736f5e;font-size:12px;font-weight:600;">Demo / prototype:</span> <a href="${prototypeLink}" style="color:#1f6e1f;font-size:13px;word-break:break-all;">${prototypeLink}</a></div>` : ""}
        ${deckLink      ? `<div style="margin-bottom:8px;"><span style="color:#736f5e;font-size:12px;font-weight:600;">Presentation deck:</span> <a href="${deckLink}" style="color:#1f6e1f;font-size:13px;word-break:break-all;">${deckLink}</a></div>` : ""}
        ${docsLink      ? `<div><span style="color:#736f5e;font-size:12px;font-weight:600;">Documentation:</span> <a href="${docsLink}" style="color:#1f6e1f;font-size:13px;word-break:break-all;">${docsLink}</a></div>` : ""}
      </div>` : ""}
      <p style="margin:0 0 16px;color:#565244;font-size:14px;line-height:1.6;">
        Please review and let ${builderName} know your decision:
      </p>
      <p style="margin:0 0 20px;">
        <a href="${projectUrl}" style="display:inline-block;padding:9px 18px;background:#fafaf8;color:#1f6e1f;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;border:1.5px solid #aadcaa;">View project on Grove →</a>
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding-right:12px;">
            <a href="${approveUrl}" style="display:inline-block;padding:12px 28px;background:#2d8c2d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">✓ Approve</a>
          </td>
          <td>
            <a href="${rejectUrl}" style="display:inline-block;padding:12px 28px;background:#fff;color:#565244;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;border:1.5px solid #ccc9bc;">✗ Reject</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:#928e7c;font-size:12px;line-height:1.6;">
        These links are unique to this request. If you have questions, reply to this email or contact ${builderName} at ${builderEmail}.
      </p>
    </div>
    <div style="background:#fafaf8;border-top:1px solid #e4e2da;padding:14px 28px;">
      <div style="color:#b0ac9c;font-size:11px;">Sent via Grove — Sprout's internal AI project tracker</div>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (emailErr) {
    console.error("Gmail error:", emailErr);
    return res.status(500).json({ error: `Email failed: ${emailErr.message}` });
  }

  // FYI email to Release Manager for alignment (non-fatal)
  try {
    await transporter.sendMail({
      from:    `"Grove by Sprout" <${process.env.GMAIL_USER}>`,
      to:      "cbasis@sprout.ph",
      replyTo: builderEmail,
      subject: `[FYI] Rooting Review submitted: ${projectName}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden;">
    <div style="background:#1f6e1f;padding:24px 28px;">
      <div style="color:#d6f0d6;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">Grove by Sprout — Alignment Notice</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Rooting Review Submitted</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.6;">Hi,</p>
      <p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.6;">
        <strong>${builderName}</strong> has submitted <strong>${projectName}</strong> for Rooting Review.
        IS / ExCom sign-off has been requested from <strong>${approverName}</strong> (${approverEmail}).
      </p>
      <p style="margin:0 0 16px;color:#565244;font-size:14px;line-height:1.6;">
        This is for your alignment — no action is required from you at this time.
        Once the approver signs off, the project will automatically advance to Sprout stage.
      </p>
      ${projectDescription ? `
      <div style="background:#fafaf8;border:1px solid #e4e2da;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <div style="color:#928e7c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">About the project</div>
        <div style="color:#565244;font-size:14px;line-height:1.6;">${projectDescription}</div>
      </div>` : ""}
      ${(prototypeLink || deckLink || docsLink) ? `
      <div style="background:#fafaf8;border:1px solid #e4e2da;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <div style="color:#928e7c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Review materials</div>
        ${prototypeLink ? `<div style="margin-bottom:8px;"><span style="color:#736f5e;font-size:12px;font-weight:600;">Demo / prototype:</span> <a href="${prototypeLink}" style="color:#1f6e1f;font-size:13px;word-break:break-all;">${prototypeLink}</a></div>` : ""}
        ${deckLink      ? `<div style="margin-bottom:8px;"><span style="color:#736f5e;font-size:12px;font-weight:600;">Presentation deck:</span> <a href="${deckLink}" style="color:#1f6e1f;font-size:13px;word-break:break-all;">${deckLink}</a></div>` : ""}
        ${docsLink      ? `<div><span style="color:#736f5e;font-size:12px;font-weight:600;">Documentation:</span> <a href="${docsLink}" style="color:#1f6e1f;font-size:13px;word-break:break-all;">${docsLink}</a></div>` : ""}
      </div>` : ""}
    </div>
    <div style="background:#fafaf8;border-top:1px solid #e4e2da;padding:14px 28px;">
      <div style="color:#b0ac9c;font-size:11px;">Sent via Grove — Sprout's internal AI project tracker</div>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (rmErr) {
    console.error("Release Manager FYI email error:", rmErr);
  }

  return res.status(200).json({ success: true, sentAt: now });
}
