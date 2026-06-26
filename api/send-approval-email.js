// api/send-approval-email.js — Vercel serverless function
// Called by the Grove app when a project owner sends an approval request.
// Env vars needed in Vercel: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY,
//   VITE_SUPABASE_URL (already set for the frontend)

import { createClient } from "@supabase/supabase-js";

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
  } = req.body;

  if (!projectId || !approverName || !approverEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const token = crypto.randomUUID();
  const now   = new Date().toISOString();
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
    })
    .eq("id", projectId);

  if (dbError) {
    console.error("DB error:", dbError);
    return res.status(500).json({ error: dbError.message });
  }

  const approveUrl = `${groveUrl}/api/handle-approval?token=${token}&action=approve`;
  const rejectUrl  = `${groveUrl}/api/handle-approval?token=${token}&action=reject`;

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:     "Grove by Sprout <grove@sprout.solutions>",
      to:       approverEmail,
      reply_to: builderEmail,
      subject:  `Approval needed: ${projectName} on Grove`,
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
      <p style="margin:0 0 20px;color:#565244;font-size:14px;line-height:1.6;">
        Please review and let ${builderName} know your decision:
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
    }),
  });

  if (!emailRes.ok) {
    const errBody = await emailRes.text();
    console.error("Resend error:", emailRes.status, errBody);
    return res.status(500).json({ error: `Email failed: ${emailRes.status}` });
  }

  return res.status(200).json({ success: true, sentAt: now });
}
