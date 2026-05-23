# Bandon Tournament Tracker

Real-time scoring app for the Bandon Dunes boys trip, August 28–31. Tracks Hit-A-House Championship (individual net stroke play), Anti-Shtick Invitational (team match play, scored hole-by-hole), and skins across 6 rounds on 4 courses.

This README walks you through deploying it for free using Firebase (database) + Vercel (hosting).

---

## How scoring works

**Hit-A-House Championship** — Individual net stroke play. R1, R2, R4 morning rounds qualify; lowest combined net advances. Top 4 play R6 on Monday from the green tees.

**Anti-Shtick Invitational** — Team match play, hole-by-hole scoring across all 4 AS rounds (R2, R3, R4, R5).
- Every hole you win = 1 point. Halved holes = 0.5 each.
- The overall winner is whoever piles up the most total hole-wins across their 4 matches (max 72 if you win every hole).
- After R4, top 2 teams meet in the Championship Final at R5 12:40 PM, bottom 2 in the Consolation Final at 12:50 PM. Both matches feed the same overall total — so the bottom-2 winner can still take the whole tournament if they steamroll their match.

**Skins** — Every round, every hole. Strokes off the field's lowest handicap (Alex). Optional carryover for ties (toggle in Setup).

**Score cap** — Any individual hole maxes at par + 4. (Enter higher and it auto-caps on blur.)

---

## What you'll do

1. Install dependencies and try the app locally
2. Create a free Firebase project for the database
3. Plug Firebase credentials into the app
4. Push to GitHub
5. Deploy to Vercel and get a shareable URL

You'll need accounts on **GitHub**, **Firebase** (Google account), and **Vercel** (sign in with GitHub). All free. You'll also need **Node.js 18+** — grab it from https://nodejs.org if you don't have it.

---

## Step 1: Install and try it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you'll see a "Firebase setup required" screen. Expected. Move to Step 2.

---

## Step 2: Create the Firebase project

1. https://console.firebase.google.com → **Add project**
2. Name it `bandon-2026` → **Continue**
3. **Disable Google Analytics** → **Create project**

---

## Step 3: Enable Firestore

1. **Build → Firestore Database → Create database**
2. **Standard edition → Next**
3. Database ID: `(default)`. Location: `us-west1 (Oregon)` → **Next**
4. Pick **Production mode** → **Create**

---

## Step 4: Set the security rules

1. In Firestore, click the **Rules** tab
2. Delete what's there
3. Paste the contents of `firestore.rules` from this project
4. Click **Publish**

---

## Step 5: Get your Firebase config

1. **Gear icon (top-left) → Project settings**
2. Scroll to **Your apps** → click the **`</>`** web icon
3. Nickname: `Bandon Web` → **Register app** (skip "Set up Firebase Hosting")
4. Copy the six values from `firebaseConfig`
5. Locally: `cp .env.example .env` and fill in the values:

| Firebase console | .env variable |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

---

## Step 6: Test locally with real Firebase

```bash
npm run dev
```

Open http://localhost:5173. Pick yourself on the "Which one are you?" screen, enter a few test scores. Open the same URL in another browser window — scores should sync within a second.

When done testing: **Setup tab → Reset everything to defaults** to wipe test data.

---

## Step 7: Push to GitHub

If your repo is already set up, just commit and push the new code via GitHub Desktop. The new `src/` folder has these files:

```
src/App.jsx          (main app)
src/components.jsx   (UI components)
src/firebase.js      (Firebase init)
src/lib.js           (constants + math)
src/main.jsx         (React entry)
src/storage.js       (Firestore data layer)
src/styles.js        (Masters-inspired styling)
```

`.env` stays out of GitHub (it's in `.gitignore`).

---

## Step 8: Deploy to Vercel

If you already have a Vercel project pointed at this repo, just push — it auto-redeploys in 60–90 seconds. Otherwise:

1. https://vercel.com → **Add New… → Project**
2. Import the GitHub repo
3. Expand **Environment Variables** and add all six `VITE_FIREBASE_*` (same names and values as your `.env`)
4. **Deploy**

---

## Using the app on game day

1. **Open the URL on your phone.** Add to home screen for quick access.
2. **First time only:** tap your name on the "Which one are you?" screen.
3. Tap **Scoring** at the bottom → tap your round → tap your tee time → **Begin Round**.
4. Enter all 4 scores for hole 1 → tap **Next Hole**. Repeat 17 more times.
5. Need to fix a previous hole? Tap **Previous Hole** or use the hole-number grid at the bottom of the screen.
6. After hole 18: tap **Finish Round ✓** to go back.
7. **Boards** tab shows live leaderboards. They update in real time as any of you enter scores.

**Locking in R5 finalists:** After R4 wraps, open R5 from the Scoring tab — there's a "Lock in finalists" button at the top. It snaps the matchups based on current AS standings (top 2 → Championship 12:40, bottom 2 → Consolation 12:50). Both matches count toward the overall AS title.

---

## Cost expectations

For a 4-day, 8-person tournament:
- ~15 KB of data total
- ~8,000 reads/day at peak
- ~1,500 writes/day at peak

Firebase Spark (free) tier limits per day: 1 GB storage, 50,000 reads, 20,000 writes. You'll use well under 1% of any limit.

---

## Troubleshooting

**"Firebase setup required" after deploy.** Env vars missing. Vercel → Project → Settings → Environment Variables → confirm all six. Then Deployments tab → Redeploy.

**Scores show locally but not on a friend's phone.** Hard refresh (long-press reload on mobile). The data IS in Firestore; the issue is a cached old build.

**A score I entered didn't save / shows wrong.** The score may have been capped at par + 4. That's by design.

**The Boards page hasn't updated.** Subscriptions auto-update within a second. If it seems stuck, tap the refresh button at the top-right.

**I want to start over.** Setup tab → Reset everything to defaults.

