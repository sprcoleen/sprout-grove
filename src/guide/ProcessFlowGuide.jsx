/**
 * src/guide/ProcessFlowGuide.jsx
 * Grove Developer Guide — single-page layout with left sidebar nav.
 * Receives design-system tokens (C, FF, DS) as props from GuideView in App.jsx.
 */
import React, { useRef, useState, useEffect, useCallback } from "react";

export default function ProcessFlowGuide({ C, FF, DS }) {
  const PURPLE    = "#805ad5";
  const PURPLE_BG = "#faf5ff";
  const PURPLE_BD = "#c4b5fd";
  const TEAL      = "#2c7a7b";
  const TEAL_BG   = "#e6fffa";
  const TEAL_BD   = "#38b2ac";
  const BLUE_TEXT = "#2c5282";
  const OG_TEXT   = "#7b341e";

  const [activeSection, setActiveSection] = useState("overview");
  const scrollContainerRef = useRef(null);

  // ── Section refs for smooth scroll ────────────────────────────────────────
  const refs = {
    overview:  useRef(null),
    start:     useRef(null),
    classify:  useRef(null),
    standards: useRef(null),
    register:  useRef(null),
    golive:    useRef(null),
    tips:      useRef(null),
  };

  const NAV_KEYS = ["overview","start","classify","standards","register","golive","tips"];

  const scrollTo = (key) => {
    const el = refs[key]?.current;
    const container = scrollContainerRef.current;
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offset = elRect.top - containerRect.top + container.scrollTop - 24;
    container.scrollTo({ top: offset, behavior: "smooth" });
  };

  const onScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop + 80;
    let current = "overview";
    for (const key of NAV_KEYS) {
      const el = refs[key]?.current;
      if (el && el.offsetTop - container.offsetTop <= scrollTop) current = key;
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const NAV = [
    { key: "overview",  label: "Overview",         num: "1" },
    { key: "start",     label: "Getting started",  num: "2" },
    { key: "classify",  label: "Classify",         num: "3" },
    { key: "standards", label: "Dev standards",    num: "4" },
    { key: "register",  label: "Register",         num: "5" },
    { key: "golive",    label: "Go-live & Review", num: "6" },
    { key: "tips",      label: "Tips & Gotchas",   num: "7" },
  ];

  // ── Shared primitives ──────────────────────────────────────────────────────

  const Pill = ({ label, color, bg, border }) => (
    <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, padding: "2px 9px",
      borderRadius: DS.radius.full, border: "1px solid " + border, background: bg, color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );

  const Alert = ({ title, body, color, bg, border }) => (
    <div style={{ background: bg, border: "0.5px solid " + border, borderRadius: DS.radius.md,
      padding: "10px 14px", marginBottom: 10, fontSize: 12, lineHeight: 1.55, color, fontFamily: FF }}>
      {title && <div style={{ fontWeight: 700, marginBottom: 3 }}>{title}</div>}
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );

  const SectionLabel = ({ children, pill }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      {pill}
      <span style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.07em", color: C.mushroom400 }}>{children}</span>
      <div style={{ flex: 1, height: 0.5, background: C.mushroom200 }} />
    </div>
  );

  const SecH = ({ num, children, sectionRef }) => (
    <div ref={sectionRef} style={{ display: "flex", alignItems: "center", gap: 10,
      marginBottom: 18, paddingTop: 4 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.mushroom900,
        color: C.white, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FF, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{num}</div>
      <div style={{ fontFamily: FF, fontSize: 19, fontWeight: 800, color: C.mushroom900 }}>{children}</div>
    </div>
  );

  const SubH = ({ children }) => (
    <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 700, color: C.mushroom900,
      marginBottom: 10, marginTop: 20 }}>{children}</div>
  );

  const Divider = () => (
    <div style={{ height: 0.5, background: C.mushroom200, margin: "32px 0" }} />
  );

  const Card = ({ children, bg = C.white, border = C.mushroom200, style = {} }) => (
    <div style={{ background: bg, border: "1px solid " + border, borderRadius: DS.radius.xl,
      padding: "18px 20px", boxShadow: DS.shadow.sm, ...style }}>{children}</div>
  );

  const ReviewCard = ({ initials, name, role, avatarBg, avatarColor, bullets, tierPills }) => (
    <div style={{ background: C.white, border: "1px solid " + C.mushroom200,
      borderRadius: DS.radius.lg, padding: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarBg,
        color: avatarColor, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{initials}</div>
      <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: C.mushroom900, marginBottom: 2 }}>{name}</div>
      <div style={{ fontFamily: FF, fontSize: 11, color: C.mushroom400, fontStyle: "italic", marginBottom: 8 }}>{role}</div>
      {tierPills && <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>{tierPills}</div>}
      {bullets.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start", marginBottom: 3 }}>
          <span style={{ color: C.mushroom400, flexShrink: 0, fontSize: 11 }}>→</span>
          <span style={{ fontFamily: FF, fontSize: 11, color: C.mushroom600, lineHeight: 1.4 }}>{b}</span>
        </div>
      ))}
    </div>
  );

  const Step = ({ num, numColor, numBg, numBd, title, body }) => (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: numBg,
        border: "2px solid " + numBd, display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: FF, fontSize: 13, fontWeight: 800,
        color: numColor, flexShrink: 0, marginTop: 2 }}>{num}</div>
      <div style={{ flex: 1, background: numBg, border: "1px solid " + numBd,
        borderRadius: DS.radius.lg, padding: "13px 16px" }}>
        <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: C.mushroom900, marginBottom: 4 }}>{title}</div>
        <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom600, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </div>
  );

  const CheckItem = ({ label, sub, border = C.mushroom200 }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px",
      border: "1px solid " + border, borderRadius: DS.radius.md, background: C.white, marginBottom: 7 }}>
      <div style={{ width: 16, height: 16, border: "1.5px solid " + C.mushroom300,
        borderRadius: 4, flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom800, lineHeight: 1.5 }}>{label}</div>
        {sub && <div style={{ fontFamily: FF, fontSize: 11, color: C.mushroom500, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  const TierBlock = ({ tier, label, color, bg, border, items }) => (
    <div style={{ background: bg, border: "1px solid " + border, borderRadius: DS.radius.lg, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Pill label={"Tier " + tier} color={color} bg={C.white} border={border} />
        <span style={{ fontFamily: FF, fontSize: 12, fontWeight: 600, color }}>{label}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 4 }}>
          <span style={{ color, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>·</span>
          <span style={{ fontFamily: FF, fontSize: 12, color: C.mushroom700 }}>{item}</span>
        </div>
      ))}
    </div>
  );

  const StdTable = ({ headers, rows }) => (
    <div style={{ overflowX: "auto", marginBottom: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FF, fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.mushroom100 }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700,
                color: C.mushroom600, borderBottom: "2px solid " + C.mushroom200,
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.mushroom50 }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "9px 12px", color: C.mushroom700,
                  borderBottom: "0.5px solid " + C.mushroom100 }}
                  dangerouslySetInnerHTML={{ __html: cell }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Bl = ({ items, color = C.mushroom600 }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color: C.mushroom400, fontSize: 16, lineHeight: 0.9, flexShrink: 0 }}>·</span>
          <span style={{ fontFamily: FF, fontSize: 12, color, lineHeight: 1.4 }}>{item}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }}>

      {/* ── Left sidebar nav ────────────────────────────────────────────────── */}
      <div style={{ width: 192, flexShrink: 0, background: C.white,
        borderRight: "1px solid " + C.mushroom200, display: "flex", flexDirection: "column",
        overflowY: "auto", padding: "24px 0 32px" }}>
        <div style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: C.mushroom400, padding: "0 20px", marginBottom: 12 }}>
          On this page
        </div>
        {NAV.map(item => {
          const isActive = activeSection === item.key;
          return (
            <button key={item.key} onClick={() => scrollTo(item.key)}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%",
                background: isActive ? C.kangkong50 : "none",
                border: "none", borderLeft: "3px solid " + (isActive ? C.kangkong500 : "transparent"),
                padding: "8px 20px 8px 17px", cursor: "pointer", textAlign: "left",
                transition: "all 0.15s" }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.mushroom50; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: isActive ? C.kangkong500 : C.mushroom200,
                color: isActive ? C.white : C.mushroom500,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, fontFamily: FF, transition: "all 0.15s" }}>
                {item.num}
              </div>
              <span style={{ fontFamily: FF, fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? C.kangkong700 : C.mushroom600, lineHeight: 1.3,
                transition: "all 0.15s" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Scrolling body ──────────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: "auto", background: C.mushroom50 }}>

        {/* ── Hero ── */}
        <div style={{ background: "linear-gradient(135deg," + C.kangkong700 + " 0%," + C.kangkong500 + " 100%)",
          padding: "36px 48px 32px", color: C.white }}>
          <div style={{ fontFamily: FF, fontSize: 11, fontWeight: 500, textTransform: "uppercase",
            letterSpacing: "1px", opacity: 0.75, marginBottom: 8 }}>Grove · Developer Guide</div>
          <div style={{ fontFamily: FF, fontSize: 24, fontWeight: 800, lineHeight: 1.15, marginBottom: 8 }}>
            Build it right, ship it safely
          </div>
          <div style={{ fontFamily: FF, fontSize: 14, opacity: 0.88, lineHeight: 1.65, maxWidth: 600, marginBottom: 18 }}>
            Everything you need to know before, during, and after building an AI or internal tool at Sprout — from first idea to go-live in Grove.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Philippines & Thailand", "2026", "All tiers"].map(tag => (
              <span key={tag} style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, padding: "3px 12px",
                borderRadius: DS.radius.full, background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.35)", color: C.white }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ padding: "40px 48px", maxWidth: 960, margin: "0 auto" }}>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1 — OVERVIEW
          ══════════════════════════════════════════════════════════════════ */}
          <SecH num="1" sectionRef={refs.overview}>Overview</SecH>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { title: "Capture ideas",  body: "Submit seed ideas to the Wishlist. Teammates upvote the ones they want built." },
              { title: "Track projects", body: "Document AI initiatives as they're being built — stage, tools used, who's building." },
              { title: "Stay safe",      body: "Classify by tier so DevOps, IS, and leadership know when to review before you ship." },
            ].map(card => (
              <Card key={card.title}>
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: C.mushroom900, marginBottom: 4 }}>{card.title}</div>
                <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom600, lineHeight: 1.65 }}>{card.body}</div>
              </Card>
            ))}
          </div>

          <SubH>Project Stages</SubH>
          <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom600, lineHeight: 1.6, marginBottom: 14 }}>
            Every project moves through four stages as it matures from an idea to a live product.
          </div>

          {/* Stage pipeline */}
          <div style={{ display: "flex", alignItems: "stretch", marginBottom: 12 }}>
            {[
              { label: "Sprout",   sub: "Early idea",     note: "Register your project and begin classifying.",
                bg: "#f0faf0", bd: "#aadcaa", dot: "#2d8c2d", text: "#1f6e1f", first: true },
              { label: "Growing",  sub: "In development", note: "Actively being built. IS/Execom approval required here.",
                bg: "#fefcbf", bd: "#d69e2e", dot: "#b7791f", text: "#744210" },
              { label: "Blooming", sub: "Live & used",     note: "Live and being used. Tier 2 & 3 need RM review to reach this.",
                bg: "#feebc8", bd: "#dd6b20", dot: "#c05621", text: "#7b341e" },
              { label: "Thriving", sub: "Fully deployed",  note: "Full Sprout portfolio product. Highest standard for Tier 3.",
                bg: "#ebf8ff", bd: "#63b3ed", dot: "#3182ce", text: "#2c5282", last: true },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <div style={{ flex: 1, background: s.bg, border: "1.5px solid " + s.bd, padding: "14px",
                  borderRadius: s.first ? DS.radius.lg + " 0 0 " + DS.radius.lg : s.last ? "0 " + DS.radius.lg + " " + DS.radius.lg + " 0" : 0,
                  display: "flex", flexDirection: "column" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, marginBottom: 6 }} />
                  <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontFamily: FF, fontSize: 10, color: s.dot, marginBottom: 8 }}>{s.sub}</div>
                  <div style={{ fontFamily: FF, fontSize: 11, color: s.text, opacity: 0.8, lineHeight: 1.5 }}>{s.note}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", padding: "0 4px",
                    background: C.mushroom100 }}>
                    <span style={{ color: C.mushroom400, fontSize: 16 }}>›</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={{ padding: "10px 14px", background: C.mushroom100, borderRadius: DS.radius.md,
            fontFamily: FF, fontSize: 12, color: C.mushroom600, marginBottom: 20 }}>
            Stage changes move <strong>one step at a time</strong> for builders.
            Tier 2 and 3 projects require a release review gate before Blooming and Thriving.
            Admins can skip stages in any direction.
          </div>

          <SubH>Quick path to go-live</SubH>
          <div style={{ background: C.kangkong50, border: "1px solid " + C.kangkong200,
            borderRadius: DS.radius.xl, padding: "16px 20px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {["Classify", "Register in Grove", "Build & fill Technical tab",
                "Secure IS/Execom approval", "Release review (Tier 2/3)", "Go live"].map((s, i, arr) => (
                <React.Fragment key={s}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.kangkong500,
                      color: C.white, fontSize: 10, fontWeight: 800, display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontFamily: FF, fontSize: 12, color: C.kangkong700 }}>{s}</span>
                  </div>
                  {i < arr.length - 1 && <span style={{ color: C.kangkong200, fontSize: 14 }}>›</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2 — GETTING STARTED
          ══════════════════════════════════════════════════════════════════ */}
          <SecH num="2" sectionRef={refs.start}>Getting Started</SecH>

          <Step num="1" numColor={C.kangkong500} numBg={C.kangkong50} numBd={C.kangkong200}
            title="Classify before you build"
            body="One question determines your tier: does the app have a backend? No backend = Tier 1, regardless of who uses it. Backend + internal only = Tier 2. Backend + external or mixed = Tier 3. Knowing your tier early sets your auth, hosting, and DB standards upfront." />
          <Step num="2" numColor={PURPLE} numBg={PURPLE_BG} numBd={PURPLE_BD}
            title="Register in Grove early"
            body="Add your project as soon as the idea is real. Log in at grove.sprout.solutions → click <strong>Add Plant</strong>. Fill in the name, description, problem space, tools, and data sources." />
          <Step num="3" numColor={C.blueberry500} numBg={C.blueberry100} numBd={C.blueberry400}
            title="Fill in the Technical tab"
            body="Answer the classification questions to lock in your tier. Then complete the per-tier checklist (hosting, auth, database, repo). Mandatory before any stage change." />
          <Step num="4" numColor={TEAL} numBg={TEAL_BG} numBd={TEAL_BD}
            title="Declare your approver & secure IS/Execom sign-off"
            body="Every project needs a named approver — your IS contact or an Execom member. Record the name and email in the Overview tab. Optional at Sprout — mandatory before advancing to Blooming." />
          <Step num="5" numColor={C.carrot500} numBg={C.carrot100} numBd={C.carrot500}
            title="Submit for release review (Tier 2 & 3)"
            body="When ready to go live, click <strong>Submit for Release Review</strong>. Belle Asis reviews your classification, data sources, and tech stack. Tier 3 gets a Jira DevOps ticket. Wait for approval before advancing." />
          <Step num="6" numColor={C.kangkong500} numBg={C.kangkong50} numBd={C.kangkong200}
            title="Move stages & go live"
            body="Advance one stage at a time — Sprout → Growing → Blooming → Thriving. Click the stage card on your project overview. Blooming = live. Thriving = full Sprout portfolio product." />

          <Divider />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3 — CLASSIFY
          ══════════════════════════════════════════════════════════════════ */}
          <SecH num="3" sectionRef={refs.classify}>Classify Your Project</SecH>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { title: "Does it have a backend?",
                body: "Any code running outside the browser — APIs, servers, data pipelines, scheduled jobs, databases. <strong>No backend = Tier 1, no matter who uses it.</strong>" },
              { title: "Who uses it? (backend projects only)",
                body: "Only relevant if the project has a backend. Internal = Sprout employees only → Tier 2. External or Both = clients, partners, public, or mixed → Tier 3." },
            ].map(card => (
              <Card key={card.title} bg={PURPLE_BG} border={PURPLE_BD}>
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: PURPLE, marginBottom: 6 }}>{card.title}</div>
                <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom600, lineHeight: 1.65 }}
                  dangerouslySetInnerHTML={{ __html: card.body }} />
              </Card>
            ))}
          </div>

          <SubH>Tier Matrix</SubH>
          <StdTable
            headers={["Backend?", "Users", "Label", "Tier"]}
            rows={[
              ["No", "Internal, External, or Both", "Static / Markup",
                `<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:9999px;border:1px solid #ccc9bc;background:#f2f1ed;color:#565244">Tier 1</span>`],
              ["Yes", "Internal only", "Internal App",
                `<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:9999px;border:1px solid #63b3ed;background:#ebf8ff;color:#2c5282">Tier 2</span>`],
              ["Yes", "External or Both", "External-Facing",
                `<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:9999px;border:1px solid #dd6b20;background:#feebc8;color:#7b341e">Tier 3</span>`],
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { tier: 1, label: "Static / Markup", color: C.mushroom700, bg: "#f2f1ed", bd: C.mushroom300,
                items: ["No backend — any users", "Prompt libraries, templates, static dashboards", "Hosted on Markup by you", "No infra migration needed"] },
              { tier: 2, label: "Internal App", color: C.blueberry500, bg: C.blueberry100, bd: C.blueberry400,
                items: ["Backend + internal users only", "HR/payroll tools, chatbots", "Sprout Vercel or Azure at go-live", "IS/Execom approval needed"] },
              { tier: 3, label: "External-Facing", color: C.carrot500, bg: C.carrot100, bd: C.carrot500,
                items: ["Backend + external or both users", "Client portals, partner tools", "Keycloak auth required", "Full DevOps + RM review"] },
            ].map(t => (
              <div key={t.tier} style={{ background: t.bg, border: "1px solid " + t.bd, borderRadius: DS.radius.lg, padding: "14px 16px" }}>
                <div style={{ fontFamily: FF, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: t.color, marginBottom: 3 }}>Tier {t.tier}</div>
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: t.color, marginBottom: 8 }}>{t.label}</div>
                <Bl items={t.items} color={t.color} />
              </div>
            ))}
          </div>

          <SubH>Security Questions (Technical tab)</SubH>
          <div style={{ fontFamily: FF, fontSize: 13, color: C.mushroom600, lineHeight: 1.6, marginBottom: 12 }}>
            Answer all 5 questions before any stage change. YES to Q2 or Q4 auto-escalates to Tier 3.
          </div>
          {[
            { q: "Does this tool require user login / authentication?",       sub: "If YES → access control layer needed", escalate: false },
            { q: "Does it access external APIs or third-party services?",     sub: "If YES → data egress risk · auto-escalates to Tier 3", escalate: true },
            { q: "Does it handle or display sensitive employee/client data?", sub: "If YES → PDPA / Data Privacy Act compliance required", escalate: false },
            { q: "Does it send data to an external AI service?",              sub: "If YES → data-sharing policy review required · auto-escalates to Tier 3", escalate: true },
            { q: "Does it store user inputs in a database?",                  sub: "If YES → data retention policy applies", escalate: false },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px",
              border: "1px solid " + (item.escalate ? C.carrot500 : C.mushroom200),
              borderRadius: DS.radius.md, background: C.white, marginBottom: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%",
                background: item.escalate ? C.carrot500 : PURPLE, color: C.white, fontSize: 10,
                fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0 }}>Q{i + 1}</div>
              <div>
                <div style={{ fontFamily: FF, fontSize: 12, fontWeight: 600, color: C.mushroom900, marginBottom: 2 }}>{item.q}</div>
                <div style={{ fontFamily: FF, fontSize: 11, color: item.escalate ? C.carrot500 : C.mushroom500,
                  fontWeight: item.escalate ? 600 : 400 }}>{item.sub}</div>
              </div>
            </div>
          ))}

          <Divider />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 4 — DEV STANDARDS
          ══════════════════════════════════════════════════════════════════ */}
          <SecH num="4" sectionRef={refs.standards}>Dev Standards</SecH>

          <SubH>Authentication</SubH>
          <Alert title="Tier 1 — no authentication required"
            body="No login or session management needed for static tools, regardless of who accesses them."
            color={C.kangkong700} bg={C.kangkong50} border={C.kangkong200} />
          <Alert title="Tier 2 — internal auth is sufficient"
            body="Sprout Google email is the standard for internal apps. No Keycloak required at this tier."
            color={BLUE_TEXT} bg={C.blueberry100} border={C.blueberry400} />
          <Alert title="Tier 3 — Keycloak is required"
            body="External-facing apps must use Keycloak. Coordinate with Coleen Bartido (DevOps) before setting up auth. Follow the existing Keycloak setup guide — escalate only after reading it."
            color={OG_TEXT} bg={C.carrot100} border={C.carrot500} />

          <SubH>Database</SubH>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <Card>
              <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: C.kangkong600, marginBottom: 8 }}>✓ Preferred</div>
              <Bl items={["Supabase — preferred for most app databases", "PostgreSQL / Azure SQL for complex needs",
                "Move DB to Sprout ownership at go-live (Tier 2/3)", "No credentials hardcoded in the repo"]} />
            </Card>
            <Card border={C.carrot500}>
              <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: C.carrot500, marginBottom: 8 }}>✗ Avoid in production</div>
              <Bl items={["Airtable — not suitable for a production database", "Google Sheets — fine for prototypes, not production",
                "Personal Supabase / Firebase accounts at go-live", "Secrets stored in plain text / committed to git"]} />
            </Card>
          </div>

          <SubH>Hosting</SubH>
          <Alert title="Tier 1 — Markup"
            body="Upload directly to Markup. No deployment infrastructure required. No DevOps ticket needed."
            color={C.kangkong700} bg={C.kangkong50} border={C.kangkong200} />
          <Alert title="Tier 2 & 3 — Personal repo is fine during development"
            body="You can develop and iterate in your own personal repository. However, <strong>before going live</strong>, all assets — repository, hosting, database, configs, and secrets — must be transferred to the <strong>Company Repository</strong> (Sprout Vercel or Sprout Azure). Raise a DevOps ticket for Coleen Bartido once IS/Execom approval is in place."
            color={BLUE_TEXT} bg={C.blueberry100} border={C.blueberry400} />
          <div style={{ background: C.white, border: "1px solid " + C.blueberry400, borderRadius: DS.radius.md,
            padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
            <span style={{ fontSize: 16, flexShrink: 0, color: C.mushroom400 }}>→</span>
            <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom700, lineHeight: 1.55 }}>
              <strong>Development</strong> — personal GitHub repo, personal Vercel, local DB: all fine.<br />
              <strong>Go-live (Blooming)</strong> — everything must move to Sprout-owned accounts. IS/Execom approval must come <em>before</em> the DevOps ticket.
            </div>
          </div>

          <SubH>Who to Route To</SubH>

          <SectionLabel pill={<Pill label="Tier 3" color={OG_TEXT} bg={C.carrot100} border={C.carrot500} />}>
            DevOps &amp; go-live support
          </SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <ReviewCard initials="BB" name="Blaise Brandon Solis Cosico" role="Python standards review"
              avatarBg="#EEEDFE" avatarColor="#534AB7"
              tierPills={[<Pill key="t3" label="Tier 3" color={OG_TEXT} bg={C.carrot100} border={C.carrot500} />]}
              bullets={["Python app review before deploy", "Run standard checklist first, then escalate", "IS/Execom approval must be secured first"]} />
            <ReviewCard initials="CB" name="Coleen Bartido" role="C# / .NET · DevOps & deployment"
              avatarBg="#E1F5EE" avatarColor="#0F6E56"
              tierPills={[<Pill key="t3" label="Tier 3" color={OG_TEXT} bg={C.carrot100} border={C.carrot500} />]}
              bullets={["C# / .NET app review", "Deployment & environment migration", "DevOps tickets — after IS/Execom approval only", "Grove site feedback and improvement requests"]} />
          </div>

          <SectionLabel pill={<Pill label="Tier 2" color={BLUE_TEXT} bg={C.blueberry100} border={C.blueberry400} />}>
            Internal product sign-off
          </SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <ReviewCard initials="RE" name="Raphael Enriquez" role="Internal product sign-off"
              avatarBg="#FAECE7" avatarColor="#993C1D"
              tierPills={[<Pill key="t2" label="Tier 2" color={BLUE_TEXT} bg={C.blueberry100} border={C.blueberry400} />]}
              bullets={["Internal product movement & go-live sign-off", "IS/Execom approval must be secured first"]} />
            <ReviewCard initials="RQ" name="Remedios Monica Quitasol" role="Internal product sign-off"
              avatarBg="#FAECE7" avatarColor="#993C1D"
              tierPills={[<Pill key="t2" label="Tier 2" color={BLUE_TEXT} bg={C.blueberry100} border={C.blueberry400} />]}
              bullets={["Internal product movement & go-live sign-off", "IS/Execom approval must be secured first"]} />
          </div>

          <SectionLabel pill={<Pill label="Release Manager" color={C.kangkong700} bg={C.kangkong50} border={C.kangkong200} />}>
            Grove oversight
          </SectionLabel>
          <div style={{ maxWidth: "calc(50% - 5px)" }}>
            <ReviewCard initials="BA" name="Belle Asis" role="Release Manager"
              avatarBg={C.kangkong100} avatarColor={C.kangkong700}
              tierPills={[<Pill key="rm" label="Release Manager" color={C.kangkong700} bg={C.kangkong50} border={C.kangkong200} />]}
              bullets={["Manages release process", "Grove site feedback and improvement requests"]} />
          </div>

          <SubH>Data Sensitivity</SubH>
          <StdTable
            headers={["Level", "Examples", "Action required"]}
            rows={[
              ["None", "Public content, anonymised summaries", "No special handling"],
              ["Internal (non-sensitive)", "Meeting notes, process docs", "Access control recommended"],
              ["Sensitive (PII, HR, payroll)", "Employee records, salary data", "PDPA / Data Privacy Act compliance"],
              ["Highly sensitive", "Health, financial, legal data", "DPO review + Legal sign-off required"],
            ]}
          />
          <Alert title="Sensitive data + external AI"
            body="If your project sends sensitive or PII data to an external AI model — a DPO/privacy review is required before launch. Coordinate with Belle Asis."
            color={C.mango600} bg={C.mango100} border={C.mango500} />

          <Divider />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 5 — REGISTER
          ══════════════════════════════════════════════════════════════════ */}
          <SecH num="5" sectionRef={refs.register}>Register in Grove</SecH>

          <Step num="1" numColor={C.kangkong500} numBg={C.kangkong50} numBd={C.kangkong200}
            title="Log in to Grove"
            body="Go to <strong>grove.sprout.solutions</strong>. Sign in with your Sprout Google account (<code>@sprout.ph</code> or <code>@sproutsolutions.io</code>). Your country is auto-set and cannot be changed." />
          <Step num="2" numColor={PURPLE} numBg={PURPLE_BG} numBd={PURPLE_BD}
            title={`Click "Add Plant"`}
            body="From the Garden view, click <strong>Add Plant</strong>. Fill in: project name, description, problem space, department, tools used, and data sources. Technical details can come later." />
          <Step num="3" numColor={C.blueberry500} numBg={C.blueberry100} numBd={C.blueberry400}
            title="Complete the Technical tab"
            body="Answer all 5 security questions — tier is computed automatically. Then fill the per-tier checklist that appears." />
          <Step num="4" numColor={TEAL} numBg={TEAL_BG} numBd={TEAL_BD}
            title="Declare your approver"
            body="In the <strong>Overview tab</strong>, find the <strong>Approver</strong> section. Enter the name and email of your IS contact or Execom member. Click <strong>Send Approval Request</strong>." />

          <SubH>Per-Tier Checklist Fields</SubH>
          <TierBlock tier={1} label="Static / Markup" color={C.mushroom700} bg="#f2f1ed" border={C.mushroom300}
            items={["Live URL (optional)", "Version control — repo URL if applicable"]} />
          <TierBlock tier={2} label="Internal App" color={C.blueberry500} bg={C.blueberry100} border={C.blueberry400}
            items={["Live URL", "Hosting platform", "Version control — repo URL if applicable", "Authentication — type if yes", "Database — platform + does it connect to Sprout DB?"]} />
          <TierBlock tier={3} label="External-Facing" color={C.carrot500} bg={C.carrot100} border={C.carrot500}
            items={["Live URL", "Hosting platform", "Version control — repo URL if applicable", "Authentication — Keycloak is required", "Database — platform + connects to Sprout DB?", "Data sensitivity level", "Does it send data to an external AI model?"]} />

          <Alert title="Existing tools not yet in Grove"
            body="If your tool is already live and used by more than 3 people, register it in Grove immediately at the correct current stage. Belle Asis will review retroactively if Tier 2 or 3."
            color={C.mango600} bg={C.mango100} border={C.mango500} />

          <Divider />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 6 — GO-LIVE & REVIEW
          ══════════════════════════════════════════════════════════════════ */}
          <SecH num="6" sectionRef={refs.golive}>Go-Live &amp; Review</SecH>

          <SubH>Stage Gates</SubH>
          <StdTable
            headers={["Transition", "Tier 1", "Tier 2", "Tier 3"]}
            rows={[
              ["<strong>Growing → Blooming</strong>", `<span style="color:#1f6e1f">Free — no RM review</span>`, "RM review required", "Full RM sign-off required"],
              ["<strong>Blooming → Thriving</strong>", `<span style="color:#1f6e1f">No additional gate</span>`, "RM final approval required", "RM approval + compliance checklist"],
            ]}
          />
          <Alert title="IS / Execom approval gate"
            body="Required before any ticket is raised for Blaise, Coleen, Raphael, or Remedios. Optional at Sprout — mandatory by Growing."
            color={TEAL} bg={TEAL_BG} border={TEAL_BD} />

          <SubH>Submitting for Release Review (Tier 2 &amp; 3)</SubH>
          <CheckItem label="Open your project page → find the Release Gate Banner" />
          <CheckItem label="Click 'Submit for Release Review'" sub="Status changes to pending — Belle Asis is notified" />
          <CheckItem label="For Tier 3: a Jira DevOps ticket is created automatically" />
          <CheckItem label="Wait for RM outcome — banner updates in real time" sub="Approved → stage button unlocked. Rejected → read comment, fix, resubmit." />

          <SubH>Tier 3 Compliance Checklist (required before Thriving)</SubH>
          {[
            "Data Minimization — only collecting what is strictly necessary",
            "Access Control — restricted to authorized users only",
            "No hardcoded credentials or API keys in source code",
            "No PII stored in application logs",
            "Compliant with PH Data Privacy Act and/or TH PDPA",
            "Reviewed by at least one person who is not the builder",
            "DevOps infrastructure confirmed — GitHub repo, hosting, database",
            "Release Manager (Belle Asis) has reviewed and signed off",
          ].map((item, i) => <CheckItem key={i} label={item} border={C.carrot500} />)}

          <SubH>Moving Assets to Sprout at Go-Live</SubH>
          <Alert title="Required for Tier 2 & 3 before Blooming"
            body="Personal accounts are fine during development. Before going live, transfer the repository, hosting environment, database, configuration, and secrets to Sprout-owned accounts. Tier 1 apps are exempt."
            color={C.mango600} bg={C.mango100} border={C.mango500} />

          <Divider />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 7 — TIPS
          ══════════════════════════════════════════════════════════════════ */}
          <SecH num="7" sectionRef={refs.tips}>Tips &amp; Gotchas</SecH>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { title: "Classify before you build, not after",
                body: "One question tells you most of what you need: does it have a backend? No backend = Tier 1, no matter who uses it. This saves rearchitecting later." },
              { title: "Register early — stages are just a label",
                body: "You don't need to finish building before registering. Add a plant as soon as the idea is real. It lets you track progress and start the approval clock early." },
              { title: "Secure your approver during Sprout",
                body: "IS/Execom approval is required before any DevOps ticket. If you wait until Growing, you might block yourself from Blooming. Get the approval early." },
              { title: "Read the Keycloak guide before asking Coleen",
                body: "There's an existing Keycloak setup guide. Work through it first. Coleen Bartido is available for escalations — not setup walkthroughs." },
              { title: "Supabase for databases — not Airtable",
                body: "Airtable and Sheets are fine for prototyping. For a production tool used by real users, use Supabase. It avoids a painful migration at go-live review." },
              { title: "If it's used by 3+ people, it belongs in Grove",
                body: "Any internal tool accessed by more than 3 people, or that connects to a company system, must be registered. Don't wait to be asked." },
              { title: "A rejection is not the end",
                body: "If your release review is rejected, read the comment carefully, fix the flagged issue, and resubmit. The review queue moves quickly once resolved." },
            ].map((tip, i) => (
              <Card key={i}>
                <div style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, color: C.mushroom400,
                  marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tip {i + 1}</div>
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: C.mushroom900, marginBottom: 5 }}>{tip.title}</div>
                <div style={{ fontFamily: FF, fontSize: 12, color: C.mushroom600, lineHeight: 1.6 }}>{tip.body}</div>
              </Card>
            ))}
          </div>

          <SubH>Common Mistakes</SubH>
          <StdTable
            headers={["Mistake", "What to do instead"]}
            rows={[
              ["Waiting until launch to register in Grove", "Register early — even when the idea is rough"],
              ["Using Airtable or Sheets as a production DB", "Switch to Supabase before go-live"],
              ["Raising a DevOps ticket before IS/Execom approval", "Get approval first, then raise the ticket"],
              ["Hardcoding API keys or credentials", "Use environment variables; never commit secrets"],
              ["Building Tier 3 auth without Keycloak", "Keycloak is mandatory for external-facing apps"],
              ["Skipping the Technical tab classification", "No stage changes are possible without a tier"],
              ["Keeping the repo on personal accounts at go-live", "Move all assets to Sprout-owned accounts before Blooming"],
              ["Sending sensitive PII to an external AI without review", "Check Q4; get DPO review if needed"],
            ]}
          />

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "24px 0 40px", fontFamily: FF, fontSize: 12, color: C.mushroom400 }}>
            Grove Developer Guide · June 2026 · Questions? Reach out to Belle Asis.
          </div>

        </div>
      </div>
    </div>
  );
}
