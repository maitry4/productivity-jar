// api/updateTasks.js
// Protected endpoint — requires a valid token to WRITE.
// Validates the token server-side before touching Firestore.

import { createHmac } from 'crypto';

const PROJECT_ID   = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const TOKEN_SECRET = process.env.TOKEN_SECRET;

function verifyToken(token) {
  if (!token) return false;
  const day = new Date().toISOString().slice(0, 10);
  const expected = createHmac('sha256', TOKEN_SECRET).update(day).digest('hex');
  return token === expected;
}

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
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  // Verify token
  const token = req.headers['x-auth-token'];
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;
  if (!body || !body.days) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  try {
    const accessToken = await getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/jar/tasks`;

    const firestoreRes = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          data: { stringValue: JSON.stringify(body) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });

    if (!firestoreRes.ok) {
      const err = await firestoreRes.text();
      return res.status(firestoreRes.status).json({ error: err });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}