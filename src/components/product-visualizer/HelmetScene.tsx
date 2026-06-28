import { type ComponentRef, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import ProceduralHelmet from "./ProceduralHelmet";
import GLBHelmet from "./GLBHelmet";
import type { ManifestColor, VisualizerManifest, ViewPreset } from "./types";

// ── Camera framing ──────────────────────────────────────────────────────
export const MIN_DISTANCE = 0.95;
export const MAX_DISTANCE = 2.8;
export const DEFAULT_FOV = 35;

type Pose = { pos: [number, number, number]; target: [number, number, number] };

const POSES: Record<ViewPreset | "explore", Pose> = {
  reset: { pos: [1.05, 0.35, 1.25], target: [0, 0, 0] },
  front: { pos: [0, 0.1, 1.55], target: [0, 0, 0] },
  back: { pos: [0, 0.14, -1.55], target: [0, 0, 0] },
  left: { pos: [-1.55, 0.1, 0.02], target: [0, 0, 0] },
  right: { pos: [1.55, 0.1, 0.02], target: [0, 0, 0] },
  // Side view that frames the helmet plus the exploded decomposition laid out
  // behind it (−Z) after the model's +90° Y orientation.
  explore: { pos: [1.55, 0.4, -0.35], target: [0.05, -0.02, -0.42] },
};

export const DEFAULT_CAMERA_POSITION = POSES.reset.pos;

export type CameraCommandType = ViewPreset | "explore" | "zoomIn" | "zoomOut";
export interface CameraCommand {
  type: CameraCommandType;
  nonce: number;
}

type OrbitControlsRef = ComponentRef<typeof OrbitControls>;

// Drives all programmatic camera moves. Preset/explore commands animate (a
// gentle lerp, or an instant snap under reduced-motion); zoom commands nudge the
// dolly distance within bounds. Free user orbit/zoom is untouched between moves.
function CameraRig({
  command,
  reducedMotion,
  controlsRef,
}: {
  command: CameraCommand;
  reducedMotion: boolean;
  controlsRef: React.RefObject<OrbitControlsRef | null>;
}) {
  const camera = useThree((s) => s.camera);
  const pose = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (command.type === "zoomIn" || command.type === "zoomOut") {
      if (!controls) return;
      const factor = command.type === "zoomIn" ? 0.8 : 1.25;
      const target = controls.target as THREE.Vector3;
      const offset = camera.position.clone().sub(target);
      const dist = THREE.MathUtils.clamp(offset.length() * factor, MIN_DISTANCE, MAX_DISTANCE);
      offset.setLength(dist);
      camera.position.copy(target).add(offset);
      controls.update();
      return;
    }
    const next = POSES[command.type];
    pose.current = {
      pos: new THREE.Vector3(...next.pos),
      target: new THREE.Vector3(...next.target),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command.nonce]);

  useFrame(() => {
    const controls = controlsRef.current;
    const goal = pose.current;
    if (!controls || !goal) return;
    const target = controls.target as THREE.Vector3;
    if (reducedMotion) {
      camera.position.copy(goal.pos);
      target.copy(goal.target);
      pose.current = null;
    } else {
      camera.position.lerp(goal.pos, 0.12);
      target.lerp(goal.target, 0.12);
      if (camera.position.distanceTo(goal.pos) < 0.01) {
        camera.position.copy(goal.pos);
        target.copy(goal.target);
        pose.current = null;
      }
    }
    controls.update();
  });

  return null;
}

interface HelmetSceneProps {
  manifest: VisualizerManifest;
  color: ManifestColor;
  explore: boolean;
  reducedMotion: boolean;
  command: CameraCommand;
  onFilterSeparationUnavailable?: (unavailable: boolean) => void;
}

export default function HelmetScene({
  manifest,
  color,
  explore,
  reducedMotion,
  command,
  onFilterSeparationUnavailable,
}: HelmetSceneProps) {
  const controlsRef = useRef<OrbitControlsRef | null>(null);

  return (
    <>
      {/* Soft studio lighting — bright enough to read a matte-black shell */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[2.5, 3.5, 2]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={10}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
        shadow-camera-left={-1}
        shadow-camera-right={1}
      />
      {/* Front fill so the face/visor side never falls into pure black */}
      <directionalLight position={[1.2, 0.6, 2.8]} intensity={0.7} color="#eaf0ff" />
      <directionalLight position={[-2.5, 1, -1.5]} intensity={0.5} color="#cdd6f4" />
      {/* Cool rim/back light for a dramatic studio edge */}
      <directionalLight position={[-1.5, 2.4, -2.6]} intensity={1.2} color="#8fb6ff" />
      <pointLight position={[-1, -0.4, 1.2]} intensity={0.35} color="#00D4AA" />

      {/* Self-contained reflections (no external HDR download) */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={1.6} position={[0, 1.5, 0]} scale={[3, 1, 1]} color="#ffffff" />
        <Lightformer intensity={0.8} position={[2, 0, 1]} scale={[1, 2, 1]} color="#9fb4c7" />
        <Lightformer intensity={0.6} position={[-2, 0.5, -1]} scale={[1, 2, 1]} color="#00D4AA" />
      </Environment>

      {manifest.model.available ? (
        <GLBHelmet
          path={manifest.model.path}
          meshes={manifest.model.meshes}
          color={color}
          explore={explore}
          reducedMotion={reducedMotion}
          rotationDeg={manifest.model.rotationDeg}
          fitSize={manifest.model.fitSize}
          shellMeshNames={manifest.model.shellMeshNames}
          explodeGroupPrefix={manifest.model.explodeGroupPrefix}
          fitMeshPrefix={manifest.model.fitMeshPrefix}
          defaultHidePrefixes={manifest.model.defaultHidePrefixes}
          exploreHidePrefixes={manifest.model.exploreHidePrefixes}
          onFilterSeparationUnavailable={onFilterSeparationUnavailable}
        />
      ) : (
        <ProceduralHelmet color={color} explore={explore} reducedMotion={reducedMotion} />
      )}

      <ContactShadows
        position={[0, -0.16, 0]}
        opacity={0.55}
        scale={1.7}
        blur={2.6}
        far={0.9}
        resolution={512}
        color="#000000"
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.62}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />

      <CameraRig command={command} reducedMotion={reducedMotion} controlsRef={controlsRef} />
    </>
  );
}
