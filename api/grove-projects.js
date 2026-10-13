/**
 * GET /api/grove-projects
 *
 * Read-only public API for pulling Grove project records.
 * Requires: x-api-key header matching GROVE_API_KEY env var.
 *
 * Query params:
 *   country = PH | TH
 *   stage   = seedling | nursery | sprout | bloom | thriving
 *   tier    = 1 | 2 | 3
 *   limit   = number (default 100, max 500)
 *   offset  = number (default 0)
 */

const ALLOWED_STAGES = ['seedling', 'nursery', 'sprout', 'bloom', 'thriving'];
const ALLOWED_COUNTRIES = ['PH', 'TH'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.GROVE_API_KEY;
  if (!expectedKey) return res.status(500).json({ error: 'API key not configured on server' });
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Missing or invalid x-api-key header' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // Parse query params
  const { country, stage, tier } = req.query;
  const limit  = Math.min(parseInt(req.query.limit  || '100', 10), 500);
  const offset = Math.max(parseInt(req.query.offset || '0',   10), 0);

  if (country && !ALLOWED_COUNTRIES.includes(country)) {
    return res.status(400).json({ error: 'Invalid country — must be PH or TH' });
  }
  if (stage && !ALLOWED_STAGES.includes(stage)) {
    return res.status(400).json({ error: `Invalid stage — must be one of: ${ALLOWED_STAGES.join(', ')}` });
  }
  if (tier && !['1', '2', '3'].includes(String(tier))) {
    return res.status(400).json({ error: 'Invalid tier — must be 1, 2, or 3' });
  }

  // Build Supabase query
  // Expose public fields only — no emails, no admin flags
  const select = [
    'id', 'name', 'description', 'stage', 'country', 'tier',
    'department', 'capabilities', 'has_backend', 'target_users',
    'demo_link', 'github_repo', 'hosting',
    'requires_auth', 'auth_type', 'has_database',
    'connects_sprout_db', 'data_sensitivity', 'sends_to_external_ai',
    'last_updated', 'created_at',
  ].join(',');

  let url = `${SUPABASE_URL}/rest/v1/projects?select=${select}&order=last_updated.desc&limit=${limit}&offset=${offset}`;
  if (country) url += `&country=eq.${country}`;
  if (stage)   url += `&stage=eq.${stage}`;
  if (tier)    url += `&tier=eq.${tier}`;

  try {
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
        Prefer: 'count=exact',
      },
    });

    if (!r.ok) {
      return res.status(502).json({ error: 'Upstream error', status: r.status });
    }

    const data = await r.json();
    const total = parseInt(r.headers.get('content-range')?.split('/')[1] || '0', 10);

    return res.status(200).json({
      total,
      limit,
      offset,
      count: data.length,
      projects: data,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
