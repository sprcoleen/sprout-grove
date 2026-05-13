# Grove Overview Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED: Use `superpowers:subagent-driven-development` (if subagents available) or `superpowers:executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `ExecutiveDashboard` component (App.jsx lines 862–1078) with a new `OverviewDashboard` component per the Grove Overview Spec (`c:\Users\KVirata\Downloads\Grove_Overview_Spec.md`).

**Architecture:** All changes are in `src/App.jsx`. The new component is added above the `// ── AI Features ───` comment, replacing `ExecutiveDashboard` in-place. Two new helper functions (`getActivityFeed`, `getToolCounts`) are added just above the component. No new files. No new npm packages. All data computed from `projects`/`wishes` props — no additional Supabase queries needed since `builder` (display name) and `submittedAt` are already in the project transform.

**Tech Stack:** React 18 (hooks: useState, useEffect), Vite, inline styles, DS token system (`C.*`, `DS.*`, `FF`) already defined at the top of App.jsx.

**Spec file:** `c:\Users\KVirata\Downloads\Grove_Overview_Spec.md`

---

## Codebase facts (read before coding)

| Item | Value |
|------|-------|
| `ExecutiveDashboard` location | App.jsx lines 862–1078 |
| Call site | App.jsx line 4306 |
| Auth role fields | `authUser.isGardener` = Admin, `authUser.isExcom` = Approver |
| Auth name field | `authUser.displayName` (email prefix; no separate `first_name` on main branch) |
| Milestone format | `"Seedling — Mar 2026"` (string per stage transition) |
| `submittedAt` | Available in project transform as `p.submittedAt` (ISO string or null) |
| `reviewStatus` | `p.reviewStatus` — `null | "approved" | "needs_rework"` |
| `toolUsed` | `p.toolUsed` — string array |
| DEPT_ZONES keys | Marketing, Product Marketing, LDU, SolCon, Sales, RevOps, Implementation, MPS, Customer Advocacy, Customer Success Management, Alliance, Aurora, Prometheus, Legal, People Ops, Finance, Execom |
| Seeds count | `wishes.filter(w => !w.fulfilledBy).length` |
| `daysAgo` helper | Already exported from `./lib/db` and imported at top of App.jsx |

---

## Chunk 1 — Helpers, Keyframes, Hero, Pipeline Tiles

### Task 1: Add helper functions and keyframes constant

**Files:** Modify `src/App.jsx` — insert at line 861 (just before `// ── Executive Dashboard ───────`)

- [ ] **Step 1.1** Insert the following block at line 861 (before the Executive Dashboard comment):

```javascript
// ── Overview Dashboard helpers ────────────────────────────────────────────────

const OVERVIEW_KF = `
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes ovPulse{0%,100%{opacity:1}50%{opacity:0.4}}
`;

const getActivityFeed = (projects, wishes) => {
  const events = [];
  for (const p of projects) {
    const mils = p.milestones || [];
    if (!mils.length) continue;
    const last = mils[mils.length - 1] || "";
    let type, text;
    if (p.stage === "thriving") {
      type = "thriving";
      text = `${p.name} moved to Thriving by ${p.builder || p.builderEmail}`;
    } else if (last.toLowerCase().includes("approved")) {
      type = "approved";
      text = `${p.name} approved — now in Sprout`;
    } else if (p.stage === "nursery" || last.toLowerCase().includes("nursery")) {
      type = "nursery";
      text = `${p.name} submitted to Nursery by ${p.builder || p.builderEmail}`;
    } else if (last.toLowerCase().includes("claimed")) {
      type = "claimed";
      text = `${p.name} claimed — now Seedling`;
    } else {
      continue;
    }
    events.push({ type, text, age: p.lastUpdated, id: "p" + p.id });
  }
  for (const w of wishes) {
    if (!w.fulfilledBy) {
      events.push({
        type: "seed",
        text: `New Seed: ${w.title} — ${w.upvoters.length} upvotes`,
        age: w.createdDaysAgo,
        id: w.id,
      });
    }
  }
  // age = "days ago" integer; ascending sort (lowest age first) = newest events first ✓
  return events.sort((a, b) => a.age - b.age).slice(0, 10);
};

const getToolCounts = (projects) => {
  const counts = {};
  for (const p of projects) {
    for (const tool of (p.toolUsed || [])) {
      counts[tool] = (counts[tool] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
};
```

- [ ] **Step 1.2** Run `npm run dev` — confirm no syntax errors. Browser loads Grove normally.

---

### Task 2: Replace ExecutiveDashboard with OverviewDashboard — scaffold + hero

**Files:** Modify `src/App.jsx` — replace lines 861 (the `// ── Executive Dashboard ───`) through 1078 (`};`) with the content below. Keep everything above line 861 and below line 1079 exactly as-is.

**What this task covers:** The component declaration, state, computed values, countUp effect, barGrow effect, and the hero greeting section only. The remaining JSX sections are filled in Tasks 3–8.

- [ ] **Step 2.1** Replace `// ── Executive Dashboard ────────────────────────────────────────────────────────` through the closing `};` of `ExecutiveDashboard` (lines 861–1078) with:

