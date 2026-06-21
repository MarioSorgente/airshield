import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// One shared "stage" for every chapter of the landing page. Gives each section a
// consistent width, padding, desktop min-height, alternating dark surface, and an
// optional restrained radial glow — so the page scrolls like one paced story
// instead of a stack of unrelated form blocks.
//
// Desktop-only min-heights (gated at `lg`) keep chapters comparable in weight on
// large screens; phones/tablets always fall back to natural content height with
// uniform vertical padding, so smaller content never creates empty viewport areas.

type Variant = "hero" | "feature" | "interactive" | "compact";
type Surface = "base" | "raised";
type Glow = "none" | "teal" | "orange" | "blue";

interface SectionShellProps {
  id: string;
  variant: Variant;
  surface?: Surface;
  glow?: Glow;
  /** Hero / full-bleed sections: skip the centered inner container. */
  bare?: boolean;
  /** Override the inner container max-width (default max-w-7xl). */
  containerClassName?: string;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  hero: "flex min-h-svh items-center overflow-hidden",
  feature: "lg:flex lg:flex-col lg:justify-center lg:min-h-[78svh]",
  interactive: "lg:flex lg:flex-col lg:justify-center lg:min-h-[72svh]",
  compact: "",
};

const SURFACE_CLASS: Record<Surface, string> = {
  base: "",
  raised: "bg-[#0A0A0E]",
};

// Background-only radial gradients: they paint, never size, so they cannot
// introduce horizontal overflow on mobile.
const GLOW_CLASS: Record<Glow, string> = {
  none: "",
  teal: "bg-[radial-gradient(60%_50%_at_50%_0%,rgba(0,212,170,0.06),transparent_70%)]",
  orange: "bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,77,28,0.06),transparent_70%)]",
  blue: "bg-[radial-gradient(60%_50%_at_50%_0%,rgba(58,124,165,0.06),transparent_70%)]",
};

const SectionShell = forwardRef<HTMLElement, SectionShellProps>(function SectionShell(
  { id, variant, surface = "base", glow = "none", bare = false, containerClassName, className, children },
  ref
) {
  return (
    <section
      ref={ref}
      id={id}
      className={cn("relative w-full", VARIANT_CLASS[variant], SURFACE_CLASS[surface], className)}
    >
      {/* Surface/glow paint full-bleed; the content column keeps its own padding. */}
      {glow !== "none" && (
        <div className={cn("pointer-events-none absolute inset-0 z-0", GLOW_CLASS[glow])} aria-hidden="true" />
      )}
      {bare ? (
        children
      ) : (
        <div
          className={cn(
            "relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28",
            containerClassName
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
});

export default SectionShell;
