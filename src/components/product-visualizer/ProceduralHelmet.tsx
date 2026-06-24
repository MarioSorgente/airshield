import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { FINISH_PBR, type ManifestColor } from "./types";

// A stylised full-face helmet built entirely from Three.js primitives — no GLB.
// It is laid out to match the AirShield V1 spec slides (rear-side intake → rear
// IP54 pod with PM filter + centrifugal blower + battery → short over-crown duct
// → chin manifold + visor bleed → rear one-way exhaust) and establishes the
// exact part/material contract the final GLB must follow:
//
//   helmet_shell      → its own (recolourable) material, MeshPhysicalMaterial
//   visor             → tinted glossy face shield
//   filter_housing    → the rear IP54 pod (highlighted in explore mode)
//   filter_cartridge  → SEPARATE PM cartridge that slides out the rear in explode
//   fan_module        → centrifugal blower below/forward of the cartridge
//
// Each instance owns its own materials (created by JSX), so recolouring never
// mutates a shared/cached material.

const ACCENT = "#00D4AA"; // site-brand teal, used for glows/highlights/airflow
const POD = "#17171d"; // sealed pod / housing shell
const METAL = "#20202a"; // anodised metal (blower, trims)
const DUCT = "#0f0f15"; // rigid over-crown duct
const LINER = "#0b0b0f"; // neck roll / interior trim (never recoloured)
const PLEAT = "#e7e5dd"; // off-white pleated filter media
const GLASS = "#0a1716"; // tinted visor glass

