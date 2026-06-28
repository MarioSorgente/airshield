import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { FINISH_PBR, type FinishPbr, type ManifestColor } from "./types";

// A stylised full-face helmet built entirely from Three.js primitives — no GLB.
// The shell is composed as an OPEN-FRONT form (dome + forehead + jaw panels with
// a real face aperture) rather than a closed ball, so it reads as a helmet and
// the large wrap-around visor sits in a genuine opening. Layout follows the
// AirShield V1 spec slides (rear-side intake → rear IP54 pod with PM filter +
// centrifugal blower + battery → short over-crown duct → chin manifold + visor
// bleed → rear one-way exhaust) and keeps the part/material contract a GLB needs:
//
//   helmet_shell      → recolourable MeshPhysicalMaterial (dome/brow/jaw/chin)
//   visor             → tinted glossy wrap-around face shield
//   filter_housing    → the rear IP54 pod (highlighted in explore mode)
//   filter_cartridge  → SEPARATE PM cartridge that slides out the rear in explode
//   fan_module        → centrifugal blower below/forward of the cartridge

const ACCENT = "#00D4AA"; // site-brand teal, used for glows/highlights/airflow
const POD = "#17171d"; // sealed pod / housing shell
const METAL = "#20202a"; // anodised metal (blower, trims)
const DUCT = "#0f0f15"; // rigid over-crown duct
const LINER = "#08080b"; // neck roll / inner liner (never recoloured)
const PLEAT = "#e7e5dd"; // off-white pleated filter media
const GLASS = "#0a1413"; // tinted visor glass

// ── Shell geometry constants ──────────────────────────────────────────────
const R = 0.185;
const SHELL_SCALE: [number, number, number] = [0.97, 1.0, 1.13];
// Front face aperture: a phi gap centred on +Z (the front). The dome covers
// everything except this gap; brow + jaw panels cap its top and bottom.
const GAP = 1.3; // aperture angular width (rad)
const DOME_PHI_START = Math.PI / 2 + GAP / 2;
const DOME_PHI_LEN = Math.PI * 2 - GAP;
const FACE_PHI_START = Math.PI / 2 - GAP / 2;

