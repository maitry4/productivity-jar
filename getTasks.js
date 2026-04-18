// api/getTasks.js
// Serverless function — runs on Vercel, never exposed to the browser.
// Reads your tasks JSON from JSONBin using the secret API key stored in env vars.

export default async function handler(req, res) {
  // Allow only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BIN_ID  = process.env.JSONBIN_BIN_ID;
  const API_KEY = process.env.JSONBIN_API_KEY;

  if (!BIN_ID || !API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing env vars' });
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY,
        'X-Bin-Meta':   'false',   // returns just the record, no metadata wrapper
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `JSONBin error: ${text}` });
    }

    const data = await response.json();

    // Cache for 60s on CDN edge so repeated loads are fast
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
