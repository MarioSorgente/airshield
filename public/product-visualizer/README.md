# AirShield One — Product Visualiser assets

This folder is the **single source of truth** for every replaceable asset used by
the 3D product visualiser in `src/components/product-visualizer/`. You can swap
the model, the fallback photos, the colours, and the labels here **without
touching any component code** — everything is read from
[`manifest.json`](./manifest.json) at runtime, with safe defaults baked into
`src/components/product-visualizer/types.ts` if the manifest fails to load.

```
public/product-visualizer/
  README.md                 ← you are here
  manifest.json             ← paths, colours, labels, availability flags
  THIRD_PARTY_ASSETS.md     ← licence record for any downloaded placeholder asset
  model/
    airshield-one.glb       ← the final 3D model (NOT present yet — see below)
  photos/
    helmet-front.webp       ← fallback images (used when WebGL is unavailable)
    helmet-left.webp
    helmet-right.webp
    helmet-back.webp
    helmet-filter-closeup.webp
  textures/
    shell-basecolor.webp    ← optional, only for a UV-mapped GLB
```

---

## Current status (prototype)

- **No final GLB yet.** `manifest.json` has `model.available: false`, so the
  visualiser renders a **stylised procedural helmet** built from Three.js
  primitives. It has correctly named parts (`helmet_shell`, `visor`,
  `filter_housing`, `filter_cartridge`, `fan_module`) so colour-switching and the
  exploded filter view already work. It is a stand-in, **not** the real AirShield
  design.
- **Fallback photos are CC0 placeholders** of a *different* helmet, shown only
  when WebGL is unavailable or the model fails to load, and labelled
  "Illustrative placeholder" in the UI. See
  [`THIRD_PARTY_ASSETS.md`](./THIRD_PARTY_ASSETS.md).

When you add the real model, set `model.available` to `true` in `manifest.json`.
The procedural helmet is replaced automatically.

---

## How to replace assets (the workflow)

1. **Drop the model** at `model/airshield-one.glb` (rules below).
2. In `manifest.json` set `"model": { "available": true, ... }`.
3. Replace the five images in `photos/` with real product photography (table
   below). Keep the same filenames, or update the paths in `manifest.json`.
4. (Optional) Adjust `colors`, `filterExplode.labels`, or mesh names in
   `manifest.json` — no code changes needed.
5. Rebuild (`npm run build`). Done.

> Keep your original high-resolution source files **outside** `public/`. Put only
> optimised, web-ready assets in this folder.

---

## Required photos

Replace each file in `photos/` with the real assets below. These are used for the
WebGL-unavailable / load-error fallback and should be the *same physical helmet*
across angles.

| Asset                       | Filename                     | Requirement                                                                                                                                 |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Main fallback product image | `helmet-front.webp`          | 2048 × 2048 minimum, transparent or clean neutral background, isolated helmet, no rider, no hands, no bike, no visible external brand logos |
| Left side view              | `helmet-left.webp`           | Same exact helmet, same lens, same distance, same lighting, full helmet visible                                                             |
| Right side view             | `helmet-right.webp`          | Same exact helmet, mirrored viewpoint only if truly identical; otherwise photograph separately                                             |
| Rear view                   | `helmet-back.webp`           | Same setup, centred, no cropped edges                                                                                                       |
| Filter close-up             | `helmet-filter-closeup.webp` | Detailed close-up of intake, filter door, or cartridge area, sharp enough for zoom                                                          |
| Optional shell texture      | `shell-basecolor.webp`       | Only for a UV-mapped GLB; do not use as a substitute for the 3D model                                                                       |
| Final 3D model              | `airshield-one.glb`          | Follow the mesh, material, optimisation, and naming rules below                                                                             |

---

## Required 3D model (`airshield-one.glb`)

The final model should be:

- **`.glb` format, glTF 2.0**
- Optimised for web, **target under 8 MB** where possible
- **UV mapped**
- **Centred and correctly scaled** (real-world-ish metres; the scene expects a
  helmet roughly 0.3–0.4 units tall)
- **Helmet front facing consistently** — front of the helmet should point toward
  **+Z** (the default camera sits on +Z and looks at the front), chin/filter
  region low and forward
- Made from **separate, clearly named meshes**:
  - `helmet_shell`
  - `visor`
  - `filter_housing`
  - `filter_cartridge`
  - `fan_module`
- The **shell needs its own material** so its colour can change independently of
  the rest of the helmet.
- The **`filter_cartridge` must be a separate mesh** from the helmet body so it
  can translate forward in the exploded view.
- Prefer **PBR materials** with sensible `roughness` / `metalness` values.
- **Do not bake logos or colour-specific graphics into the shell texture** if the
  shell needs colour customisation.

The mesh names above are read from `manifest.json` → `model.meshes`. If you use
different names, update that object instead of renaming meshes.

### Why these rules matter

- **Product photography cannot create true interactive 3D by itself.** The
  rotate / zoom / orbit experience requires a real model.
- **For accurate colour switching, the GLB must have a separate shell material.**
  CSS tinting of a photo is *not* colour-accurate — the photo fallback is labelled
  illustrative for this reason.
- **For accurate filter zoom / exploded view, the cartridge must be a separate
  mesh** named `filter_cartridge`.
- **Do not mix different helmet samples or different lighting conditions across
  angles** — the fallback gallery assumes one consistent helmet.
- **Keep original high-resolution source photos outside `public`;** put only
  optimised web assets in this folder.

### Graceful degradation

The visualiser never assumes a mesh exists. If a named mesh is missing:

- Missing `helmet_shell` → colour switching is skipped (no crash).
- Missing `filter_cartridge` → the exploded view falls back to the
  `helmet-filter-closeup.webp` image automatically.
