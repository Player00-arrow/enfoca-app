// Vercel serverless function: POST /api/my-sessions
// Returns one employee's own session rows — used by "Mi progreso". Open by
// name (no login in this app), same low-stakes posture as before: anyone
// could type someone else's name, but this is game scores, not sensitive
// data. The aggregate, all-employee view lives behind /api/sst-sessions
// instead, which actually checks a secret.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Supabase no está configurado en Vercel' });
    return;
  }

  const employee = ((req.body && req.body.employee) || '').trim();
  if (!employee) {
    res.status(400).json({ error: 'Falta employee' });
    return;
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/sessions?empleado=eq.${encodeURIComponent(employee)}&order=ts.desc&limit=200`;
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
