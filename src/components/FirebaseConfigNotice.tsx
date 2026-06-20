import { AlertTriangle } from "lucide-react";
import { missingFirebaseEnv } from "@/lib/firebase";

// Renders ONLY when the Firebase web config is incomplete — i.e. one or more
// VITE_FIREBASE_* vars were missing at build time. Invisible when correctly
// configured, so on a misconfigured Vercel deploy this chip is the at-a-glance
// signal that the env vars didn't take.
export default function FirebaseConfigNotice() {
  if (missingFirebaseEnv.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] max-w-xs rounded-lg border border-[#FF4D1C]/40 bg-[#13131A]/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF4D1C]" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#FF4D1C]">
            Firebase not configured — {missingFirebaseEnv.length} env var
            {missingFirebaseEnv.length > 1 ? "s" : ""} missing
          </p>
          <p className="font-mono-label text-[10px] leading-relaxed text-[#8A8A93]">
            {missingFirebaseEnv.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}
