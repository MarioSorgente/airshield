import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { Shield, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fadeUp } from "@/components/motion";
import SectionShell from "@/components/SectionShell";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { saveEarlyAccessReservation } from "@/lib/airshieldDb";

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

export default function HeroSection() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      trackEvent("scroll_to_section", { section: id });
    }
  };

  const handleReserve = async () => {
    trackEvent("hero_reserve_click", { source: "hero_primary" });
    if (!email) {
      setShowModal(true);
      trackEvent("modal_opened", { modal: "reserve_early_access" });
      return;
    }
    await submitReservation();
  };

  const submitReservation = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await saveEarlyAccessReservation({
        source: "hero_section",
        email,
        whatsapp: whatsapp || undefined,
        city: city || undefined,
      });
      trackEvent("email_submitted", { source: "hero_reserve", email, city });
      if (whatsapp) trackEvent("whatsapp_submitted", { source: "hero_reserve", whatsapp });
      storeFormData("hero_reserve", { email, whatsapp, city, timestamp: new Date().toISOString() });
      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setEmail("");
        setWhatsapp("");
        setCity("");
      }, 3000);
    } catch (err) {
      console.error("Reservation failed:", err);
      toast.error("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell ref={heroRef} id="hero" variant="hero" bare>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060608] via-[#0D0D10] to-[#13131A]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00D4AA]/5 to-transparent" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            className="space-y-8"
            variants={reduce ? undefined : heroContainer}
            initial={reduce ? false : "hidden"}
            animate={reduce ? undefined : "show"}
          >
            {/* Status badge */}
            <motion.div variants={reduce ? undefined : fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D4AA]/30 bg-[#00D4AA]/10">
              <span className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse" />
              <span className="font-mono-label text-xs text-[#00D4AA] uppercase tracking-wider">
                Built for Indonesia's riders
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={reduce ? undefined : fadeUp} className="space-y-4">
              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                YOUR HELMET PROTECTS YOUR SKULL.
                <br />
                <span className="text-[#00D4AA]">WHAT PROTECTS YOUR LUNGS?</span>
              </h1>
              <p className="text-lg text-[#8A8A93] max-w-xl leading-relaxed">
                Every day, Indonesian riders sit inches from exhaust, dust, and PM2.5.
                AirShield is a premium filtration helmet built for people who breathe traffic daily.
              </p>
              <p className="text-base text-[#F4F1EC]/80 max-w-xl leading-relaxed">
                It doesn't stop at your lungs — it shows up in the mirror, in your workouts,
                and in everything you buy to fix it.
              </p>
            </motion.div>

            {/* Price anchor */}
            <motion.div variants={reduce ? undefined : fadeUp} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#13131A] border border-[#1A1A22] w-fit">
              <Info className="w-5 h-5 text-[#F5C842]" />
              <div>
                <p className="text-sm text-[#8A8A93]">Target launch price</p>
                <p className="text-xl font-bold text-[#F4F1EC]">
                  Rp 3.2M <span className="text-sm font-normal text-[#8A8A93]">/ approx. $200</span>
                </p>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={reduce ? undefined : fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleReserve}
                className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold px-8 py-6 text-base rounded-lg transition-all hover:scale-105"
              >
                Reserve early access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => scrollToSection("exposure-calculator")}
                variant="outline"
                className="border-[#1A1A22] hover:border-[#00D4AA]/50 text-[#F4F1EC] hover:text-[#00D4AA] px-8 py-6 text-base rounded-lg transition-all"
              >
                Calculate my exposure
              </Button>
            </motion.div>

            {/* Microcopy */}
            <motion.p variants={reduce ? undefined : fadeUp} className="text-sm text-[#8A8A93]">
              No spam. We'll contact early supporters first when access opens.
            </motion.p>

            {/* Launch framing */}
            <motion.div variants={reduce ? undefined : fadeUp} className="pt-4 border-t border-[#1A1A22]">
              <p className="text-sm text-[#8A8A93]">
                Launching first in <span className="text-[#F4F1EC] font-medium">Jakarta, Bali, and major Java cities</span>.
              </p>
            </motion.div>
          </motion.div>

          {/* Right: Product image */}
          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#00D4AA]/20 rounded-full blur-[100px] scale-75 animate-pulse" />
              {/* Hero image — rider shot with built-in feature call-outs */}
              <motion.img
                src="/hero-main.jpg"
                alt="Rider on a motorbike wearing the AirShield filtration helmet, with integrated fan-assisted filtration, replaceable filter cartridge, and USB-C rechargeable battery"
                style={reduce ? undefined : { y: imgY, scale: imgScale }}
                className="relative z-10 w-full max-w-xl lg:max-w-2xl rounded-2xl shadow-2xl shadow-[#00D4AA]/10"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reserve Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide">
              RESERVE EARLY ACCESS
            </DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#00D4AA]" />
              </div>
              <p className="text-lg font-medium text-[#00D4AA]">You're on the list!</p>
              <p className="text-sm text-[#8A8A93]">
                We'll be in touch as soon as access opens in your area.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-[#8A8A93]">
                Enter your details to reserve early access.
              </p>
              <Input
                placeholder="Email address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Input
                placeholder="WhatsApp (optional)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Input
                placeholder="City *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Button
                onClick={submitReservation}
                disabled={!email || !city || saving}
                className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5"
              >
                {saving ? "Saving..." : "Reserve my spot"}
              </Button>
              <p className="text-xs text-center text-[#8A8A93]">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}