```javascript
// ── Overview Dashboard ────────────────────────────────────────────────────────
const OverviewDashboard = ({ projects, wishes, authUser, onSelectProject, onNavigateGarden, onNavigateWishlist }) => {
  // ── Animation state ─────────────────────────────────────────────────────────
  const [counts, setCounts]         = useState({ seeds:0, seedling:0, nursery:0, sprout:0, bloom:0, thriving:0 });
  const [barsReady, setBarsReady]   = useState(false);
  const [hoverTile, setHoverTile]   = useState(null);
  const [clickTile, setClickTile]   = useState(null);

  // ── Computed data ────────────────────────────────────────────────────────────
  const unclaimedSeeds = wishes.filter(w => !w.claimedBy && !w.fulfilledBy);
  const seedCount      = unclaimedSeeds.length;
  const highVoteSeeds  = unclaimedSeeds.filter(w => w.upvoters.length >= 4).length;

  const pipeline = {
    seeds:    wishes.filter(w => !w.fulfilledBy).length,
    seedling: projects.filter(p => p.stage === "seedling").length,
    nursery:  projects.filter(p => p.stage === "nursery").length,
    sprout:   projects.filter(p => p.stage === "sprout").length,
    bloom:    projects.filter(p => p.stage === "bloom").length,
    thriving: projects.filter(p => p.stage === "thriving").length,
  };

  // lastUpdated = days since last update; ascending sort puts lowest (most recent) at [0] ✓
  const spotlight = projects
    .filter(p => p.stage === "thriving")
    .sort((a, b) => a.lastUpdated - b.lastUpdated)[0] || null;

  const activityFeed = getActivityFeed(projects, wishes);

  const topBuilders = (() => {
    const map = {};
    for (const p of projects) {
      if (p.stage === "seedling") continue;
      const key = p.builderEmail || p.builder;
      if (!map[key]) map[key] = { name: p.builder || p.builderEmail, email: p.builderEmail, count: 0 };
      map[key].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 4);
  })();

  const topSeeds = wishes
    .filter(w => w.upvoters.length > 0)
    .sort((a, b) => b.upvoters.length - a.upvoters.length)
    .slice(0, 3);

  const toolCounts = getToolCounts(projects);

  const deptCoverage = Object.keys(DEPT_ZONES).map(dept => ({
    dept,
    count: projects.filter(p => p.builtBy === dept).length,
  })).sort((a, b) => b.count - a.count);

  // Action zone data
  const myProjects    = projects.filter(p => p.builderEmail === authUser?.email);
  const nurseryQueue  = projects.filter(p => p.stage === "nursery")
    .sort((a, b) => {
      const aMs = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bMs = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return aMs - bMs; // ASC — oldest first
    });
  const stalePlants   = projects
    .filter(p => p.lastUpdated > 30)
    .sort((a, b) => b.lastUpdated - a.lastUpdated);
  const seedsToClaim  = wishes
    .filter(w => !w.claimedBy && !w.fulfilledBy)
    .sort((a, b) => b.upvoters.length - a.upvoters.length)
    .slice(0, 3);

  const healthPct = Math.round(
    (projects.filter(p => p.stage === "bloom" || p.stage === "thriving").length /
      Math.max(projects.length, 1)) * 100
  );

  // ── CountUp animation (200ms delay, 600ms duration) ─────────────────────────
  useEffect(() => {
    const targets = { ...pipeline };
    const steps = 600 / 16;
    const cur = { seeds: 0, seedling: 0, nursery: 0, sprout: 0, bloom: 0, thriving: 0 };
    let started = false;
    const delay = setTimeout(() => {
      started = true;
      const timer = setInterval(() => {
        let done = true;
        const next = { ...cur };
        for (const key of Object.keys(targets)) {
          const step = targets[key] / steps;
          next[key] = Math.min(cur[key] + step, targets[key]);
          if (next[key] < targets[key]) done = false;
          cur[key] = next[key];
        }
        setCounts({
          seeds: Math.round(next.seeds), seedling: Math.round(next.seedling),
          nursery: Math.round(next.nursery), sprout: Math.round(next.sprout),
          bloom: Math.round(next.bloom), thriving: Math.round(next.thriving),
        });
        if (done) clearInterval(timer);
      }, 16);
      return timer;
    }, 200);
    return () => { clearTimeout(delay); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bar grow animation (300ms delay) ─────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  // ── Hero greeting ────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = authUser?.displayName || authUser?.email?.split("@")[0] || "";

  // ── Dot color map for activity feed ─────────────────────────────────────────
  const FEED_DOTS = {
    thriving: C.kangkong500,
    approved: C.blueberry500,
    nursery:  C.mango500,
    seed:     C.ubas500,
    claimed:  C.mushroom300,
  };

  const ageLabel = (days) => days === 0 ? "today" : days === 1 ? "1d ago" : `${days}d ago`;

  // ── Tile config ──────────────────────────────────────────────────────────────
  const TILE_CFG = [
    { key:"seeds",    label:"Seeds",    sub:"Ideas waiting to be built",  bg:C.mushroom50,  border:C.mushroom200, countColor:C.mushroom900, nav:()=>onNavigateWishlist?.() },
    { key:"seedling", label:"Seedling", sub:STAGE_DESC.seedling,          bg:C.white,       border:C.mushroom200, countColor:C.mushroom900, nav:()=>onNavigateGarden?.("board","seedling") },
    { key:"nursery",  label:"Nursery",  sub:STAGE_DESC.nursery,           bg:C.mango50,     border:C.mango500,   countColor:C.mango600,   nav:()=>onNavigateGarden?.("board","nursery") },
    { key:"sprout",   label:"Sprout",   sub:STAGE_DESC.sprout,            bg:C.white,       border:C.mushroom200, countColor:C.mushroom900, nav:()=>onNavigateGarden?.("board","sprout") },
    { key:"bloom",    label:"Bloom",    sub:STAGE_DESC.bloom,             bg:C.white,       border:C.mushroom200, countColor:C.mushroom900, nav:()=>onNavigateGarden?.("board","bloom") },
    { key:"thriving", label:"Thriving", sub:STAGE_DESC.thriving,          bg:C.kangkong50,  border:C.kangkong200, countColor:C.kangkong700, nav:()=>onNavigateGarden?.("board","thriving") },
  ];

  return (
    <div style={{ padding:"28px 32px", background:C.mushroom100, minHeight:"100%", overflowY:"auto", fontFamily:FF }}>
      <style>{OVERVIEW_KF}</style>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom:20, animation:"fadeUp 0.4s ease both" }}>
        <div style={{ fontSize:19, fontWeight:700, color:C.mushroom900, letterSpacing:"-0.01em", marginBottom:3 }}>
          {greeting}, {firstName}
        </div>
        <div style={{ fontSize:12, color:C.mushroom500 }}>
          Live snapshot of Sprout&rsquo;s AI ecosystem &middot; {projects.length} active plants across PH &amp; TH
        </div>
      </div>

      {/* ── Pipeline tiles ───── TASK 3 fills this section ──────────────── */}
      {/* PIPELINE_TILES_PLACEHOLDER */}

      {/* ── Two-column body ─── TASKS 4-8 fill this section ─────────────── */}
      {/* BODY_PLACEHOLDER */}

    </div>
  );
};
```

