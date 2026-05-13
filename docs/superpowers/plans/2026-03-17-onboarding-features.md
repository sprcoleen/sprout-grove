# Onboarding Features — Welcome Modal Redesign & Help Panel Stages Tab

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Welcome Modal to match the v3 visual spec and add a Stages guide tab to the Help Panel `?` panel.

**Architecture:** Both changes are fully self-contained within `src/App.jsx` in the grove-enhancements worktree. No new files are needed. The Welcome Modal gets a full visual overhaul (dark green header, stage list, simplified props). The Help Panel gets a new top-level tab navigation (Stages / Adding work / Roles / FAQ) — "Stages" shows a new per-stage guide; "Adding work" preserves the existing report/ask feed; "Roles" and "FAQ" show empty state.

**Tech Stack:** React 19, Vite 6, Supabase JS v2.49.4, inline styles using `DS` / `C` / `FF` tokens already in App.jsx

---

## Pre-flight: DB migration

Before deploying, migration `supabase/migrations/06-add-has-dismissed-welcome.sql` must be run in the Supabase dashboard. It adds `has_dismissed_welcome boolean NOT NULL DEFAULT false` to the `profiles` table. The React code already reads/writes this column.

---

## Chunk 1: Welcome Modal Redesign

### File Structure

- Modify: `.worktrees/grove-enhancements/src/App.jsx`
  - Replace `WelcomeModal` function (~lines 2661–2728): full visual redesign
  - Update `WelcomeModal` call site (~line 4441): remove 3 dead props, add `country` prop

### Task 1: Replace WelcomeModal component

**Files:**
- Modify: `.worktrees/grove-enhancements/src/App.jsx`

- [ ] **Step 1: Start the dev server**

```bash
cd C:\Users\KVirata\Desktop\sprout-garden\.worktrees\grove-enhancements
npm run dev
```

Open `http://localhost:5173` in a browser. Sign in if needed. The current welcome modal should appear (white background, action cards). Keep this tab open for verification.

- [ ] **Step 2: Replace the WelcomeModal function**

Find the block from line 2660 (`// ── WelcomeModal`) through line 2728 (closing `}`) and replace the entire `WelcomeModal` function with:

