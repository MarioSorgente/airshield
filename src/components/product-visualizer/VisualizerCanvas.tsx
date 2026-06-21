import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import HelmetScene, {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_FOV,
  type CameraCommand,
} from "./HelmetScene";
import type { ManifestColor, VisualizerManifest } from "./types";

// Thin wrapper that owns the <Canvas>. Imported lazily by ProductVisualizer so
// three / @react-three/* land in a separate async chunk and stay out of the
// initial page bundle.

interface VisualizerCanvasProps {
  manifest: VisualizerManifest;
  color: ManifestColor;
  explore: boolean;
  reducedMotion: boolean;
  command: CameraCommand;
  onFilterSeparationUnavailable?: (unavailable: boolean) => void;
}

export default function VisualizerCanvas(props: VisualizerCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: DEFAULT_CAMERA_POSITION, fov: DEFAULT_FOV }}
      aria-label="Interactive 3D model of the AirShield One helmet"
      role="img"
    >
      <Suspense fallback={null}>
        <HelmetScene {...props} />
      </Suspense>
    </Canvas>
  );
}