- [ ] **Step 2.2** Update the call site on line 4306 (the `ExecutiveDashboard` usage). Change:
  ```jsx
  {view==="dashboard" && <ExecutiveDashboard projects={projects} wishes={wishes} onSelectProject={handleSelectProject} onNavigateGarden={(vm,sf)=>{setGardenNav(prev=>({key:prev.key+1,viewMode:vm,stageFilter:sf}));setView("garden");}} onNavigateWishlist={()=>setView("wishlist")}/>}
  ```
  To:
  ```jsx
  {view==="dashboard" && <OverviewDashboard projects={projects} wishes={wishes} authUser={authUser} onSelectProject={handleSelectProject} onNavigateGarden={(vm,sf)=>{setGardenNav(prev=>({key:prev.key+1,viewMode:vm,stageFilter:sf}));setView("garden");}} onNavigateWishlist={()=>setView("wishlist")}/>}
  ```

- [ ] **Step 2.3** Run `npm run dev`. Verify:
  - Overview tab renders without console errors
  - Hero shows time-aware greeting with user's name
  - Placeholder comments visible in DOM (or missing — both OK)

---

### Task 3: Pipeline tiles + count-up animation

**Files:** Modify `src/App.jsx` — in `OverviewDashboard`, replace `{/* PIPELINE_TILES_PLACEHOLDER */}` with the tiles JSX below.

- [ ] **Step 3.1** Replace `{/* PIPELINE_TILES_PLACEHOLDER */}` with:

```jsx
{/* ── Pipeline tiles ───────────────────────────────────────────────── */}
<div style={{
  display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6, marginBottom:20,
  animation:"fadeUp 0.4s ease 0.05s both",
}}>
  {TILE_CFG.map((t, i) => {
    const isHov = hoverTile === i;
    const isClk = clickTile === i;
    return (
      <div
        key={t.key}
        onMouseEnter={() => setHoverTile(i)}
        onMouseLeave={() => setHoverTile(null)}
        onClick={() => {
          setClickTile(i);
          setTimeout(() => { setClickTile(null); t.nav(); }, 120);
        }}
        style={{
          background: t.bg,
          border: `0.5px solid ${isHov ? (t.key==="nursery" ? C.mango500 : C.kangkong200) : t.border}`,
          borderRadius: 9,
          padding: "12px 10px",
          cursor: "pointer",
          textAlign: "center",
          transform: isClk ? "scale(0.97)" : isHov ? "translateY(-2px)" : "none",
          boxShadow: isHov ? DS.shadow.sm : "none",
          transition: "all 0.18s ease",
          userSelect: "none",
        }}
      >
        <div style={{ fontSize:20, fontWeight:600, color:t.countColor, lineHeight:1 }}>
          {counts[t.key]}
        </div>
        <div style={{ fontSize:10, fontWeight:600, color:C.mushroom700, marginTop:3 }}>
          {t.label}
        </div>
        <div style={{ fontSize:9, color:C.mushroom400, marginTop:2, lineHeight:1.4 }}>
          {t.sub}
        </div>
        <div style={{ fontSize:9, fontWeight:600, color:C.kangkong500, marginTop:5, opacity:isHov?1:0, transition:"opacity 0.18s" }}>
          View all →
        </div>
      </div>
    );
  })}
</div>
```

- [ ] **Step 3.2** Run `npm run dev`. Verify:
  - 6 tiles render in a row
  - Numbers count up from 0 on page load
  - Hover lifts tile, shows shadow, border turns green (or amber for Nursery), "View all →" appears
  - Click: brief scale-down then navigates to Board filtered by that stage

---

## Chunk 2 — Action Zone, Feed, Right Column, Bottom Row, Assembly

### Task 4: Action zone (role-adaptive panels)

**Files:** Modify `src/App.jsx` — in `OverviewDashboard`, replace `{/* BODY_PLACEHOLDER */}` with the two-column layout starting with the action zone row.