type SphereArgs = ConstructorParameters<typeof THREE.SphereGeometry>;

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

    const targetEmissive = explore ? 0.6 : 0;
    for (const mat of [housingMatRef.current, cartridgeMatRef.current]) {
      if (mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, t);
      }
    }
  });

  return (
    <group name="airshield_helmet" position={[0, 0.04, 0]}>
      {/* ── Dark inner liner so the visor reads as a window, not a shell ── */}
      <mesh position={[0, -0.01, -0.005]} scale={[0.92, 0.96, 1.04]}>
        <sphereGeometry args={[0.168, 40, 32]} />
        <meshStandardMaterial color={LINER} roughness={0.98} metalness={0} side={THREE.BackSide} />
      </mesh>

      {/* ── Shell (recolourable, open-front composition) ─────────────── */}
      <group name="helmet_shell">
        {/* Main dome — covers top/back/sides, open at the front aperture */}
        <ShellPatch
          name="helmet_shell_dome"
          color={color.hex}
          pbr={pbr}
          args={[R, 64, 48, DOME_PHI_START, DOME_PHI_LEN, 0, Math.PI * 0.93]}
        />
        {/* Forehead / brow panel — caps the top of the aperture */}
        <ShellPatch
          color={color.hex}
          pbr={pbr}
          args={[R, 44, 24, FACE_PHI_START, GAP, 0, Math.PI * 0.36]}
        />
        {/* Jaw panel — caps the bottom of the aperture */}
        <ShellPatch
          color={color.hex}
          pbr={pbr}
          args={[R, 44, 24, FACE_PHI_START, GAP, Math.PI * 0.6, Math.PI * 0.33]}
        />
        {/* Protruding chin bar / jaw guard with a front chin vent */}
        <ChinBar color={color.hex} pbr={pbr} />
        {/* Low-profile brow intake slots (flush, replaces the old blob) */}
        {[-0.04, 0.04].map((x) => (
          <mesh key={x} position={[x, 0.158, 0.092]} rotation={[0.7, 0, 0]}>
            <boxGeometry args={[0.05, 0.012, 0.02]} />
            <meshStandardMaterial color="#070709" roughness={0.85} metalness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ── Neck roll (not recoloured) ───────────────────────────────── */}
      <mesh position={[0, -0.175, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.135, 0.06, 48, 1, true]} />
        <meshStandardMaterial color={LINER} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Visor (large tinted glossy wrap shield) ──────────────────── */}
      <Visor />

      {/* ── Visor trim along the brow edge of the aperture ───────────── */}
      <BrowTrim />

      {/* ── Over-crown rigid duct (hugs the crown) ───────────────────── */}
      <OverCrownDuct />

      {/* ── Rear IP54 pod (intake + filter bay + battery) ────────────── */}
      <group name="filter_housing">
        {/* Filter bay / upper housing — highlighted in explore mode */}
        <group position={[0, -0.01, -0.198]} rotation={[-0.42, 0, 0]}>
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
          <mesh position={[0, 0, 0.044]}>
            <boxGeometry args={[0.12, 0.092, 0.003]} />
            <meshStandardMaterial color="#0a0a0e" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>

        {/* Rear-side down-facing intake louver (top of pod) */}
        <group position={[0, 0.07, -0.175]} rotation={[0.55, 0, 0]}>
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
        <group position={[0, -0.13, -0.205]}>
          <RoundedBox args={[0.13, 0.085, 0.09]} radius={0.025} smoothness={5} castShadow>
            <meshStandardMaterial color={POD} roughness={0.4} metalness={0.6} />
          </RoundedBox>
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
          <mesh position={[0, -0.018, -0.046]}>
            <boxGeometry args={[0.018, 0.007, 0.003]} />
            <meshStandardMaterial color="#040406" roughness={0.6} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* ── Filter cartridge (SEPARATE — slides out the rear in explode) ─ */}
      <group ref={cartridgeRef} name="filter_cartridge" position={[0, -0.01, CARTRIDGE_BASE_Z]}>
        <group rotation={[-0.42, 0, 0]}>
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
          {Array.from({ length: 14 }).map((_, i) => (
            <mesh key={i} position={[-0.052 + i * 0.008, 0, -0.017]} rotation={[0, 0.6, 0]}>
              <boxGeometry args={[0.006, 0.088, 0.012]} />
              <meshStandardMaterial color={PLEAT} roughness={0.95} metalness={0} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── Centrifugal blower (below/forward of the cartridge) ───────── */}
      <group ref={fanRef} name="fan_module" position={[0, -0.072, FAN_BASE_Z]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.046, 0.046, 0.034, 36]} />
          <meshStandardMaterial color={METAL} roughness={0.34} metalness={0.7} />
        </mesh>
        <mesh position={[0.02, 0.05, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.03, 0.05, 0.03]} />
          <meshStandardMaterial color={METAL} roughness={0.34} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, -0.018]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.006, 28]} />
          <meshStandardMaterial color="#050507" roughness={0.7} metalness={0.3} />
        </mesh>
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
      <group position={[0, -0.092, 0.085]}>
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
      <group position={[0, 0.13, -0.16]} rotation={[-0.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.07, 0.03, 0.028]} />
          <meshStandardMaterial color="#0a0a0e" roughness={0.8} metalness={0.3} />
        </mesh>
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} position={[0, 0.007 - i * 0.007, 0.015]} rotation={[0.6, 0, 0]}>
            <boxGeometry args={[0.062, 0.003, 0.011]} />
            <meshStandardMaterial color={METAL} roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── Airflow path visualisation (glowing teal) ────────────────── */}
      <AirflowLines explore={explore} reducedMotion={reducedMotion} />
    </group>
  );
}

