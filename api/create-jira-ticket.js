export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

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

  const { summary, description, assigneeAccountId, labels, requestedBy, projectName, githubRepo, hosting, database, remarks } = req.body || {};
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
        customfield_10035: {
          type: 'doc', version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text',
            text: `DevOps setup requested for "${projectName || summary}" by ${requestedBy || 'a Grove user'}.`
          }] }],
        },
        customfield_10036: {
          type: 'doc', version: 1,
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Please set up the DevOps infrastructure for this project:' }] },
            ...[
              githubRepo ? `GitHub Repo: ${githubRepo}` : null,
              hosting    ? `Hosting: ${hosting}`        : null,
              database   ? `Database: ${database}`      : null,
              remarks    ? `Additional Remarks: ${remarks}` : null,
            ].filter(Boolean).map(line => ({
              type: 'paragraph', content: [{ type: 'text', text: line }]
            })),
          ],
        },
        ...(assigneeAccountId && { assignee: { accountId: assigneeAccountId } }),
        ...(labels?.length  && { labels }),
      },
    }),
  });

  const body = await jiraRes.json();
  if (!jiraRes.ok) {
    console.error('Jira error:', JSON.stringify(body));
    const detail = [
      ...(body.errorMessages || []),
      ...Object.values(body.errors || {}),
    ].join('; ') || `HTTP ${jiraRes.status}`;
    return res.status(jiraRes.status).json({ error: detail });
  }

  // Add a comment indicating the ticket was generated from Grove
  try {
    const requesterLabel = requestedBy || 'a Grove user';
    await fetch(`https://${JIRA_HOST}/rest/api/3/issue/${body.key}/comment`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '🌱 This ticket was automatically generated from ' },
                { type: 'text', text: 'Grove', marks: [{ type: 'strong' }] },
                { type: 'text', text: ` by ${requesterLabel}.` },
              ],
            },
          ],
        },
      }),
    });
  } catch (commentErr) {
    console.warn('Could not post Grove comment:', commentErr.message);
  }

  return res.status(200).json({ key: body.key, id: body.id });
}
