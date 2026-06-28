import { useState } from "react";
import { Package, Fan, Filter, Battery, Bell, ArrowRight, Check, MessageCircle, ZoomIn, Box, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SectionShell from "@/components/SectionShell";
import ProductVisualizer from "@/components/product-visualizer/ProductVisualizer";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { saveEarlyAccessReservation, saveVariantSelection } from "@/lib/airshieldDb";

// Two candidate designs shown as full 6-angle galleries. The pick is a real
// business signal — whichever design wins the vote is the one we build first —
// so it's tracked as a `design_selected` event + a variant_selections write.
const designs = [
  {
    id: "tourer",
    name: "Tourer",
    image: "/helmets/design-tourer.jpg",
    tagline: "Rounded modular shell — calm, touring-first stance.",
    accent: "#3A7CA5",
  },
  {
    id: "sport",
    name: "Aero Sport",
    image: "/helmets/design-sport.jpg",
    tagline: "Aggressive aero shell — sharp, sport-first stance.",
    accent: "#00D4AA",
  },
];

const features = [
  { icon: Package, text: "AirShield full-face helmet" },
  { icon: Fan, text: "Integrated fan-assisted filtration system" },
  { icon: Filter, text: "Replaceable filter cartridge" },
  { icon: Battery, text: "USB-C rechargeable battery" },
  { icon: Bell, text: "Filter replacement indicator" },
];

export default function ProductCardSection() {
  const [selectedDesign, setSelectedDesign] = useState(designs[0].id);
  const [view, setView] = useState<"angles" | "3d">("angles");
  const [showZoom, setShowZoom] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState<"reserve" | "whatsapp">("reserve");

  const design = designs.find((d) => d.id === selectedDesign) ?? designs[0];

  // Only an explicit switch counts as a vote, so the default selection on mount
  // doesn't skew the "which design to build first" tally.
  const handleDesignSelect = async (designId: string) => {
    if (designId === selectedDesign) {
      setShowZoom(true);
      return;
    }
    setSelectedDesign(designId);
    const picked = designs.find((d) => d.id === designId);
    if (!picked) return;
    trackEvent("design_selected", { design: picked.name });
    try {
      await saveVariantSelection({ variantName: picked.name, email: email || undefined });
    } catch {
      // Silent fail — localStorage has the backup below.
    }
    storeFormData("design_selection", { design: picked.name, timestamp: new Date().toISOString() });
  };

  const openReserveModal = () => {
    trackEvent("hero_reserve_click", { source: "product_card" });
    trackEvent("preorder_notify_click", { source: "product_card" });
    setModalType("reserve");
    setShowReserveModal(true);
  };

  const openWhatsAppModal = () => {
    trackEvent("preorder_notify_click", { source: "product_card_whatsapp" });
    setModalType("whatsapp");
    setShowWhatsAppModal(true);
  };

  const submitForm = async () => {
    // Reserve modal needs email + city; WhatsApp modal allows WhatsApp-only.
    if (modalType === "reserve" && (!email || !city)) return;
    if (modalType === "whatsapp" && !whatsapp) return;
    setSaving(true);
    try {
      await saveEarlyAccessReservation({
        source: modalType === "reserve" ? "product_card_reserve" : "product_card_whatsapp",
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        city: city || undefined,
        variant: design.name,
      });
      if (modalType === "reserve") {
        trackEvent("email_submitted", { source: "product_card_reserve", email, city });
      }
      if (whatsapp) trackEvent("whatsapp_submitted", { source: "product_card", whatsapp });
      storeFormData("product_card", { email, whatsapp, city, design: design.name, modalType, timestamp: new Date().toISOString() });
      setSubmitted(true);
      setTimeout(() => {
        setShowReserveModal(false);
        setShowWhatsAppModal(false);
        setSubmitted(false);
        setEmail("");
        setWhatsapp("");
        setCity("");
      }, 3000);
    } catch (err) {
      console.error("Submit failed:", err);
      toast.error("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell id="product" variant="feature" surface="raised" containerClassName="max-w-5xl">
      <div className="bg-[#0D0D10] rounded-[2rem] border border-[#1A1A22] overflow-hidden">
          {/* Status bar */}
          <div className="px-6 py-3 bg-[#13131A] border-b border-[#1A1A22] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D4AA]" />
              <span className="font-mono-label text-xs text-[#00D4AA] uppercase tracking-wider">
                AirShield One · H13 HEPA Filtration
              </span>
            </div>
            <span className="text-xs text-[#8A8A93]">AirShield One</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product visual — interactive 3D model or the two-design angle gallery */}
            <div className="space-y-5">
              {/* View toggle: 3D model vs all-angles photos */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                {([
                  { id: "angles" as const, label: "Angles", icon: Images },
                  { id: "3d" as const, label: "3D model", icon: Box },
                ]).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setView(v.id);
                      trackEvent("preset_view_selected", { view: v.id });
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      view === v.id
                        ? "bg-[#00D4AA] text-[#060608]"
                        : "text-[#8A8A93] hover:text-[#F4F1EC]"
                    }`}
                  >
                    <v.icon className="w-4 h-4" />
                    {v.label}
                  </button>
                ))}
              </div>

              {view === "3d" ? (
                <>
                  <ProductVisualizer selectedVariant="Matte Black" />
                  <p className="text-sm text-[#8A8A93]">
                    Interactive engineering model of AirShield One — drag to rotate,
                    scroll to zoom, and explore the filtration system.
                  </p>
                </>
              ) : (
                <>
                  {/* Style chooser — selection is tracked silently for product planning */}
                  <div className="space-y-1">
                    <p className="font-mono-label text-xs text-[#00D4AA] uppercase tracking-wider">
                      Choose your style
                    </p>
                    <p className="text-sm text-[#8A8A93]">
                      Two shells, same filtration system inside. Pick the one that's you.
                    </p>
                  </div>

                  {/* Design switcher */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                    {designs.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleDesignSelect(d.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedDesign === d.id
                            ? "bg-[#00D4AA] text-[#060608]"
                            : "text-[#8A8A93] hover:text-[#F4F1EC]"
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>

                  {/* All-angles grid (click to zoom) */}
                  <button
                    onClick={() => setShowZoom(true)}
                    className="group relative block w-full overflow-hidden rounded-2xl border border-[#1A1A22] bg-[#060608]"
                    aria-label={`Zoom ${design.name} — all angles`}
                  >
                    <img
                      src={design.image}
                      alt={`AirShield One — ${design.name} design, six angles`}
                      loading="lazy"
                      className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#060608]/80 backdrop-blur-sm font-mono-label text-[10px] uppercase tracking-wider text-[#F4F1EC]">
                      6 angles
                    </span>
                    <span className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#060608]/80 backdrop-blur-sm text-xs text-[#F4F1EC] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-3.5 h-3.5" /> Zoom
                    </span>
                  </button>

                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: design.accent }} />
                    <p className="text-sm text-[#8A8A93]">
                      <span className="text-[#F4F1EC] font-medium">{design.name}.</span> {design.tagline}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Product details */}
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-3xl tracking-wide">AIRSHIELD ONE</h2>
                <p className="text-sm text-[#8A8A93] mt-1">
                  Premium full-face filtration helmet
                </p>
              </div>

              {/* Price */}
              <div className="p-4 rounded-lg bg-[#13131A] border border-[#1A1A22]">
                <p className="text-sm text-[#8A8A93]">Target launch price</p>
                <p className="text-3xl font-bold text-[#F4F1EC]">
                  Rp 3.2M
                  <span className="text-base font-normal text-[#8A8A93] ml-2">/ approx. $200</span>
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#8A8A93] uppercase tracking-wider">
                  Includes
                </p>
                {features.map((f) => (
                  <div key={f.text} className="flex items-center gap-3">
                    <f.icon className="w-5 h-5 text-[#00D4AA]" />
                    <span className="text-sm">{f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={openReserveModal}
                  className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5 rounded-lg transition-all hover:scale-[1.02]"
                >
                  Reserve the {design.name}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={openWhatsAppModal}
                  variant="outline"
                  className="w-full border-[#1A1A22] hover:border-[#00D4AA]/50 text-[#F4F1EC] hover:text-[#00D4AA] py-5 rounded-lg transition-all"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Notify me on WhatsApp when pre-orders open
                </Button>
              </div>

              <p className="text-xs text-center text-[#8A8A93]">
                Reserve now to secure your early-access spot for the {design.name}.
              </p>
            </div>
          </div>
        </div>

      {/* Zoom lightbox — full 6-angle grid */}
      <Dialog open={showZoom} onOpenChange={setShowZoom}>
        <DialogContent className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] max-w-5xl p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wide px-1">
              {design.name.toUpperCase()} · ALL ANGLES
            </DialogTitle>
          </DialogHeader>
          <img
            src={design.image}
            alt={`AirShield One — ${design.name} design, six angles enlarged`}
            className="w-full rounded-xl border border-[#1A1A22]"
          />
        </DialogContent>
      </Dialog>

      {/* Reserve Modal */}
      <Dialog open={showReserveModal} onOpenChange={setShowReserveModal}>
        <DialogContent className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide">
              RESERVE EARLY ACCESS
            </DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#00D4AA]" />
              </div>
              <p className="text-lg font-medium text-[#00D4AA]">You're on the list!</p>
              <p className="text-sm text-[#8A8A93]">
                We'll be in touch soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-[#8A8A93]">
                Reserve your spot for the {design.name} AirShield One.
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
                onClick={submitForm}
                disabled={!email || !city || saving}
                className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5"
              >
                {saving ? "Saving..." : "Reserve my spot"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide">
              WHATSAPP NOTIFICATION
            </DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-[#00D4AA]" />
              </div>
              <p className="text-lg font-medium text-[#00D4AA]">We'll message you!</p>
              <p className="text-sm text-[#8A8A93]">
                You'll receive a WhatsApp when pre-orders open.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-[#8A8A93]">
                Get notified on WhatsApp when pre-orders open.
              </p>
              <Input
                placeholder="WhatsApp number *"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Input
                placeholder="Email (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Button
                onClick={submitForm}
                disabled={!whatsapp || saving}
                className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5"
              >
                {saving ? "Saving..." : "Notify me on WhatsApp"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}
