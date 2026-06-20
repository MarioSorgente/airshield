// Firebase web SDK initialization.
// Config is read from VITE_FIREBASE_* environment variables (see .env.example).
// Firestore is the only persistence layer used by this app.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Which of the required VITE_FIREBASE_* env vars are missing/empty.
// VITE_* values are inlined at BUILD time — if they aren't set when the app is
// built (e.g. forgotten in Vercel, or added after the last deploy), the config
// is empty and every Firestore write fails. We surface that loudly instead of
// failing silently (see FirebaseConfigNotice).
const requiredEnv = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

export const missingFirebaseEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const firebaseReady = missingFirebaseEnv.length === 0;

if (!firebaseReady) {
  console.error(
    `[AirShield] Missing Firebase env vars: ${missingFirebaseEnv.join(", ")}. ` +
      `Set them in your .env (locally) or Vercel → Settings → Environment Variables, ` +
      `then rebuild/redeploy (VITE_* vars are baked in at build time).`
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
