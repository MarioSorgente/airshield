import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// One consistent chapter header: eyebrow / mono label → headline → supporting
// text, with a built-in 48–64px gap before the content area. Pass `title` as JSX
// to preserve per-section line breaks and accent spans.

type Tone = "teal" | "orange" | "blue";

interface SectionHeaderProps {
  icon?: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
  align?: "center" | "left";
  /** Extend the headline classes for dramatic chapters (e.g. larger scale). */
  titleClassName?: string;
}

const TONE: Record<Tone, string> = {
  teal: "#00D4AA",
  orange: "#FF4D1C",
  blue: "#3A7CA5",
};

export default function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "teal",
  align = "center",
  titleClassName,
}: SectionHeaderProps) {
  const color = TONE[tone];
  const centered = align === "center";

  return (
    <div
      className={cn(
        "mb-12 space-y-4 lg:mb-16",
        centered ? "text-center" : "text-left"
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
            centered && "mx-auto"
          )}
          style={{ borderColor: `${color}4D`, backgroundColor: `${color}1A` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
          <span
            className="font-mono-label text-xs uppercase tracking-wider"
            style={{ color }}
          >
            {eyebrow}
          </span>
        </div>
      ) : (
        <p
          className="font-mono-label text-xs uppercase tracking-widest"
          style={{ color }}
        >
          {eyebrow}
        </p>
      )}

      <h2 className={cn("font-heading text-4xl tracking-tight sm:text-5xl", titleClassName)}>
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            "max-w-2xl text-[#8A8A93] leading-relaxed",
            centered && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
