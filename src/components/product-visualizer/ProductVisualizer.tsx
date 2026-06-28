import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { Filter, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackEvent } from "@/lib/tracking";
import FallbackProductViewer from "./FallbackProductViewer";
import VisualizerControls from "./VisualizerControls";
import FilterExplorePanel from "./FilterExplorePanel";
import {
  colorForVariant,
  DEFAULT_MANIFEST,
  loadManifest,
  type VisualizerManifest,
  type ViewPreset,
} from "./types";
import type { CameraCommand } from "./HelmetScene";

const VisualizerCanvas = lazy(() => import("./VisualizerCanvas"));

// ── WebGL probe (run once, client-side) ─────────────────────────────────
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

// ── Error boundary → static fallback ────────────────────────────────────
class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[AirShield] 3D visualiser failed, showing image fallback:", error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function LoadingState() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-[#8A8A93]">
      <Loader2 className="h-6 w-6 animate-spin text-[#00D4AA]" />
      <span className="text-xs">Loading 3D model…</span>
    </div>
  );
}

interface ProductVisualizerProps {
  /** Variant name from ProductCardSection — mapped to a shell colour. */
  selectedVariant: string;
  /** Optional hook fired when the user opens the filter explore mode. */
  onExploreFilter?: () => void;
}

export default function ProductVisualizer({
  selectedVariant,
  onExploreFilter,
}: ProductVisualizerProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();

  const containerRef = useRef<HTMLDivElement>(null);
  const nonce = useRef(0);

  const [webglSupported] = useState(detectWebGL);
  const [manifest, setManifest] = useState<VisualizerManifest | null>(null);
  const [inView, setInView] = useState(false);
  const [explore, setExplore] = useState(false);
  const [separationUnavailable, setSeparationUnavailable] = useState(false);
  const [command, setCommand] = useState<CameraCommand>({ type: "reset", nonce: 0 });

  // Load the manifest (always resolves — falls back to DEFAULT_MANIFEST).
  useEffect(() => {
    const ctrl = new AbortController();
    loadManifest(ctrl.signal).then(setManifest);
    return () => ctrl.abort();
  }, []);

  // Mount the heavy 3D chunk only when the section nears the viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  const issue = (type: CameraCommand["type"]) => {
    nonce.current += 1;
    setCommand({ type, nonce: nonce.current });
  };

  const handlePreset = (view: Exclude<ViewPreset, "reset">) => {
    setExplore(false);
    issue(view);
    trackEvent("preset_view_selected", { view });
  };
  const handleReset = () => {
    setExplore(false);
    issue("reset");
    trackEvent("view_reset");
  };
  const openExplore = () => {
    setExplore(true);
    issue("explore");
    trackEvent("filter_explore_opened", { product: "AirShield One" });
    onExploreFilter?.();
  };
  const backToHelmet = () => {
    setExplore(false);
    issue("reset");
  };

  const activeManifest = manifest ?? DEFAULT_MANIFEST;
  const color = colorForVariant(activeManifest, selectedVariant);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#1A1A22] bg-[radial-gradient(120%_120%_at_50%_25%,#1A1A22_0%,#0D0D10_55%,#08080b_100%)] sm:aspect-square"
    >
      {/* H13 HEPA chip (preserved from the original product card). Hidden in
          explore mode so it doesn't overlap the "Filtration system" title. */}
      {!explore && (
        <div className="absolute left-4 top-4 z-30 rounded-full border border-[#00D4AA]/30 bg-[#00D4AA]/20 px-3 py-1">
          <span className="text-xs font-medium text-[#00D4AA]">H13 HEPA</span>
        </div>
      )}

      {!webglSupported ? (
        <FallbackProductViewer fallback={activeManifest.fallback} />
      ) : (
        <SceneErrorBoundary fallback={<FallbackProductViewer fallback={activeManifest.fallback} />}>
          {manifest && inView ? (
            <Suspense fallback={<LoadingState />}>
              <VisualizerCanvas
                manifest={activeManifest}
                color={color}
                explore={explore}
                reducedMotion={reducedMotion}
                command={command}
                onFilterSeparationUnavailable={setSeparationUnavailable}
              />
            </Suspense>
          ) : (
            <LoadingState />
          )}

          {/* Overlays */}
          {explore ? (
            <FilterExplorePanel
              labels={activeManifest.filterExplode.labels}
              onZoomIn={() => issue("zoomIn")}
              onZoomOut={() => issue("zoomOut")}
              onBack={backToHelmet}
              separationUnavailable={separationUnavailable}
            />
          ) : (
            <>
              {activeManifest.filterExplode.available && (
                <button
                  type="button"
                  onClick={openExplore}
                  className="absolute right-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-lg border border-[#00D4AA]/40 bg-[#00D4AA]/10 px-3 py-1.5 text-xs font-medium text-[#00D4AA] backdrop-blur transition-colors hover:bg-[#00D4AA]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/60"
                >
                  <Filter className="h-4 w-4" />
                  Explore filtration system
                </button>
              )}

              <p className="pointer-events-none absolute inset-x-0 bottom-16 z-20 text-center text-[11px] text-[#8A8A93]">
                Drag to rotate · {isMobile ? "Pinch" : "Scroll"} to zoom
              </p>

              <VisualizerControls
                onPreset={handlePreset}
                onReset={handleReset}
                onZoomIn={() => issue("zoomIn")}
                onZoomOut={() => issue("zoomOut")}
              />
            </>
          )}
        </SceneErrorBoundary>
      )}
    </div>
  );
}
