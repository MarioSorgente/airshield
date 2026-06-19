import { useState } from "react";
import { Check, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { savePriceResponse } from "@/lib/airshieldDb";

const priceOptions = [
  {
    id: "essential" as const,
    name: "Essential",
    price: "Rp 2.4M–2.8M",
    description: "Helmet + filter system",
    features: ["Full-face helmet", "Integrated filtration", "USB-C battery", "1 filter cartridge"],
    cta: "I'd consider this",
    highlight: false,
  },
  {
    id: "standard" as const,
    name: "Standard",
    price: "Rp 3.2M",
    description: "Helmet + filter system + first replacement cartridge",
    features: [
      "Full-face helmet",
      "Integrated filtration",
      "USB-C battery",
      "2 filter cartridges",
      "Filter indicator",
    ],
    cta: "This feels right",
    highlight: true,
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: "Rp 4M+",
    description: "Better battery, premium shell, app/filter indicator",
    features: [
      "Premium shell materials",
      "Extended battery life",
      "App connectivity",
      "Smart filter indicator",
      "Premium finish options",
      "Priority beta access",
    ],
    cta: "I want premium",
    highlight: false,
  },
];

export default function PriceTestSection() {
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [useCase, setUseCase] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePriceSelect = (priceId: string) => {
    setSelectedPrice(priceId);
    trackEvent("price_option_selected", { price_option: priceId });
    setShowModal(true);
  };

  const submitResponse = async () => {
    if (!selectedPrice) return;
    setSaving(true);
    try {
      await savePriceResponse({
        priceOption: selectedPrice as "essential" | "standard" | "premium",
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        city: city || undefined,
        useCase: useCase || undefined,
      });
      trackEvent("price_option_selected", {
        price_option: selectedPrice,
        email,
        city,
        useCase,
      });
      if (email) trackEvent("email_submitted", { source: "price_test", email });
      storeFormData("price_response", {
        priceOption: selectedPrice,
        email,
        whatsapp,
        city,
        useCase,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setEmail("");
        setWhatsapp("");
        setCity("");
        setUseCase("");
      }, 3000);
    } catch (err) {
      console.error("Price submit failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="font-mono-label text-xs text-[#00D4AA] uppercase tracking-widest">
            Market Research
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight">
            WHAT WOULD YOU PAY TO BREATHE CLEANER AIR ON EVERY RIDE?
          </h2>
          <p className="text-[#8A8A93] max-w-2xl mx-auto">
            These are research options to help us understand what riders value. No payment is collected.
          </p>
        </div>

        {/* Price cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {priceOptions.map((option) => (
            <div
              key={option.id}
              className={`relative rounded-2xl border p-6 space-y-6 transition-all hover:scale-[1.02] ${
                option.highlight
                  ? "border-[#00D4AA] bg-gradient-to-b from-[#00D4AA]/10 to-[#0D0D10]"
                  : "border-[#1A1A22] bg-[#0D0D10]"
              }`}
            >
              {option.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#00D4AA] text-[#060608] text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="space-y-2">
                <p className="font-mono-label text-xs text-[#8A8A93] uppercase tracking-wider">
                  {option.name}
                </p>
                <p className="text-3xl font-bold text-[#F4F1EC]">{option.price}</p>
                <p className="text-sm text-[#8A8A93]">{option.description}</p>
              </div>

              <div className="space-y-3">
                {option.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#00D4AA] flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePriceSelect(option.id)}
                className={`w-full py-5 rounded-lg font-semibold transition-all ${
                  option.highlight
                    ? "bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608]"
                    : "border border-[#1A1A22] hover:border-[#00D4AA]/50 bg-transparent hover:bg-[#00D4AA]/10 text-[#F4F1EC]"
                }`}
              >
                {option.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-center p-4 rounded-lg bg-[#13131A] border border-[#1A1A22]">
          <p className="text-sm text-[#8A8A93]">
            These prices are for validation purposes only. Final pricing will depend on manufacturing costs,
            certification requirements, and component sourcing. No payment is collected today.
          </p>
        </div>
      </div>

      {/* Capture Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide">
              GREAT CHOICE!
            </DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#00D4AA]" />
              </div>
              <p className="text-lg font-medium text-[#00D4AA]">Thanks for your feedback!</p>
              <p className="text-sm text-[#8A8A93]">
                We'll notify you if we build this version.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-[#8A8A93]">
                Want to be notified if we build the {selectedPrice && priceOptions.find((p) => p.id === selectedPrice)?.name} version?
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
                placeholder="City (optional)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Input
                placeholder="Main use case (optional)"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Button
                onClick={submitResponse}
                disabled={!email || saving}
                className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5"
              >
                {saving ? "Saving..." : "Notify me"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
