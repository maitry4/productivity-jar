// api/updateTasks.js
// Serverless function — runs on Vercel, never exposed to the browser.
// Writes the full updated tasks JSON back to JSONBin.
// Called when the user checks/unchecks a task OR adds new tasks via the admin panel.

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BIN_ID  = process.env.JSONBIN_BIN_ID;
  const API_KEY = process.env.JSONBIN_API_KEY;

  if (!BIN_ID || !API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing env vars' });
  }

  let body;
  try {
    // Vercel parses JSON body automatically
    body = req.body;
    if (!body || !body.days) {
      return res.status(400).json({ error: 'Invalid body: expected { days: [...] }' });
    }
  } catch {
    return res.status(400).json({ error: 'Could not parse request body' });
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `JSONBin error: ${text}` });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, record: data.record });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
