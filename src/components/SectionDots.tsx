import { SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/useActiveSection";

// Desktop-only right-side dot navigator. Highlights the active section and
// lets you jump between them. Hidden under lg.
export default function SectionDots() {
  const active = useActiveSection(SECTIONS.map((s) => s.id));

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex"
    >
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-label={s.label}
          className="group relative flex items-center justify-end"
        >
          <span className="absolute right-6 whitespace-nowrap rounded-md border border-[#1A1A22] bg-[#13131A] px-2 py-1 text-xs text-[#F4F1EC] opacity-0 transition-opacity group-hover:opacity-100">
            {s.label}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              active === s.id
                ? "h-2.5 w-2.5 bg-[#00D4AA]"
                : "h-2 w-2 bg-[#8A8A93]/40 group-hover:bg-[#8A8A93]"
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
