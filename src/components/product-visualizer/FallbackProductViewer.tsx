import { useState } from "react";
import type { ManifestFallback } from "./types";

// Shown when WebGL is unavailable or the 3D scene fails to load. A simple,
// honest image gallery — not a fake 360°. Each angle button swaps the image; if
// a specific photo is missing it falls back to the always-present default image.

type AngleKey = "front" | "left" | "right" | "back" | "filterCloseup";

const ANGLES: { key: AngleKey; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "back", label: "Back" },
  { key: "filterCloseup", label: "Filter" },
];

export default function FallbackProductViewer({ fallback }: { fallback: ManifestFallback }) {
  const [angle, setAngle] = useState<AngleKey>("front");
  const [errored, setErrored] = useState(false);

  const src = errored ? fallback.default : fallback[angle];

  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      <div className="relative flex flex-1 items-center justify-center p-6">
        <img
          src={src}
          alt="AirShield One helmet"
          onError={() => setErrored(true)}
          className="max-h-full max-w-full object-contain"
        />
        {fallback.illustrative && (
          <div className="absolute left-4 top-4 rounded-full border border-[#1A1A22] bg-[#13131A]/80 px-3 py-1 backdrop-blur">
            <span className="text-[10px] uppercase tracking-wider text-[#8A8A93]">
              Illustrative placeholder
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 p-3">
        {ANGLES.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => {
              setErrored(false);
              setAngle(a.key);
            }}
            aria-label={`View ${a.label.toLowerCase()}`}
            aria-pressed={angle === a.key}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/60 ${
              angle === a.key
                ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                : "border-[#1A1A22] bg-[#13131A]/80 text-[#F4F1EC] hover:border-[#00D4AA]/50"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
