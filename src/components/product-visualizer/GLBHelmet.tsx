/* eslint-disable react-hooks/immutability -- this component imperatively mutates
   three.js object/material properties inside useFrame, which is the standard
   @react-three/fiber pattern and not a React render-purity concern. */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { FINISH_PBR, type ManifestColor, type ManifestMeshes } from "./types";

// Renders the real AirShield GLB once one is dropped into
// `public/product-visualizer/model/` and `model.available` is flipped to true in
// the manifest. Dormant in the current prototype (procedural helmet is used).
//
// Defensive by design: every mesh lookup is by NAME (from the manifest) and
// guarded, so a model missing a part never crashes the scene. Materials are
// CLONED before editing so we never mutate useGLTF's cached/shared materials.

const TEAL = "#00D4AA";
const EXPLODE_FORWARD = 0.22; // local +Z metres

interface GLBHelmetProps {
  path: string;
  meshes: ManifestMeshes;
  color: ManifestColor;
  explore: boolean;
  reducedMotion: boolean;
  /** Called with true if the model has no separable filter_cartridge mesh. */
  onFilterSeparationUnavailable?: (unavailable: boolean) => void;
}

export default function GLBHelmet({
  path,
  meshes,
  color,
  explore,
  reducedMotion,
  onFilterSeparationUnavailable,
}: GLBHelmetProps) {
  const { scene } = useGLTF(path) as unknown as { scene: THREE.Group };

  // Clone the scene so multiple mounts / HMR don't share mutated transforms.
  const root = useMemo(() => scene.clone(true), [scene]);

  const cartridgeRef = useRef<THREE.Object3D | null>(null);
  const cartridgeBaseZ = useRef(0);
  const fanRef = useRef<THREE.Object3D | null>(null);
  const fanBaseZ = useRef(0);
  const shellMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const highlightMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Resolve named parts + clone the materials we intend to mutate.
  useEffect(() => {
    const shell = root.getObjectByName(meshes.shell);
    if (shell instanceof THREE.Mesh && shell.material) {
      const mat = (shell.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
      shell.material = mat;
      shellMatRef.current = mat;
    }

    const cartridge = root.getObjectByName(meshes.filterCartridge);
    cartridgeRef.current = cartridge ?? null;
    if (cartridge) cartridgeBaseZ.current = cartridge.position.z;
    onFilterSeparationUnavailable?.(!cartridge);

    const fan = root.getObjectByName(meshes.fanModule);
    fanRef.current = fan ?? null;
    if (fan) fanBaseZ.current = fan.position.z;

    const highlights: THREE.MeshStandardMaterial[] = [];
    for (const name of [meshes.filterHousing, meshes.filterCartridge]) {
      const obj = root.getObjectByName(name);
      if (obj instanceof THREE.Mesh && obj.material) {
        const mat = (obj.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(TEAL);
        mat.emissiveIntensity = 0;
        obj.material = mat;
        highlights.push(mat);
      }
    }
    highlightMatsRef.current = highlights;

    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
  }, [root, meshes, onFilterSeparationUnavailable]);

  // Apply the selected colour + finish to the shell material.
  useEffect(() => {
    const mat = shellMatRef.current;
    if (!mat) return;
    mat.color = new THREE.Color(color.hex);
    const pbr = FINISH_PBR[color.finish];
    mat.roughness = pbr.roughness;
    mat.metalness = pbr.metalness;
    mat.needsUpdate = true;
  }, [color]);

  useFrame((_, delta) => {
    const t = reducedMotion ? 1 : Math.min(1, delta * 6);
    if (cartridgeRef.current) {
      const target = cartridgeBaseZ.current + (explore ? EXPLODE_FORWARD : 0);
      cartridgeRef.current.position.z = THREE.MathUtils.lerp(
        cartridgeRef.current.position.z,
        target,
        t,
      );
    }
    if (fanRef.current) {
      const target = fanBaseZ.current + (explore ? EXPLODE_FORWARD * 0.6 : 0);
      fanRef.current.position.z = THREE.MathUtils.lerp(fanRef.current.position.z, target, t);
    }
    const targetEmissive = explore ? 0.55 : 0;
    for (const mat of highlightMatsRef.current) {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, t);
    }
  });

  return <primitive object={root} />;
}
