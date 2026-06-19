import { useState } from "react";
import { Calculator, Clock, MapPin, Bike, AlertTriangle, ArrowRight, Check, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent, storeFormData } from "@/lib/tracking";
import { trpc } from "@/providers/trpc";

const cities = [
  { name: "Jakarta", pm25: 45.3 },
  { name: "Bali / Denpasar", pm25: 38.7 },
  { name: "Bandung", pm25: 42.1 },
  { name: "Surabaya", pm25: 40.5 },
  { name: "Yogyakarta", pm35: 36.2 },
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
  const [trafficLevel, setTrafficLevel] = useState<"light" | "normal" | "heavy">("normal");
  const [helmetType, setHelmetType] = useState<"open_face" | "full_face" | "mask_under_helmet" | "no_mask">("open_face");
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const calcMutation = trpc.airshield.submitExposureCalc.useMutation();

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

  const handleCalculate = () => {
    trackEvent("exposure_calculator_started", { city, trafficLevel, helmetType });
    setShowResults(true);
    trackEvent("exposure_calculator_completed", {
      city,
      weeklyHours,
      yearlyHours,
      trafficLevel,
      helmetType,
    });
  };

  const handleSubmitBeta = async () => {
    if (!email) return;
    try {
      await calcMutation.mutateAsync({
        city,
        minutesPerDay,
        daysPerWeek,
        trafficLevel,
        helmetType,
        email,
        weeklyHours: `${weeklyHours} hours`,
        yearlyHours: `${yearlyHours} hours`,
      });
      trackEvent("email_submitted", { source: "exposure_calculator", email, city });
      storeFormData("exposure_calc", {
        email,
        city,
        minutesPerDay,
        daysPerWeek,
        trafficLevel,
        helmetType,
        weeklyHours,
        yearlyHours,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  return (
    <section id="exposure-calculator" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D4AA]/30 bg-[#00D4AA]/10">
            <Calculator className="w-4 h-4 text-[#00D4AA]" />
            <span className="font-mono-label text-xs text-[#00D4AA] uppercase tracking-wider">
              Interactive Tool
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight">
            HOW MUCH TRAFFIC AIR DO YOU BREATHE EVERY WEEK?
          </h2>
          <p className="text-[#8A8A93] max-w-2xl mx-auto">
            Estimate your weekly exposure time based on your commute patterns. This is a population-level
            estimate, not a personal medical prediction.
          </p>
        </div>

        {/* Calculator form */}
        <div className="bg-[#0D0D10] rounded-2xl border border-[#1A1A22] p-6 lg:p-8 space-y-8">
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-[#00D4AA]/10 to-[#0D0D10] rounded-2xl border border-[#00D4AA]/30 p-6 lg:p-8 space-y-6">
              <h3 className="font-heading text-2xl tracking-wide text-center">
                YOUR EXPOSURE ESTIMATE
              </h3>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                  <p className="font-mono-label text-3xl font-bold text-[#00D4AA]">{weeklyHours}h</p>
                  <p className="text-xs text-[#8A8A93] mt-1">Weekly hours in traffic air</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                  <p className="font-mono-label text-3xl font-bold text-[#F5C842]">{yearlyHours}h</p>
                  <p className="text-xs text-[#8A8A93] mt-1">Yearly hours in traffic air</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-[#13131A] border border-[#1A1A22]">
                  <p className="font-mono-label text-3xl font-bold text-[#FF4D1C]">{effectiveExposure}h</p>
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
                  Your ride is not just a commute. It is repeated exposure.
                </p>
              </div>
            </div>

            {/* Lead capture after results */}
            <div className="bg-[#0D0D10] rounded-2xl border border-[#1A1A22] p-6 lg:p-8 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="font-heading text-xl tracking-wide">
                  WANT TO KNOW WHEN WE TEST THE FIRST AIRSHIELD PROTOTYPE IN YOUR CITY?
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
                    disabled={!email || calcMutation.isPending}
                    className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#060608] font-semibold px-6"
                  >
                    {calcMutation.isPending ? "Saving..." : "Send me beta access"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#13131A] border border-[#1A1A22]">
              <AlertTriangle className="w-5 h-5 text-[#F5C842] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#8A8A93] leading-relaxed">
                <strong className="text-[#F5C842]">Disclaimer:</strong> This is a population-level estimate
                based on public PM2.5 research and time spent riding. It is not a personal medical prediction.
                Real exposure depends on route, congestion, weather, speed, helmet fit, and behavior.
                Long-term health impact estimates are based on AQLI-style population research, not individual diagnosis.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
