import { useState } from "react";
import { Package, Fan, Filter, Battery, Bell, ArrowRight, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { trpc } from "@/providers/trpc";

const variants = [
  { name: "Matte Black", color: "#1a1a1a" },
  { name: "White / Grey", color: "#d4d4d4" },
  { name: "High-visibility", color: "#F5C842" },
  { name: "Minimal Premium", color: "#2a2a2a" },
  { name: "Sport Style", color: "#FF4D1C" },
];

const features = [
  { icon: Package, text: "AirShield full-face helmet" },
  { icon: Fan, text: "Integrated fan-assisted filtration system" },
  { icon: Filter, text: "Replaceable filter cartridge" },
  { icon: Battery, text: "USB-C rechargeable battery" },
  { icon: Bell, text: "Filter replacement indicator" },
];

export default function ProductCardSection() {
  const [selectedVariant, setSelectedVariant] = useState(variants[0].name);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [modalType, setModalType] = useState<"reserve" | "whatsapp">("reserve");

  const reserveMutation = trpc.airshield.reserveEarlyAccess.useMutation();
  const variantMutation = trpc.airshield.submitVariantSelection.useMutation();

  const handleVariantSelect = async (variantName: string) => {
    setSelectedVariant(variantName);
    trackEvent("variant_selected", { variant: variantName });
    try {
      await variantMutation.mutateAsync({ variantName, email: email || undefined });
    } catch {
      // Silent fail - localStorage has backup
    }
    storeFormData("variant_selection", { variant: variantName, timestamp: new Date().toISOString() });
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
    if (!email) return;
    try {
      await reserveMutation.mutateAsync({
        source: modalType === "reserve" ? "product_card_reserve" : "product_card_whatsapp",
        email,
      });
      if (modalType === "reserve") {
        trackEvent("email_submitted", { source: "product_card_reserve", email, city });
      }
      if (whatsapp) trackEvent("whatsapp_submitted", { source: "product_card", whatsapp });
      storeFormData("product_card", { email, whatsapp, city, modalType, timestamp: new Date().toISOString() });
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
    }
  };

  return (
    <section id="product" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0D0D10] rounded-2xl border border-[#1A1A22] overflow-hidden">
          {/* Status bar */}
          <div className="px-6 py-3 bg-[#13131A] border-b border-[#1A1A22] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F5C842]" />
              <span className="font-mono-label text-xs text-[#F5C842] uppercase tracking-wider">
                Concept Product — Not Yet Available
              </span>
            </div>
            <span className="text-xs text-[#8A8A93]">AirShield One</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product visual */}
            <div className="space-y-6">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-[#13131A] to-[#1A1A22] flex items-center justify-center relative overflow-hidden">
                <img
                  src="/hero-helmet.jpg"
                  alt="AirShield One"
                  className="w-3/4 h-3/4 object-contain"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#00D4AA]/20 border border-[#00D4AA]/30">
                  <span className="text-xs font-medium text-[#00D4AA]">Prototype Concept</span>
                </div>
              </div>

              {/* Variant selector */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#8A8A93] uppercase tracking-wider">
                  Choose your style
                </p>
                <div className="flex flex-wrap gap-3">
                  {variants.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => handleVariantSelect(v.name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        selectedVariant === v.name
                          ? "border-[#00D4AA] bg-[#00D4AA]/10"
                          : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-[#8A8A93]/30"
                        style={{ backgroundColor: v.color }}
                      />
                      <span className="text-sm">{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product details */}
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-3xl tracking-wide">AIRSHIELD ONE</h2>
                <p className="text-sm text-[#8A8A93] mt-1">
                  Premium full-face filtration helmet concept
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
                  Reserve early access
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
                No payment today. This helps us decide production volume, pricing, and beta location.
              </p>
            </div>
          </div>
        </div>
      </div>

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
                We'll contact you when prototype testing opens.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-[#8A8A93]">
                Reserve your spot for the {selectedVariant} AirShield One. No payment required.
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
                disabled={!email || !city || reserveMutation.isPending}
                className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5"
              >
                {reserveMutation.isPending ? "Saving..." : "Reserve my spot"}
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
                disabled={!whatsapp || reserveMutation.isPending}
                className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5"
              >
                {reserveMutation.isPending ? "Saving..." : "Notify me on WhatsApp"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
