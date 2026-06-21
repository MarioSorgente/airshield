import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FINISH_PBR, type ManifestColor } from "./types";

// A stylised full-face helmet built from Three.js primitives. It is a deliberate
// placeholder — not the real AirShield design — but it establishes the exact
// part/material contract the final GLB must follow:
//
//   helmet_shell      → its own material, recoloured live by `color`
//   visor             → tinted glass
//   filter_housing    → chin intake housing (highlighted in explore mode)
//   filter_cartridge  → SEPARATE part that slides forward in the exploded view
//   fan_module        → small fan disc behind the cartridge
//
// Each instance owns its own materials (created by JSX), so recolouring never
// mutates a shared/cached material.

const TEAL = "#00D4AA";

// Resting vs exploded forward offset (local +Z = front of helmet).
const CARTRIDGE_BASE_Z = 0.205;
const CARTRIDGE_EXPLODED_Z = 0.46;
const FAN_BASE_Z = 0.14;
const FAN_EXPLODED_Z = 0.3;

interface ProceduralHelmetProps {
  color: ManifestColor;
  /** When true, separate the cartridge and highlight the filter parts. */
  explore: boolean;
  reducedMotion: boolean;
}

export default function ProceduralHelmet({ color, explore, reducedMotion }: ProceduralHelmetProps) {
  const cartridgeRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Group>(null);
  const housingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const cartridgeMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const pbr = FINISH_PBR[color.finish];

  useFrame((_, delta) => {
    const t = reducedMotion ? 1 : Math.min(1, delta * 6);

    if (cartridgeRef.current) {
      const target = explore ? CARTRIDGE_EXPLODED_Z : CARTRIDGE_BASE_Z;
      cartridgeRef.current.position.z = THREE.MathUtils.lerp(
        cartridgeRef.current.position.z,
        target,
        t,
      );
    }
    if (fanRef.current) {
      const target = explore ? FAN_EXPLODED_Z : FAN_BASE_Z;
      fanRef.current.position.z = THREE.MathUtils.lerp(fanRef.current.position.z, target, t);
    }

    // Teal emissive highlight on the filter parts while exploring.
    const targetEmissive = explore ? 0.55 : 0;
    for (const mat of [housingMatRef.current, cartridgeMatRef.current]) {
      if (mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, t);
      }
    }
  });

  return (
    <group name="airshield_helmet" position={[0, 0.02, 0]}>
      {/* ── Shell (recolourable) ─────────────────────────────────────── */}
      <group name="helmet_shell">
        {/* Dome */}
        <mesh name="helmet_shell_dome" castShadow scale={[1, 1, 1.05]}>
          <sphereGeometry args={[0.18, 64, 64]} />
          <meshStandardMaterial color={color.hex} roughness={pbr.roughness} metalness={pbr.metalness} />
        </mesh>
        {/* Chin bar */}
        <mesh
          name="helmet_shell_chin"
          castShadow
          position={[0, -0.085, 0.12]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <capsuleGeometry args={[0.072, 0.17, 12, 24]} />
          <meshStandardMaterial color={color.hex} roughness={pbr.roughness} metalness={pbr.metalness} />
        </mesh>
        {/* Neck collar */}
        <mesh name="helmet_shell_collar" position={[0, -0.14, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.135, 0.07, 48, 1, true]} />
          <meshStandardMaterial
            color={color.hex}
            roughness={pbr.roughness}
            metalness={pbr.metalness}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ── Visor (tinted glass) ─────────────────────────────────────── */}
      <mesh
        name="visor"
        position={[0, 0.03, 0.02]}
        rotation={[0, 0, 0]}
        scale={[1.02, 0.92, 1.06]}
      >
        <sphereGeometry
          args={[0.183, 48, 32, Math.PI * 0.3, Math.PI * 0.4, Math.PI * 0.22, Math.PI * 0.36]}
        />
        <meshStandardMaterial
          color="#0b1a1a"
          roughness={0.08}
          metalness={0.2}
          transparent
          opacity={0.78}
          side={THREE.DoubleSide}
          emissive={TEAL}
          emissiveIntensity={0.06}
        />
      </mesh>

      {/* ── Filter housing (chin intake) ─────────────────────────────── */}
      <group name="filter_housing" position={[0, -0.085, 0.17]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.08, 0.06]} />
          <meshStandardMaterial
            ref={housingMatRef}
            color="#15151b"
            roughness={0.45}
            metalness={0.5}
            emissive={TEAL}
            emissiveIntensity={0}
          />
        </mesh>
        {/* Air intake grille hint */}
        <mesh position={[0, 0, 0.031]}>
          <boxGeometry args={[0.1, 0.055, 0.004]} />
          <meshStandardMaterial color="#08080b" roughness={0.8} metalness={0.2} />
        </mesh>
      </group>

      {/* ── Filter cartridge (SEPARATE — slides forward in explode) ──── */}
      <group ref={cartridgeRef} name="filter_cartridge" position={[0, -0.085, CARTRIDGE_BASE_Z]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.028, 40]} />
          <meshStandardMaterial
            ref={cartridgeMatRef}
            color="#d8d8d2"
            roughness={0.7}
            metalness={0.1}
            emissive={TEAL}
            emissiveIntensity={0}
          />
        </mesh>
        {/* Pleated filter face */}
        <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.006, 40]} />
          <meshStandardMaterial color="#eceae2" roughness={0.95} metalness={0} />
        </mesh>
      </group>

      {/* ── Fan module (behind the cartridge) ────────────────────────── */}
      <group ref={fanRef} name="fan_module" position={[0, -0.085, FAN_BASE_Z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.022, 32]} />
          <meshStandardMaterial color="#1c1c24" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
