import { supabase } from './supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

export const daysAgo = (ts) =>
  Math.floor((Date.now() - new Date(ts).getTime()) / 86400000)

// ── Row transforms ────────────────────────────────────────────────────────────

export const toProject = (row) => ({
  id:              row.id,
  country:         row.country,
  name:            row.name,
  builtBy:         row.built_by,
  builtFor:        Array.isArray(row.built_for) ? row.built_for : (row.built_for ? [row.built_for] : []),
  area:            row.problem_space,
  stage:           row.stage,
  impact:          row.impact        || 'TBD',
  impactNum:       row.impact_num    || 'TBD',
  builder:         row.builder,
  builderEmail:    row.builder_email,
  zx:              row.zx,
  zy:              row.zy,
  notes:           row.notes          || [],
  milestones:      row.milestones     || [],
  description:     row.description,
  problemSpace:    row.problem_space,
  dataSource:      row.data_source,
  dataSources:     row.data_sources     || [],
  demoLink:        row.demo_link      || '',
  interestedUsers: row.interested_users || [],
  imageUrl:        row.image_url      || '',
  toolUsed:        row.tool_used      || [],
  collaboratorEmails:  row.collaborator_emails  || [],
  agenticFramework:    row.agentic_framework    || [],
  isUiOnly:          row.is_ui_only          ?? null,
  usesExternalApis:  row.uses_external_apis  ?? null,
  requiresDeployment:row.requires_deployment ?? null,
  tier:              row.tier                ?? null,
  githubRepo:      row.github_repo     || '',
  hosting:         row.hosting         || '',
  database:        row.database        || '',
  prototypeLink:   row.prototype_link  || null,
  deckLink:        row.deck_link       || null,
  reviewStatus:    row.review_status   || null,
  reviewComment:   row.review_comment  || null,
  reviewedBy:      row.reviewed_by     || null,
  reviewedAt:      row.reviewed_at     || null,
  submittedAt:     row.submitted_at    || null,
  lastUpdated:     daysAgo(row.last_updated),
  lastUpdatedAt:   row.last_updated  || null,
  createdAt:       row.created_at    || null,
  createdDaysAgo:  row.created_at ? daysAgo(row.created_at) : null,
  requiresAuth:        row.requires_auth        ?? null,
  externalAccess:      row.external_access      ?? null,
  hasSensitiveData:    row.has_sensitive_data   ?? null,
  sendsToExternalAI:   row.sends_to_external_ai ?? null,
  storesUserInputs:    row.stores_user_inputs   ?? null,
})

export const fromProject = (proj) => ({
  name:             proj.name,
  built_by:         proj.builtBy,
  built_for:        proj.builtFor || [],
  stage:            proj.stage,
  impact:           proj.impact,
  impact_num:       proj.impactNum,
  builder:          proj.builder,
  builder_email:    proj.builderEmail,
  zx:               Math.round(proj.zx  || 40),
  zy:               Math.round(proj.zy  || 50),
  notes:            proj.notes           || [],
  milestones:       proj.milestones      || [],
  description:      proj.description,
  problem_space:    proj.area ?? proj.problemSpace,
  data_source:      proj.dataSource,
  data_sources:     proj.dataSources    || [],
  demo_link:        proj.demoLink        || '',
  interested_users: proj.interestedUsers || [],
  tool_used:        proj.toolUsed        || [],
  collaborator_emails:  proj.collaboratorEmails  || [],
  agentic_framework:    proj.agenticFramework   || [],
  is_ui_only:          proj.isUiOnly          ?? null,
  uses_external_apis:  proj.usesExternalApis  ?? null,
  requires_deployment: proj.requiresDeployment ?? null,
  tier:                proj.tier               ?? null,
  requires_auth:        proj.requiresAuth        ?? null,
  external_access:      proj.externalAccess      ?? null,
  has_sensitive_data:   proj.hasSensitiveData    ?? null,
  sends_to_external_ai: proj.sendsToExternalAI   ?? null,
  stores_user_inputs:   proj.storesUserInputs    ?? null,
  github_repo:      proj.githubRepo     || '',
  hosting:          proj.hosting        || '',
  database:         proj.database       || '',
  prototype_link:   proj.prototypeLink  ?? null,
  deck_link:        proj.deckLink       ?? null,
  last_updated:     new Date().toISOString(),
})