```jsx
// ── WelcomeModal ──────────────────────────────────────────────────────────────
function WelcomeModal({ onExplore, onDismissPermanently, firstName, isApprover, country }) {
  const roleName  = isApprover ? "Approver" : "Planter";
  const roleEmoji = isApprover ? "🌿" : "🌱";
  const teamLabel = country === "PH" ? "PH team" : "TH team";
  const nudge     = isApprover ? "Review plants in the Nursery" : "Claim a seed to build";

  const stageRows = [
    { key:"seedling", emoji:"🌱", label:"Seedling", desc:"Someone is actively building",      bg:STAGE_COLORS.seedling.bg, text:STAGE_COLORS.seedling.text },
    { key:"nursery",  emoji:"🌿", label:"Nursery",  desc:"Under leadership review",           bg:STAGE_COLORS.nursery.bg,  text:STAGE_COLORS.nursery.text  },
    { key:"sprout",   emoji:"🌿", label:"Sprout",   desc:"Approved, actively developing",     bg:STAGE_COLORS.sprout.bg,   text:STAGE_COLORS.sprout.text   },
    { key:"bloom",    emoji:"🌸", label:"Bloom",    desc:"Live, in user testing",             bg:STAGE_COLORS.bloom.bg,    text:STAGE_COLORS.bloom.text    },
    { key:"thriving", emoji:"🌳", label:"Thriving", desc:"Delivering measurable value",       bg:STAGE_COLORS.thriving.bg, text:STAGE_COLORS.thriving.text },
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(32,30,24,0.65)",backdropFilter:"blur(8px)"}}>
      <div style={{background:C.white,borderRadius:DS.radius.xl,maxWidth:480,width:"92%",boxShadow:DS.shadow.xl,overflow:"hidden",animation:"slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1)"}}>

        {/* ── Dark green header ── */}
        <div style={{background:"#14532d",padding:"28px 24px 24px",position:"relative",textAlign:"center"}}>
          {/* Skip — session-only dismiss */}
          <button onClick={onExplore}
            style={{position:"absolute",top:14,right:16,background:"none",border:"none",color:"rgba(255,255,255,0.65)",fontFamily:FF,fontSize:13,cursor:"pointer",padding:"4px 8px",borderRadius:DS.radius.sm,transition:"color 0.15s"}}
            onMouseOver={e=>e.currentTarget.style.color="#fff"}
            onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.65)"}
          >Skip</button>
          {/* Logo */}
          <div style={{fontSize:32,marginBottom:10,lineHeight:1}}>🌿</div>
          {/* Grove + Beta pill */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
            <span style={{fontFamily:FF,fontSize:26,fontWeight:800,color:"#fff"}}>Grove</span>
            <span style={{fontFamily:FF,fontSize:11,fontWeight:600,background:"rgba(255,255,255,0.18)",color:"rgba(255,255,255,0.88)",borderRadius:DS.radius.full,padding:"3px 9px",letterSpacing:0.3}}>Beta</span>
          </div>
          {/* Tagline */}
          <div style={{fontFamily:FF,fontSize:13,color:"rgba(255,255,255,0.80)",lineHeight:1.65,maxWidth:340,margin:"0 auto"}}>
            Every thriving AI tool started as a seed. Grove is where Sprout plants, tends, and grows its AI work — together.
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{padding:"20px 24px 24px"}}>

          {/* Role pill */}
          <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:C.mushroom100,border:"1.5px solid "+C.mushroom200,borderRadius:DS.radius.full,padding:"8px 16px",flexWrap:"wrap",justifyContent:"center"}}>
              <span style={{fontSize:15}}>{roleEmoji}</span>
              <span style={{fontFamily:FF,fontSize:13,fontWeight:700,color:C.mushroom800}}>{roleName}</span>
              <span style={{fontFamily:FF,fontSize:13,color:C.mushroom500}}>· {teamLabel}</span>
              <span style={{fontFamily:FF,fontSize:12,color:C.mushroom400}}>· {nudge}</span>
            </div>
          </div>

          {/* Section label */}
          <div style={{fontFamily:FF,fontSize:10,fontWeight:700,color:C.mushroom500,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>How ideas grow</div>

          {/* Stage list */}
          <div style={{border:"1px solid "+C.mushroom200,borderRadius:DS.radius.lg,overflow:"hidden",marginBottom:16}}>
            {/* Seed row */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.mushroom50,borderBottom:"1px solid "+C.mushroom200}}>
              <span style={{fontSize:15,flexShrink:0}}>🌰</span>
              <span style={{fontFamily:FF,fontSize:13,fontWeight:700,color:C.mushroom700,flexShrink:0}}>Seed</span>
              <span style={{fontFamily:FF,fontSize:12,color:C.mushroom500,flex:1}}>An idea for a project or tool</span>
              <span style={{display:"flex",alignItems:"center",gap:3,fontFamily:FF,fontSize:11,color:C.blueberry500,flexShrink:0,opacity:0.85}}>overlap check 🔍</span>
            </div>
            {/* Project stage rows */}
            {stageRows.map((s, i) => (
              <div key={s.key} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:s.bg,borderBottom:i < stageRows.length-1 ? "1px solid rgba(0,0,0,0.06)" : "none"}}>
                <span style={{fontSize:15,flexShrink:0}}>{s.emoji}</span>
                <span style={{fontFamily:FF,fontSize:13,fontWeight:700,color:s.text,flexShrink:0}}>{s.label}</span>
                <span style={{fontFamily:FF,fontSize:12,color:s.text,opacity:0.8}}>{s.desc}</span>
              </div>
            ))}
          </div>

          {/* Builder nudge card */}
          <div style={{background:C.kangkong50,border:"1px solid "+C.kangkong200,borderRadius:DS.radius.md,padding:"12px 14px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>🌱</span>
            <span style={{fontFamily:FF,fontSize:12,color:C.kangkong700,lineHeight:1.6}}>You don't need to be an engineer to build. Anyone at Sprout can claim a seed and start growing it.</span>
          </div>

          {/* Beta note + primary CTA */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:10}}>
            <div style={{fontFamily:FF,fontSize:12,color:C.mushroom500,lineHeight:1.5,flex:1}}>
              Grove is in Beta. Hit <strong style={{color:C.mushroom700}}>?</strong> for help or to learn more about each stage.
            </div>
            <button onClick={onExplore}
              style={{flexShrink:0,padding:"10px 20px",borderRadius:DS.radius.lg,background:"#14532d",border:"none",color:C.white,fontFamily:FF,fontSize:14,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"background 0.15s"}}
              onMouseOver={e=>e.currentTarget.style.background="#0f3d21"}
              onMouseOut={e=>e.currentTarget.style.background="#14532d"}
            >Take me in →</button>
          </div>

          {/* Don't show again */}
          <button onClick={onDismissPermanently}
            style={{width:"100%",padding:"9px 0",borderRadius:DS.radius.lg,background:"none",border:"1.5px solid "+C.mushroom200,color:C.mushroom500,fontFamily:FF,fontSize:12,fontWeight:500,cursor:"pointer",transition:"all 0.15s"}}
            onMouseOver={e=>{e.currentTarget.style.background=C.mushroom50;e.currentTarget.style.borderColor=C.mushroom300;}}
            onMouseOut={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor=C.mushroom200;}}
          >Don't show again</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update the WelcomeModal call site**

Find the existing `<WelcomeModal` block (~line 4441) that looks like:

```jsx
{authUser && !authUser.hasDismissedWelcome && !welcomeSeen && !dataLoading && (
  <WelcomeModal
    onExplore={() => setWelcomeSeen(true)}
    onDismissPermanently={handleDismissWelcomePermanently}
    onPlantSeed={() => { setWelcomeSeen(true); setView("wishlist"); setShowAddWish(true); }}
    onAddToGarden={() => { setWelcomeSeen(true); setView("garden"); setShowForm(true); }}
    onReviewNursery={() => { setWelcomeSeen(true); setView("garden"); }}
    firstName={authUser.firstName}
    isApprover={authUser.isApprover}
  />
)}
```

Replace with:

```jsx
{authUser && !authUser.hasDismissedWelcome && !welcomeSeen && !dataLoading && (
  <WelcomeModal
    onExplore={() => setWelcomeSeen(true)}
    onDismissPermanently={handleDismissWelcomePermanently}
    firstName={authUser.firstName}
    isApprover={authUser.isApprover}
    country={authUser.country}
  />
)}
```

- [ ] **Step 4: Verify visually**

Hard-refresh `http://localhost:5173`. If the modal is already dismissed for your account, temporarily open browser DevTools → Application → Local Storage → delete Supabase session, sign back in to trigger the modal.