// Rear-pod explode offsets. Local +Z = front of helmet, so the cartridge and
// blower slide toward −Z (straight out the back) when exploded.
const CARTRIDGE_BASE_Z = -0.205;
const CARTRIDGE_EXPLODED_Z = -0.38;
const FAN_BASE_Z = -0.175;
const FAN_EXPLODED_Z = -0.3;

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
    const targetEmissive = explore ? 0.6 : 0;
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
        {/* Aero cranium — elongated ellipsoid for a real helmet profile */}
        <mesh name="helmet_shell_dome" castShadow scale={[1, 1.03, 1.16]}>
          <sphereGeometry args={[0.18, 64, 48]} />
          <meshPhysicalMaterial
            color={color.hex}
            roughness={pbr.roughness}
            metalness={pbr.metalness}
            clearcoat={pbr.clearcoat}
            clearcoatRoughness={pbr.clearcoatRoughness}
          />
        </mesh>

        {/* Front brow / peak */}
        <mesh castShadow position={[0, 0.108, 0.13]} rotation={[0.5, 0, 0]} scale={[1, 0.45, 0.7]}>
          <sphereGeometry args={[0.12, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhysicalMaterial
            color={color.hex}
            roughness={pbr.roughness}
            metalness={pbr.metalness}
            clearcoat={pbr.clearcoat}
            clearcoatRoughness={pbr.clearcoatRoughness}
          />
        </mesh>

        {/* Rear aero spoiler fin */}
        <mesh castShadow position={[0, 0.105, -0.165]} rotation={[-0.7, 0, 0]}>
          <coneGeometry args={[0.05, 0.11, 4, 1]} />
          <meshPhysicalMaterial
            color={color.hex}
            roughness={pbr.roughness}
            metalness={pbr.metalness}
            clearcoat={pbr.clearcoat}
            clearcoatRoughness={pbr.clearcoatRoughness}
          />
        </mesh>

        {/* Chin bar (bevelled) with a recessed front chin vent */}
        <group position={[0, -0.092, 0.118]}>
          <RoundedBox args={[0.205, 0.092, 0.095]} radius={0.035} smoothness={5} castShadow>
            <meshPhysicalMaterial
              color={color.hex}
              roughness={pbr.roughness}
              metalness={pbr.metalness}
              clearcoat={pbr.clearcoat}
              clearcoatRoughness={pbr.clearcoatRoughness}
            />
          </RoundedBox>
          {/* Chin vent recess */}
          <mesh position={[0, -0.002, 0.05]}>
            <boxGeometry args={[0.085, 0.05, 0.012]} />
            <meshStandardMaterial color="#070709" roughness={0.85} metalness={0.2} />
          </mesh>
          {/* Vent slats */}
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={i} position={[0, -0.018 + i * 0.012, 0.056]}>
              <boxGeometry args={[0.082, 0.004, 0.006]} />
              <meshStandardMaterial color={METAL} roughness={0.4} metalness={0.7} />
            </mesh>
          ))}
        </group>

        {/* Side ear-pods */}
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * 0.158, -0.05, 0.04]} scale={[0.5, 1, 1.15]}>
            <sphereGeometry args={[0.05, 24, 24]} />
            <meshPhysicalMaterial
              color={color.hex}
              roughness={pbr.roughness}
              metalness={pbr.metalness}
              clearcoat={pbr.clearcoat}
              clearcoatRoughness={pbr.clearcoatRoughness}
            />
          </mesh>
        ))}
      </group>

      {/* ── Neck roll / interior trim (not recoloured) ───────────────── */}
      <mesh position={[0, -0.15, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.118, 0.132, 0.06, 48, 1, true]} />
        <meshStandardMaterial color={LINER} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Visor (tinted glossy face shield) ────────────────────────── */}
      <Visor />

      {/* ── Brow trim around the visor aperture ──────────────────────── */}
      <BrowTrim />

      {/* ── Over-crown rigid duct ────────────────────────────────────── */}
      <OverCrownDuct />

      {/* ── Rear IP54 pod (intake + filter bay + battery) ────────────── */}
      <group name="filter_housing">
        {/* Filter bay / upper housing — highlighted in explore mode */}
        <group position={[0, 0.0, -0.182]} rotation={[-0.42, 0, 0]}>
          <RoundedBox args={[0.142, 0.12, 0.085]} radius={0.022} smoothness={5} castShadow>
            <meshStandardMaterial
              ref={housingMatRef}
              color={POD}
              roughness={0.42}
              metalness={0.55}
              emissive={ACCENT}
              emissiveIntensity={0}
            />
          </RoundedBox>
          {/* Service-cover parting line */}
          <mesh position={[0, 0, 0.044]}>
            <boxGeometry args={[0.12, 0.092, 0.003]} />
            <meshStandardMaterial color="#0a0a0e" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>

        {/* Rear-side down-facing intake louver (top of pod) */}
        <group position={[0, 0.078, -0.158]} rotation={[0.55, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.12, 0.05, 0.045]} />
            <meshStandardMaterial color="#0a0a0e" roughness={0.8} metalness={0.3} />
          </mesh>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[0, 0.018 - i * 0.009, 0.024]} rotation={[-0.5, 0, 0]}>
              <boxGeometry args={[0.11, 0.0035, 0.014]} />
              <meshStandardMaterial color={METAL} roughness={0.4} metalness={0.7} />
            </mesh>
          ))}
        </group>

        {/* Battery & control pod (lowest, protrudes rear-down) */}
        <group position={[0, -0.118, -0.2]}>
          <RoundedBox args={[0.13, 0.085, 0.09]} radius={0.025} smoothness={5} castShadow>
            <meshStandardMaterial color={POD} roughness={0.4} metalness={0.6} />
          </RoundedBox>
          {/* Status LEDs */}
          {[-0.03, -0.01, 0.01, 0.03].map((x, i) => (
            <mesh key={i} position={[x, 0.018, -0.046]}>
              <boxGeometry args={[0.008, 0.004, 0.002]} />
              <meshStandardMaterial
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={i === 0 ? 1.4 : 0.5}
                toneMapped={false}
              />
            </mesh>
          ))}
          {/* USB-C port */}
          <mesh position={[0, -0.018, -0.046]}>
            <boxGeometry args={[0.018, 0.007, 0.003]} />
            <meshStandardMaterial color="#040406" roughness={0.6} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* ── Filter cartridge (SEPARATE — slides out the rear in explode) ─ */}
      <group ref={cartridgeRef} name="filter_cartridge" position={[0, 0.0, CARTRIDGE_BASE_Z]}>
        <group rotation={[-0.42, 0, 0]}>
          {/* Cartridge frame */}
          <RoundedBox args={[0.12, 0.1, 0.03]} radius={0.008} smoothness={4} castShadow>
            <meshStandardMaterial
              ref={cartridgeMatRef}
              color="#26262d"
              roughness={0.5}
              metalness={0.5}
              emissive={ACCENT}
              emissiveIntensity={0}
            />
          </RoundedBox>
          {/* Pleated media (rear face — the service direction) */}
          {Array.from({ length: 14 }).map((_, i) => (
            <mesh key={i} position={[-0.052 + i * 0.008, 0, -0.017]} rotation={[0, 0.6, 0]}>
              <boxGeometry args={[0.006, 0.088, 0.012]} />
              <meshStandardMaterial color={PLEAT} roughness={0.95} metalness={0} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── Centrifugal blower (below/forward of the cartridge) ───────── */}
      <group ref={fanRef} name="fan_module" position={[0, -0.052, FAN_BASE_Z]}>
        {/* Volute / scroll housing */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.046, 0.046, 0.034, 36]} />
          <meshStandardMaterial color={METAL} roughness={0.34} metalness={0.7} />
        </mesh>
        {/* Tangential outlet stub (toward the over-crown duct) */}
        <mesh position={[0.02, 0.05, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.03, 0.05, 0.03]} />
          <meshStandardMaterial color={METAL} roughness={0.34} metalness={0.7} />
        </mesh>
        {/* Recessed inlet eye */}
        <mesh position={[0, 0, -0.018]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.006, 28]} />
          <meshStandardMaterial color="#050507" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Impeller blades */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.022, Math.sin(a) * 0.022, -0.012]}
              rotation={[0, 0, a + 0.6]}
            >
              <boxGeometry args={[0.018, 0.004, 0.012]} />
              <meshStandardMaterial color="#2c2c36" roughness={0.4} metalness={0.6} />
            </mesh>
          );
        })}
      </group>

      {/* ── Chin manifold (delivery to nose & mouth) ─────────────────── */}
      <group position={[0, -0.075, 0.075]}>
        <RoundedBox args={[0.1, 0.028, 0.05]} radius={0.01} smoothness={4}>
          <meshStandardMaterial color={DUCT} roughness={0.5} metalness={0.4} />
        </RoundedBox>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-0.032 + i * 0.016, -0.015, 0.01]}>
            <boxGeometry args={[0.008, 0.004, 0.03]} />
            <meshStandardMaterial color="#050507" roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ── Rear one-way exhaust louver (rear-upper) ─────────────────── */}
      <group position={[0, 0.1, -0.188]} rotation={[-0.6, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.035, 0.03]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.8} metalness={0.3} />
        </mesh>
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} position={[0, 0.008 - i * 0.008, 0.016]} rotation={[0.6, 0, 0]}>
            <boxGeometry args={[0.072, 0.003, 0.012]} />
            <meshStandardMaterial color={METAL} roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── Airflow path visualisation (glowing teal) ────────────────── */}
      <AirflowLines explore={explore} reducedMotion={reducedMotion} />
    </group>
  );
}