- [ ] **Step 4.1** Replace `{/* BODY_PLACEHOLDER */}` with the full two-column layout. Add this as the body:

```jsx
{/* ── Two-column body ─────────────────────────────────────────────── */}
<div style={{ display:"flex", gap:16, alignItems:"start" }}>

  {/* ── LEFT COLUMN (flex 1.45) ──────────────────────────────────── */}
  <div style={{ flex:"1.45 1 0", minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>

    {/* ── Action zone — Your Focus ────────────────────────────────── */}
    <div style={{ animation:"fadeUp 0.4s ease 0.1s both" }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.mushroom500, marginBottom:8 }}>
        Your Focus
      </div>
      <div style={{ display:"flex", gap:12 }}>

        {/* LEFT PANEL */}
        <div style={{ flex:1, background:C.white, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.md, padding:"12px 14px" }}>
          {authUser?.isExcom ? (
            /* Approver: Nursery queue */
            <>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.mushroom500, marginBottom:10 }}>
                Nursery Queue
              </div>
              {nurseryQueue.length === 0 ? (
                <div style={{ fontSize:11, color:C.mushroom400 }}>No plants awaiting review.</div>
              ) : nurseryQueue.map((p, i) => {
                const submitted = p.submittedAt ? Math.floor((Date.now() - new Date(p.submittedAt).getTime()) / 86400000) : p.lastUpdated;
                const overdue = submitted > 7;
                return (
                  <div key={p.id}
                    onMouseEnter={e => { e.currentTarget.style.background=C.mushroom50; e.currentTarget.style.paddingLeft="18px"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.paddingLeft="0"; }}
                    onClick={() => onSelectProject(p)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom: i<nurseryQueue.length-1?`0.5px solid ${C.mushroom100}`:"none", cursor:"pointer", transition:"all 0.15s" }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:0 }}>
                      <span style={{ fontSize:9, fontWeight:600, background:C.mango100, color:C.mango600, border:`0.5px solid ${C.mango500}`, borderRadius:DS.radius.full, padding:"1px 7px", flexShrink:0 }}>
                        Nursery
                      </span>
                      <span style={{ fontSize:12, fontWeight:500, color:C.mushroom900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                    </div>
                    {overdue && (
                      <span style={{ fontSize:9, fontWeight:600, background:C.tomato100, color:C.tomato500, border:`0.5px solid ${C.tomato500}`, borderRadius:DS.radius.full, padding:"1px 7px", flexShrink:0, marginLeft:6 }}>
                        Overdue {submitted}d
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          ) : authUser?.isGardener ? (
            /* Admin: Garden health — stale plants */
            <>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.mushroom500, marginBottom:10 }}>
                Garden Health
              </div>
              {stalePlants.length === 0 ? (
                <div style={{ fontSize:11, color:C.mushroom400 }}>No stale plants. Garden is healthy!</div>
              ) : stalePlants.slice(0, 5).map((p, i) => (
                <div key={p.id}
                  onMouseEnter={e => { e.currentTarget.style.background=C.mushroom50; e.currentTarget.style.paddingLeft="18px"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.paddingLeft="0"; }}
                  onClick={() => onSelectProject(p)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom: i<Math.min(stalePlants.length,5)-1?`0.5px solid ${C.mushroom100}`:"none", cursor:"pointer", transition:"all 0.15s" }}
                >
                  <span style={{ fontSize:12, fontWeight:500, color:C.mushroom900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{p.name}</span>
                  <span style={{ fontSize:10, color:C.mushroom400, flexShrink:0, marginLeft:8 }}>{p.lastUpdated}d ago</span>
                </div>
              ))}
            </>
          ) : (
            /* Planter: My plants */
            <>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.mushroom500, marginBottom:10 }}>
                My Plants
              </div>
              {myProjects.length === 0 ? (
                <div style={{ fontSize:11, color:C.mushroom400 }}>You haven&rsquo;t added any plants yet.</div>
              ) : myProjects.slice(0, 5).map((p, i) => {
                let ctaText = null;
                if (p.stage === "seedling" && !p.prototypeLink) ctaText = "Add prototype →";
                else if (p.stage === "seedling" && p.prototypeLink) ctaText = "Submit for review →";
                else if (p.stage === "nursery" && p.reviewStatus === "needs_rework") ctaText = "View feedback →";
                else if (p.stage === "nursery") ctaText = null;
                else ctaText = "View →";
                return (
                  <div key={p.id}
                    onMouseEnter={e => { e.currentTarget.style.background=C.mushroom50; e.currentTarget.style.paddingLeft="18px"; e.currentTarget.querySelector(".cta").style.opacity=1; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.paddingLeft="0"; e.currentTarget.querySelector(".cta").style.opacity=0; }}
                    onClick={() => onSelectProject(p)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom: i<Math.min(myProjects.length,5)-1?`0.5px solid ${C.mushroom100}`:"none", cursor:"pointer", transition:"all 0.15s" }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:0 }}>
                      <span style={{ fontSize:9, fontWeight:600, background:STAGE_COLORS[p.stage]?.bg, color:STAGE_COLORS[p.stage]?.text, border:`0.5px solid ${STAGE_COLORS[p.stage]?.border}`, borderRadius:DS.radius.full, padding:"1px 7px", flexShrink:0 }}>
                        {STAGE_LABELS[p.stage]}
                      </span>
                      <span style={{ fontSize:12, fontWeight:500, color:C.mushroom900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                    </div>
                    {ctaText ? (
                      <span className="cta" style={{ fontSize:11, fontWeight:600, color:C.kangkong500, flexShrink:0, marginLeft:8, opacity:0, transition:"opacity 0.15s" }}>{ctaText}</span>
                    ) : (
                      <span className="cta" style={{ fontSize:10, color:C.mushroom400, flexShrink:0, marginLeft:8, opacity:0 }}>Under review</span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex:1, background:C.white, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.md, padding:"12px 14px" }}>
          {authUser?.isExcom ? (
            /* Approver: My plants */
            <>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.mushroom500, marginBottom:10 }}>
                My Plants
              </div>
              {myProjects.length === 0 ? (
                <div style={{ fontSize:11, color:C.mushroom400 }}>You haven&rsquo;t added any plants yet.</div>
              ) : myProjects.slice(0,5).map((p, i) => (
                <div key={p.id}
                  onMouseEnter={e => { e.currentTarget.style.background=C.mushroom50; e.currentTarget.style.paddingLeft="18px"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.paddingLeft="0"; }}
                  onClick={() => onSelectProject(p)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom: i<Math.min(myProjects.length,5)-1?`0.5px solid ${C.mushroom100}`:"none", cursor:"pointer", transition:"all 0.15s" }}
                >
                  <span style={{ fontSize:12, fontWeight:500, color:C.mushroom900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{p.name}</span>
                  <span style={{ fontSize:10, color:C.mushroom400, flexShrink:0, marginLeft:8 }}>{p.lastUpdated}d ago</span>
                </div>
              ))}
            </>
          ) : authUser?.isGardener ? (
            /* Admin: Quick stats */
            <>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.mushroom500, marginBottom:10 }}>
                Quick Stats
              </div>
              {[
                { label:"Total plants", value:projects.length },
                { label:"Pipeline health", value:healthPct + "%" },
                { label:"Nursery queue", value:nurseryQueue.length },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`0.5px solid ${C.mushroom100}` }}>
                  <span style={{ fontSize:11, color:C.mushroom600 }}>{label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.mushroom900 }}>{value}</span>
                </div>
              ))}
              <button onClick={() => onNavigateGarden?.("board","All")} style={{ marginTop:10, fontSize:11, fontWeight:600, color:C.kangkong500, background:"none", border:`0.5px solid ${C.kangkong200}`, borderRadius:DS.radius.md, padding:"5px 10px", cursor:"pointer", width:"100%" }}>
                View Board →
              </button>
            </>
          ) : (
            /* Planter: Seeds to claim */
            <>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.mushroom500, marginBottom:10 }}>
                Seeds to Claim
              </div>
              {seedsToClaim.length === 0 ? (
                <div style={{ fontSize:11, color:C.mushroom400 }}>No unclaimed Seeds right now.</div>
              ) : seedsToClaim.map((w, i) => (
                <div key={w.id}
                  onMouseEnter={e => { e.currentTarget.style.background=C.mushroom50; e.currentTarget.style.paddingLeft="18px"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.paddingLeft="0"; }}
                  onClick={() => onNavigateWishlist?.()}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom: i<seedsToClaim.length-1?`0.5px solid ${C.mushroom100}`:"none", cursor:"pointer", transition:"all 0.15s" }}
                >
                  <span style={{ fontSize:12, fontWeight:500, color:C.mushroom900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{w.title}</span>
                  <span style={{ fontSize:10, color:C.ubas500, fontWeight:600, flexShrink:0, marginLeft:8 }}>▲ {w.upvoters.length}</span>
                </div>
              ))}
            </>
          )}
        </div>

      </div>{/* end action zone flex */}
    </div>{/* end action zone section */}

    {/* ── ACTIVITY_FEED_PLACEHOLDER ── Task 5 fills this */}
    {/* ACTIVITY_FEED_PLACEHOLDER */}

    {/* ── TOOLS_PLACEHOLDER ── Task 7 fills this */}
    {/* TOOLS_PLACEHOLDER */}

  </div>{/* end left column */}

  {/* ── RIGHT COLUMN (flex 1) ─────────────────────────────────────── */}
  <div style={{ flex:"1 1 0", minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>

    {/* ── SPOTLIGHT_PLACEHOLDER ── Task 6 fills this */}
    {/* SPOTLIGHT_PLACEHOLDER */}

    {/* ── LEADERBOARDS_PLACEHOLDER ── Task 6 fills this */}
    {/* LEADERBOARDS_PLACEHOLDER */}

    {/* ── DEPT_PLACEHOLDER ── Task 8 fills this */}
    {/* DEPT_PLACEHOLDER */}

  </div>{/* end right column */}

</div>{/* end two-column body */}
```

