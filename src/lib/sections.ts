// Ordered landing-page sections — shared by the nav, the dot navigator, and the
// active-section tracker so they stay in sync with the render order in App.tsx.
export type SectionMeta = { id: string; label: string };

export const SECTIONS: SectionMeta[] = [
  { id: "hero", label: "Home" },
  { id: "problem", label: "The problem" },
  { id: "exposure-calculator", label: "Exposure" },
  { id: "product", label: "Product" },
  { id: "use-cases", label: "Who it's for" },
  { id: "science", label: "Science" },
  { id: "pricing", label: "Pricing" },
  { id: "beta", label: "Beta" },
];

// Curated subset shown in the desktop top nav (follows the scroll order).
export const NAV_LINKS: SectionMeta[] = [
  { id: "exposure-calculator", label: "Exposure" },
  { id: "product", label: "Product" },
  { id: "use-cases", label: "Who it's for" },
  { id: "science", label: "Science" },
  { id: "pricing", label: "Pricing" },
];
