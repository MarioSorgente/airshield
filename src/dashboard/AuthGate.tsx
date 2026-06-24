// Firebase Auth gate for the admin dashboard.
//
// Real security: firestore.rules only grants reads to the admin account, so even
// though the Firebase API key is public, a signed-out (or non-admin) visitor's
// read requests are rejected by the server. This component just provides the
// login UI and a friendly "not authorized" state.
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, firebaseReady, missingFirebaseEnv } from "@/lib/firebase";

// Optional client-side check so a non-admin login gets a clear message instead
// of an empty dashboard. The actual enforcement is in firestore.rules.
const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL as string | undefined
)?.toLowerCase();

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF4EC] px-6 text-[#2A2520]">
      {children}
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // If Firebase isn't configured there's no auth state to resolve, so we're
  // "ready" immediately (avoids a synchronous setState inside the effect).
  const [ready, setReady] = useState(!firebaseReady);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  if (!firebaseReady || !auth) {
    return (
      <Centered>
        <div className="max-w-sm rounded-2xl border border-[#EADFD3] bg-white p-8 text-center">
          <p className="font-semibold">Firebase not configured</p>
          <p className="mt-2 text-sm text-[#8A7F73]">
            {missingFirebaseEnv.length
              ? `Missing: ${missingFirebaseEnv.join(", ")}.`
              : "Auth could not initialize."}{" "}
            Add the VITE_FIREBASE_* vars to your environment and rebuild.
          </p>
        </div>
      </Centered>
    );
  }

  if (!ready) {
    return (
      <Centered>
        <p className="text-[#A89C8E]">Loading…</p>
      </Centered>
    );
  }

  // Past the guard above, auth is guaranteed non-null; bind a local so it stays
  // narrowed inside the handlers below.
  const authClient = auth;

  const isAdmin =
    !!user && (!ADMIN_EMAIL || user.email?.toLowerCase() === ADMIN_EMAIL);

  if (isAdmin) {
    return (
      <>
        <button
          onClick={() => void signOut(authClient)}
          className="fixed right-4 top-4 z-50 rounded-lg border border-[#EADFD3] bg-white px-3 py-1.5 text-xs font-medium text-[#5C5247] shadow-sm hover:bg-[#F7EFE6]"
        >
          Sign out
        </button>
        {children}
      </>
    );
  }

  // Signed in but not the configured admin.
  if (user && !isAdmin) {
    return (
      <Centered>
        <div className="max-w-sm space-y-4 rounded-2xl border border-[#EADFD3] bg-white p-8 text-center">
          <div className="text-2xl">🚫</div>
          <p className="font-semibold">Not authorized</p>
          <p className="text-sm text-[#8A7F73]">
            {user.email} can't view this dashboard.
          </p>
          <button
            onClick={() => void signOut(authClient)}
            className="w-full rounded-lg bg-[#2A2520] py-2.5 font-medium text-white hover:bg-black"
          >
            Sign out
          </button>
        </div>
      </Centered>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(authClient, email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(
        code === "auth/invalid-credential" ||
          code === "auth/wrong-password" ||
          code === "auth/user-not-found"
          ? "Incorrect email or password."
          : "Sign-in failed. Check the email/password provider is enabled."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Centered>
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-[#EADFD3] bg-white p-8 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <div className="text-2xl">🛡️</div>
          <h1 className="text-xl font-semibold">AirShield Dashboard</h1>
          <p className="text-sm text-[#8A7F73]">Admin sign-in</p>
        </div>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="Email"
          className="w-full rounded-lg border border-[#EADFD3] bg-[#FBF4EC] px-4 py-3 outline-none focus:border-[#E8654F]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="Password"
          className="w-full rounded-lg border border-[#EADFD3] bg-[#FBF4EC] px-4 py-3 outline-none focus:border-[#E8654F]"
        />
        {error && <p className="text-sm text-[#E8654F]">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="w-full rounded-lg bg-[#E8654F] py-3 font-semibold text-white transition-colors hover:bg-[#d9573f] disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Centered>
  );
}