- [ ] **Step 4.2** Run `npm run dev`. Verify:
  - Two columns render
  - Planter role: "My Plants" on left, "Seeds to Claim" on right
  - Row hover: slight background change visible
  - If you have `authUser.isExcom = true` (or `isGardener`): panels switch to Nursery Queue / Quick Stats

---

### Task 5: Activity feed + Seeds nudge

**Files:** Modify `src/App.jsx` — replace `{/* ACTIVITY_FEED_PLACEHOLDER */}` in the left column.

- [ ] **Step 5.1** Replace `{/* ACTIVITY_FEED_PLACEHOLDER */}` with:

```jsx
{/* ── Activity feed ────────────────────────────────────────────────── */}
<div style={{ animation:"fadeUp 0.4s ease 0.15s both" }}>
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.mushroom500 }}>
      What&rsquo;s Happening
    </div>
    <div style={{ fontSize:9, color:C.mushroom400 }}>Loaded just now</div>
  </div>
  <div style={{ background:C.white, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.md, overflow:"hidden" }}>
    {activityFeed.length === 0 ? (
      <div style={{ padding:"14px", fontSize:12, color:C.mushroom400 }}>No recent activity yet.</div>
    ) : activityFeed.map((ev, i) => (
      <div key={ev.id}
        onMouseEnter={e => { e.currentTarget.style.background=C.mushroom50; e.currentTarget.style.paddingLeft="18px"; }}
        onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.paddingLeft="0"; }}
        style={{
          display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
          borderBottom: i < activityFeed.length - 1 ? `0.5px solid ${C.mushroom100}` : "none",
          transition:"all 0.15s",
          animation:`slideIn 0.25s ease ${i * 0.05}s both`,
        }}
      >
        <div style={{ width:7, height:7, borderRadius:"50%", background:FEED_DOTS[ev.type] || C.mushroom300, flexShrink:0 }}/>
        <div style={{ flex:1, fontSize:12, color:C.mushroom800, lineHeight:1.4 }}>{ev.text}</div>
        <div style={{ fontSize:10, color:C.mushroom400, flexShrink:0 }}>{ageLabel(ev.age)}</div>
      </div>
    ))}
  </div>

  {/* Seeds nudge */}
  {seedCount > 0 && (
    <div
      onMouseEnter={e => { e.currentTarget.style.background="#f3f0ff"; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background=C.ubas100; e.currentTarget.style.transform="none"; }}
      onClick={() => onNavigateWishlist?.()}
      style={{ marginTop:8, padding:"10px 14px", background:C.ubas100, border:`0.5px solid ${C.ubas400}`, borderRadius:DS.radius.md, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", transition:"all 0.15s" }}
    >
      <span style={{ fontSize:11, color:C.mushroom700 }}>
        <strong style={{ color:C.ubas500 }}>{seedCount}</strong> Seeds unclaimed
        {highVoteSeeds > 0 && ` — ${highVoteSeeds} with 4+ upvotes`}
      </span>
      <span style={{ fontSize:11, fontWeight:600, color:C.ubas500 }}>Browse Seeds →</span>
    </div>
  )}
</div>
```

