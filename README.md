# AirShield

Market-validation landing page for **AirShield One**, a concept full-face motorcycle helmet with integrated air filtration, aimed at Indonesian riders. The page collects waitlist signups, exposure-calculator results, pricing feedback, and other research responses.

Persistence is **Firebase Firestore**, written directly from the browser with the Firebase Web SDK — there is no backend server.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v3 + shadcn/ui (Radix)
- Three.js / @react-three/fiber (hero visuals)
- Firebase Firestore (the only persistence layer)
- Deployed as a static SPA on Vercel

## Data model

Every form writes one document (with a server `createdAt` timestamp) to a Firestore collection via a helper in [`src/lib/airshieldDb.ts`](src/lib/airshieldDb.ts):

| Collection | Written by |
| --- | --- |
| `waitlist_signups` | Beta CTA form |
| `exposure_calculations` | Exposure calculator |
| `price_responses` | Price test |
| `variant_selections` | Product card variant picker |
| `filter_subscriptions` | Filter subscription test |
| `use_case_selections` | Use-case segmentation |
| `objection_selections` | Objection capture + "keep me updated" email |
| `early_access_reservations` | Hero + Product card reserve / WhatsApp |

Form events are also mirrored to `localStorage` (see [`src/lib/tracking.ts`](src/lib/tracking.ts)) as an offline backup and as a hook for future analytics (GA / Meta Pixel).

---

## 1. Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create your env file and fill in the Firebase web config (see step 2 below)
cp .env.example .env

# 3. Start the dev server (http://localhost:3000)
npm run dev
```

Other scripts:

```bash
npm run check     # tsc -b (type-check)
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run lint      # eslint
```

The app reads these `VITE_FIREBASE_*` variables (all public — they ship to the browser):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## 2. Firebase setup (from zero)

1. Go to <https://console.firebase.google.com> → **Add project** → name it (e.g. `airshield`) → create. Analytics is optional.
2. In the left sidebar: **Build → Firestore Database → Create database**. Choose **Production mode** and a region close to your users (e.g. `asia-southeast1` / Singapore). Click Enable.
3. Register a web app: **Project settings (gear icon) → Your apps → Web (`</>`)**. Give it a nickname, register (you do **not** need Firebase Hosting). Copy the `firebaseConfig` values into your `.env`:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
4. Deploy the security rules (see next section).

### Deploy Firestore security rules

The rules in [`firestore.rules`](firestore.rules) allow the public to **create** documents in the eight form collections but **deny all reads/updates/deletes** — so submitted leads can't be scraped. You view submissions in the Firebase console (Firestore → Data).

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your project, give it an alias like "default"
firebase deploy --only firestore:rules
```

> If you skip this, Firestore stays in its locked default state and form writes will be rejected.

---

## 3. Vercel deployment

1. Push this repo to GitHub and **Import** it in Vercel.
2. Vercel auto-detects Vite. Confirm:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Add the six `VITE_FIREBASE_*` environment variables under **Settings → Environment Variables** (Production + Preview).
4. Deploy. [`vercel.json`](vercel.json) provides the SPA fallback so all routes serve `index.html`.

### Verify your Vercel env vars are working

`VITE_*` variables are **inlined into the bundle at build time**, not read at runtime. The most common deployment mistake is adding/changing them but not rebuilding — so the live site still has the old (or empty) config and every Firestore write silently fails. Checklist:

1. **Names match exactly** — all six `VITE_FIREBASE_*` keys, no typos, no quotes around values.
2. **Set for the right Environments** — Production **and** Preview.
3. **Redeploy after any change** — env var edits don't take effect until the next build (in Vercel: Deployments → ⋯ → Redeploy).
4. **Firestore rules deployed** — run `firebase deploy --only firestore:rules` (without this, even correct keys get permission-denied on write).

The app self-tests this for you:
- If any `VITE_FIREBASE_*` is missing at build time, a **"Firebase not configured"** chip appears at the bottom-left of the live site and the browser console logs exactly which vars are missing.
- If config is present but a write fails (wrong project, rules not deployed, offline), submitting any form shows an error toast instead of the success state.

So a clean end-to-end test is: open the deployed site → no red chip → submit a form → you see the success state → the document appears in Firestore → Data.

---

## Project structure

```
.
├── public/                  # static assets (hero-helmet.jpg, etc.)
├── src/
│   ├── lib/
│   │   ├── firebase.ts      # Firebase web SDK init from VITE_FIREBASE_*
│   │   ├── airshieldDb.ts   # Firestore write functions (one per collection)
│   │   └── tracking.ts      # localStorage event/form backup
│   ├── sections/            # landing page sections (forms live here)
│   ├── components/ui/       # shadcn/ui components
│   ├── App.tsx
│   └── main.tsx
├── firestore.rules          # create-only security rules
├── firebase.json            # points the Firebase CLI at firestore.rules
├── vercel.json              # SPA fallback
└── .env.example
```
