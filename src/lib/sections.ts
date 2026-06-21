// Ordered landing-page sections — shared by the nav, the dot navigator, and the
// active-section tracker so they stay in sync with the render order in App.tsx.
export type SectionMeta = { id: string; label: string };

export const SECTIONS: SectionMeta[] = [
  { id: "hero", label: "Home" },
  { id: "product", label: "Product" },
  { id: "use-cases", label: "Who it's for" },
  { id: "pricing", label: "Pricing" },
  { id: "problem", label: "The problem" },
  { id: "exposure-calculator", label: "Exposure" },
  { id: "filter", label: "Filter" },
  { id: "beta", label: "Beta" },
  { id: "science", label: "Science" },
];

// Curated subset shown in the desktop top nav.
export const NAV_LINKS: SectionMeta[] = [
  { id: "product", label: "Product" },
  { id: "use-cases", label: "Who it's for" },
  { id: "pricing", label: "Pricing" },
  { id: "exposure-calculator", label: "Exposure" },
  { id: "science", label: "Science" },
];