export const toWish = (row) => ({
  id:              row.id,
  country:         row.country,
  title:           row.title,
  why:             row.why,
  builtFor:        Array.isArray(row.built_for) ? row.built_for : (row.built_for ? [row.built_for] : []),
  wisherName:      row.wisher_name,
  wisherEmail:     row.wisher_email,
  upvoters:        row.upvoters        || [],
  fulfilledBy:     row.fulfilled_by    || null,
  claimedBy:       row.claimed_by      || null,
  claimedByEmail:  row.claimed_by_email|| null,
  claimedAt:       row.claimed_at      || null,
  readyForReview:  row.ready_for_review|| false,
  prototypeLink:   row.prototype_link  || null,
  prototypeNote:   row.prototype_note  || null,
  createdDaysAgo:  daysAgo(row.created_at),
  createdAt:       row.created_at    || null,
})

export const fromWish = (wish) => ({
  id:               wish.id,
  country:          wish.country,
  title:            wish.title,
  why:              wish.why             || '',
  built_for:        wish.builtFor || [],
  wisher_name:      wish.wisherName,
  wisher_email:     wish.wisherEmail,
  upvoters:         wish.upvoters        || [],
  fulfilled_by:     wish.fulfilledBy     || null,
  claimed_by:       wish.claimedBy       || null,
  claimed_by_email: wish.claimedByEmail  || null,
  claimed_at:       wish.claimedAt       || null,
  ready_for_review: wish.readyForReview  || false,
  prototype_link:   wish.prototypeLink   || null,
  prototype_note:   wish.prototypeNote   || null,
})

// ── Queries ───────────────────────────────────────────────────────────────────

export const loadProjects = async () => {
  const { data, error } = await supabase
    .from('projects').select('*').order('created_at', { ascending: false })
  if (error) { console.error('loadProjects:', error); return [] }
  return data.map(toProject)
}

export const loadWishes = async () => {
  const { data, error } = await supabase
    .from('wishes').select('*').order('created_at', { ascending: false })
  if (error) { console.error('loadWishes:', error); return [] }
  return data.map(toWish)
}

export const loadProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles').select('email, display_name')
  if (error) { console.error('loadProfiles:', error); return [] }
  return data
}

export const loadActivityLog = async () => {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) { console.error('loadActivityLog:', error); return [] }
  return data
}

export const loadNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('loadNotifications:', error); return [] }
  return data
}

export const toDevopsRequest = (row) => ({
  id:           row.id,
  projectId:    row.project_id,
  projectName:  row.project_name,
  builderEmail: row.builder_email,
  requestedBy:  row.requested_by,
  githubRepo:   row.github_repo  || '',
  hosting:      row.hosting      || '',
  database:     row.database     || '',
  status:         row.status           || 'todo',
  devopsNotes:    row.devops_notes     || '',
  country:        row.country          || '',
  jiraTicketKey:  row.jira_ticket_key  || null,
  createdAt:      row.created_at       || null,
  updatedAt:      row.updated_at       || null,
})

export const fromDevopsRequest = (req) => ({
  project_id:    String(req.projectId),
  project_name:  req.projectName,
  builder_email: req.builderEmail,
  requested_by:  req.requestedBy,
  github_repo:   req.githubRepo  || null,
  hosting:       req.hosting     || null,
  database:      req.database    || null,
  status:           req.status         || 'todo',
  devops_notes:     req.devopsNotes    || null,
  country:          req.country        || null,
  jira_ticket_key:  req.jiraTicketKey  || null,
  updated_at:       new Date().toISOString(),
})

export const loadDevopsRequests = async () => {
  const { data, error } = await supabase
    .from('devops_requests').select('*').order('created_at', { ascending: false })
  if (error) { console.error('loadDevopsRequests:', error); return [] }
  return data.map(toDevopsRequest)
}
