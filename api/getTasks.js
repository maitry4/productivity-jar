// api/getTasks.js
// Public endpoint — no auth needed to READ (visitors can see the jar).
// Reads from Firestore using the Firebase Admin SDK via REST.

const PROJECT_ID  = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL= process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Minimal Firebase Admin auth — get an access token via Google OAuth2
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: CLIENT_EMAIL,
    sub: CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  };

  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Sign with RS256
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(PRIVATE_KEY, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = await getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/jar/tasks`;

    const firestoreRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (firestoreRes.status === 404) {
      // Document doesn't exist yet — return empty scaffold
      return res.status(200).json({ startDate: '2026-04-18', days: [] });
    }

    if (!firestoreRes.ok) {
      const err = await firestoreRes.text();
      return res.status(firestoreRes.status).json({ error: err });
    }

    const doc = await firestoreRes.json();
    // Firestore wraps data in typed fields — extract the raw JSON we stored as a string
    const raw = doc.fields?.data?.stringValue;
    if (!raw) return res.status(200).json({ startDate: '2026-04-18', days: [] });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(JSON.parse(raw));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}