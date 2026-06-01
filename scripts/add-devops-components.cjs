const fs = require('fs');
const path = 'C:/Users/PC/WorkFiles/ClaudeProject/sprout-grove/src/App.jsx';
let c = fs.readFileSync(path, 'utf8');
const R = '\r\n';

const anchor = 'export default function SproutAIGarden() {';

const devopsRequestModal = `// ── DevopsRequestModal ───────────────────────────────────────────────────────
function DevopsRequestModal({ project, authUser, onClose, onSubmit }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const ticketSummary = 'DevOps Setup Request: ' + project.name;
  const ticketDesc = [
    'Project: ' + project.name,
    'Builder: ' + project.builderEmail,
    '',
    'Please set up the following:',
    'GitHub Repo: ' + (project.githubRepo || 'TBD'),
    'Hosting:     ' + (project.hosting    || 'TBD'),
    'Database:    ' + (project.database   || 'TBD'),
  ].join('\\n');
  const handleCopy = () => {
    navigator.clipboard.writeText(ticketSummary + '\\n\\n' + ticketDesc).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      projectId:    project.id,
      projectName:  project.name,
      builderEmail: project.builderEmail,
      requestedBy:  authUser.email,
      githubRepo:   project.githubRepo,
      hosting:      project.hosting,
      database:     project.database,
      status:       'todo',
      country:      project.country,
    });
    setSubmitting(false);
  };
  return (
    <div style={{position:'fixed',inset:0,zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(32,30,24,0.55)',backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:DS.radius.xl,padding:28,maxWidth:500,width:'92%',maxHeight:'90vh',overflowY:'auto',boxShadow:DS.shadow.xl,border:'1px solid '+C.mushroom200,animation:'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <div style={{fontFamily:FF,fontSize:17,fontWeight:700,color:C.mushroom900,display:'flex',alignItems:'center',gap:8}}>
              <IcoDevops size={20} color={C.carrot500}/> Request DevOps Setup
            </div>
            <div style={{fontFamily:FF,fontSize:12,color:C.mushroom500,marginTop:3}}>
              Logs a request in Grove and links you to the Sprout DevOps Jira board.
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4,flexShrink:0}}><IcoClose size={18} color={C.mushroom400}/></button>
        </div>
        <div style={{background:C.mushroom50,border:'1px solid '+C.mushroom200,borderRadius:DS.radius.lg,padding:'14px 16px',marginBottom:16}}>
          <div style={{fontFamily:FF,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:C.mushroom400,marginBottom:8}}>Ticket info</div>
          <div style={{fontFamily:FF,fontSize:13,fontWeight:700,color:C.mushroom900,marginBottom:10}}>{ticketSummary}</div>
          <div style={{fontFamily:'Roboto Mono, monospace',fontSize:11,color:C.mushroom700,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{ticketDesc}</div>
        </div>
        <button onClick={handleCopy} style={{width:'100%',padding:'9px',background:copied?C.kangkong50:C.white,border:'1.5px solid '+(copied?C.kangkong400:C.mushroom300),borderRadius:DS.radius.lg,fontFamily:FF,fontSize:12,fontWeight:600,cursor:'pointer',color:copied?C.kangkong600:C.mushroom600,marginBottom:16,transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          {copied ? <><IcoCheck size={13} color={C.kangkong500}/> Copied!</> : 'Copy ticket description'}
        </button>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',background:C.white,border:'1px solid '+C.mushroom300,borderRadius:DS.radius.lg,fontFamily:FF,fontSize:13,cursor:'pointer',color:C.mushroom600}}>Cancel</button>
          <a href={JIRA_BOARD_URL} target="_blank" rel="noreferrer" style={{flex:1,padding:'10px',background:C.blueberry100,border:'1.5px solid '+C.blueberry400,borderRadius:DS.radius.lg,fontFamily:FF,fontSize:13,fontWeight:600,cursor:'pointer',color:C.blueberry500,display:'flex',alignItems:'center',justifyContent:'center',gap:6,textDecoration:'none'}}
          >Open Jira board ↗</a>
          <button onClick={handleSubmit} disabled={submitting} style={{flex:2,padding:'10px',background:submitting?C.mushroom300:C.carrot500,color:C.white,border:'none',borderRadius:DS.radius.lg,fontFamily:FF,fontSize:13,fontWeight:700,cursor:submitting?'not-allowed':'pointer',transition:'all 0.15s'}}>
            {submitting ? 'Logging…' : 'Log Request in Grove'}
          </button>
        </div>
      </div>
    </div>
  );
}`;

