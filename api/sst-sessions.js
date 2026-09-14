// Vercel serverless function: POST /api/sst-sessions
// Returns EVERY session row — powers the SST panel. Gated by a real,
// server-side secret: the client sends `code`, and only a match against
// SST_ACCESS_CODE (set in Vercel, never shipped to the browser) unlocks
// the data. This is the actual access control the Claude-preview version
// could only fake client-side.
//
// Required Vercel environment variables (in addition to the Supabase ones):
//   SST_ACCESS_CODE = the code SST uses to open the panel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SST_ACCESS_CODE } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SST_ACCESS_CODE) {
    res.status(500).json({ error: 'Falta configuración en el servidor' });
    return;
  }

  const code = (req.body && req.body.code) || '';
  if (code !== SST_ACCESS_CODE) {
    res.status(401).json({ error: 'Código incorrecto' });
    return;
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/sessions?order=ts.desc&limit=1000`;
    const upstream = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!upstream.ok) {
      res.status(502).json({ error: 'Supabase respondió con error' });
      return;
    }
    res.status(200).json(await upstream.json());
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar Supabase' });
  }
}
