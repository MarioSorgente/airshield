import { useEffect, useRef, useState } from "react";
import { FlaskConical, Check, ArrowRight, Share2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import SectionShell from "@/components/SectionShell";
import SectionHeader from "@/components/SectionHeader";
import { trackEvent, storeFormData } from "@/lib/tracking";
import {
  saveWaitlistSignup,
  getWaitlistCount,
  incrementWaitlistCount,
} from "@/lib/airshieldDb";
import { getSessionId, getUtm } from "@/lib/session";
import { WAITLIST_OFFSET } from "@/lib/config";

const useCaseOptions = [
  { value: "commuting", label: "Commuting" },
  { value: "grab_gojek_delivery", label: "Grab/Gojek/Delivery" },
  { value: "bali_daily_riding", label: "Bali daily riding" },
  { value: "sport_riding", label: "Sport riding" },
  { value: "family_parent_use", label: "Family/parent use" },
  { value: "other", label: "Other" },
];

const helmetTypes = [
  { value: "open_face", label: "Open-face" },
  { value: "full_face", label: "Full-face" },
  { value: "half_face", label: "Half-face" },
  { value: "none", label: "None / other" },
];

export default function BetaCTASection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    city: "",
    ridingMinutes: 60,
    mainUse: "commuting" as string,
    currentHelmet: "open_face" as string,
    priceOpinion: "" as string,
    filterSubscription: "" as string,
    objection: "",
    featureRequest: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const startedRef = useRef(false);

  // Live waitlist size for the social-proof badge above the form.
  useEffect(() => {
    getWaitlistCount()
      .then(setLiveCount)
      .catch(() => setLiveCount(WAITLIST_OFFSET));
  }, []);

  const updateField = (field: string, value: string | number) => {
    // Fire "signup_started" once, the first time the visitor touches the form,
    // so the dashboard funnel can measure start → complete drop-off.
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("signup_started", { source: "beta_form" });
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleShare = async () => {
    const shareData = {
      title: "AirShield early access",
      text: "I just joined the AirShield waitlist — clean air for every ride. Skip the line:",
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied — share it with a friend!");
      }
    } catch {
      // user dismissed the share sheet — no-op
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.city) return;

    setSaving(true);
    try {
      const utm = getUtm();
      await saveWaitlistSignup({
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp || undefined,
        city: formData.city,
        ridingMinutesPerDay: formData.ridingMinutes,
        mainUse: formData.mainUse as "commuting" | "grab_gojek_delivery" | "bali_daily_riding" | "sport_riding" | "family_parent_use" | "other",
        currentHelmetType: formData.currentHelmet as "open_face" | "full_face" | "half_face" | "none",
        priceOpinion: (formData.priceOpinion as "yes" | "maybe" | "no") || undefined,
        filterSubscription: (formData.filterSubscription as "yes" | "maybe" | "no") || undefined,
        objection: formData.objection || undefined,
        featureRequest: formData.featureRequest || undefined,
        sessionId: getSessionId(),
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
      });

      trackEvent("beta_application_submitted", {
        email: formData.email,
        city: formData.city,
        mainUse: formData.mainUse,
        priceOpinion: formData.priceOpinion,
      });
      trackEvent("email_submitted", { source: "beta_form", email: formData.email });
      if (formData.whatsapp) {
        trackEvent("whatsapp_submitted", { source: "beta_form", whatsapp: formData.whatsapp });
      }
      storeFormData("beta_application", {
        ...formData,
        timestamp: new Date().toISOString(),
      });

      // Bump the public counter and use the returned value as their place in line.
      const newPosition = await incrementWaitlistCount();
      setPosition(newPosition);
      setLiveCount(newPosition);
      setSubmitted(true);
    } catch (err) {
      console.error("Beta submit failed:", err);
      toast.error("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell id="beta" variant="feature" glow="teal" containerClassName="max-w-3xl">
      <SectionHeader
        icon={FlaskConical}
        eyebrow="Beta Program"
        title="BE FIRST TO RIDE AIRSHIELD."
        description="AirShield is in development now. Join the early-access list to test it first, reserve your unit, and help shape the launch."
      />

        {submitted ? (
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="w-24 h-24 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
              <Check className="w-12 h-12 text-[#00D4AA]" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-heading tracking-wide text-[#00D4AA]">
                YOU'RE ON THE LIST!
              </p>
              {position !== null && (
                <p className="text-lg text-[#F4F1EC]">
                  You're{" "}
                  <span className="font-heading text-2xl text-[#00D4AA]">
                    #{position.toLocaleString()}
                  </span>{" "}
                  in line for AirShield early access. We'll message you the moment
                  your invite is ready.
                </p>
              )}
              <p className="text-[#8A8A93]">
                We'll use your answers to shape priorities, pricing, and launch city.
              </p>
            </div>
            <Button
              onClick={handleShare}
              className="w-full max-w-md mx-auto bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-6 text-base rounded-lg transition-all hover:scale-[1.01]"
            >
              Skip the line — share with a friend
              <Share2 className="w-5 h-5 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="bg-[#0D0D10] rounded-[2rem] border border-[#1A1A22] p-6 lg:p-8 space-y-6">
            {liveCount !== null && (
              <div className="flex items-center justify-center gap-2 rounded-full border border-[#00D4AA]/30 bg-[#00D4AA]/10 px-4 py-2 text-sm text-[#00D4AA]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D4AA] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00D4AA]" />
                </span>
                Join {liveCount.toLocaleString()}+ riders already in line
              </div>
            )}
            {/* Name */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
                />
              </div>
            </div>

            {/* WhatsApp + City */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp (optional)</label>
                <Input
                  placeholder="+62..."
                  value={formData.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City *</label>
                <Input
                  placeholder="Jakarta, Bali, Bandung..."
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
                />
              </div>
            </div>

            {/* Riding minutes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">How many minutes do you ride per day?</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={5}
                  value={formData.ridingMinutes}
                  onChange={(e) => updateField("ridingMinutes", Number(e.target.value))}
                  className="flex-1 accent-[#00D4AA]"
                />
                <span className="font-mono-label text-lg text-[#00D4AA] w-20 text-right">
                  {formData.ridingMinutes} min
                </span>
              </div>
            </div>

            {/* Main use */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Main use</label>
              <div className="flex flex-wrap gap-2">
                {useCaseOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateField("mainUse", option.value)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                      formData.mainUse === option.value
                        ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                        : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current helmet */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current helmet type</label>
              <div className="flex flex-wrap gap-2">
                {helmetTypes.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateField("currentHelmet", option.value)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                      formData.currentHelmet === option.value
                        ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                        : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price opinion */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Would you consider paying Rp 3.2M for this?
              </label>
              <div className="flex flex-wrap gap-2">
                {(["yes", "maybe", "no"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => updateField("priceOpinion", option)}
                    className={`px-6 py-2 rounded-lg border text-sm capitalize transition-all ${
                      formData.priceOpinion === option
                        ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                        : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter subscription */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Would you consider a filter replacement subscription?
              </label>
              <div className="flex flex-wrap gap-2">
                {(["yes", "maybe", "no"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => updateField("filterSubscription", option)}
                    className={`px-6 py-2 rounded-lg border text-sm capitalize transition-all ${
                      formData.filterSubscription === option
                        ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                        : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Objection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                What would stop you from buying? (optional)
              </label>
              <Input
                placeholder="Price, heat, weight, trust..."
                value={formData.objection}
                onChange={(e) => updateField("objection", e.target.value)}
                className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
            </div>

            {/* Feature request — early-stage, open to feedback */}
            <div className="space-y-2 rounded-2xl border border-[#00D4AA]/20 bg-[#00D4AA]/5 p-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="w-4 h-4 text-[#00D4AA]" />
                We're early — what would make AirShield perfect for you? (optional)
              </label>
              <p className="text-xs text-[#8A8A93]">
                The design isn't locked. Glasses-friendly fit, a louder fan mode, a
                specific colour, Bluetooth — tell us and it goes straight to the
                build team.
              </p>
              <Textarea
                placeholder="Your request or idea for the helmet..."
                value={formData.featureRequest}
                onChange={(e) => updateField("featureRequest", e.target.value)}
                rows={3}
                className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93]"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.email || !formData.city || saving}
              className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-6 text-base rounded-lg transition-all hover:scale-[1.01]"
            >
              {saving ? "Submitting..." : "Join early access"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-[#8A8A93]">
              No spam. We contact early supporters first as access opens, and your
              answers shape pricing and the launch city.
            </p>
          </div>
        )}
    </SectionShell>
  );
}