// ── Reusable recolourable shell patch ─────────────────────────────────────
function ShellPatch({
  args,
  color,
  pbr,
  name,
}: {
  args: SphereArgs;
  color: string;
  pbr: FinishPbr;
  name?: string;
}) {
  return (
    <mesh name={name} castShadow scale={SHELL_SCALE}>
      <sphereGeometry args={args} />
      <meshPhysicalMaterial
        color={color}
        roughness={pbr.roughness}
        metalness={pbr.metalness}
        clearcoat={pbr.clearcoat}
        clearcoatRoughness={pbr.clearcoatRoughness}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Chin bar / jaw guard (curved, protruding) ─────────────────────────────
function ChinBar({ color, pbr }: { color: string; pbr: FinishPbr }) {
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.142, -0.05, 0.0),
      new THREE.Vector3(-0.105, -0.105, 0.095),
      new THREE.Vector3(0, -0.125, 0.155),
      new THREE.Vector3(0.105, -0.105, 0.095),
      new THREE.Vector3(0.142, -0.05, 0.0),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.04, 18, false);
  }, []);
  return (
    <>
      <mesh geometry={geom} castShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          clearcoatRoughness={pbr.clearcoatRoughness}
        />
      </mesh>
      {/* Chin vent recess + slats */}
      <group position={[0, -0.122, 0.176]}>
        <mesh>
          <boxGeometry args={[0.075, 0.04, 0.012]} />
          <meshStandardMaterial color="#070709" roughness={0.85} metalness={0.2} />
        </mesh>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[0, -0.013 + i * 0.009, 0.005]}>
            <boxGeometry args={[0.07, 0.0035, 0.01]} />
            <meshStandardMaterial color={METAL} roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ── Visor (large tinted glossy wrap-around shield) ────────────────────────
function Visor() {
  return (
    <>
      <mesh name="visor" scale={[SHELL_SCALE[0], SHELL_SCALE[1], SHELL_SCALE[2]]}>
        <sphereGeometry
          args={[0.1895, 56, 36, FACE_PHI_START - 0.07, GAP + 0.14, Math.PI * 0.33, Math.PI * 0.31]}
        />
        <meshPhysicalMaterial
          color={GLASS}
          roughness={0.04}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.03}
          ior={1.45}
          transparent
          opacity={0.62}
          side={THREE.DoubleSide}
          emissive={ACCENT}
          emissiveIntensity={0.02}
        />
      </mesh>
      {/* Visor pivot bosses (hinge detail) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.178, -0.005, 0.045]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.014, 24]} />
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
      new THREE.Vector3(-0.17, 0.01, 0.085),
      new THREE.Vector3(-0.1, 0.082, 0.155),
      new THREE.Vector3(0, 0.1, 0.178),
      new THREE.Vector3(0.1, 0.082, 0.155),
      new THREE.Vector3(0.17, 0.01, 0.085),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.012, 12, false);
  }, []);
  return (
    <mesh geometry={geom} castShadow>
      <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.78} />
    </mesh>
  );
}

// ── Over-crown rigid duct (hugs the crown, no periscope) ──────────────────
function OverCrownDuct() {
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.105, -0.175),
      new THREE.Vector3(0, 0.175, -0.09),
      new THREE.Vector3(0, 0.2, 0.0),
      new THREE.Vector3(0, 0.18, 0.09),
      new THREE.Vector3(0, 0.125, 0.15),
    ]);
    return new THREE.TubeGeometry(curve, 80, 0.015, 16, false);
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
        new THREE.Vector3(0, 0.085, -0.205),
        new THREE.Vector3(0, 0.185, -0.1),
        new THREE.Vector3(0, 0.214, 0.0),
        new THREE.Vector3(0, 0.19, 0.1),
        new THREE.Vector3(0, 0.12, 0.165),
        new THREE.Vector3(0, -0.02, 0.175),
        new THREE.Vector3(0, -0.12, 0.115),
      ]),
    [],
  );

  const mainGeom = useMemo(() => new THREE.TubeGeometry(mainCurve, 90, 0.005, 10, false), [
    mainCurve,
  ]);

  const visorGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.13, -0.03, 0.145),
      new THREE.Vector3(0, -0.055, 0.2),
      new THREE.Vector3(0.13, -0.03, 0.145),
    ]);
    return new THREE.TubeGeometry(curve, 40, 0.0038, 8, false);
  }, []);

  const exhaustGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, -0.18),
      new THREE.Vector3(0, 0.1, -0.27),
      new THREE.Vector3(0, 0.07, -0.33),
    ]);
    return new THREE.TubeGeometry(curve, 30, 0.0042, 8, false);
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

  const tubeOpacity = explore ? 0.42 : 0.26;

  return (
    <group>
      {[mainGeom, visorGeom, exhaustGeom].map((geom, i) => (
        <mesh key={i} geometry={geom}>
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={i === 0 ? tubeOpacity : tubeOpacity * 0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Travelling flow pulse */}
      {Array.from({ length: FLOW_DOTS }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dotsRef.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.0075, 12, 12]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
