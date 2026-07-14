const WEBHOOK = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK_URL;

const TIER_INFO = {
  1: { label: "T1 — Static/Internal",      support: "No Groundskeeper needed — owner uploads to Markup directly." },
  2: { label: "T2 — Internal App",          support: "Groundskeeper team handles setup (Coleen, Blaise, Nikki, Raffy). IS/Execom approval required." },
  3: { label: "T3 — External-Facing",       support: "Groundskeeper team handles setup (Coleen, Blaise, Nikki, Raffy). IS/Execom approval + DPO/privacy review required." },
};

const STAGE_LABEL = {
  seedling: "Seedling", nursery: "Nursery", sprout: "Sprout",
  bloom: "Bloom", thriving: "Thriving",
};

function tierLine(tier) {
  const info = TIER_INFO[tier];
  if (!info) return "• Tier: Unclassified — owner should complete classification.";
  return `• Tier: ${info.label}\n• Support: ${info.support}`;
}

export async function notifyProjectCreated(project) {
  if (!WEBHOOK) return;
  const dept = Array.isArray(project.builtFor) ? project.builtFor.join(", ") : (project.builtFor || "—");
  const stage = STAGE_LABEL[project.stage] || project.stage || "—";
  const text = [
    `🌱 *New project added on Grove*`,
    ``,
    `*${project.name}* was added by ${project.builder || project.builderEmail}.`,
    `• Stage: ${stage}`,
    `• Department: ${dept}`,
    tierLine(project.tier),
  ].join("\n");

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(err => console.warn("gchat notify failed:", err));
}

export async function notifySupportRequested({ projectName, requestedBy, tier, jiraTicketKey }) {
  if (!WEBHOOK) return;
  const info = TIER_INFO[tier];
  const handler = info
    ? (tier === 1 ? "No Groundskeeper needed for T1 projects." : "Groundskeeper team (Coleen, Blaise, Nikki, Raffy)")
    : "Unclassified — classify the project first.";
  const text = [
    `🔧 *Setup support requested on Grove*`,
    ``,
    `*${projectName}* needs infrastructure setup.`,
    `• Requested by: ${requestedBy}`,
    `• Tier: ${info ? info.label : "Unclassified"}`,
    `• Who handles: ${handler}`,
    jiraTicketKey ? `• Jira: ${jiraTicketKey}` : null,
  ].filter(Boolean).join("\n");

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(err => console.warn("gchat notify failed:", err));
}
