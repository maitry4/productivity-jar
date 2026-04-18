// api/auth.js
// Verifies the password against the one stored in Vercel env vars.
// Returns a signed token (simple HMAC) the client stores in localStorage.
// Never exposes the password to the browser.

import { createHmac } from 'crypto';

const TOKEN_SECRET  = process.env.TOKEN_SECRET;   // any long random string
const SITE_PASSWORD = process.env.SITE_PASSWORD;  // your chosen password

function makeToken() {
  // Token = today's date + HMAC signed with TOKEN_SECRET
  // Expires daily — client must re-verify if date changes (but "remember me" re-verifies silently)
  const day = new Date().toISOString().slice(0, 10);
  return createHmac('sha256', TOKEN_SECRET).update(day).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'No password provided' });

  if (password !== SITE_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  return res.status(200).json({ token: makeToken() });
}