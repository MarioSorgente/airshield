import { ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import type { ManifestFilterLabel } from "./types";

// Explore-mode overlay. Shown when "Explore filtration system" is active. Labels
// come straight from the manifest so they can be edited without code changes. We
// keep them in this panel (not as floating 3D tags) to stay calm and uncluttered.

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-[#1A1A22] bg-[#13131A]/80 text-[#F4F1EC] backdrop-blur transition-colors hover:border-[#00D4AA]/60 hover:text-[#00D4AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/60";

interface FilterExplorePanelProps {
  labels: ManifestFilterLabel[];
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBack: () => void;
  /** True when the active model has no separable cartridge mesh. */
  separationUnavailable?: boolean;
}

export default function FilterExplorePanel({
  labels,
  onZoomIn,
  onZoomOut,
  onBack,
  separationUnavailable = false,
}: FilterExplorePanelProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3">
      {/* Title + back */}
      <div className="flex items-start justify-between gap-2">
        <div className="pointer-events-auto rounded-lg border border-[#00D4AA]/30 bg-[#0D0D10]/85 px-3 py-1.5 backdrop-blur">
          <span className="font-mono-label text-xs uppercase tracking-wider text-[#00D4AA]">
            Filtration system
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-[#1A1A22] bg-[#13131A]/80 px-3 py-1.5 text-xs font-medium text-[#F4F1EC] backdrop-blur transition-colors hover:border-[#00D4AA]/60 hover:text-[#00D4AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to helmet
        </button>
      </div>

      {/* Bottom: labels + zoom */}
      <div className="flex items-end justify-between gap-2">
        <div className="pointer-events-auto max-w-[16rem] space-y-1.5 rounded-xl border border-[#1A1A22] bg-[#0D0D10]/85 p-3 backdrop-blur">
          {labels.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D4AA]" />
              <span className="text-xs text-[#F4F1EC]">{l.text}</span>
            </div>
          ))}
          {separationUnavailable && (
            <p className="pt-1 text-[10px] leading-snug text-[#8A8A93]">
              Close-up shown — the current model has no separable cartridge mesh.
            </p>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={iconBtn}>
            <ZoomOut className="h-4 w-4" />
          </button>
          <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={iconBtn}>
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
