# Bandon Tournament Tracker

Real-time scoring app for the Bandon Dunes boys trip, August 28–31. Tracks Hit-A-House Championship (individual net stroke play), Anti-Shtick Invitational (team match play), and skins across 6 rounds on 4 courses.

This README walks you through deploying it for free using Firebase (database) + Vercel (hosting). End-to-end setup is about an hour.

---

## What you'll do

1. Install dependencies and try the app locally
2. Create a free Firebase project for the database
3. Plug Firebase credentials into the app
4. Push to GitHub
5. Deploy to Vercel and get a shareable URL

You'll need accounts on **GitHub**, **Firebase** (Google account), and **Vercel** (sign in with GitHub). All free. You'll also need **Node.js 18+** installed locally — grab it from https://nodejs.org if you don't have it.

---

## Step 1: Install and try it locally (5 min)

In a terminal, in this folder:

```bash
npm install
```

That installs React, Vite, Firebase, and lucide-react. Takes 30 seconds.

```bash
npm run dev
```

Open http://localhost:5173 in your browser. You'll see a "Firebase setup required" screen — expected, you haven't configured anything yet. Move to Step 2.

---

## Step 2: Create the Firebase project (5 min)

1. Go to https://console.firebase.google.com
2. Click **Add project** (or **Create a project**)
3. Name it whatever you want, e.g. `bandon-2026`. Click **Continue**.
4. **Disable Google Analytics** when asked — not needed and adds friction. Click **Create project**.
5. Wait ~30 seconds for provisioning, then click **Continue**.

---

## Step 3: Enable Firestore (3 min)

1. In the left sidebar of your new Firebase project, click **Build → Firestore Database**
2. Click **Create database**
3. Pick **Start in production mode** → **Next**
4. For location, pick **`us-west1` (Oregon)** — closest to Bandon, lowest latency. (Or whichever region is closest to your group.) Click **Enable**.

Wait ~30 seconds for it to provision.

---

## Step 4: Set the security rules (2 min)

The default rules block all reads/writes. Replace them:

1. In Firestore, click the **Rules** tab (top of the page)
2. Select all existing text and delete it
3. Paste the contents of `firestore.rules` from this project
4. Click **Publish**

This allows anyone with your app URL to read and write tournament data. For a buddy trip where you control who has the URL, this is the right tradeoff — it avoids requiring everyone to sign in. See "Optional: lock down access" at the bottom of this README for tighter security.

---

## Step 5: Get your Firebase config (3 min)

1. In the top-left of the Firebase console, click the **gear icon** next to "Project Overview" → **Project settings**
2. Scroll down to **Your apps**
3. Click the **`</>`** icon (Web app)
4. Give it a nickname like `Bandon Tournament Web` → **Register app**
5. Firebase shows you a code block with `firebaseConfig = { ... }`. Copy these six values.

Now plug them into your project:

1. In this folder, copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor and fill in the values from the Firebase console.

The keys map like this:

| Firebase console | .env variable |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

**These keys aren't secret** — they identify your project to the SDK, but actual security is enforced by Firestore rules (which you set in Step 4). It's fine to commit them to a private repo. Don't commit them to a public repo as a matter of hygiene.

---

## Step 6: Test locally with real Firebase (2 min)

```bash
npm run dev
```

Open http://localhost:5173. You should now see the player picker on first launch ("Which one are you?"). Pick yourself, enter a few test scores. Open a second browser window (incognito or another browser entirely) and load the same URL — you should see scores update within ~1 second across both windows. That confirms Firebase is wired up correctly.

To verify the data is hitting Firestore: in the Firebase console, go to **Firestore Database** → you should see a `bandon-2026` collection appear with `meta`, `settings`, and `scores-r1` documents.

When you're done testing, wipe the test data: in the app, go to **Setup tab → Reset everything to defaults**.

---

## Step 7: Push to GitHub (5 min)

If you don't have a GitHub repo yet:

