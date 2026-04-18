# 🫙 The Jar — Setup Guide (Firebase + Vercel)

---

## Project Structure

```
thejar/
├── public/
│   └── index.html           ← the site
├── api/
│   ├── auth.js              ← verifies password, returns token
│   ├── getTasks.js          ← reads from Firestore (public)
│   └── updateTasks.js       ← writes to Firestore (token required)
├── vercel.json
├── package.json
├── initial-data.json        ← paste this into Firestore to start
└── README.md
```

---

## Step 1 — Firebase Setup

1. Go to **https://console.firebase.google.com** → Create a project (no analytics needed)
2. Go to **Firestore Database** → Create database → Start in **test mode** (we'll secure it via the API, not Firestore rules)
3. Go to **Project Settings → Service Accounts → Generate new private key**
   - This downloads a JSON file. You'll need three values from it:
   - `project_id`
   - `client_email`
   - `private_key`
4. In Firestore, create a document manually:
   - Collection: `jar`
   - Document ID: `tasks`
   - Add a field: `data` (type: string) → paste the entire contents of `initial-data.json` as the value
   - Add a field: `updatedAt` (type: string) → today's date e.g. `2026-04-18`

---

## Step 2 — Vercel Setup

1. Push this folder to a GitHub repo
2. Import to **https://vercel.com** → select the repo
3. Go to **Settings → Environment Variables** and add all five:

| Name                     | Value                                      |
|--------------------------|--------------------------------------------|
| `FIREBASE_PROJECT_ID`    | `project_id` from service account JSON     |
| `FIREBASE_CLIENT_EMAIL`  | `client_email` from service account JSON   |
| `FIREBASE_PRIVATE_KEY`   | `private_key` from service account JSON (include the `-----BEGIN...` lines, paste as-is) |
| `SITE_PASSWORD`          | your chosen password (only you know this)  |
| `TOKEN_SECRET`           | any long random string e.g. `xK9#mP2$qL8` |

4. Deploy → done ✅

---

## How it works

### API calls per day
- **Morning (first load):** 1 read from Firestore → cached in localStorage
- **All day:** check/uncheck only touches localStorage — 0 API calls
- **Midnight:** 1 write to Firestore with final state
- **Total: 2 calls/day** → 10,000 free Firestore reads/day means effectively unlimited

### Auth flow
```
You enter password
  → POST /api/auth (password never stored in JS)
  → Vercel checks against SITE_PASSWORD env var
  → Returns a daily HMAC token
  → Stored in localStorage (if "remember me") or sessionStorage
  → Token sent with every write request
  → Visitors without token can VIEW but not check/uncheck
```

### Midnight sync
- A timer fires at exactly midnight
- Pushes the day's localStorage state to Firestore
- If tab was closed at midnight, the next morning's load catches up and syncs yesterday first

---

## Adding tasks each morning

1. Go to **Firebase Console → Firestore → jar → tasks**
2. Edit the `data` field (it's a JSON string)
3. Add a new day block to the `days` array:

```json
{
  "date": "2026-04-19",
  "tasks": [
    { "id": "2026-04-19-1", "label": "Your task", "done": false },
    { "id": "2026-04-19-2", "label": "Another task", "done": false }
  ]
}
```

4. Save → refresh the site next morning → new slips appear

---

## Notes

- The `FIREBASE_PRIVATE_KEY` env var must preserve newlines. Paste it exactly as it appears in the downloaded JSON (Vercel handles this correctly).
- If you rotate your password, update `SITE_PASSWORD` in Vercel and redeploy. Old tokens expire naturally at midnight anyway.
- Firestore free tier: 50,000 reads/day, 20,000 writes/day — more than enough for lifetime personal use.