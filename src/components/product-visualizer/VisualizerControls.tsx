import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { ViewPreset } from "./types";

// HTML overlay (outside the Canvas) for the standard product view: preset
// angles, zoom, and reset. All real <button>s with aria-labels for keyboard
// users. Momentary actions — no persistent "active" state to track.

const PRESETS: { id: Exclude<ViewPreset, "reset">; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "back", label: "Back" },
];

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-[#1A1A22] bg-[#13131A]/80 text-[#F4F1EC] backdrop-blur transition-colors hover:border-[#00D4AA]/60 hover:text-[#00D4AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/60";

interface VisualizerControlsProps {
  onPreset: (view: Exclude<ViewPreset, "reset">) => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function VisualizerControls({
  onPreset,
  onReset,
  onZoomIn,
  onZoomOut,
}: VisualizerControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-2 p-3">
      {/* Preset angles */}
      <div className="pointer-events-auto flex flex-wrap gap-1.5 rounded-xl border border-[#1A1A22] bg-[#13131A]/70 p-1 backdrop-blur">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(p.id)}
            aria-label={`View ${p.label.toLowerCase()}`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#F4F1EC] transition-colors hover:bg-[#00D4AA]/10 hover:text-[#00D4AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/60"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Zoom + reset */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={iconBtn}>
          <ZoomOut className="h-4 w-4" />
        </button>
        <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={iconBtn}>
          <ZoomIn className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} aria-label="Reset view" className={iconBtn}>
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