const devopsBoard = `// ── DevopsBoard ──────────────────────────────────────────────────────────────
const DEVOPS_COLS = [
  {id:'todo',        label:'To Do',       color:C.mushroom600, bg:C.mushroom50, border:C.mushroom200, nextId:'in_progress', nextLabel:'Start →'},
  {id:'in_progress', label:'In Progress', color:C.mango600,    bg:C.mango50,    border:C.mango300,   nextId:'done',        nextLabel:'Mark Done →'},
  {id:'done',        label:'Done',        color:C.kangkong600, bg:C.kangkong50, border:C.kangkong200, nextId:null,          nextLabel:null},
];
function DevopsBoard({ requests, authUser, onUpdate, onViewProject }) {
  const [noteInput, setNoteInput] = React.useState({});
  const canManage = authUser?.isAdmin || authUser?.isDevops;
  return (
    <div style={{flex:1,overflowY:'auto',background:C.mushroom50,display:'flex',flexDirection:'column',fontFamily:FF}}>
      <div style={{padding:'20px 28px 12px',background:C.white,borderBottom:'1px solid '+C.mushroom200,display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <IcoDevops size={22} color={C.carrot500}/>
        <div>
          <div style={{fontFamily:FF,fontSize:18,fontWeight:700,color:C.mushroom900}}>DevOps Requests</div>
          <div style={{fontFamily:FF,fontSize:12,color:C.mushroom500,marginTop:1}}>Deployment & setup requests for Tier 3 projects</div>
        </div>
        <div style={{flex:1}}/>
        <a href={JIRA_BOARD_URL} target="_blank" rel="noreferrer" style={{padding:'7px 14px',background:C.blueberry100,border:'1.5px solid '+C.blueberry400,borderRadius:DS.radius.lg,fontFamily:FF,fontSize:12,fontWeight:600,color:C.blueberry500,textDecoration:'none',display:'flex',alignItems:'center',gap:5}}
        >View in Jira ↗</a>
      </div>
      <div style={{flex:1,overflowX:'auto',padding:24}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,minWidth:640}}>
          {DEVOPS_COLS.map(col => {
            const cards = requests.filter(r => r.status === col.id);
            return (
              <div key={col.id} style={{background:C.white,border:'1px solid '+C.mushroom200,borderRadius:DS.radius.xl,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:DS.shadow.sm}}>
                <div style={{padding:'12px 16px',background:col.bg,borderBottom:'1px solid '+col.border,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:FF,fontSize:12,fontWeight:700,color:col.color,textTransform:'uppercase',letterSpacing:0.5}}>{col.label}</span>
                  <span style={{fontFamily:FF,fontSize:11,fontWeight:700,background:C.white,color:col.color,border:'1px solid '+col.border,borderRadius:DS.radius.full,padding:'1px 7px',marginLeft:'auto'}}>{cards.length}</span>
                </div>
                <div style={{flex:1,overflowY:'auto',padding:'12px 10px',display:'flex',flexDirection:'column',gap:10,minHeight:120}}>
                  {cards.length===0&&<div style={{fontFamily:FF,fontSize:12,color:C.mushroom400,fontStyle:'italic',textAlign:'center',padding:'20px 0'}}>No requests here</div>}
                  {cards.map(req => (
                    <div key={req.id} style={{background:C.mushroom50,border:'1px solid '+C.mushroom200,borderRadius:DS.radius.lg,padding:'12px 14px',boxShadow:DS.shadow.sm}}>
                      <div style={{fontFamily:FF,fontSize:13,fontWeight:700,color:C.mushroom900,marginBottom:4}}>{req.projectName}</div>
                      <div style={{fontFamily:FF,fontSize:11,color:C.mushroom500,marginBottom:8}}>
                        Requested by {req.requestedBy.split('@')[0]}
                        {req.createdAt&&<span style={{color:C.mushroom400}}> · {new Date(req.createdAt).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</span>}
                      </div>
                      {[['GitHub',req.githubRepo],['Hosting',req.hosting],['DB',req.database]].filter(([,v])=>v).map(([k,v])=>(
                        <div key={k} style={{fontFamily:FF,fontSize:11,color:C.mushroom600,marginBottom:3,display:'flex',gap:6}}><span style={{fontWeight:700,color:C.mushroom500,minWidth:46}}>{k}</span><span style={{wordBreak:'break-all'}}>{v}</span></div>
                      ))}
                      {req.devopsNotes&&<div style={{marginTop:8,padding:'6px 8px',background:C.kangkong50,border:'1px solid '+C.kangkong100,borderRadius:DS.radius.sm,fontFamily:FF,fontSize:11,color:C.kangkong700,borderLeft:'3px solid '+C.kangkong400}}>{req.devopsNotes}</div>}
                      <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                        <button onClick={()=>onViewProject&&onViewProject(req)} style={{padding:'4px 10px',background:C.white,border:'1px solid '+C.mushroom200,borderRadius:DS.radius.full,fontFamily:FF,fontSize:11,cursor:'pointer',color:C.mushroom600}}>View project</button>
                        {canManage&&col.nextId&&(
                          <button onClick={()=>onUpdate(req.id, col.nextId, req.devopsNotes)} style={{padding:'4px 10px',background:col.bg,border:'1.5px solid '+col.border,borderRadius:DS.radius.full,fontFamily:FF,fontSize:11,fontWeight:600,cursor:'pointer',color:col.color}}>{col.nextLabel}</button>
                        )}
                      </div>
                      {canManage&&(
                        <div style={{display:'flex',gap:6,marginTop:8}}>
                          <input value={noteInput[req.id]||''} onChange={e=>setNoteInput(p=>({...p,[req.id]:e.target.value}))}
                            placeholder="Add devops note…"
                            style={{flex:1,padding:'5px 8px',borderRadius:DS.radius.sm,border:'1px solid '+C.mushroom200,fontFamily:FF,fontSize:11,color:C.mushroom700,background:C.white,outline:'none'}}
                          />
                          <button onClick={()=>{if(noteInput[req.id]?.trim())onUpdate(req.id,req.status,noteInput[req.id]);setNoteInput(p=>({...p,[req.id]:''}));}}
                            style={{padding:'5px 10px',background:C.kangkong500,color:C.white,border:'none',borderRadius:DS.radius.sm,fontFamily:FF,fontSize:11,fontWeight:600,cursor:'pointer'}}
                          >Save</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}`;

const insertion = devopsRequestModal + R + R + devopsBoard + R + R;
if (c.includes(anchor)) {
  c = c.replace(anchor, insertion + anchor);
  console.log('OK — inserted ' + insertion.length + ' chars');
} else {
  console.log('ANCHOR NOT FOUND');
}
fs.writeFileSync(path, c, 'utf8');
