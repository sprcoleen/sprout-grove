export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_HOST  = process.env.JIRA_HOST || 'sprouthq.atlassian.net';

  if (!JIRA_EMAIL || !JIRA_TOKEN) {
    return res.status(500).json({ error: 'Jira credentials not configured' });
  }

  const { keys } = req.body || {};
  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: 'keys[] is required' });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };

  const results = await Promise.all(keys.map(async (key) => {
    try {
      const r = await fetch(
        `https://${JIRA_HOST}/rest/api/3/issue/${encodeURIComponent(key)}?fields=status`,
        { headers }
      );
      if (r.status === 404) return { key, found: false };
      if (!r.ok) return { key, found: null, error: `HTTP ${r.status}` };
      const data = await r.json();
      return {
        key,
        found:          true,
        jiraStatus:     data.fields.status.name,
        statusCategory: data.fields.status.statusCategory.key,
      };
    } catch (e) {
      return { key, found: null, error: e.message };
    }
  }));

  return res.status(200).json({ results });
}
