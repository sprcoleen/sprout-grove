// supabase/functions/send-approval-email/index.ts
// Called by the Grove app when a project owner sends an approval request.
// Generates a unique token, stores it, and emails the approver with Approve/Reject links.
//
// Required Supabase secrets (set via Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY     — from resend.com
//   GROVE_URL          — e.g. https://grove.sprout.solutions
//   SUPABASE_URL       — injected automatically
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const {
      projectId,
      projectName,
      approverName,
      approverEmail,
      builderName,
      builderEmail,
      projectDescription,
    } = await req.json();

    if (!projectId || !approverName || !approverEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a unique token for this approval request
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    const groveUrl = Deno.env.get("GROVE_URL") || "https://grove.sprout.solutions";

    // Store the token and mark as pending
    const { error: dbError } = await supabase
      .from("projects")
      .update({
        approver_name: approverName,
        approver_email: approverEmail,
        approval_status: "pending",
        approval_requested_at: now,
        approval_token: token,
        approval_rejected_at: null,
        approval_rejection_reason: null,
        approved_at: null,
      })
      .eq("id", projectId);

    if (dbError) throw dbError;

    const approveUrl = `${groveUrl}/api/approve?token=${token}&action=approve`;
    const rejectUrl  = `${groveUrl}/api/approve?token=${token}&action=reject`;

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Grove by Sprout <grove@sprout.solutions>",
        to: approverEmail,
        reply_to: builderEmail,
        subject: `Approval needed: ${projectName} on Grove`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden;">
    <div style="background:#1f6e1f;padding:24px 28px;">
      <div style="color:#d6f0d6;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">Grove by Sprout</div>
      <div style="color:#fff;font-size:20px;font-weight:700;">Approval Request</div>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;color:#3a372e;font-size:15px;line-height:1.6;">
        Hi ${approverName},
      </p>
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
        Please review the project and let ${builderName} know your decision:
      </p>
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <a href="${approveUrl}" style="display:inline-block;padding:12px 28px;background:#2d8c2d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">✓ Approve</a>
        <a href="${rejectUrl}"  style="display:inline-block;padding:12px 28px;background:#fff;color:#565244;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;border:1.5px solid #ccc9bc;">✗ Reject</a>
      </div>
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
      throw new Error(`Resend error ${emailRes.status}: ${errBody}`);
    }

    return new Response(JSON.stringify({ success: true, sentAt: now }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-approval-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
