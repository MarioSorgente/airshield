import { useState } from "react";
import { Bike, Briefcase, Heart, Globe, Star, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { saveUseCaseSelection } from "@/lib/airshieldDb";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import SectionShell from "@/components/SectionShell";
import SectionHeader from "@/components/SectionHeader";

const useCases = [
  {
    id: "daily_commuters",
    icon: Bike,
    title: "Daily Commuters",
    description: "30–120 minutes per day in traffic.",
    detail: "You ride to work, to school, to the market. Every day. The exposure adds up.",
  },
  {
    id: "delivery_riders",
    icon: Briefcase,
    title: "Grab / Gojek / Delivery Riders",
    description: "Your motorbike is your workplace. Your exposure is higher.",
    detail: "8+ hours per day on the road. You're not just commuting — you're working in traffic.",
  },
  {
    id: "parents",
    icon: Heart,
    title: "Parents",
    description: "For riders who think about long-term health.",
    detail: "You think about the future — for yourself and your family. Protecting your lungs matters.",
  },
  {
    id: "bali_expats",
    icon: Globe,
    title: "Bali Riders / Expats",
    description: "For people riding daily in traffic, dust, and tourism zones.",
    detail: "Bali traffic is intense. Construction dust, tourist vans, and narrow roads multiply exposure.",
  },
  {
    id: "premium_buyers",
    icon: Star,
    title: "Premium Helmet Buyers",
    description: "For riders already willing to pay more for safety, comfort, and design.",
    detail: "You invest in quality gear. A helmet that also protects your lungs is the next logical step.",
  },
];

export default function UseCaseSection() {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = async (caseId: string) => {
    setSelectedCase(caseId);
    trackEvent("use_case_selected", { use_case: caseId });
    setShowModal(true);
  };

  const submitForm = async () => {
    if (!selectedCase) return;
    try {
      await saveUseCaseSelection({
        useCaseName: selectedCase,
        email: email || undefined,
      });
      trackEvent("email_submitted", { source: "use_case", email, useCase: selectedCase });
      storeFormData("use_case", {
        useCase: selectedCase,
        email,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setEmail("");
      }, 3000);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  return (
    <SectionShell id="use-cases" variant="interactive">
      <SectionHeader
        eyebrow="Segmentation"
        title="WHO IS AIRSHIELD FOR?"
        description="Click the card that best describes you. This helps us understand which riders need AirShield most."
      />

      {/* Use case cards */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc) => (
            <StaggerItem
              key={uc.id}
              whileHover={{ y: -4 }}
              onClick={() => handleSelect(uc.id)}
              className={`p-6 rounded-2xl border cursor-pointer transition-[border-color,box-shadow] duration-300 ${
                selectedCase === uc.id
                  ? "border-[#00D4AA] bg-[#00D4AA]/10"
                  : "border-[#1A1A22] bg-[#0D0D10] hover:border-[#00D4AA]/40 hover:shadow-[0_0_40px_-12px_rgba(0,212,170,0.35)]"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center">
                  <uc.icon className="w-6 h-6 text-[#00D4AA]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{uc.title}</h3>
                  <p className="text-sm text-[#8A8A93]">{uc.description}</p>
                  <p className="text-sm text-[#8A8A93]/70">{uc.detail}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#00D4AA] hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 p-0 h-auto"
                >
                  That's me
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

      {/* Capture Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide">
              THANKS!
            </DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-[#00D4AA]" />
              </div>
              <p className="text-lg font-medium text-[#00D4AA]">We'll keep you updated!</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-[#8A8A93]">
                You selected: <span className="text-[#F4F1EC] font-medium">
                  {useCases.find((u) => u.id === selectedCase)?.title}
                </span>
              </p>
              <p className="text-sm text-[#8A8A93]">
                Want updates specific to your rider type?
              </p>
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
              <Button
                onClick={submitForm}
                className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-5"
              >
                Keep me updated
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="w-full text-[#8A8A93] hover:text-[#F4F1EC]"
              >
                Skip, I don't want updates
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}
