export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_HOST  = process.env.JIRA_HOST || 'sprouthq.atlassian.net';
  const PROJECT_KEY = 'DEV';

  if (!JIRA_EMAIL || !JIRA_TOKEN) {
    return res.status(500).json({ error: 'Jira credentials not configured on server' });
  }

  const { summary, description } = req.body || {};
  if (!summary) {
    return res.status(400).json({ error: 'summary is required' });
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');

  const jiraRes = await fetch(`https://${JIRA_HOST}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: { key: PROJECT_KEY },
        summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: description || summary }],
            },
          ],
        },
        issuetype: { name: 'Task' },
      },
    }),
  });

  const body = await jiraRes.json();
  if (!jiraRes.ok) {
    console.error('Jira error:', body);
    return res.status(jiraRes.status).json({ error: body.errorMessages || body });
  }

  return res.status(200).json({ key: body.key, id: body.id });
}