Expected result:
- Dark green header with 🌿, "Grove", "Beta" pill, tagline
- "Skip" in top-right of header (green area)
- Role pill shows "🌱 Planter · PH team · Claim a seed to build" (or Approver variant)
- Stage list: Seed, Seedling, Nursery, Sprout, Bloom, Thriving with correct colors
- Builder nudge card (green background)
- Beta note + "Take me in →" button side by side
- "Don't show again" button below

Test all three buttons:
- "Skip" → modal closes, does NOT set `has_dismissed_welcome`; reopens on next hard-refresh before permanent dismiss
- "Take me in →" → same as Skip (session dismiss only)
- "Don't show again" → modal closes, `has_dismissed_welcome` = true in DB, never shows again

- [ ] **Step 5: Commit**

```bash
cd C:\Users\KVirata\Desktop\sprout-garden\.worktrees\grove-enhancements
git add src/App.jsx
git commit -m "feat: redesign WelcomeModal — dark green header, stage list, simplified props"
```

---

## Chunk 2: Help Panel Stages Tab

### File Structure

- Modify: `.worktrees/grove-enhancements/src/App.jsx`
  - App component: add `helpTab` / `setHelpTab` state, pass as new props to `<HelpPanel>`
  - `HelpPanel` function signature: add `helpTab` and `setHelpTab` params
  - `HelpPanel` render: add tab nav row, conditionally show stage guide vs. existing feed vs. empty state