- [ ] **Step 5.2** Run `npm run dev`. Verify:
  - Activity feed shows events with colored dots
  - Feed items slide in with stagger
  - Seeds nudge renders when unclaimed seeds exist
  - Seeds nudge not rendered when seedCount === 0

---

### Task 6: Project Spotlight + Leaderboards (right column rows 1–2)

**Files:** Modify `src/App.jsx` — replace `{/* SPOTLIGHT_PLACEHOLDER */}` and `{/* LEADERBOARDS_PLACEHOLDER */}` in the right column.

- [ ] **Step 6.1** Replace `{/* SPOTLIGHT_PLACEHOLDER */}` with:

```jsx
{/* ── Spotlight ───────────────────────────────────────────────────── */}
<div style={{ animation:"fadeUp 0.4s ease 0.1s both" }}>
  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.mushroom500, marginBottom:8 }}>
    Project Spotlight
  </div>
  {spotlight ? (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor=C.kangkong400; e.currentTarget.style.boxShadow=DS.shadow.sm; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=C.kangkong200; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none"; }}
      onClick={() => onSelectProject(spotlight)}
      style={{ background:C.kangkong50, border:`0.5px solid ${C.kangkong200}`, borderRadius:DS.radius.md, padding:"14px", cursor:"pointer", transition:"all 0.18s" }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:C.kangkong500, animation:"ovPulse 2s infinite", flexShrink:0 }}/>
        <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.kangkong700 }}>Most recently thriving</span>
      </div>
      <div style={{ fontSize:15, fontWeight:600, color:C.mushroom900, marginBottom:4 }}>{spotlight.name}</div>
      {spotlight.description && (
        <div style={{ fontSize:11, color:C.mushroom700, lineHeight:1.5, marginBottom:10, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {spotlight.description}
        </div>
      )}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
        <span style={{ fontSize:10, fontWeight:600, background:STAGE_COLORS.thriving.bg, color:STAGE_COLORS.thriving.text, border:`0.5px solid ${STAGE_COLORS.thriving.border}`, borderRadius:DS.radius.full, padding:"2px 8px" }}>Thriving</span>
        {spotlight.capability && CAP_COLORS[spotlight.capability] && (
          <span style={{ fontSize:10, fontWeight:600, background:CAP_COLORS[spotlight.capability].bg, color:CAP_COLORS[spotlight.capability].text, border:`0.5px solid ${CAP_COLORS[spotlight.capability].border}`, borderRadius:DS.radius.full, padding:"2px 8px" }}>{spotlight.capability}</span>
        )}
        <span style={{ fontSize:10, color:C.mushroom500, background:C.mushroom100, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.full, padding:"2px 8px" }}>
          {spotlight.builtBy}{spotlight.country ? ` · ${spotlight.country}` : ""}
        </span>
      </div>
      <div style={{ borderTop:`0.5px solid ${C.kangkong200}`, paddingTop:8 }}>
        <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:C.kangkong600, marginBottom:4 }}>Documented impact</div>
        <div style={{ fontSize:13, fontWeight:600, color:C.kangkong700 }}>{spotlight.impact || "TBD"}</div>
      </div>
    </div>
  ) : (
    <div style={{ background:C.kangkong50, border:`0.5px dashed ${C.kangkong200}`, borderRadius:DS.radius.md, padding:"28px 14px", textAlign:"center" }}>
      <div style={{ fontSize:12, fontWeight:500, color:C.kangkong500, marginBottom:4 }}>No thriving plants yet</div>
      <div style={{ fontSize:11, color:C.mushroom500 }}>Be the first to get a plant to Thriving</div>
    </div>
  )}
</div>
```

