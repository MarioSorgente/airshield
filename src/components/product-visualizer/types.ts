// Shared types + safe defaults for the AirShield One product visualiser.
//
// Everything the visualiser renders (model path, colours, fallback images,
// filter labels) is described by `public/product-visualizer/manifest.json`.
// `loadManifest()` fetches it at runtime; if the fetch or parse fails we fall
// back to `DEFAULT_MANIFEST` so the component never crashes and always has a
// sensible shell to render.

/** Surface finish — drives roughness/metalness of the shell material. */
export type Finish = "matte" | "satin" | "gloss";

export interface ManifestColor {
  name: string;
  hex: string;
  finish: Finish;
}

export interface ManifestMeshes {
  shell: string;
  visor: string;
  filterHousing: string;
  filterCartridge: string;
  fanModule: string;
}

export interface ManifestModel {
  path: string;
  /** When false, the procedural placeholder helmet is used (no GLB fetched). */
  available: boolean;
  meshes: ManifestMeshes;
  /** Optional manual orientation nudge (degrees), applied before auto-fit. */
  rotationDeg?: [number, number, number];
  /** Target size (largest dimension, world units) for auto-fit. Default 0.34. */
  fitSize?: number;
  /**
   * Mesh names that make up the recolourable shell. When set, these meshes are
   * rendered in the solid variant colour (vertex colours off); every other mesh
   * keeps its baked vertex colours. Falls back to `meshes.shell` when omitted.
   */
  shellMeshNames?: string[];
  /**
   * Name prefix of the serviceable filter assembly (e.g. "AS02_"). In explore
   * mode every mesh with this prefix slides out together (radially outward) and
   * glows, giving a real exploded view. Falls back to the single
   * `meshes.filterCartridge` when omitted.
   */
  explodeGroupPrefix?: string;
}

export interface ManifestFallback {
  front: string;
  left: string;
  right: string;
  back: string;
  filterCloseup: string;
  /** Always-present image used when the named angle photos aren't available. */
  default: string;
  /** True if the fallback imagery is a placeholder, not the real product. */
  illustrative: boolean;
}

export interface ManifestFilterLabel {
  id: string;
  text: string;
}

export interface ManifestFilterExplode {
  available: boolean;
  labels: ManifestFilterLabel[];
}

export interface VisualizerManifest {
  product: string;
  model: ManifestModel;
  fallback: ManifestFallback;
  colors: ManifestColor[];
  filterExplode: ManifestFilterExplode;
}

/** The four orbit presets plus the neutral reset pose. */
export type ViewPreset = "front" | "left" | "right" | "back" | "reset";

/**
 * Finish → PBR material params. Kept here (not in the manifest) because these
 * are renderer concerns, not content the user replaces. `clearcoat` /
 * `clearcoatRoughness` drive the procedural shell's MeshPhysicalMaterial (a
 * thin automotive-paint lacquer); GLBHelmet reads only roughness/metalness and
 * ignores the rest, so the extra fields are safely additive.
 */
export interface FinishPbr {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

export const FINISH_PBR: Record<Finish, FinishPbr> = {
  matte: { roughness: 0.85, metalness: 0.05, clearcoat: 0.15, clearcoatRoughness: 0.6 },
  satin: { roughness: 0.5, metalness: 0.15, clearcoat: 0.5, clearcoatRoughness: 0.35 },
  gloss: { roughness: 0.18, metalness: 0.35, clearcoat: 1.0, clearcoatRoughness: 0.08 },
};

/**
 * Used whenever the manifest can't be loaded. Mirrors
 * `public/product-visualizer/manifest.json` — keep the two in sync. The five
 * colours intentionally match the variant names/hex in ProductCardSection so the
 * existing "Choose your style" buttons map cleanly onto the 3D shell.
 */
export const DEFAULT_MANIFEST: VisualizerManifest = {
  product: "AirShield One",
  model: {
    path: "/product-visualizer/model/airshield-one.glb",
    available: false,
    meshes: {
      shell: "helmet_shell",
      visor: "visor",
      filterHousing: "filter_housing",
      filterCartridge: "filter_cartridge",
      fanModule: "fan_module",
    },
  },
  fallback: {
    front: "/product-visualizer/photos/helmet-front.webp",
    left: "/product-visualizer/photos/helmet-left.webp",
    right: "/product-visualizer/photos/helmet-right.webp",
    back: "/product-visualizer/photos/helmet-back.webp",
    filterCloseup: "/product-visualizer/photos/helmet-filter-closeup.webp",
    default: "/product-visualizer/photos/helmet-fallback-cc0.jpg",
    illustrative: true,
  },
  colors: [
    { name: "Matte Black", hex: "#1a1a1a", finish: "matte" },
    { name: "White / Grey", hex: "#d4d4d4", finish: "satin" },
    { name: "High-visibility", hex: "#F5C842", finish: "gloss" },
    { name: "Minimal Premium", hex: "#2a2a2a", finish: "satin" },
    { name: "Sport Style", hex: "#FF4D1C", finish: "gloss" },
  ],
  filterExplode: {
    available: true,
    labels: [
      { id: "intake", text: "Rear down-facing intake" },
      { id: "cartridge", text: "PM filter cartridge (replaceable)" },
      { id: "fan", text: "Centrifugal blower" },
      { id: "pod", text: "Sealed battery & control pod (IP54)" },
    ],
  },
};

const MANIFEST_URL = "/product-visualizer/manifest.json";

/** Look up a colour by variant name, falling back to the first colour. */
export function colorForVariant(
  manifest: VisualizerManifest,
  variantName: string,
): ManifestColor {
  return (
    manifest.colors.find((c) => c.name === variantName) ??
    manifest.colors[0] ?? { name: variantName, hex: "#9aa0a6", finish: "satin" }
  );
}

/**
 * Fetch the manifest. Returns DEFAULT_MANIFEST on any failure so callers never
 * need a separate error path for "no manifest".
 */
export async function loadManifest(signal?: AbortSignal): Promise<VisualizerManifest> {
  try {
    const res = await fetch(MANIFEST_URL, { signal });
    if (!res.ok) return DEFAULT_MANIFEST;
    const data = (await res.json()) as Partial<VisualizerManifest>;
    // Shallow-merge so a partial/edited manifest still yields a complete object.
    return {
      ...DEFAULT_MANIFEST,
      ...data,
      model: { ...DEFAULT_MANIFEST.model, ...data.model },
      fallback: { ...DEFAULT_MANIFEST.fallback, ...data.fallback },
      filterExplode: { ...DEFAULT_MANIFEST.filterExplode, ...data.filterExplode },
      colors:
        Array.isArray(data.colors) && data.colors.length > 0
          ? data.colors
          : DEFAULT_MANIFEST.colors,
    };
  } catch {
    return DEFAULT_MANIFEST;
  }
}