### Design decisions

| Tab | When selected | Behaviour |
|---|---|---|
| Stages (default) | `helpTab === "stages"` | Show stage guide content (new). Hide report/ask buttons. |
| Adding work | `helpTab === "adding-work"` | Show existing report/ask feed (current behaviour). |
| Roles | `helpTab === "roles"` | Empty state: "Coming soon" |
| FAQ | `helpTab === "faq"` | Empty state: "Coming soon" |
| submit / edit views | any | Tab nav hidden; focused form (existing). |

The `back to Help` link in the submit/edit view returns to the feed under "Adding work" tab.

### Task 2: Add helpTab state and wire props in App

**Files:**
- Modify: `.worktrees/grove-enhancements/src/App.jsx`

- [ ] **Step 1: Find the existing help-related state block**

Search for `const [helpOpen` (near line ~3691 area). You will see a cluster of `useState` calls:

```jsx
const [helpOpen, setHelpOpen] = useState(false);
const [helpView, setHelpView] = useState("feed");
// ... more help state
```

- [ ] **Step 2: Add helpTab state**

Directly below the `helpOpen` declaration, add:

```jsx
const [helpTab, setHelpTab] = useState("stages");
```

- [ ] **Step 3: Pass helpTab props to HelpPanel call site**

Find the `<HelpPanel` block (~line 4452). Add two new props:

```jsx
helpTab={helpTab}
setHelpTab={setHelpTab}
```

So the call site becomes (add the two new lines, do NOT change any existing props):

```jsx
<HelpPanel
  open={helpOpen}
  onClose={() => setHelpOpen(false)}
  onOpen={handleHelpOpen}
  items={helpItems}
  filter={helpFilter}
  setFilter={setHelpFilter}
  page={helpPage}
  setPage={setHelpPage}
  view={helpView}
  setView={setHelpView}
  submitType={helpSubmitType}
  setSubmitType={setHelpSubmitType}
  formTitle={helpFormTitle}
  setFormTitle={setHelpFormTitle}
  formDesc={helpFormDesc}
  setFormDesc={setHelpFormDesc}
  editItem={helpEditItem}
  onSubmit={handleHelpSubmit}
  onUpvote={handleHelpUpvote}
  onResolve={handleHelpResolve}
  onDelete={handleHelpDelete}
  onStartEdit={(item) => { setHelpEditItem(item); setHelpFormTitle(item.title); setHelpFormDesc(item.description || ""); setHelpView("edit"); }}
  loading={helpLoading}
  authUser={authUser}
  helpTab={helpTab}
  setHelpTab={setHelpTab}
/>
```

### Task 3: Update HelpPanel — add tab nav and Stages guide content

**Files:**
- Modify: `.worktrees/grove-enhancements/src/App.jsx` (HelpPanel function, ~line 3426)

- [ ] **Step 1: Update the HelpPanel function signature**

Find:
```jsx
function HelpPanel({ open, onClose, items, filter, setFilter, page, setPage,
  view, setView, submitType, setSubmitType, formTitle, setFormTitle,
  formDesc, setFormDesc, editItem, onOpen, onSubmit, onUpvote,
  onResolve, onDelete, onStartEdit, loading, authUser }) {
```

Replace with (add `helpTab, setHelpTab` at the end):
```jsx
function HelpPanel({ open, onClose, items, filter, setFilter, page, setPage,
  view, setView, submitType, setSubmitType, formTitle, setFormTitle,
  formDesc, setFormDesc, editItem, onOpen, onSubmit, onUpvote,
  onResolve, onDelete, onStartEdit, loading, authUser, helpTab, setHelpTab }) {
```

- [ ] **Step 2: Add the stage guide data constant inside HelpPanel**

Add this constant block directly after the opening brace of HelpPanel (before the `helpDateLabel` declaration):

