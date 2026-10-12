export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ ok: false, error: 'Supabase env vars not configured' });
  }

  const checks = {};
  const ts = new Date().toISOString();

  // Ping Supabase — a HEAD request with the anon key is enough to register
  // activity and prevent the project from being paused due to inactivity.
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`, {
      method: 'HEAD',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    // 200 = data returned, 406 = RLS blocked but DB was reached — both mean Supabase is up.
    checks.supabase = r.ok || r.status === 406 ? 'ok' : `error:${r.status}`;
  } catch (e) {
    checks.supabase = `error:${e.message}`;
  }

  const ok = Object.values(checks).every(v => v === 'ok');
  return res.status(ok ? 200 : 503).json({ ok, ts, checks });
}
