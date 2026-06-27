import { useEffect, useRef, useState } from "react";
import { Calculator, Clock, MapPin, Bike, ArrowRight, Check, Wind, Dumbbell, Hourglass, Sparkles, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CountUp from "@/components/CountUp";
import SectionShell from "@/components/SectionShell";
import SectionHeader from "@/components/SectionHeader";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { saveExposureCalculation } from "@/lib/airshieldDb";

const cities = [
  { name: "Jakarta", pm25: 45.3 },
  { name: "Bali / Denpasar", pm25: 38.7 },
  { name: "Bandung", pm25: 42.1 },
  { name: "Surabaya", pm25: 40.5 },
  { name: "Yogyakarta", pm25: 36.2 },
  { name: "Other", pm25: 40.0 },
];

const trafficMultipliers = {
  light: 0.7,
  normal: 1.0,
  heavy: 1.5,
};

const helmetExposure = {
  open_face: 1.0,
  full_face: 0.85,
  mask_under_helmet: 0.6,
  no_mask: 1.0,
};

const whoGuideline = 5; // µg/m³ annual mean

export default function ExposureCalculator() {
  const [city, setCity] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState(60);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [trafficLevel, setTrafficLevel] = useState<"light" | "normal" | "heavy">("normal");
  const [helmetType, setHelmetType] = useState<"open_face" | "full_face" | "mask_under_helmet" | "no_mask">("open_face");
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Jump to the results as soon as they render after "Calculate my exposure".
  // scroll-padding-top (5rem, set in index.css) keeps them clear of the fixed nav.
  useEffect(() => {
    if (showResults) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showResults]);

  const cityData = cities.find((c) => c.name === city);
  const pm25Level = cityData?.pm25 || 40;

  const weeklyHours = ((minutesPerDay * daysPerWeek) / 60).toFixed(1);
  const yearlyHours = ((minutesPerDay * daysPerWeek * 52) / 60).toFixed(0);
  const weeklyTrafficHours = (
    (minutesPerDay * daysPerWeek * trafficMultipliers[trafficLevel]) /
    60
  ).toFixed(1);

  const exposureReduction = helmetExposure[helmetType];
  const effectiveExposure = (parseFloat(weeklyTrafficHours) * exposureReduction).toFixed(1);

  const vsWHO = (pm25Level / whoGuideline).toFixed(1);

  // AQLI rule of thumb: ~0.098 years of life expectancy lost per 1 µg/m³ of
  // sustained PM2.5 above the WHO guideline (5 µg/m³).
  const lifeYearsLost = Math.max(0, (pm25Level - whoGuideline) * 0.098);

  // ── The maintenance tax ───────────────────────────────────────────────
  // Pollution isn't only a distant death sentence — it's a weekly bill in three
  // currencies: looks, training, and the money you already spend undoing it.
  // The figures below are ILLUSTRATIVE estimates (labeled as such in the UI),
  // tuned to land in believable ranges for the cities above — not medical claims.
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const vsWHONum = pm25Level / whoGuideline; // numeric form of the `vsWHO` display string
  const yearlyEffectiveHours = parseFloat(effectiveExposure) * 52;

  // PERFORMANCE — training adaptation/recovery blunted by breathing traffic air,
  // bounded to ~3–18%. Turned into the one concrete personal number: sessions/year
  // you train for but don't fully bank.
  const perfTaxRate = clamp((yearlyEffectiveHours / 300) * (vsWHONum / 8) * 0.12, 0.03, 0.18);
  const wastedSessions = Math.round(workoutsPerWeek * 52 * perfTaxRate);

  // LOOKS — coarse, directional "undo-the-damage" routine cost (serums, facials,
  // hair treatments). Rounded hard to the nearest 0.5M so it never reads
  // fake-precise; ~Rp 4–6M/yr at typical inputs.
  const looksAnnualRaw =
    80_000 * parseFloat(effectiveExposure) * Math.min(1.3, vsWHONum / 8) * 12;
  const looksAnnualM = Math.max(0.5, Math.round(looksAnnualRaw / 500_000) / 2);

  const handleCalculate = () => {
    trackEvent("exposure_calculator_started", { city, trafficLevel, helmetType });
    setShowResults(true);
    trackEvent("exposure_calculator_completed", {
      city,
      weeklyHours,
      yearlyHours,
      trafficLevel,
      helmetType,
      workoutsPerWeek,
      wastedSessions,
      looksAnnual: `Rp ${looksAnnualM.toFixed(1)}M`,
    });
  };

  const handleSubmitBeta = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await saveExposureCalculation({
        city,
        minutesPerDay,
        daysPerWeek,
        trafficLevel,
        helmetType,
        workoutsPerWeek,
        email,
        weeklyHours: `${weeklyHours} hours`,
        yearlyHours: `${yearlyHours} hours`,
        looksAnnual: `Rp ${looksAnnualM.toFixed(1)}M`,
        wastedSessions,
      });
      trackEvent("email_submitted", { source: "exposure_calculator", email, city });
      storeFormData("exposure_calc", {
        email,
        city,
        minutesPerDay,
        daysPerWeek,
        workoutsPerWeek,
        trafficLevel,
        helmetType,
        weeklyHours,
        yearlyHours,
        wastedSessions,
        looksAnnual: `Rp ${looksAnnualM.toFixed(1)}M`,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
      toast.error("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell
      id="exposure-calculator"
      variant="interactive"
      surface="raised"
      glow="teal"
      containerClassName="max-w-3xl"
    >
      <SectionHeader
        icon={Calculator}
        eyebrow="The Maintenance Tax"
        title="THE AIR ISN'T JUST SHORTENING YOUR LIFE — IT'S BILLING YOU EVERY WEEK."
        description="Pollution isn't a distant death sentence. It's a bill that comes due every week — in your skin and hair, in your training, and in the money you already spend undoing the damage. See what your ride is really costing you."
      />

      <div className="space-y-8">
        {/* Calculator form */}
        <div className="bg-[#0D0D10] rounded-[2rem] border border-[#1A1A22] p-6 lg:p-8 space-y-8">
          {/* City */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-[#00D4AA]" />
              Your city
            </label>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCity(c.name)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    city === c.name
                      ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                      : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Minutes per day */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-[#00D4AA]" />
                Minutes riding per day
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={5}
                  value={minutesPerDay}
                  onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                  className="flex-1 accent-[#00D4AA]"
                />
                <span className="font-mono-label text-lg text-[#00D4AA] w-16 text-right">
                  {minutesPerDay}
                </span>
              </div>
            </div>

            {/* Days per week */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Bike className="w-4 h-4 text-[#00D4AA]" />
                Days riding per week
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={1}
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="flex-1 accent-[#00D4AA]"
                />
                <span className="font-mono-label text-lg text-[#00D4AA] w-16 text-right">
                  {daysPerWeek}
                </span>
              </div>
            </div>
          </div>

          {/* Workouts per week — drives the personal "training tax" */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Dumbbell className="w-4 h-4 text-[#00D4AA]" />
              Workouts per week
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={14}
                step={1}
                value={workoutsPerWeek}
                onChange={(e) => setWorkoutsPerWeek(Number(e.target.value))}
                className="flex-1 accent-[#00D4AA]"
              />
              <span className="font-mono-label text-lg text-[#00D4AA] w-16 text-right">
                {workoutsPerWeek}
              </span>
            </div>
            <p className="text-xs text-[#8A8A93]">
              Gym, runs, training — anything you grind for and want to keep.
            </p>
          </div>

          {/* Traffic level */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Wind className="w-4 h-4 text-[#00D4AA]" />
              Typical traffic condition
            </label>
            <div className="flex flex-wrap gap-2">
              {(["light", "normal", "heavy"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setTrafficLevel(level)}
                  className={`px-4 py-2 rounded-lg border text-sm capitalize transition-all ${
                    trafficLevel === level
                      ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                      : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                  }`}
                >
                  {level} traffic
                </button>
              ))}
            </div>
          </div>

          {/* Helmet type */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Bike className="w-4 h-4 text-[#00D4AA]" />
              Your current setup
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "open_face", label: "Open-face helmet" },
                { value: "full_face", label: "Full-face helmet" },
                { value: "mask_under_helmet", label: "Mask under helmet" },
                { value: "no_mask", label: "No mask / other" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHelmetType(option.value)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    helmetType === option.value
                      ? "border-[#00D4AA] bg-[#00D4AA]/10 text-[#00D4AA]"
                      : "border-[#1A1A22] hover:border-[#8A8A93]/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calculate button */}
          <Button
            onClick={handleCalculate}
            disabled={!city}
            className="w-full bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold py-6 rounded-lg text-lg transition-all hover:scale-[1.01]"
          >
            Calculate my exposure
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Results */}
        {showResults && (
          <div ref={resultsRef} className="scroll-mt-20 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-[#00D4AA]/10 to-[#0D0D10] rounded-[2rem] border border-[#00D4AA]/30 p-6 lg:p-8 space-y-6">
              <h3 className="font-heading text-2xl tracking-wide text-center">
                WHAT THIS RIDE IS COSTING YOU
              </h3>

              {/* The maintenance tax — four co-equal costs, no single hero number */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Lifespan (AQLI) */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FF4D1C]/15 to-[#0D0D10] border border-[#FF4D1C]/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Hourglass className="w-4 h-4 text-[#FF4D1C]" />
                    <p className="font-mono-label text-xs text-[#8A8A93] uppercase tracking-wider">
                      What it costs your life
                    </p>
                  </div>
                  <p className="font-heading text-5xl text-[#FF4D1C] leading-none">
                    ≈ <CountUp value={lifeYearsLost} decimals={1} /> yrs
                  </p>
                  <p className="text-sm text-[#8A8A93]">
                    shorter, on {city || "your city"}'s air — a sustained {pm25Level} µg/m³, {vsWHO}× the WHO limit.
                  </p>
                  <a
                    href="https://aqli.epic.uchicago.edu/methodology/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-[#3A7CA5] hover:text-[#00D4AA] transition-colors"
                  >
                    Source: Air Quality Life Index (AQLI) →
                  </a>
                </div>

                {/* Looks */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FF4D1C]/15 to-[#0D0D10] border border-[#FF4D1C]/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF4D1C]" />
                    <p className="font-mono-label text-xs text-[#8A8A93] uppercase tracking-wider">
                      What it costs your looks
                    </p>
                  </div>
                  <p className="font-heading text-5xl text-[#FF4D1C] leading-none">
                    ≈ <CountUp value={looksAnnualM} decimals={1} prefix="Rp " suffix="M+" />
                  </p>
                  <p className="text-sm text-[#8A8A93]">
                    a year on serums, facials and hair treatments. The grey face in the lift mirror, congestion along the strap line, hair that won't behave — that's not age, it's exhaust.
                  </p>
                  <p className="text-xs text-[#8A8A93]/70">Typical rider spend, scaled to your exposure.</p>
                </div>

                {/* Performance */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FF4D1C]/15 to-[#0D0D10] border border-[#FF4D1C]/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-[#FF4D1C]" />
                    <p className="font-mono-label text-xs text-[#8A8A93] uppercase tracking-wider">
                      What it costs your training
                    </p>
                  </div>
                  <p className="font-heading text-5xl text-[#FF4D1C] leading-none">
                    ≈ <CountUp value={wastedSessions} /> <span className="text-2xl">sessions</span>
                  </p>
                  <p className="text-sm text-[#8A8A93]">
                    a year you train for but don't fully bank. You add weight to the bar, but recovery's shot and your resting heart rate creeps up. You train clean — you breathe dirty.
                  </p>
                </div>

                {/* The bill — directional close, no fake-precise total */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#00D4AA]/15 to-[#0D0D10] border border-[#00D4AA]/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#00D4AA]" />
                    <p className="font-mono-label text-xs text-[#8A8A93] uppercase tracking-wider">
                      The bill you already pay
                    </p>
                  </div>
                  <p className="font-heading text-5xl text-[#00D4AA] leading-none">
                    Millions <span className="text-2xl">of Rp / yr</span>
                  </p>
                  <p className="text-sm text-[#8A8A93]">
                    Skin, hair, training, supplements — you're already spending every month to undo what the air does. AirShield is a one-time Rp 3.2M.
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-[#8A8A93]/70">
                Illustrative estimates of typical rider spend, scaled to your exposure — not medical advice.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                  <p className="font-mono-label text-3xl font-bold text-[#00D4AA]">
                    <CountUp value={parseFloat(weeklyHours)} decimals={1} suffix="h" />
                  </p>
                  <p className="text-xs text-[#8A8A93] mt-1">Weekly hours in traffic air</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                  <p className="font-mono-label text-3xl font-bold text-[#F5C842]">
                    <CountUp value={parseFloat(yearlyHours)} suffix="h" />
                  </p>
                  <p className="text-xs text-[#8A8A93] mt-1">Yearly hours in traffic air</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                  <p className="font-mono-label text-3xl font-bold text-[#FF4D1C]">
                    <CountUp value={parseFloat(effectiveExposure)} decimals={1} suffix="h" />
                  </p>
                  <p className="text-xs text-[#8A8A93] mt-1">Effective weekly exposure</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#13131A] border border-[#1A1A22] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8A8A93]">City PM2.5 level</span>
                  <span className="font-mono-label text-sm">{pm25Level} µg/m³</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8A8A93]">WHO guideline</span>
                  <span className="font-mono-label text-sm">{whoGuideline} µg/m³</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8A8A93]">vs. WHO guideline</span>
                  <span className="font-mono-label text-sm text-[#FF4D1C]">{vsWHO}x higher</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FF4D1C]/10 border border-[#FF4D1C]/20">
                <p className="text-center font-medium text-[#FF4D1C]">
                  Your ride isn't just a commute. It's a bill you pay every week — in your face, your training, and your wallet.
                </p>
              </div>
            </div>

            {/* Lead capture after results */}
            <div className="bg-[#0D0D10] rounded-[2rem] border border-[#1A1A22] p-6 lg:p-8 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="font-heading text-xl tracking-wide">
                  WANT TO KNOW WHEN AIRSHIELD LAUNCHES IN YOUR CITY?
                </h4>
                <p className="text-sm text-[#8A8A93]">
                  Join the beta list and we'll contact you when testing opens.
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#00D4AA]" />
                  </div>
                  <p className="text-lg font-medium text-[#00D4AA]">You're on the beta list!</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                  <Input
                    placeholder="Email address *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#13131A] border-[#1A1A22] text-[#F4F1EC] placeholder:text-[#8A8A93] flex-1"
                  />
                  <Button
                    onClick={handleSubmitBeta}
                    disabled={!email || saving}
                    className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold px-6"
                  >
                    {saving ? "Saving..." : "Send me beta access"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