```jsx
  const STAGE_GUIDE = [
    {
      key: "seed", emoji: "🌰", label: "Seed",
      borderColor: C.mushroom400, bg: C.white, textColor: C.mushroom800,
      desc: "An idea for a project, tool, or solution that could help a team or the whole company. Anyone at Sprout can plant a seed, regardless of their technical background.",
      callouts: [
        {
          id: "overlap",
          bg: C.blueberry100, border: C.blueberry400, textColor: C.blueberry500,
          icon: "🔍",
          title: "Overlap detection",
          body: "When you add a Seed, Grove checks if a similar idea or project already exists. If it does, you'll see a prompt to connect with that builder instead of starting from scratch.",
        },
      ],
    },
    {
      key: "seedling", emoji: "🌱", label: "Seedling",
      borderColor: STAGE_COLORS.seedling.border, bg: C.white, textColor: STAGE_COLORS.seedling.text,
      gardenBadge: false,
      desc: "Someone has claimed this seed and is actively building it. This is the hands-on stage — experimenting, prototyping, and figuring out what works.",
      callouts: [
        {
          id: "requirements",
          bg: C.mango100, border: C.mango500, textColor: C.mango700,
          icon: "📋",
          title: "What you need at this stage",
          body: "A working prototype (something people can try) and a short deck explaining what you're building and its impact. Both are required before moving to Nursery.",
        },
        {
          id: "ai-help",
          bg: C.kangkong100, border: C.kangkong300, textColor: C.kangkong700,
          icon: "✨",
          title: "Not sure how to make a deck?",
          body: "AI can help you put one together quickly. Ask Claude or Gemini to help you structure your idea, how it works, and the impact in a few slides.",
        },
        {
          id: "overlap-seedling",
          bg: C.blueberry100, border: C.blueberry400, textColor: C.blueberry500,
          icon: "🔍",
          title: "Overlap detection also runs here",
          body: "If your project overlaps with another Seedling or Garden project, Grove will surface it so you can reach out and collaborate.",
          bodyBold: true,
        },
      ],
    },
    {
      key: "nursery", emoji: "🌿", label: "Nursery",
      borderColor: STAGE_COLORS.nursery.border, bg: C.white, textColor: STAGE_COLORS.nursery.text,
      gardenBadge: true,
      desc: "Before spending more time building, leadership reviews your prototype and deck. The goal isn't to gatekeep — it's to make sure you get the right guidance, connections, and resources before you invest more time.",
      callouts: [
        {
          id: "feedback",
          bg: C.mango100, border: C.mango500, textColor: C.mango700,
          icon: "💬",
          title: "If leadership needs changes before approving",
          body: "You'll get feedback directly in Grove. You can update your work and resubmit — your project is never stuck.",
          bodyBold: false,
        },
      ],
    },
    {
      key: "sprout", emoji: "🌿", label: "Sprout",
      borderColor: STAGE_COLORS.sprout.border, bg: C.white, textColor: STAGE_COLORS.sprout.text,
      gardenBadge: true,
      desc: "Approved by leadership. You're now building the full product with momentum, guidance, and company backing behind you.",
      callouts: [],
    },
    {
      key: "bloom", emoji: "🌸", label: "Bloom",
      borderColor: STAGE_COLORS.bloom.border, bg: C.white, textColor: STAGE_COLORS.bloom.text,
      gardenBadge: true,
      desc: "Live and in the hands of real users. The team is testing, gathering feedback, and refining before full rollout.",
      callouts: [],
    },
    {
      key: "thriving", emoji: "🌳", label: "Thriving",
      borderColor: STAGE_COLORS.thriving.border, bg: C.white, textColor: STAGE_COLORS.thriving.text,
      gardenBadge: true,
      desc: "Delivering real, measurable value to Sprout. This is the goal every seed is working towards.",
      callouts: [],
    },
  ];
```

- [ ] **Step 3: Update the panel header — rename title and add tab nav**

Find the existing panel header block:

```jsx
          {/* Panel header */}
          <div style={{padding:"12px 14px 0", borderBottom:"1px solid "+C.mushroom200, flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontFamily:FF,fontSize:15,fontWeight:600,color:C.mushroom900}}>Help</span>
```