- [ ] **Step 6.2** Replace `{/* LEADERBOARDS_PLACEHOLDER */}` with:

```jsx
{/* ── Top Builders ─────────────────────────────────────────────────── */}
<div style={{ animation:"fadeUp 0.4s ease 0.2s both" }}>
  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.mushroom500, marginBottom:8 }}>
    Top Builders
  </div>
  <div style={{ background:C.white, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.md, padding:"12px 14px" }}>
    {topBuilders.length === 0 ? (
      <div style={{ fontSize:11, color:C.mushroom400 }}>No data yet.</div>
    ) : (() => {
      const maxB = topBuilders[0]?.count || 1;
      return topBuilders.map((b, i) => (
        <div key={b.email || b.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom: i<topBuilders.length-1?8:0 }}>
          <span style={{ fontSize:10, color:C.mushroom300, width:12, flexShrink:0 }}>{i+1}</span>
          <div style={{ width:22, height:22, borderRadius:5, background:C.mushroom100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:9, fontWeight:700, color:C.mushroom600 }}>
            {(b.name||"?").slice(0,2).toUpperCase()}
          </div>
          <span style={{ fontSize:11, color:C.mushroom800, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</span>
          <div style={{ width:50, height:3, background:C.mushroom100, borderRadius:DS.radius.full, overflow:"hidden", flexShrink:0 }}>
            <div style={{ height:"100%", width: barsReady ? `${(b.count/maxB)*100}%` : 0, background:C.kangkong500, transition:"width 0.8s ease 0.3s", borderRadius:DS.radius.full }}/>
          </div>
          <span style={{ fontSize:10, color:C.mushroom500, width:16, textAlign:"right", flexShrink:0 }}>{b.count}</span>
        </div>
      ));
    })()}
  </div>
</div>

{/* ── Top Seeds ─────────────────────────────────────────────────────── */}
<div style={{ animation:"fadeUp 0.4s ease 0.25s both" }}>
  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.mushroom500, marginBottom:8 }}>
    Top Seeds
  </div>
  <div style={{ background:C.white, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.md, padding:"12px 14px" }}>
    {topSeeds.length === 0 ? (
      <div style={{ fontSize:11, color:C.mushroom400 }}>No Seeds with upvotes yet.</div>
    ) : (() => {
      const maxS = topSeeds[0]?.upvoters.length || 1;
      return topSeeds.map((w, i) => (
        <div key={w.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom: i<topSeeds.length-1?8:0 }}>
          <span style={{ fontSize:10, color:C.mushroom300, width:12, flexShrink:0 }}>{i+1}</span>
          <div style={{ width:22, height:22, borderRadius:5, background:C.ubas100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, color:C.ubas500 }}>▲</div>
          <span style={{ fontSize:11, color:C.mushroom800, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.title}</span>
          <div style={{ width:50, height:3, background:C.mushroom100, borderRadius:DS.radius.full, overflow:"hidden", flexShrink:0 }}>
            <div style={{ height:"100%", width: barsReady ? `${(w.upvoters.length/maxS)*100}%` : 0, background:C.ubas500, transition:"width 0.8s ease 0.3s", borderRadius:DS.radius.full }}/>
          </div>
          <span style={{ fontSize:10, color:C.mushroom500, width:16, textAlign:"right", flexShrink:0 }}>{w.upvoters.length}</span>
        </div>
      ));
    })()}
  </div>
</div>
```

- [ ] **Step 6.3** Run `npm run dev`. Verify:
  - Spotlight card shows most recently thriving plant with pulsing dot
  - Spotlight empty state shows when no thriving plants
  - Top Builders shows up to 4 rows
  - Top Seeds shows up to 3 rows
  - Bars animate from 0 on load

---

### Task 7: Tools in Use (left column, bottom)

**Files:** Modify `src/App.jsx` — replace `{/* TOOLS_PLACEHOLDER */}` in the left column.

- [ ] **Step 7.1** Replace `{/* TOOLS_PLACEHOLDER */}` with:

```jsx
{/* ── Tools in Use ─────────────────────────────────────────────────── */}
<div style={{ animation:"fadeUp 0.4s ease 0.2s both" }}>
  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.mushroom500, marginBottom:8 }}>
    Tools in Use
  </div>
  <div style={{ background:C.white, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.md, padding:"12px 14px" }}>
    {toolCounts.length === 0 ? (
      <div style={{ fontSize:11, color:C.mushroom400 }}>No tool data yet.</div>
    ) : (() => {
      const maxT = toolCounts[0]?.count || 1;
      return (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3px 20px" }}>
          {toolCounts.map(({ tool, count }) => (
            <div key={tool} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, fontWeight:500, color:C.mushroom800, width:80, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tool}</span>
              <div style={{ flex:1, height:4, background:C.mushroom100, borderRadius:DS.radius.full, overflow:"hidden" }}>
                <div style={{ height:"100%", width: barsReady ? `${(count/maxT)*100}%` : 0, background:C.kangkong500, transition:"width 0.8s ease 0.4s", borderRadius:DS.radius.full }}/>
              </div>
              <span style={{ fontSize:10, color:C.mushroom500, width:20, textAlign:"right", flexShrink:0 }}>{count}</span>
            </div>
          ))}
        </div>
      );
    })()}
  </div>
</div>
```