1. Go to https://github.com → click **New repository**
2. Name it `bandon-tournament` (or anything else). **Private** is fine. Don't add a README/license — we already have a README.
3. Click **Create repository**
4. Follow the "push an existing repository" instructions GitHub shows. Roughly:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bandon-tournament.git
git push -u origin main
```

The `.env` file is in `.gitignore`, so your Firebase keys won't be pushed. Vercel will get them via its own env-vars system in Step 8.

---

## Step 8: Deploy to Vercel (5 min)

1. Go to https://vercel.com → **Sign Up** with your GitHub account
2. On the dashboard, click **Add New… → Project**
3. Find your `bandon-tournament` repo in the list, click **Import**
4. Vercel auto-detects this as a Vite app. Don't change the build settings.
5. Expand **Environment Variables**. Add all six `VITE_FIREBASE_*` variables — same names and values as your local `.env`. Don't forget any.
6. Click **Deploy**. Takes 60–90 seconds.

When it's done, you'll get a URL like `bandon-tournament-abc123.vercel.app`. Click it to open. The app loads with live data from Firestore. **Share this URL with your friends.**

To update the app later, just `git push` to your `main` branch — Vercel auto-rebuilds and redeploys in ~60 seconds.

---

## Step 9: Optional — custom domain or shorter URL

The default `*.vercel.app` URL is fine, but you can change it.

**Free option**: In Vercel → your project → **Settings → Domains**, you can rename the subdomain to something cleaner like `bandon-2026.vercel.app` if it's available.

**Paid option ($10–15/year)**: Buy a domain on Namecheap or Cloudflare and point it at Vercel. Vercel → Settings → Domains has step-by-step instructions.

---

## Cost expectations

**Will I get a bill?** No. Here's why.

For your 4-day, 8-person tournament, the app will generate:
- **~15 KB of data total**
- **~8,000 reads on the busiest day** (8 people × real-time subscriptions × 4 hours active per round)
- **~1,500 writes on the busiest day** (8 people × 18 holes × 6 rounds, spread over 4 days)

Firebase Spark (free) tier limits, per day:
- 1 GB storage (you use < 0.001%)
- 50,000 reads (you use < 16%)
- 20,000 writes (you use < 8%)

Vercel Hobby (free) tier limits, per month:
- 100 GB bandwidth (you use < 1 GB)

Both free tiers are permanent — they don't expire after a trial period. The only way you'd get a bill is if you opt into a paid tier, which there's no reason to do.

---

## Troubleshooting

**"Firebase setup required" screen after deploying to Vercel.** Env vars aren't set. Vercel → Project → Settings → Environment Variables — make sure all six `VITE_FIREBASE_*` are there. After adding, go to the Deployments tab and click **Redeploy** on the latest one.

**Scores show locally but not on a friend's phone.** Most likely: they're hitting a cached version. Have them hard-refresh (long-press the reload button on mobile) or close and reopen the browser tab.

**"Missing or insufficient permissions" error in the console.** Firestore rules weren't published. Repeat Step 4.

**Schema changed and I want to start fresh.** In the app, **Setup tab → Reset everything to defaults**. This wipes the Firestore data and reseeds with the current code defaults.

**Anyone with the URL can edit scores — including by accident.** Yes, that's the current setup. If someone's editing the wrong player's column, that's a UX risk, not a security one. The app has a "who am I" picker that highlights your own column in orange to mitigate this; remind your friends to set it on first launch.

---

## Optional: lock down access

If you want only specific email addresses to be able to edit:

1. Firebase Console → **Build → Authentication → Get started**
2. Enable **Email/Password** and/or **Google** sign-in
3. Update `firestore.rules` to require `request.auth != null` (or check email against a whitelist)
4. Add a sign-in flow to the app — this is ~30 minutes of additional code; let me know if you want help

For 8 friends sharing a private URL, this is almost always overkill. Skip unless you're paranoid.

---

## File layout

```
bandon-tournament/
├── .env.example              Template for Firebase config (copy to .env)
├── .gitignore                Don't commit .env or node_modules
├── README.md                 You are here
├── firestore.rules           Security rules to paste into Firebase console
├── index.html                Entry HTML
├── package.json              Dependencies and scripts
├── vite.config.js            Vite build config
└── src/
    ├── App.jsx               The whole app — UI, math, leaderboards
    ├── firebase.js           Firebase init from env vars
    ├── main.jsx              React entry point
    └── storage.js            Firestore data-access layer
```

The entire app logic lives in `src/App.jsx` (~2,000 lines). If you want to tweak rules (tiebreakers, scoring, etc.), that's where.

The data layer is `src/storage.js`. It exposes a small API (`loadAll`, `subscribeAll`, `persistScoreCell`, etc.) and is the only file that knows about Firestore — everything else is plain React.
