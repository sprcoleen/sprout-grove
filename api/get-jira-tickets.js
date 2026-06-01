export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_HOST  = process.env.JIRA_HOST || 'sprouthq.atlassian.net';

  if (!JIRA_EMAIL || !JIRA_TOKEN) {
    return res.status(500).json({ error: 'Jira credentials not configured on server' });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  const jql  = encodeURIComponent('project = DEV AND labels = "Src-Grove" ORDER BY created DESC');
  const fields = 'summary,status,created,updated,assignee,labels';

  try {
    const jiraRes = await fetch(
      `https://${JIRA_HOST}/rest/api/3/search?jql=${jql}&fields=${fields}&maxResults=50`,
      { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } }
    );

    const body = await jiraRes.json();
    if (!jiraRes.ok) {
      const detail = [...(body.errorMessages || []), ...Object.values(body.errors || {})].join('; ') || `HTTP ${jiraRes.status}`;
      return res.status(jiraRes.status).json({ error: detail });
    }

    const tickets = (body.issues || []).map(issue => ({
      key:            issue.key,
      url:            `https://${JIRA_HOST}/browse/${issue.key}`,
      summary:        issue.fields.summary?.replace(/^Grove SRC:\s*/i, '') || issue.fields.summary,
      fullSummary:    issue.fields.summary,
      status:         issue.fields.status.name,
      statusCategory: issue.fields.status.statusCategory.key, // 'new' | 'indeterminate' | 'done'
      statusColor:    issue.fields.status.statusCategory.colorName,
      created:        issue.fields.created,
      updated:        issue.fields.updated,
      assignee:       issue.fields.assignee?.displayName || null,
    }));

    return res.status(200).json({ tickets });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
