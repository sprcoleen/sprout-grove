// supabase/functions/handle-approval/index.ts
// Public magic-link endpoint. No auth required — approver clicks from email.
//
// GET ?token=xxx&action=approve  → approve project, return success HTML
// GET ?token=xxx&action=reject   → return HTML form to enter rejection reason
// POST { token, reason }         → record rejection, return confirmation HTML
//
// Required secrets: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, GROVE_URL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RELEASE_MANAGER_EMAIL = "cbasis@sprout.ph";

const html = (title: string, body: string) => `<!DOCTYPE html>
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
    .header .label{color:#d6f0d6;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px}
    .header h1{color:#fff;font-size:18px;font-weight:700}
    .body{padding:28px}
    p{color:#3a372e;font-size:15px;line-height:1.6;margin-bottom:14px}
    .sub{color:#928e7c;font-size:13px;margin-bottom:0}
    textarea{width:100%;padding:10px 13px;border:1.5px solid #ccc9bc;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;min-height:100px;color:#3a372e;background:#fafaf8;outline:none;transition:border-color 0.15s}
    textarea:focus{border-color:#2d8c2d}
    label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#736f5e;margin-bottom:6px}
    button{width:100%;padding:12px;background:#c05621;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-top:14px;font-family:inherit}
    button:hover{background:#9c4221}
    .icon{font-size:36px;margin-bottom:12px}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="label">Grove by Sprout</div>
      <h1>${title}</h1>
    </div>
    <div class="body">${body}</div>
  </div>
</body>
</html>`;

