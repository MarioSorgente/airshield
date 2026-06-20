import { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/tracking";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;
      // Show after scrolling past hero
      setVisible(scrollY > heroHeight * 0.8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    trackEvent("hero_reserve_click", { source: "sticky_cta" });
    const el = document.getElementById("beta");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-[#13131A]/95 backdrop-blur-lg border-t border-[#1A1A22] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <p className="text-xs text-[#8A8A93]">AirShield One</p>
              <p className="text-sm font-medium">Reserve early access</p>
            </div>
            <p className="sm:hidden text-sm font-medium">Reserve early access</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleClick}
              size="sm"
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold px-4"
            >
              Join beta
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 rounded-lg hover:bg-[#1A1A22] transition-colors"
            >
              <X className="w-4 h-4 text-[#8A8A93]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
