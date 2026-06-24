/* eslint-disable react-hooks/immutability -- this component imperatively mutates
   three.js object/material properties inside useEffect/useFrame, which is the
   standard @react-three/fiber pattern and not a React render-purity concern. */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { FINISH_PBR, type ManifestColor, type ManifestMeshes } from "./types";

// Renders a real helmet GLB once one is dropped into
// `public/product-visualizer/model/` and `model.available` is flipped to true in
// the manifest. Designed to work with ANY reasonable helmet model — not just one
// authored to our exact part names:
//
//   • Auto-orients (optional manifest rotation), auto-centres and auto-scales the
//     model to fit the scene, so it always frames correctly regardless of the
//     model's native units/origin.
//   • Recolours the shell: uses the named `helmet_shell` mesh if present,
//     otherwise falls back to the largest OPAQUE mesh (transparent visor glass is
//     left untouched). The colour variant buttons keep working either way.
//   • Separates a named `filter_cartridge` (+ `fan_module`) in explode mode; if
//     the model has no such part it reports separation unavailable and the UI
//     shows a calm close-up instead.
//
// Materials are CLONED before editing so we never mutate useGLTF's cached/shared
// materials.

const TEAL = "#00D4AA";

interface GLBHelmetProps {
  path: string;
  meshes: ManifestMeshes;
  color: ManifestColor;
  explore: boolean;
  reducedMotion: boolean;
  /** Optional manual orientation nudge (degrees) from the manifest. */
  rotationDeg?: [number, number, number];
  /** Target size (largest dimension, world units) for auto-fit. */
  fitSize?: number;
  /** Called with true if the model has no separable filter_cartridge mesh. */
  onFilterSeparationUnavailable?: (unavailable: boolean) => void;
}

/** Pick the largest opaque mesh as a stand-in shell when none is named. */
function findLargestOpaqueMesh(root: THREE.Object3D): THREE.Mesh | null {
  let best: THREE.Mesh | null = null;
  let bestVolume = -1;
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const mat = o.material as THREE.Material | undefined;
    if (mat && (mat.transparent || (mat as THREE.MeshStandardMaterial).opacity < 1)) return;
    box.setFromObject(o);
    box.getSize(size);
    const volume = size.x * size.y * size.z;
    if (volume > bestVolume) {
      bestVolume = volume;
      best = o;
    }
  });
  return best;
}

export default function GLBHelmet({
  path,
  meshes,
  color,
  explore,
  reducedMotion,
  rotationDeg,
  fitSize = 0.34,
  onFilterSeparationUnavailable,
}: GLBHelmetProps) {
  const { scene } = useGLTF(path) as unknown as { scene: THREE.Group };

  // Clone the scene so multiple mounts / HMR don't share mutated transforms.
  const root = useMemo(() => scene.clone(true), [scene]);

  const cartridgeRef = useRef<THREE.Object3D | null>(null);
  const cartridgeBaseZ = useRef(0);
  const fanRef = useRef<THREE.Object3D | null>(null);
  const fanBaseZ = useRef(0);
  const explodeAmt = useRef(0.12);
  const shellMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const highlightMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Orient → centre → scale the model so it always frames correctly.
  useEffect(() => {
    if (rotationDeg) {
      root.rotation.set(
        THREE.MathUtils.degToRad(rotationDeg[0]),
        THREE.MathUtils.degToRad(rotationDeg[1]),
        THREE.MathUtils.degToRad(rotationDeg[2]),
      );
    }
    root.position.set(0, 0, 0);
    root.scale.setScalar(1);
    root.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = fitSize / maxDim;
    root.scale.setScalar(s);
    root.position.set(-center.x * s, -center.y * s, -center.z * s);
    explodeAmt.current = size.z * 0.5; // model-local units; scales with root
  }, [root, rotationDeg, fitSize]);

  // Resolve named parts + clone the materials we intend to mutate.
  useEffect(() => {
    const named = root.getObjectByName(meshes.shell);
    const shell = named instanceof THREE.Mesh ? named : findLargestOpaqueMesh(root);
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
      const target = cartridgeBaseZ.current + (explore ? explodeAmt.current : 0);
      cartridgeRef.current.position.z = THREE.MathUtils.lerp(
        cartridgeRef.current.position.z,
        target,
        t,
      );
    }
    if (fanRef.current) {
      const target = fanBaseZ.current + (explore ? explodeAmt.current * 0.6 : 0);
      fanRef.current.position.z = THREE.MathUtils.lerp(fanRef.current.position.z, target, t);
    }
    const targetEmissive = explore ? 0.55 : 0;
    for (const mat of highlightMatsRef.current) {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, t);
    }
  });

  return <primitive object={root} />;
}
