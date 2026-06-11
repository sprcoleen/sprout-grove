/**
 * src/guide/ProcessFlowGuide.jsx
 * Stage Gate & Review Queue — Process Flow page for the Grove Guide section.
 * Receives design-system tokens (C, FF, DS) as props from GuideView in App.jsx.
 */
import React from "react";

export default function ProcessFlowGuide({ C, FF, DS }) {
  const Section = ({ title, icon, children, id }) => (
    <div id={id} style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
        <div style={{ fontFamily: FF, fontSize: 20, fontWeight: 800, color: C.mushroom900 }}>{title}</div>
      </div>
      {children}
    </div>
  );

  const Card = ({ children, bg = C.white, border = C.mushroom200, style = {} }) => (
    <div style={{ background: bg, border: "1px solid " + border, borderRadius: DS.radius.xl, padding: "20px 24px", boxShadow: DS.shadow.sm, ...style }}>
      {children}
    </div>
  );

  const Badge = ({ label, color, bg, border }) => (
    <span style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color, background: bg, border: "1px solid " + border, borderRadius: DS.radius.full, padding: "2px 10px", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );

  const TierBadge = ({ tier }) => {
    const map = {
      1: { label: "Tier 1 — Low Risk",    color: C.mushroom700, bg: C.mushroom50,   border: C.mushroom300 },
      2: { label: "Tier 2 — Medium Risk", color: C.blueberry500, bg: C.blueberry100, border: C.blueberry400 },
      3: { label: "Tier 3 — High Risk",   color: C.carrot500,   bg: C.carrot100,    border: C.carrot500 },
    };
    const t = map[tier];
    return <Badge label={t.label} color={t.color} bg={t.bg} border={t.border} />;
  };

  const StatusTag = ({ label, color, bg }) => (
    <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color, background: bg, borderRadius: DS.radius.full, padding: "2px 8px" }}>
      {label}
    </span>
  );

  // ── Phase steps data ──────────────────────────────────────────────────────────
  const phases = [
    {
      num: "1", color: C.kangkong500, bg: C.kangkong50, border: C.kangkong200,
      title: "Project Registration",
      body: "Any Sprout employee logs into Grove, clicks Add Plant, fills in the project name, description, problem space, data sources, and tools used. The system auto-sets the country from your email domain (@sprout.ph = PH, @sproutsolutions.io = TH) — this is locked forever.",
      tag: { label: "ALL TIERS", color: C.kangkong600, bg: C.kangkong50 },
    },
    {
      num: "2", color: "#805ad5", bg: "#faf5ff", border: "#c4b5fd",
      title: "Security & Data Classification",
      body: "Go to the Technical tab and answer all 5 security questions. This step is mandatory — a project at the Sprout stage is blocked from advancing to Bloom until all 5 questions are answered and a tier is assigned.",
      tag: { label: "MANDATORY GATE", color: C.carrot500, bg: C.carrot100 },
    },
    {
      num: "3", color: C.blueberry500, bg: C.blueberry100, border: C.blueberry400,
      title: "Tier Auto-Assignment",
      body: "Grove computes your tier automatically based on your answers. Tier 1 = low risk, Tier 2 = medium risk (needs deployment), Tier 3 = high risk (external APIs, external AI, or auth + sensitive data). Unclassified projects are blocked from all stage changes.",
      tag: { label: "AUTO-COMPUTED", color: C.blueberry500, bg: C.blueberry100 },
    },
    {
      num: "4", color: C.mango600, bg: C.mango50, border: C.mango300,
      title: "Stage Advancement (with Gate Checks)",
      body: "As you build, move your project through stages using the stage buttons on the project page. Gates are enforced at Sprout → Bloom and Bloom → Thriving. Tier 1 moves freely once classified; Tier 2 and 3 need RM approval. A blocked move shows a purple notification at the bottom of the screen.",
      tag: { label: "GATES ENFORCED", color: C.mango600, bg: C.mango50 },
    },
    {
      num: "5", color: C.carrot500, bg: C.carrot100, border: C.carrot500,
      title: "Release Manager Review",
      body: "For Tier 2 and Tier 3 projects, click Submit for Release Review before advancing past a gate. The Release Manager reviews your classification, data sources, and tier, then approves, rejects, or requests changes. Tier 3 projects also get a Jira DevOps ticket auto-created.",
      tag: { label: "TIER 2 & 3 ONLY", color: C.carrot500, bg: C.carrot100 },
    },
    {
      num: "6", color: C.kangkong600, bg: C.kangkong50, border: C.kangkong200,
      title: "Go Live (Thriving)",
      body: "Once all gates are cleared, your project reaches Thriving — it's live, reviewed, and part of Sprout's AI portfolio. Tier 3 projects must also complete the policy compliance checklist before this final step.",
      tag: { label: "PRODUCTION", color: C.kangkong600, bg: C.kangkong50 },
    },
  ];

  // ── Security questions ────────────────────────────────────────────────────────
  const securityQs = [
    { q: "Does this tool require user login / authentication?",        risk: "Access control layer needed",                                         escalate: false },
    { q: "Does it access external APIs or third-party services?",      risk: "Data egress risk",                                                    escalate: true },
    { q: "Does it handle or display sensitive employee/client data?",  risk: "PDPA / Data Privacy Act compliance required",                         escalate: false },
    { q: "Does it send data to an external AI service?",               risk: "Data-sharing policy review required",                                 escalate: true },
    { q: "Does it store user inputs in a database?",                   risk: "Data retention policy applies",                                       escalate: false },
  ];

  // ── Stage gate rules — reflects actual DB stage names ────────────────────────
  const gateRows = [
    {
      from: "🌿 Sprout", to: "🌸 Bloom",
      t1: "✅ Security classification complete + tier assigned",
      t2: "✅ Classification + RM acknowledgment required",
      t3: "✅ Classification + full RM sign-off required",
    },
    {
      from: "🌸 Bloom", to: "🌳 Thriving",
      t1: "✅ No additional gate",
      t2: "🔍 RM final approval required",
      t3: "🔐 RM final approval required",
    },
  ];

  // ── Compliance checklist ──────────────────────────────────────────────────────
  const checklist = [
    "Data Minimization — only collecting what is strictly necessary for the tool's purpose",
    "Access Control — access is restricted to authorized users only",
    "No hardcoded credentials or API keys in source code",
    "No PII stored in application logs",
    "Compliant with PH Data Privacy Act and / or TH PDPA",
    "Reviewed by at least one person who is not the builder",
    "DevOps infrastructure confirmed — GitHub repo, hosting, database",
    "Release Manager has reviewed and signed off",
  ];

  // ── Quick reference ───────────────────────────────────────────────────────────
  const quickRef = [
    { scenario: "New tool, Tier 1",                        builder: "Register → Classify → Advance freely",                                          rm: "No action required" },
    { scenario: "New tool, Tier 2",                        builder: "Register → Classify → Submit for review → Wait → Advance",                      rm: "Acknowledge at Growing→Blooming and Blooming→Thriving" },
    { scenario: "New tool, Tier 3",                        builder: "Register → Classify → Submit for review → DevOps ticket → Checklist → Advance", rm: "Full sign-off at every gate + Jira ticket tracking" },
    { scenario: "Existing tool not yet in Grove",          builder: "Register immediately at the correct current stage",                              rm: "Review retroactively if Tier 2 or 3" },
    { scenario: "Tier escalation (data scope increased)",  builder: "Update classification → Re-submit for review",                                  rm: "Re-review triggered automatically" },
  ];

  // ── Monitoring schedule ───────────────────────────────────────────────────────
  const monitoring = [
    { activity: "Review pending projects in the queue",              frequency: "Weekly",        owner: "Release Manager" },
    { activity: "Audit unclassified projects (no tier assigned)",    frequency: "Bi-weekly",     owner: "Release Manager" },
    { activity: "Re-review all Thriving projects",                   frequency: "Every 6 months",owner: "Release Manager" },
    { activity: "Check for ghost projects built outside Grove",      frequency: "Monthly",       owner: "Release Manager + Team Leads" },
    { activity: "Review Tier 3 projects accessing internal DBs",     frequency: "Quarterly",     owner: "Release Manager + IT Security" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.mushroom50, fontFamily: FF }}>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg,#3b2d6e 0%,#805ad5 100%)", padding: "40px 48px 36px", color: C.white }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 32 }}>🛡️</span>
          <div>
            <div style={{ fontFamily: FF, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>Stage Gate & Review Process</div>
            <div style={{ fontFamily: FF, fontSize: 13, opacity: 0.8, marginTop: 2 }}>Grove Governance · Release Managers: Belle Asis, Diane Litan</div>
          </div>
        </div>
        <div style={{ fontFamily: FF, fontSize: 14, opacity: 0.9, maxWidth: 680, lineHeight: 1.7 }}>
          Every AI or internal tool built at Sprout must pass through this process before going live.
          It ensures all projects are classified, reviewed, and safe — regardless of whether they were built by Product Engineering.
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, background: "rgba(72,187,120,0.2)", border: "1px solid rgba(72,187,120,0.5)", borderRadius: DS.radius.full, padding: "4px 12px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#68d391", display: "inline-block" }} />
          <span style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: "#c6f6d5" }}>Live in Grove — June 2026</span>
        </div>
        {/* Quick jump links */}
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          {["Process Flow", "Security Questions", "Stage Gates", "Review Queue", "Compliance Checklist", "Quick Reference"].map(label => (
            <a key={label} href={"#" + label.toLowerCase().replace(/ /g, "-")}
              style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, color: C.white, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: DS.radius.full, padding: "4px 12px", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      <div style={{ padding: "36px 48px", maxWidth: 960, margin: "0 auto" }}>

        {/* ── Why this exists ── */}
        <div style={{ marginBottom: 36, padding: "16px 20px", background: C.mango50, border: "1px solid " + C.mango300, borderRadius: DS.radius.xl }}>
          <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: C.mango700, marginBottom: 6 }}>⚠️ Why this matters</div>
          <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom700, lineHeight: 1.7 }}>
            Sprout employees can build and ship internal tools using Claude, AI platforms, and other services — many of which can access internal databases, handle employee PII, or send data to external AI providers.
            Without a governance process, these tools may violate the PH Data Privacy Act, TH PDPA, or Sprout's internal data policies.
            This process is the safeguard.
          </div>
        </div>

        {/* ── Roles ── */}
        <Section title="Roles in this Process" icon="👥">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {[
              { icon: "🌱", role: "Builder", color: C.kangkong600, bg: C.kangkong50, border: C.kangkong200,
                who: "Any Sprout employee",
                does: ["Registers the project in Grove", "Completes security classification", "Submits for release review", "Advances stages after approval"] },
              { icon: "🔍", role: "Release Manager", color: "#805ad5", bg: "#faf5ff", border: "#c4b5fd",
                who: "Belle Asis, Diane Litan",
                does: ["Reviews Tier 2 & 3 projects", "Approves or rejects stage advancement", "Monitors the governance dashboard", "Manages the review queue"] },
              { icon: "🌿", role: "Admin (Gardener)", color: C.blueberry500, bg: C.blueberry100, border: C.blueberry400,
                who: "Same as Release Manager",
                does: ["All Release Manager actions", "Edit any project or seed", "Skip stages in any direction", "Delete records and moderate Grove"] },
            ].map(r => (
              <Card key={r.role} bg={r.bg} border={r.border}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 800, color: r.color }}>{r.role}</div>
                    <div style={{ fontFamily: FF, fontSize: 11, color: C.mushroom500 }}>{r.who}</div>
                  </div>
                </div>
                {r.does.map(d => (
                  <div key={d} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                    <span style={{ color: r.color, fontWeight: 700, flexShrink: 0, fontSize: 11 }}>✓</span>
                    <span style={{ fontFamily: FF, fontSize: 11, color: C.mushroom700 }}>{d}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </Section>

        {/* ── Process Flow ── */}
        <Section id="process-flow" title="End-to-End Process Flow" icon="🗺️">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {phases.map((p, i) => (
              <div key={p.num} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Step number */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.bg, border: "2px solid " + p.border, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF, fontSize: 15, fontWeight: 800, color: p.color, flexShrink: 0, marginTop: 2 }}>
                  {p.num}
                </div>
                {/* Content */}
                <div style={{ flex: 1, background: p.bg, border: "1px solid " + p.border, borderRadius: DS.radius.lg, padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 700, color: C.mushroom900 }}>{p.title}</div>
                    <StatusTag label={p.tag.label} color={p.tag.color} bg={p.tag.bg} />
                  </div>
                  <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom600, lineHeight: 1.65 }}>{p.body}</div>
                </div>
                {/* Connector arrow */}
                {i < phases.length - 1 && (
                  <div style={{ position: "absolute", marginLeft: 16, marginTop: 50, fontSize: 18, color: C.mushroom300, pointerEvents: "none" }} />
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Security Questions ── */}
        <Section id="security-questions" title="Security & Data Classification Questions" icon="🔐">
          <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom600, lineHeight: 1.6, marginBottom: 16 }}>
            These 5 questions must be answered in the <strong>Technical tab</strong> of every project before it can advance past Sprout.
            Answering YES to Q2 or Q4 automatically escalates the project to <strong>Tier 3</strong>.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {securityQs.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 16px", background: C.white, border: "1px solid " + C.mushroom200, borderRadius: DS.radius.lg, boxShadow: DS.shadow.sm }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#805ad5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF, fontSize: 11, fontWeight: 800, color: C.white, flexShrink: 0 }}>
                  Q{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: C.mushroom900, marginBottom: 3 }}>{item.q}</div>
                  <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom500 }}>If YES: {item.risk}</div>
                </div>
                {item.escalate && (
                  <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, color: C.carrot500, background: C.carrot100, border: "1px solid " + C.carrot500, borderRadius: DS.radius.full, padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                    → Tier 3
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "12px 16px", background: C.mango100, border: "1px solid " + C.mango500, borderRadius: DS.radius.lg }}>
            <strong style={{ fontFamily: FF, fontSize: 12, color: C.mango700 }}>⚠ Auto-escalation rule: </strong>
            <span style={{ fontFamily: FF, fontSize: 12, color: C.mango700 }}>
              If a project requires authentication AND handles sensitive data, it is automatically classified as <strong>Tier 3</strong> regardless of other answers. Coordinate with Belle or Coleen before shipping.
            </span>
          </div>
        </Section>

        {/* ── Tier Assignment ── */}
        <Section title="Tier Assignment" icon="🏷️">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { num: 1, label: "Low Risk — Markup / Simple Logic", color: C.mushroom700, bg: C.mushroom50, border: C.mushroom300, accent: C.mushroom400,
                criteria: "UI-only tool, no deployment needed, no sensitive data, no external integrations",
                review: "Self-declaration only — no RM review required",
                examples: "ChatGPT prompt library, email templates, simple data scripts" },
              { num: 2, label: "Medium Risk — Internal App", color: C.blueberry500, bg: C.blueberry100, border: C.blueberry400, accent: C.blueberry500,
                criteria: "Requires deployment or infrastructure, but no high-risk data exposure",
                review: "Release Manager acknowledgment required before Blooming and Thriving",
                examples: "HR dashboards, internal chatbots, payroll tools, team utilities" },
              { num: 3, label: "High Risk — External App / Sensitive Data", color: C.carrot500, bg: C.carrot100, border: C.carrot500, accent: C.carrot500,
                criteria: "Accesses external APIs OR sends data to external AI OR (requires auth AND handles sensitive data)",
                review: "Full RM sign-off + Jira DevOps ticket + policy compliance checklist before Thriving",
                examples: "Client portals, public-facing AI, partner integrations, projects with auth + PII" },
            ].map(t => (
              <div key={t.num} style={{ position: "relative", background: t.bg, border: "1px solid " + t.border, borderRadius: DS.radius.xl, padding: "18px 20px 18px 26px", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: t.accent, borderRadius: DS.radius.xl + " 0 0 " + DS.radius.xl }} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: FF, fontSize: 14, fontWeight: 800, color: t.color, background: C.white, border: "2px solid " + t.border, borderRadius: DS.radius.full, padding: "2px 12px" }}>Tier {t.num}</span>
                      <span style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</span>
                    </div>
                    <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom700, marginBottom: 6, lineHeight: 1.5 }}><strong>Criteria:</strong> {t.criteria}</div>
                    <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom500 }}><strong>Examples:</strong> {t.examples}</div>
                  </div>
                  <div style={{ minWidth: 220, padding: "10px 14px", background: C.white, border: "1px solid " + t.border, borderRadius: DS.radius.lg }}>
                    <div style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: t.color, marginBottom: 4 }}>Review Required</div>
                    <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom700, lineHeight: 1.5 }}>{t.review}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Stage Gates ── */}
        <Section id="stage-gates" title="Stage Gate Rules" icon="🚦">
          <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom600, lineHeight: 1.6, marginBottom: 16 }}>
            Two gate checkpoints are enforced by Grove: <strong>Sprout → Bloom</strong> (going live) and <strong>Bloom → Thriving</strong> (production-ready). Earlier transitions (Seedling → Nursery → Sprout) follow the separate nursery prototype review process.
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FF, fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.mushroom100 }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200, whiteSpace: "nowrap" }}>Transition</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}><TierBadge tier={1} /></th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}><TierBadge tier={2} /></th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}><TierBadge tier={3} /></th>
                </tr>
              </thead>
              <tbody>
                {gateRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.mushroom50 }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: C.mushroom800, borderBottom: "1px solid " + C.mushroom100, whiteSpace: "nowrap" }}>
                      {row.from} → {row.to}
                    </td>
                    <td style={{ padding: "12px 14px", color: C.mushroom600, borderBottom: "1px solid " + C.mushroom100 }}>{row.t1}</td>
                    <td style={{ padding: "12px 14px", color: C.mushroom600, borderBottom: "1px solid " + C.mushroom100 }}>{row.t2}</td>
                    <td style={{ padding: "12px 14px", color: C.mushroom600, borderBottom: "1px solid " + C.mushroom100 }}>{row.t3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: C.mushroom100, borderRadius: DS.radius.md, fontFamily: FF, fontSize: 12, color: C.mushroom600 }}>
            💡 Stage gates are enforced both in the Grove UI <strong>and</strong> at the database level (Supabase RLS) — bypassing the UI still blocks the change at the database.
          </div>
        </Section>

        {/* ── Review Queue ── */}
        <Section id="review-queue" title="Review Queue Flow (Tier 2 & Tier 3)" icon="🔍">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Builder column */}
            <Card bg={C.kangkong50} border={C.kangkong200}>
              <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 800, color: C.kangkong600, marginBottom: 14 }}>🌱 Builder Steps</div>
              {[
                "Open your project page — the Release Gate Banner appears automatically on Sprout or Bloom stage projects (Tier 2 & 3)",
                "Click Submit for Release Review on the banner",
                "System sets release_review_status = pending",
                "For Tier 3: Grove auto-creates a Jira ticket (label: Src-Grove) assigned to the Release Manager",
                "Wait for the review outcome — the banner updates in real time",
                "If Rejected: read the comment, fix the issue, re-submit via the banner",
                "If Changes Requested: update the record as instructed, re-submit",
                "If Approved: stage advancement button is now unlocked — proceed",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.kangkong500, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF, fontSize: 10, fontWeight: 800, color: C.white, flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom700, lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
            </Card>

            {/* Release Manager column */}
            <Card bg="#faf5ff" border="#c4b5fd">
              <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 800, color: "#805ad5", marginBottom: 14 }}>🔍 Release Manager Steps</div>
              {[
                "Open Grove and go to the Overview view — the Garden Health section (admin-only) shows Pending Release Reviews",
                "Click any pending project in the queue to open its detail panel",
                "Review: security classification, data sources, tier, description, and Technical tab answers",
                "Take one of three actions:",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#805ad5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF, fontSize: 10, fontWeight: 800, color: C.white, flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom700, lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
              {/* Decision options */}
              {[
                { icon: "✅", label: "Approve", desc: "Add optional note — unlocks stage advancement", color: C.kangkong600, bg: C.kangkong50, border: C.kangkong200 },
                { icon: "❌", label: "Reject", desc: "Required comment — blocks advancement until resubmitted", color: C.tomato600, bg: C.tomato100, border: C.tomato500 },
                { icon: "🔁", label: "Request Changes", desc: "Sends back to builder with specific items to fix", color: C.mango600, bg: C.mango50, border: C.mango300 },
              ].map(opt => (
                <div key={opt.label} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", background: opt.bg, border: "1px solid " + opt.border, borderRadius: DS.radius.md, marginBottom: 6, marginLeft: 30 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontFamily: FF, fontSize: 12, fontWeight: 700, color: opt.color }}>{opt.label}</div>
                    <div style={{ fontFamily: FF, fontSize: 11, color: C.mushroom500 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: "8px 10px", background: C.mushroom50, borderRadius: DS.radius.md }}>
                <div style={{ fontFamily: FF, fontSize: 11, color: C.mushroom500 }}>System records: <code>release_reviewed_by</code>, <code>release_reviewed_at</code>, and <code>release_review_comment</code> on the project. Approval resets when the project advances to the next stage.</div>
              </div>
            </Card>
          </div>
        </Section>

        {/* ── Compliance Checklist ── */}
        <Section id="compliance-checklist" title="Compliance Checklist (Tier 3 — Required Before Thriving)" icon="📋">
          <Card bg={C.carrot100} border={C.carrot500}>
            <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom700, lineHeight: 1.6, marginBottom: 16 }}>
              All 8 items below must be confirmed by the builder and verified by the Release Manager before a Tier 3 project can move to <strong>Thriving</strong>.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {checklist.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", background: C.white, border: "1px solid " + C.carrot500, borderRadius: DS.radius.md }}>
                  <div style={{ width: 20, height: 20, borderRadius: DS.radius.sm, border: "2px solid " + C.carrot500, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom800, lineHeight: 1.5 }}>{item}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── Monitoring ── */}
        <Section title="Ongoing Monitoring" icon="📊">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FF, fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.mushroom100 }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}>Activity</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}>Frequency</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {monitoring.map((m, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.mushroom50 }}>
                    <td style={{ padding: "10px 14px", color: C.mushroom700, borderBottom: "1px solid " + C.mushroom100 }}>{m.activity}</td>
                    <td style={{ padding: "10px 14px", color: C.mushroom600, borderBottom: "1px solid " + C.mushroom100, whiteSpace: "nowrap" }}>{m.frequency}</td>
                    <td style={{ padding: "10px 14px", color: C.mushroom600, borderBottom: "1px solid " + C.mushroom100 }}>{m.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, padding: "12px 16px", background: C.mango50, border: "1px solid " + C.mango300, borderRadius: DS.radius.lg, fontFamily: FF, fontSize: 12, color: C.mango700 }}>
            <strong>⚠️ Ghost Project Policy:</strong> Any internal tool accessed by more than 3 people OR that connects to a company system MUST be registered in Grove — regardless of how it was built. Team leads are responsible for ensuring their teams comply.
          </div>
        </Section>

        {/* ── Quick Reference ── */}
        <Section id="quick-reference" title="Quick Reference" icon="⚡">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FF, fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.mushroom100 }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}>Scenario</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}>Builder Action</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.mushroom700, borderBottom: "2px solid " + C.mushroom200 }}>Release Manager</th>
                </tr>
              </thead>
              <tbody>
                {quickRef.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.mushroom50 }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: C.mushroom800, borderBottom: "1px solid " + C.mushroom100 }}>{r.scenario}</td>
                    <td style={{ padding: "10px 14px", color: C.mushroom600, borderBottom: "1px solid " + C.mushroom100 }}>{r.builder}</td>
                    <td style={{ padding: "10px 14px", color: C.mushroom600, borderBottom: "1px solid " + C.mushroom100 }}>{r.rm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", padding: "20px 0 40px", fontFamily: FF, fontSize: 12, color: C.mushroom400 }}>
          Grove Stage Gate & Review Process · Last updated June 2026 · Questions? Reach out to Belle Asis or Diane Litan.
        </div>
      </div>
    </div>
  );
}
