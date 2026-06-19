import { useState } from "react";
import { Filter, Calendar, Check, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { trpc } from "@/providers/trpc";

const frequencies = [
  {
    id: "reminders_only" as const,
    label: "One-time reminders",
    description: "Get notified when your filter might need changing",
  },
  {
    id: "every_4_weeks" as const,
    label: "Every 4 weeks",
    description: "Monthly replacement for heavy commuters",
  },
  {
    id: "every_6_weeks" as const,
    label: "Every 6 weeks",
    description: "Regular replacement for daily riders",
  },
  {
    id: "every_8_weeks" as const,
    label: "Every 8 weeks",
    description: "Extended life for occasional riders",
  },
  {
    id: "not_interested" as const,
    label: "Not interested",
    description: "I prefer buying filters manually",
  },
];

export default function FilterSubscriptionSection() {
  const [selectedFreq, setSelectedFreq] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filterMutation = trpc.airshield.submitFilterSubscription.useMutation();

  const handleFreqSelect = (freqId: string) => {
    setSelectedFreq(freqId);
    trackEvent("filter_subscription_selected", { frequency: freqId });
    if (freqId !== "not_interested") {
      setShowPriceModal(true);
    } else {
      // Still capture the "not interested" response
      submitResponse(freqId, "no");
    }
  };

  const submitResponse = async (freq: string, acceptance: "yes" | "maybe" | "no") => {
    try {
      await filterMutation.mutateAsync({
        frequency: freq as "reminders_only" | "every_4_weeks" | "every_6_weeks" | "every_8_weeks" | "not_interested",
        email: email || undefined,
        priceAcceptance: acceptance,
      });
      trackEvent("filter_subscription_selected", {
        frequency: freq,
        price_acceptance: acceptance,
        email,
      });
      if (email) trackEvent("email_submitted", { source: "filter_subscription", email });
      storeFormData("filter_subscription", {
        frequency: freq,
        priceAcceptance: acceptance,
        email,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowPriceModal(false);
        setSubmitted(false);
        setEmail("");
      }, 3000);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  return (
    <section id="filter" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D4AA]/30 bg-[#00D4AA]/10">
            <Filter className="w-4 h-4 text-[#00D4AA]" />
            <span className="font-mono-label text-xs text-[#00D4AA] uppercase tracking-wider">
              Subscription Validation
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight">
            THE HELMET IS THE START.
            <br />
            <span className="text-[#00D4AA]">THE FILTER IS THE HABIT.</span>
          </h2>
          <p className="text-[#8A8A93] max-w-2xl mx-auto leading-relaxed">
            AirShield would use replaceable filter cartridges. This creates an opportunity to test
            whether users would accept a recurring replacement model. Select your preferred plan:
          </p>
        </div>

        {/* Price context */}
        <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-[#13131A] border border-[#1A1A22] w-fit mx-auto">
          <DollarSign className="w-5 h-5 text-[#F5C842]" />
          <p className="text-sm text-[#8A8A93]">
            Estimated replacement cost: <span className="text-[#F4F1EC] font-medium">Rp 100k–200k</span> per cartridge
          </p>
        </div>

        {/* Frequency options */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {frequencies.map((freq) => (
            <button
              key={freq.id}
              onClick={() => handleFreqSelect(freq.id)}
              className={`p-5 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                selectedFreq === freq.id
                  ? "border-[#00D4AA] bg-[#00D4AA]/10"
                  : "border-[#1A1A22] hover:border-[#8A8A93]/50 bg-[#0D0D10]"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[#00D4AA]" />
                <span className="font-medium">{freq.label}</span>
              </div>
              <p className="text-sm text-[#8A8A93]">{freq.description}</p>
            </button>
          ))}
        </div>

        {/* Price acceptance modal */}
        <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
          <DialogContent className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl tracking-wide">
                FILTER SUBSCRIPTION
              </DialogTitle>
            </DialogHeader>
            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-[#00D4AA]" />
                </div>
                <p className="text-lg font-medium text-[#00D4AA]">Thanks for your feedback!</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <p className="text-sm text-[#8A8A93]">
                  Would you subscribe if each replacement cartridge cost around Rp 100k–200k?
                </p>
                <div className="space-y-2">
                  {([
                    { value: "yes" as const, label: "Yes, every month" },
                    { value: "maybe" as const, label: "Yes, every 6–8 weeks" },
                    { value: "no" as const, label: "Maybe, depends on price" },
                  ]).map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => submitResponse(selectedFreq!, option.value)}
                      variant="outline"
                      className="w-full justify-start border-[#1A1A22] hover:border-[#00D4AA]/50 hover:bg-[#00D4AA]/10 text-[#F4F1EC]"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="pt-2">
                  <Input
                    placeholder="Email (optional, for updates)"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
