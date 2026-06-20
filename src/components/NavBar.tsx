import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Shield, Menu, X, ArrowRight } from "lucide-react";
import { NAV_LINKS, SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/useActiveSection";
import { trackEvent } from "@/lib/tracking";

// Apple-style frosted nav: transparent over the hero, materializes on scroll.
// Desktop = inline links + Reserve pill; mobile = hamburger → full-screen sheet.
export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const active = useActiveSection(SECTIONS.map((s) => s.id));

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > window.innerHeight * 0.6);
  });

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? "border-b border-[#1A1A22] bg-[#060608]/70 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#hero" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#00D4AA]" />
            <span className="font-heading text-xl tracking-wider">AIRSHIELD</span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                className={`text-sm transition-colors ${
                  active === l.id ? "text-[#00D4AA]" : "text-[#8A8A93] hover:text-[#F4F1EC]"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#beta"
              onClick={() => trackEvent("hero_reserve_click", { source: "navbar" })}
              className="hidden items-center gap-1.5 rounded-full bg-[#00D4AA] px-4 py-2 text-sm font-semibold text-[#060608] transition-colors hover:bg-[#00D4AA]/90 sm:inline-flex"
            >
              Reserve <ArrowRight className="h-4 w-4" />
            </a>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-[#F4F1EC] md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[70] bg-[#060608]/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-heading text-xl tracking-wider">AIRSHIELD</span>
              <button onClick={() => setMenuOpen(false)} className="p-2" aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <motion.nav
              className="flex flex-col px-6 pt-6"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
            >
              {SECTIONS.filter((s) => s.id !== "hero").map((l) => (
                <motion.a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={() => setMenuOpen(false)}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  className={`border-b border-[#1A1A22] py-3 font-heading text-2xl tracking-wide ${
                    active === l.id ? "text-[#00D4AA]" : "text-[#F4F1EC]"
                  }`}
                >
                  {l.label}
                </motion.a>
              ))}
              <a
                href="#beta"
                onClick={() => {
                  setMenuOpen(false);
                  trackEvent("hero_reserve_click", { source: "navbar_mobile" });
                }}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#00D4AA] px-5 py-3 font-semibold text-[#060608]"
              >
                Reserve early access <ArrowRight className="h-4 w-4" />
              </a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
