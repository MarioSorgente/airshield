import { useState } from "react";
import { AlertCircle, Check, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { trpc } from "@/providers/trpc";

const objections = [
  { id: "too_expensive", label: "Too expensive" },
  { id: "too_hot", label: "Too hot" },
  { id: "too_heavy", label: "Too heavy" },
  { id: "not_stylish", label: "Not stylish enough" },
  { id: "dont_trust", label: "I don't trust filtration claims" },
  { id: "prefer_mask", label: "I prefer a normal mask" },
  { id: "dont_ride_enough", label: "I don't ride enough" },
  { id: "need_testing", label: "I need to see testing first" },
  { id: "other", label: "Other" },
];

export default function ObjectionCaptureSection() {
  const [selectedObjections, setSelectedObjections] = useState<string[]>([]);
  const [showThanks, setShowThanks] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const objectionMutation = trpc.airshield.submitObjection.useMutation();

  const toggleObjection = (id: string) => {
    setSelectedObjections((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedObjections.length === 0) return;

    trackEvent("objection_selected", { objections: selectedObjections });

    // Submit each objection
    for (const obj of selectedObjections) {
      try {
        await objectionMutation.mutateAsync({
          objectionName: obj,
        });
      } catch {
        // Silent fail
      }
    }

    storeFormData("objections", {
      objections: selectedObjections,
      timestamp: new Date().toISOString(),
    });

    setShowThanks(true);
  };

  const handleSubscribe = async () => {
    if (!email) return;
    trackEvent("email_submitted", { source: "objection_updates", email });
    storeFormData("objection_updates", { email, timestamp: new Date().toISOString() });
    setSubmitted(true);
  };

  return (
    <section id="objections" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF4D1C]/30 bg-[#FF4D1C]/10">
            <AlertCircle className="w-4 h-4 text-[#FF4D1C]" />
            <span className="font-mono-label text-xs text-[#FF4D1C] uppercase tracking-wider">
              Feedback Collection
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight">
            WHAT WOULD STOP YOU FROM USING THIS?
          </h2>
          <p className="text-[#8A8A93] max-w-2xl mx-auto">
            Your honest feedback helps us build the right version. Select all that apply.
          </p>
        </div>

        {!showThanks ? (
          <div className="space-y-8">
            {/* Objection grid */}
            <div className="flex flex-wrap gap-3 justify-center">
              {objections.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => toggleObjection(obj.id)}
                  className={`px-5 py-3 rounded-xl border text-sm transition-all hover:scale-[1.02] ${
                    selectedObjections.includes(obj.id)
                      ? "border-[#FF4D1C] bg-[#FF4D1C]/10 text-[#FF4D1C]"
                      : "border-[#1A1A22] bg-[#0D0D10] hover:border-[#8A8A93]/50"
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <div className="text-center">
              <Button
                onClick={handleSubmit}
                disabled={selectedObjections.length === 0}
                className="bg-[#FF4D1C] hover:bg-[#FF4D1C]/90 text-white font-semibold px-8 py-5 rounded-lg transition-all hover:scale-105"
              >
                Submit feedback
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        ) : !showUpdates ? (
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-[#00D4AA]" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-medium text-[#00D4AA]">Thanks — this helps us build the right version.</p>
              <p className="text-sm text-[#8A8A93]">
                We recorded: {selectedObjections.map((o) => objections.find((obj) => obj.id === o)?.label).join(", ")}
              </p>
            </div>
            <Button
              onClick={() => setShowUpdates(true)}
              variant="outline"
              className="border-[#1A1A22] hover:border-[#00D4AA]/50 text-[#F4F1EC] hover:text-[#00D4AA]"
            >
              Still want updates?
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : !submitted ? (
          <div className="max-w-md mx-auto space-y-4 animate-in fade-in">
            <p className="text-center text-sm text-[#8A8A93]">
              Enter your email and we'll notify you when we address your concerns.
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0D0D10] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93] flex-1"
              />
              <Button
                onClick={handleSubscribe}
                disabled={!email}
                className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold px-6"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-[#00D4AA]" />
            </div>
            <p className="text-lg font-medium text-[#00D4AA]">We'll keep you updated!</p>
          </div>
        )}
      </div>
    </section>
  );
}