Change `Help` to `Help & Guide`:

```jsx
              <span style={{fontFamily:FF,fontSize:15,fontWeight:600,color:C.mushroom900}}>Help & Guide</span>
```

Then, immediately before the `{/* + Report and + Ask buttons */}` block, add the tab nav. The tab nav should only show when `view === "feed"`:

```jsx
            {/* Top-level tab nav — only in feed view */}
            {view === "feed" && (
              <div style={{display:"flex",gap:0,marginBottom:8}}>
                {[
                  ["stages",      "Stages"],
                  ["adding-work", "Adding work"],
                  ["roles",       "Roles"],
                  ["faq",         "FAQ"],
                ].map(([val, label]) => (
                  <button key={val}
                    onClick={() => setHelpTab(val)}
                    style={{
                      padding:"6px 11px", fontFamily:FF, fontSize:12, fontWeight:500,
                      border:"none", background:"none", cursor:"pointer",
                      color: helpTab === val ? C.kangkong700 : C.mushroom500,
                      borderBottom: helpTab === val ? "2px solid "+C.kangkong600 : "2px solid transparent",
                      transition:"all 0.15s", whiteSpace:"nowrap",
                    }}
                  >{label}</button>
                ))}
              </div>
            )}
```

- [ ] **Step 4: Gate the "+ Report / + Ask" buttons and filter tabs**

The existing buttons appear in `{view === "feed" && (...)}`. Wrap those two blocks with an additional condition so they only show on the "adding-work" tab:

Find:
```jsx
            {/* + Report and + Ask buttons — hidden during submit/edit */}
            {view === "feed" && (
              <div style={{display:"flex",gap:6,marginBottom:10}}>
```

Change to:
```jsx
            {/* + Report and + Ask buttons — only on adding-work tab */}
            {view === "feed" && helpTab === "adding-work" && (
              <div style={{display:"flex",gap:6,marginBottom:10}}>
```

Find:
```jsx
            {/* Filter tabs — only in feed view */}
            {view === "feed" && (
              <div style={{display:"flex",gap:0,borderBottom:"1px solid "+C.mushroom200}}>
```

Change to:
```jsx
            {/* Filter tabs — only in feed view on adding-work tab */}
            {view === "feed" && helpTab === "adding-work" && (
              <div style={{display:"flex",gap:0,borderBottom:"1px solid "+C.mushroom200}}>
```