// ── Visor ────────────────────────────────────────────────────────────────
function Visor() {
  return (
    <>
      <mesh name="visor" position={[0, 0.01, 0.02]} scale={[1.02, 0.94, 1.08]}>
        <sphereGeometry
          args={[0.183, 56, 36, Math.PI * 0.3, Math.PI * 0.4, Math.PI * 0.2, Math.PI * 0.4]}
        />
        <meshPhysicalMaterial
          color={GLASS}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.03}
          ior={1.45}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          emissive={ACCENT}
          emissiveIntensity={0.05}
        />
      </mesh>
      {/* Visor pivot bosses (hinge detail) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.176, -0.005, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 24]} />
          <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.75} />
        </mesh>
      ))}
    </>
  );
}

// ── Brow trim (dark frame across the top of the visor aperture) ───────────
function BrowTrim() {
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.155, -0.01, 0.115),
      new THREE.Vector3(-0.095, 0.035, 0.165),
      new THREE.Vector3(0, 0.05, 0.188),
      new THREE.Vector3(0.095, 0.035, 0.165),
      new THREE.Vector3(0.155, -0.01, 0.115),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.011, 12, false);
  }, []);
  return (
    <mesh geometry={geom} castShadow>
      <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.78} />
    </mesh>
  );
}

// ── Over-crown rigid duct ─────────────────────────────────────────────────
function OverCrownDuct() {
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05, -0.185),
      new THREE.Vector3(0, 0.16, -0.11),
      new THREE.Vector3(0, 0.208, 0.0),
      new THREE.Vector3(0, 0.165, 0.115),
      new THREE.Vector3(0, 0.07, 0.16),
    ]);
    return new THREE.TubeGeometry(curve, 80, 0.017, 16, false);
  }, []);
  return (
    <mesh geometry={geom} castShadow>
      <meshStandardMaterial color={DUCT} roughness={0.45} metalness={0.4} />
    </mesh>
  );
}

// ── Airflow lines (glowing teal tubes + travelling pulse) ─────────────────
const FLOW_DOTS = 6;

function AirflowLines({ explore, reducedMotion }: { explore: boolean; reducedMotion: boolean }) {
  const mainCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.075, -0.215),
        new THREE.Vector3(0, 0.17, -0.13),
        new THREE.Vector3(0, 0.225, 0.0),
        new THREE.Vector3(0, 0.17, 0.13),
        new THREE.Vector3(0, 0.05, 0.2),
        new THREE.Vector3(0, -0.065, 0.165),
        new THREE.Vector3(0, -0.115, 0.095),
      ]),
    [],
  );

  const mainGeom = useMemo(() => new THREE.TubeGeometry(mainCurve, 90, 0.0055, 10, false), [
    mainCurve,
  ]);

  const visorGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, -0.02, 0.16),
      new THREE.Vector3(0, 0.0, 0.205),
      new THREE.Vector3(0.11, -0.02, 0.16),
    ]);
    return new THREE.TubeGeometry(curve, 40, 0.004, 8, false);
  }, []);

  const exhaustGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.105, -0.2),
      new THREE.Vector3(0, 0.135, -0.27),
      new THREE.Vector3(0, 0.16, -0.33),
    ]);
    return new THREE.TubeGeometry(curve, 30, 0.0045, 8, false);
  }, []);

  const dotsRef = useRef<(THREE.Mesh | null)[]>([]);
  const phase = useRef(0);

  useFrame((_, delta) => {
    if (!reducedMotion) phase.current = (phase.current + delta * 0.16) % 1;
    for (let i = 0; i < FLOW_DOTS; i++) {
      const dot = dotsRef.current[i];
      if (!dot) continue;
      const u = (phase.current + i / FLOW_DOTS) % 1;
      mainCurve.getPointAt(u, dot.position);
    }
  });

  const tubeOpacity = explore ? 0.5 : 0.32;

  return (
    <group>
      <mesh geometry={mainGeom}>
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={tubeOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={visorGeom}>
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={tubeOpacity * 0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={exhaustGeom}>
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={tubeOpacity * 0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Travelling flow pulse */}
      {Array.from({ length: FLOW_DOTS }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dotsRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.008, 12, 12]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
