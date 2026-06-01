/**
 * Local API server for development.
 * Runs alongside `npm run dev` to serve /api/* routes.
 * Usage: node server/local-api.js
 */
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env.local into process.env
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    process.env[key] = val;
  });
  console.log('✅ Loaded .env.local');
}

const PORT        = 3001;
const JIRA_EMAIL  = process.env.JIRA_EMAIL;
const JIRA_TOKEN  = process.env.JIRA_API_TOKEN;
const JIRA_HOST   = process.env.JIRA_HOST || 'sprouthq.atlassian.net';
const auth        = JIRA_EMAIL && JIRA_TOKEN
  ? Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')
  : null;

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  console.log(`→ ${req.method} ${url.pathname}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  if (!auth) {
    return sendJSON(res, 500, { error: 'Jira credentials not configured on server' });
  }

  // ── GET /api/get-jira-tickets ─────────────────────────────────────────────
  if (url.pathname === '/api/get-jira-tickets' && req.method === 'GET') {
    try {
      const jiraRes = await fetch(`https://${JIRA_HOST}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jql: 'project = DEV AND labels = "Src-Grove" ORDER BY created DESC',
          fields: ['summary', 'status', 'created', 'updated', 'assignee', 'labels'],
          maxResults: 50,
        }),
      });
      const body = await jiraRes.json();
      if (!jiraRes.ok) {
        const detail = [...(body.errorMessages || []), ...Object.values(body.errors || {})].join('; ') || `HTTP ${jiraRes.status}`;
        return sendJSON(res, jiraRes.status, { error: detail });
      }
      const tickets = (body.issues || []).map(issue => ({
        key:            issue.key,
        url:            `https://${JIRA_HOST}/browse/${issue.key}`,
        summary:        issue.fields.summary?.replace(/^Grove SRC:\s*/i, '') || issue.fields.summary,
        status:         issue.fields.status.name,
        statusCategory: issue.fields.status.statusCategory.key,
        created:        issue.fields.created,
        updated:        issue.fields.updated,
        assignee:       issue.fields.assignee?.displayName || null,
      }));
      return sendJSON(res, 200, { tickets });
    } catch (e) {
      return sendJSON(res, 500, { error: e.message });
    }
  }

  // ── POST /api/create-jira-ticket ──────────────────────────────────────────
  if (url.pathname === '/api/create-jira-ticket' && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    await new Promise(r => req.on('end', r));
    const { summary, description, assigneeAccountId, labels, requestedBy, projectName, githubRepo, hosting, database, remarks } = JSON.parse(Buffer.concat(chunks).toString() || '{}');

    if (!summary) return sendJSON(res, 400, { error: 'summary is required' });

    try {
      const jiraRes = await fetch(`https://${JIRA_HOST}/rest/api/3/issue`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            project: { key: 'DEV' },
            summary,
            description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: description || summary }] }] },
            issuetype: { name: 'Task' },
            customfield_10035: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: `DevOps setup requested for "${projectName || summary}" by ${requestedBy || 'a Grove user'}.` }] }] },
            customfield_10036: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Please set up the DevOps infrastructure:' }] }, ...[githubRepo && `GitHub Repo: ${githubRepo}`, hosting && `Hosting: ${hosting}`, database && `Database: ${database}`, remarks && `Additional Remarks: ${remarks}`].filter(Boolean).map(t => ({ type: 'paragraph', content: [{ type: 'text', text: t }] }))] },
            ...(assigneeAccountId && { assignee: { accountId: assigneeAccountId } }),
            ...(labels?.length && { labels }),
          },
        }),
      });
      const body = await jiraRes.json();
      if (!jiraRes.ok) {
        const detail = [...(body.errorMessages || []), ...Object.values(body.errors || {})].join('; ') || `HTTP ${jiraRes.status}`;
        return sendJSON(res, jiraRes.status, { error: detail });
      }
      // Post comment
      try {
        await fetch(`https://${JIRA_HOST}/rest/api/3/issue/${body.key}/comment`, {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: '🌱 This ticket was automatically generated from ' }, { type: 'text', text: 'Grove', marks: [{ type: 'strong' }] }, { type: 'text', text: ` by ${requestedBy || 'a Grove user'}.` }] }] } }),
        });
      } catch {}
      return sendJSON(res, 200, { key: body.key, id: body.id });
    } catch (e) {
      return sendJSON(res, 500, { error: e.message });
    }
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`🔧 Local API server running at http://localhost:${PORT}`);
  console.log('   Routes: GET /api/get-jira-tickets, POST /api/create-jira-ticket');
});
