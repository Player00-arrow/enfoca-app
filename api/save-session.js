// Vercel serverless function: POST /api/save-session
// Inserts one game-session row directly into Supabase using the SERVICE
// ROLE key (kept only in Vercel's environment variables — never sent to
// the browser). The service role key bypasses Row Level Security, so no
// RLS policies need to be configured on the table.
//
// Required Vercel environment variables:
//   SUPABASE_URL               = https://xxxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  = Settings > API > service_role (secret)

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

  const b = req.body || {};
  const blank = (v) => (v === '' || v === undefined ? null : v);
  const row = {
    fecha: b.fecha,
    hora: b.hora,
    ts: b.ts,
    empleado: b.empleado,
    juego: b.juego,
    puntaje: b.puntaje,
    nivel: blank(b.nivel),
    precision_pct: blank(b.precision),
    tiempo_reaccion_ms: blank(b.tiempoReaccionMs),
    aciertos: blank(b.aciertos),
    fallos: blank(b.fallos),
    falsos: blank(b.falsos),
  };

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(502).json({ error: 'Supabase respondió con error', detail });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar Supabase' });
  }
}