Also add a bottom border to the header when on the Stages tab (since the filter tabs won't render). Add after the filter tabs block:

```jsx
            {/* Header bottom border when no filter tabs */}
            {view === "feed" && helpTab !== "adding-work" && (
              <div style={{borderBottom:"1px solid "+C.mushroom200, marginBottom:0}}/>
            )}
```

- [ ] **Step 5: Add stage guide and empty states to the panel body**

In the panel body section, the existing code is:

```jsx
          {/* Panel body */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
            {view === "feed" && (
              <>
                {pageItems.length === 0 ? (
```

Add the new content blocks BEFORE the existing `{view === "feed" && ...}` check. Replace the opening of the panel body section with:

```jsx
          {/* Panel body */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>

            {/* ── Stages guide ── */}
            {view === "feed" && helpTab === "stages" && (
              <div style={{display:"flex",flexDirection:"column",gap:20,paddingBottom:16}}>
                {STAGE_GUIDE.map(stage => (
                  <div key={stage.key} style={{borderLeft:"4px solid "+stage.borderColor,paddingLeft:12}}>
                    {/* Stage name row */}
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:16}}>{stage.emoji}</span>
                      <span style={{fontFamily:FF,fontSize:14,fontWeight:700,color:stage.textColor}}>{stage.label}</span>
                      {stage.gardenBadge && (
                        <span style={{fontFamily:FF,fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:DS.radius.full,background:stage.borderColor+"22",color:stage.textColor,border:"1px solid "+stage.borderColor}}>
                          Garden
                        </span>
                      )}
                    </div>
                    {/* Description */}
                    <div style={{fontFamily:FF,fontSize:12,color:C.mushroom700,lineHeight:1.65,marginBottom:stage.callouts.length > 0 ? 10 : 0}}>
                      {stage.desc}
                    </div>
                    {/* Callout cards */}
                    {stage.callouts.map(callout => (
                      <div key={callout.id} style={{background:callout.bg,border:"1px solid "+callout.border,borderRadius:DS.radius.md,padding:"10px 12px",marginTop:8}}>
                        <div style={{display:"flex",gap:7,alignItems:"flex-start"}}>
                          <span style={{fontSize:13,flexShrink:0,marginTop:1}}>{callout.icon}</span>
                          <div>
                            <span style={{fontFamily:FF,fontSize:12,fontWeight:700,color:callout.textColor}}>
                              {callout.title}
                            </span>
                            <span style={{fontFamily:FF,fontSize:12,color:callout.textColor,lineHeight:1.6}}>
                              {" "}{callout.body}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* ── Empty states for Roles / FAQ ── */}
            {view === "feed" && (helpTab === "roles" || helpTab === "faq") && (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:200,gap:8}}>
                <div style={{fontSize:24}}>🌱</div>
                <div style={{fontFamily:FF,fontSize:13,fontWeight:600,color:C.mushroom600}}>Coming soon</div>
                <div style={{fontFamily:FF,fontSize:12,color:C.mushroom400,textAlign:"center"}}>
                  This section is being planted.
                </div>
              </div>
            )}

            {/* ── Existing feed (Adding work tab) ── */}
            {view === "feed" && helpTab === "adding-work" && (
              <>
```

Then find the CLOSING tag of the existing `{view === "feed" && (` block — it ends with `)}` after the `pageItems.map(...)`. Add an extra `)}` to close the new `helpTab === "adding-work"` condition:

Find the line that closes the feed block (after the last `pageItems.map` close):
```jsx
            )}

            {(view === "submit" || view === "edit") && (
```

Replace with:
```jsx
              </>
            )}

            {(view === "submit" || view === "edit") && (
```

- [ ] **Step 6: Update the "Back to Help" link in submit/edit view**

When the user submits a report/ask and goes to the submit view from the "Adding work" tab, clicking "Back" should stay on "adding-work" tab. Find:

```jsx
                <button onClick={()=>setView("feed")}
```

No change needed — `setView("feed")` is correct; the `helpTab` state already holds "adding-work" since that's the only tab that shows the "+ Report" / "+ Ask" buttons.

- [ ] **Step 7: Verify visually**

Hard-refresh `http://localhost:5173`. Click the `?` FAB.

Expected:
- Panel title shows "Help & Guide"
- 4 tabs at top: Stages | Adding work | Roles | FAQ
- "Stages" tab active by default
- Stages content: 6 stage entries (Seed through Thriving) each with colored left border, emoji, name, description
- Seed entry has 🔍 overlap detection callout (blue bg)
- Seedling entry has 3 callout cards (mango requirements, green AI nudge, blue overlap)
- Nursery entry has feedback callout (mango bg)
- Click "Adding work" tab → shows existing report/ask feed with "+ Report" / "+ Ask" buttons and All/Reports/Asks filter
- Click "Roles" or "FAQ" → shows "Coming soon" empty state

- [ ] **Step 8: Commit**

```bash
cd C:\Users\KVirata\Desktop\sprout-garden\.worktrees\grove-enhancements
git add src/App.jsx
git commit -m "feat: add Stages guide tab to Help panel with per-stage descriptions and callouts"
```

---

## Final checklist before deployment

- [ ] Run `npm run build` and confirm no errors: `cd .worktrees/grove-enhancements && npm run build`
- [ ] Apply migration 06 in Supabase dashboard (if not done already): copy and run `supabase/migrations/06-add-has-dismissed-welcome.sql`
- [ ] Push branch: `git push origin grove-enhancements`
- [ ] Verify Vercel preview deployment loads and both features work end-to-end
- [ ] Remove debug `console.log` statements from the auth `useEffect` before final production promote

---

Plan complete and saved to `docs/superpowers/plans/2026-03-17-onboarding-features.md`. Ready to execute?
