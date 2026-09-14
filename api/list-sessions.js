// Vercel serverless function: POST /api/list-sessions
// Relays to the Power Automate flow that reads every row currently in the
// Excel table in OneDrive, so the app's "Mi progreso" and "Panel SST" views
// can render live stats without talking to Microsoft Graph directly.
//
// Required Vercel environment variable:
//   POWER_AUTOMATE_READ_URL = the "HTTP POST URL" of the read flow.
//
// Expected shape back from the flow's Response action: either a bare array
// of row objects, or { rows: [...] } / { value: [...] } — each row with the
// same keys save-session.js sends (empleado, juego, puntaje, fecha, hora, ts).

export default async function handler(req, res) {
  const url = process.env.POWER_AUTOMATE_READ_URL;
  if (!url) {
    res.status(500).json({ error: 'POWER_AUTOMATE_READ_URL no está configurada en Vercel' });
    return;
  }

  try {
    const upstream = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!upstream.ok) {
      res.status(502).json({ error: 'Power Automate respondió con error', status: upstream.status });
      return;
    }
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar Power Automate' });
  }
}