async function sendEmail(apiKey: string, to: string, subject: string, htmlBody: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Grove by Sprout <grove@sprout.solutions>",
      to,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html: htmlBody,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Resend error ${res.status}:`, err);
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action");
  const groveUrl = Deno.env.get("GROVE_URL") || "https://grove.sprout.solutions";
  const resendKey = Deno.env.get("RESEND_API_KEY")!;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── POST: submit rejection reason ───────────────────────────────────────────
  if (req.method === "POST") {
    let body: { token?: string; reason?: string } = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const { token: postToken, reason } = body;

    if (!postToken || !reason?.trim()) {
      return new Response(html("Missing info", `<p>A rejection reason is required.</p>`), {
        headers: { "Content-Type": "text/html" },
      });
    }

    const { data: project, error } = await supabase
      .from("projects")
      .select("id, name, builder_email, builder, approver_name, approval_status")
      .eq("approval_token", postToken)
      .single();

    if (error || !project) {
      return new Response(html("Invalid link", `<p>This approval link is no longer valid.</p>`), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (project.approval_status !== "pending") {
      return new Response(html("Already actioned", `<p>This request has already been ${project.approval_status}.</p>`), {
        headers: { "Content-Type": "text/html" },
      });
    }

    const now = new Date().toISOString();
    await supabase.from("projects").update({
      approval_status: "rejected",
      approval_rejected_at: now,
      approval_rejection_reason: reason.trim(),
      approval_token: null,
    }).eq("id", project.id);

    // Notify the project owner
    if (project.builder_email) {
      await sendEmail(resendKey, project.builder_email,
        `Approval request rejected: ${project.name}`,
        `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#fafaf8;padding:32px">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden">
          <div style="background:#c05621;padding:20px 24px"><div style="color:#fff;font-size:18px;font-weight:700">Approval Rejected</div></div>
          <div style="padding:24px">
            <p style="color:#3a372e;font-size:15px;line-height:1.6;margin-bottom:12px">Your approval request for <strong>${project.name}</strong> was rejected by <strong>${project.approver_name}</strong>.</p>
            <div style="background:#fef2f2;border:1px solid #fbd38d;border-radius:8px;padding:12px 14px;margin-bottom:16px">
              <div style="color:#7b341e;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:4px">Reason</div>
              <div style="color:#3a372e;font-size:14px;line-height:1.5">${reason.trim()}</div>
            </div>
            <p style="color:#928e7c;font-size:13px;line-height:1.6">Please review the feedback, update your project, and send a new approval request when ready.</p>
            <a href="${groveUrl}" style="display:inline-block;margin-top:16px;padding:10px 22px;background:#2d8c2d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Open Grove</a>
          </div>
        </div>
        </body></html>`
      );
    }

    return new Response(html("Rejection recorded",
      `<div class="icon">✗</div>
       <p>You've rejected the approval request for <strong>${project.name}</strong>.</p>
       <p>The rejection reason has been saved and <strong>${project.builder || "the project owner"}</strong> has been notified.</p>
       <p class="sub">You can close this tab.</p>`
    ), { headers: { "Content-Type": "text/html" } });
  }

  // ── GET: approve or show reject form ───────────────────────────────────────
  if (!token) {
    return new Response(html("Invalid link", `<p>No approval token found in this link.</p>`), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, builder_email, builder, approver_name, approval_status")
    .eq("approval_token", token)
    .single();

  if (error || !project) {
    return new Response(html("Invalid link", `<p>This approval link is no longer valid or has already been used.</p>`), {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (project.approval_status !== "pending") {
    return new Response(html("Already actioned",
      `<p>This approval request for <strong>${project.name}</strong> has already been <strong>${project.approval_status}</strong>.</p>
       <p class="sub">No further action needed.</p>`
    ), { headers: { "Content-Type": "text/html" } });
  }

  // ── Approve ────────────────────────────────────────────────────────────────
  if (action === "approve") {
    const now = new Date().toISOString();
    await supabase.from("projects").update({
      approval_status: "approved",
      approved_at: now,
      approval_token: null,
    }).eq("id", project.id);

    // Notify Release Manager (Belle)
    await sendEmail(resendKey, RELEASE_MANAGER_EMAIL,
      `${project.name} approved — ready for Grove release review`,
      `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#fafaf8;padding:32px">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e2da;overflow:hidden">
        <div style="background:#1f6e1f;padding:20px 24px"><div style="color:#fff;font-size:18px;font-weight:700">Ready for Release Review</div></div>
        <div style="padding:24px">
          <p style="color:#3a372e;font-size:15px;line-height:1.6;margin-bottom:12px"><strong>${project.name}</strong> has received sign-off from <strong>${project.approver_name}</strong> and is ready for your release review on Grove.</p>
          <a href="${groveUrl}" style="display:inline-block;margin-top:8px;padding:10px 22px;background:#2d8c2d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Review on Grove</a>
        </div>
      </div>
      </body></html>`,
      project.builder_email || undefined
    );

    return new Response(html("Approved!",
      `<div class="icon">✓</div>
       <p>You've approved <strong>${project.name}</strong>.</p>
       <p><strong>${project.builder || "The project owner"}</strong> can now advance this project on Grove. The Release Manager has been notified.</p>
       <p class="sub">You can close this tab.</p>`
    ), { headers: { "Content-Type": "text/html" } });
  }

  // ── Show reject form ───────────────────────────────────────────────────────
  if (action === "reject") {
    return new Response(html("Reject Request",
      `<p>You're rejecting the approval request for <strong>${project.name}</strong>.</p>
       <p>Please provide a reason so <strong>${project.builder || "the project owner"}</strong> knows what to fix:</p>
       <form id="f">
         <label for="reason">Rejection reason</label>
         <textarea id="reason" name="reason" placeholder="e.g. The project needs a data privacy review before proceeding…" required></textarea>
         <button type="submit">Submit rejection</button>
       </form>
       <script>
         document.getElementById('f').onsubmit = async (e) => {
           e.preventDefault();
           const reason = document.getElementById('reason').value.trim();
           if (!reason) return;
           const btn = e.target.querySelector('button');
           btn.textContent = 'Submitting…'; btn.disabled = true;
           const res = await fetch(window.location.pathname, {
             method: 'POST',
             headers: {'Content-Type':'application/json'},
             body: JSON.stringify({ token: '${token}', reason })
           });
           document.body.innerHTML = await res.text();
         };
       </script>`
    ), { headers: { "Content-Type": "text/html" } });
  }

  return new Response(html("Unknown action", `<p>Invalid link. Please check the email you received.</p>`), {
    headers: { "Content-Type": "text/html" },
  });
});