- [ ] **Step 7.2** Run `npm run dev`. Verify:
  - Tools grid renders in 2 columns
  - Bars animate from 0 to final width

---

### Task 8: Department Coverage (right column, bottom)

**Files:** Modify `src/App.jsx` — replace `{/* DEPT_PLACEHOLDER */}` in the right column.

- [ ] **Step 8.1** Replace `{/* DEPT_PLACEHOLDER */}` with:

```jsx
{/* ── Dept coverage ────────────────────────────────────────────────── */}
<div style={{ animation:"fadeUp 0.4s ease 0.3s both" }}>
  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.mushroom500, marginBottom:8 }}>
    Dept Coverage
  </div>
  <div style={{ background:C.white, border:`0.5px solid ${C.mushroom200}`, borderRadius:DS.radius.md, padding:"12px 14px" }}>
    {(() => {
      const maxD = deptCoverage[0]?.count || 1;
      return deptCoverage.map(({ dept, count }) => {
        const barColor = count >= 3 ? C.kangkong500 : count >= 1 ? C.mango500 : C.mushroom200;
        const nameColor = count === 0 ? C.mushroom400 : C.mushroom800;
        return (
          <div key={dept} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <span style={{ fontSize:11, color:nameColor, width:70, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dept}</span>
            <div style={{ flex:1, height:4, background:C.mushroom100, borderRadius:DS.radius.full, overflow:"hidden" }}>
              <div style={{ height:"100%", width: barsReady && maxD > 0 ? `${(count/maxD)*100}%` : 0, background:barColor, transition:"width 0.8s ease 0.5s", borderRadius:DS.radius.full }}/>
            </div>
            <span style={{ fontSize:10, color:C.mushroom500, width:16, textAlign:"right", flexShrink:0 }}>{count}</span>
          </div>
        );
      });
    })()}
  </div>
</div>
```

- [ ] **Step 8.2** Run `npm run dev`. Verify:
  - All 17 departments listed
  - Bars use green (3+), amber (1–2), gray (0)
  - Dept names in gray for 0-count depts

---

### Task 9: Final cleanup + done-state verification

**Files:** `src/App.jsx`

- [ ] **Step 9.1** Remove all remaining `{/* *_PLACEHOLDER */}` comment lines from `OverviewDashboard` (they should all be replaced now).

- [ ] **Step 9.2** Run `npm run dev`. Open browser. Go through the done-state checklist:

```
[ ] Pipeline tiles show correct counts from live Supabase data
[ ] Tile numbers count up from 0 on page load
[ ] Tile hover: lift, shadow, border color change, View all link appears
[ ] Tile click: scale press animation, then navigates to Board filtered by stage
[ ] Approver action zone shows Nursery queue with overdue indicators
[ ] Planter action zone shows own plants + Seeds to claim
[ ] Admin action zone shows stale plants + quick stats
[ ] Activity feed loads events, newest first
[ ] Seeds nudge renders only when unclaimed Seeds > 0
[ ] Spotlight shows most recent Thriving plant with pulsing dot
[ ] Spotlight empty state renders when no Thriving plants exist
[ ] Top Builders leaderboard shows correct counts, bars animate
[ ] Top Seeds leaderboard shows top 3 by upvote count
[ ] Tools in use shows correct aggregated counts
[ ] Dept coverage bars use correct color logic (green/amber/gray)
[ ] Hero greeting is time-aware and uses user's name
[ ] No emoji flags anywhere in the component
[ ] All colors use C.* or DS.* tokens — no raw hex values
[ ] No CSS files or Tailwind classes used
```

- [ ] **Step 9.3** Commit:
```bash
git add src/App.jsx
git commit -m "feat: replace ExecutiveDashboard with OverviewDashboard

Implements Grove Overview Spec (March 2026). Role-adaptive action zone,
pipeline tiles with count-up animation, activity feed, project spotlight,
leaderboards, tools and dept coverage charts."
```

---

## Adaptations and known deviations

| Item | Spec | Codebase reality | Resolution |
|------|------|-----------------|------------|
| Role fields | `is_admin`, `is_approver` | `authUser.isGardener`, `authUser.isExcom` | Use codebase names |
| First name | `profiles.first_name` | `authUser.displayName` (email prefix) | Use `displayName`; no data loss |
| Builder display name | Join profiles table | `p.builder` already in project data | Use `p.builder` — same result |
| `capability` field | Explicit capability pill | Not in `toProject` transform | Render conditionally: only if `p.capability` defined |
| `activity_log` table | SELECT from activity_log | No such table in schema | Derive from milestones + wish `createdDaysAgo` |
| `last_updated` in admin query | ISO timestamp comparison | Stored as `lastUpdated` (days ago integer) | Use `p.lastUpdated > 30` |

---

## Session summary template (fill in after build)

```
Built: OverviewDashboard component replacing ExecutiveDashboard in App.jsx

Decisions: [any judgement calls made, or 'None']

Adaptations: authUser.isGardener→Admin, authUser.isExcom→Approver, displayName→firstName,
             builder field used instead of profiles join, activity feed derived from milestones

Noticed (not touched): [anything flagged for later, or 'None']

Checklist: [X/19 items passed]
```
