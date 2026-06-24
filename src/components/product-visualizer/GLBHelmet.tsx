/* eslint-disable react-hooks/immutability -- this component imperatively mutates
   three.js object/material properties inside useEffect/useFrame, which is the
   standard @react-three/fiber pattern and not a React render-purity concern. */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { FINISH_PBR, type ManifestColor, type ManifestMeshes } from "./types";

// Renders the AirShield helmet GLB. Designed to work with the structured concept
// model (helmet shell + all AS01–AS08 components, per-vertex COLOR_0, no normals,
// no materials) as well as simpler models:
//
//   • Auto-orients (manifest rotation), auto-centres and auto-scales to fit.
//   • Computes vertex normals when the model has none, so it shades.
//   • Renders baked vertex colours; meshes whose colour has alpha < 1 (the tinted
//     visor, airflow indicators) become transparent.
//   • Recolours the SHELL: every mesh in `shellMeshNames` (or the single named
//     `shell`) renders in the solid variant colour with vertex colours off; all
//     other meshes keep their design colours. The colour variant buttons drive it.
//   • Separates a named `filter_cartridge` (+ `fan_module`) in explode mode; if no
//     such part exists it reports separation unavailable and the UI shows a
//     close-up instead.
//
// Materials are CLONED before editing so useGLTF's cached materials are untouched.

const TEAL = "#00D4AA";

interface GLBHelmetProps {
  path: string;
  meshes: ManifestMeshes;
  color: ManifestColor;
  explore: boolean;
  reducedMotion: boolean;
  rotationDeg?: [number, number, number];
  fitSize?: number;
  shellMeshNames?: string[];
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

/** Minimum alpha of a VEC4 colour attribute (1 if none / opaque). */
function minColorAlpha(geo: THREE.BufferGeometry): number {
  const col = geo.getAttribute("color");
  if (!col || col.itemSize < 4) return 1;
  let min = 1;
  for (let i = 0; i < col.count; i++) {
    const a = col.getW(i);
    if (a < min) min = a;
  }
  return min;
}

export default function GLBHelmet({
  path,
  meshes,
  color,
  explore,
  reducedMotion,
  rotationDeg,
  fitSize = 0.34,
  shellMeshNames,
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
  const shellMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
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

  // Prepare materials: normals, vertex colours, transparency, shell tinting.
  useEffect(() => {
    const shellSet = shellMeshNames && shellMeshNames.length ? new Set(shellMeshNames) : null;
    const shellMats: THREE.MeshStandardMaterial[] = [];

    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      const geo = o.geometry as THREE.BufferGeometry;
      if (!geo.getAttribute("normal")) geo.computeVertexNormals();

      const src = (Array.isArray(o.material) ? o.material[0] : o.material) as
        | THREE.Material
        | undefined;
      const mat = (src ? src.clone() : new THREE.MeshStandardMaterial()) as THREE.MeshStandardMaterial;

      const isShell = shellSet ? shellSet.has(o.name) : o.name === meshes.shell;
      if (isShell) {
        mat.vertexColors = false; // solid variant colour applied in the colour effect
        shellMats.push(mat);
      } else {
        mat.vertexColors = !!geo.getAttribute("color");
        mat.metalness = 0.18;
        mat.roughness = 0.62;
        if (minColorAlpha(geo) < 0.999) {
          mat.transparent = true;
          mat.depthWrite = false;
        }
      }
      mat.needsUpdate = true;
      o.material = mat;
    });

    // Fallback: if no named shell matched, tint the largest opaque mesh.
    if (shellMats.length === 0) {
      const named = root.getObjectByName(meshes.shell);
      const shell = named instanceof THREE.Mesh ? named : findLargestOpaqueMesh(root);
      if (shell instanceof THREE.Mesh && shell.material) {
        const mat = (shell.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
        mat.vertexColors = false;
        shell.material = mat;
        shellMats.push(mat);
      }
    }
    shellMatsRef.current = shellMats;

    // Explode targets + highlight materials (no-ops when the parts are absent).
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
        const mat = obj.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(TEAL);
        mat.emissiveIntensity = 0;
        highlights.push(mat);
      }
    }
    highlightMatsRef.current = highlights;
  }, [root, meshes, shellMeshNames, onFilterSeparationUnavailable]);

  // Apply the selected colour + finish to the shell materials.
  useEffect(() => {
    const pbr = FINISH_PBR[color.finish];
    for (const mat of shellMatsRef.current) {
      mat.color = new THREE.Color(color.hex);
      mat.roughness = pbr.roughness;
      mat.metalness = pbr.metalness;
      mat.needsUpdate = true;
    }
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
