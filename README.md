# 🫙 The Jar — Setup Guide

A beautiful daily task tracker. Tasks live in JSONBin, site deploys on Vercel. Your API key never touches the browser.

---

## Project Structure

```
thejar/
├── public/
│   └── index.html          ← the site
├── api/
│   ├── getTasks.js         ← serverless: reads from JSONBin
│   └── updateTasks.js      ← serverless: writes to JSONBin
├── vercel.json             ← routing config
├── initial-data.json       ← paste this into JSONBin to start
└── README.md
```

---

## Step 1 — Create your JSONBin

1. Go to **https://jsonbin.io** and sign up (free)
2. Click **Create Bin**
3. Paste the contents of `initial-data.json` as the bin content
4. Set the bin to **Private** (toggle in the top right)
5. Click **Create Bin**
6. Copy the **Bin ID** from the URL — it looks like `6621f3abc2a35f059865ab12`
7. Go to **API Keys** (top nav) → copy your **Secret Key** (starts with `$2b$...`)

---

## Step 2 — Deploy to Vercel

1. Push this folder to a GitHub repo (can be private)
2. Go to **https://vercel.com** → Import Project → select your repo
3. Leave all build settings as default (Vercel auto-detects the serverless functions)
4. Before deploying, go to **Settings → Environment Variables** and add:

   | Name                | Value                          |
   |---------------------|--------------------------------|
   | `JSONBIN_BIN_ID`    | your bin ID from Step 1        |
   | `JSONBIN_API_KEY`   | your secret key from Step 1    |

5. Click **Deploy** — done! ✅

Your site will be live at `https://your-project.vercel.app`

---

## Daily Workflow

Every morning:
1. Open your site
2. Click the **✏️ button** (bottom right corner)
3. Type today's tasks — one per line
4. Hit **Save to Jar**

Tasks are saved to JSONBin through your secure Vercel API. Check them off during the day — each check persists immediately. The jar fills up over time. 🫙

---

## How the data flows

```
Browser
  │
  ├─► GET /api/getTasks ──────────► JSONBin (with secret key) ──► returns JSON
  │
  └─► PUT /api/updateTasks ───────► JSONBin (with secret key) ──► saves JSON
```

The secret key only ever exists in Vercel's environment — never in your HTML or JS source.

---

## Adding past dates manually

If you want to backfill, use the admin panel and pick any date. Tasks are sorted automatically.

---

## Resetting / starting fresh

Just create a new JSONBin with fresh `initial-data.json` content and update your `JSONBIN_BIN_ID` env var in Vercel.
