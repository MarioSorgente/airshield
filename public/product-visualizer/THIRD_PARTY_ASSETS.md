# Third-party & placeholder assets

This file records every non-original asset used by the product visualiser, its
licence, and the reasoning behind it. Everything here is a **temporary prototype
placeholder** — none of it is the final AirShield One product.

## Summary

| Asset | Role | Source | Creator | Licence | Attribution required? |
| --- | --- | --- | --- | --- | --- |
| `photos/helmet-fallback-cc0.jpg` | Static fallback image (shown only when WebGL is unavailable or the 3D scene errors) | [WordPress Photo Directory](https://wordpress.org/photos/photo/87968da2fd/) | Yam B Chhetri | **CC0 1.0** (public domain dedication) | No |
| Procedural 3D helmet | Primary interactive model | Generated in-code from Three.js primitives (`ProceduralHelmet.tsx`) | AirShield project | n/a (original) | No |

> The fallback image was discovered via the [Openverse](https://openverse.org)
> CC0-filtered search and verified on its source landing page before download.
> It was **downloaded locally** (not hotlinked). Direct file:
> `https://pd.w.org/2025/09/87968da2fd8f3a683.48854620-1152x2048.jpeg`

## Why a procedural model instead of a downloaded GLB

The visualiser's core requirements — live shell **colour switching** and an
**exploded filter view** — depend on the model having a *separate shell material*
and a *separate, named `filter_cartridge` mesh*. Freely-licensed helmet GLBs
almost never expose those named parts, so a downloaded model would break two
acceptance criteria and risk presenting another brand's design as AirShield.

A procedural helmet built from Three.js primitives sidesteps all of that: it is
original, carries zero licence/brand risk, and is authored with exactly the part
and material names the final GLB must use (`helmet_shell`, `visor`,
`filter_housing`, `filter_cartridge`, `fan_module`). It is a deliberate stand-in,
not a finished design.

## Placeholder selection checklist (fallback image)

Assessed against the brief's criteria:

| Criterion | Result |
| --- | --- |
| Isolated product | ⚠️ Single helmet is the sole subject, but on a natural outdoor background (not a clean studio sweep) |
| Unbranded | ✅ No visible brand logos |
| Full helmet visible | ✅ Full-face helmet, fully in frame |
| High resolution | ✅ 1152 × 2048 |
| Consistent perspective | n/a — a single image is reused for all fallback angles (see limitations) |
| Usable commercial licence | ✅ CC0 1.0 (no permission, attribution, or payment required) |
| No visible watermark | ✅ None |
| Suitable for a premium technical page | ⚠️ Acceptable for a *labelled* fallback; not premium studio quality |

**Decision:** Accept as the WebGL-unavailable fallback only. It is surfaced in
the UI with an explicit "Illustrative placeholder" badge. The aggregator sites
that dominate web searches (purepng, pngimg, nicepng, cleanpng, freepik, etc.)
were **rejected** — their licences are unverifiable and they frequently host
branded manufacturer marketing photos, which the brief forbids.

## Rules for whoever replaces these assets

- This is a **different helmet**, not AirShield One. Do not present it as the
  final product; keep the "Illustrative placeholder" label until real assets land.
- Replace it with real, isolated AirShield photography per the table in
  [`README.md`](./README.md). Then point `manifest.json` → `fallback.*` at your
  real `helmet-*.webp` files.
- The fallback path is set via `manifest.json` → `fallback.default`; the per-angle
  slots (`front`/`left`/`right`/`back`/`filterCloseup`) still reference the
  canonical `helmet-*.webp` filenames, so dropping those files in "just works".

## Known limitation

Only one verified-CC0, no-rider, single-helmet image of acceptable quality was
available, so the fallback reuses it for every angle rather than mixing different
helmets/lighting across angles (which the brief explicitly warns against). The
angle buttons in the fallback gallery therefore show the same image until real
per-angle photos are added.
