import { Wind, AlertTriangle, Shield, VenetianMask, XCircle } from "lucide-react";

const problemCards = [
  {
    icon: Wind,
    title: "Rider behind bus exhaust",
    description:
      "Motorcyclists sit directly in the exhaust stream of vehicles ahead. In heavy traffic, you are breathing what their engines expelled seconds ago.",
    color: "#FF4D1C",
  },
  {
    icon: XCircle,
    title: "Open-face helmet = direct exposure",
    description:
      "Half-face and open-face helmets leave your mouth, nose, and chin completely exposed to traffic pollution. No barrier between you and the air.",
    color: "#FF4D1C",
  },
  {
    icon: Shield,
    title: "Standard full-face = impact protection only",
    description:
      "Traditional full-face helmets protect against skull trauma. They are not designed to filter the air you breathe. Vents bring in unfiltered outside air.",
    color: "#F5C842",
  },
  {
    icon: VenetianMask,
    title: "Mask = can help, but heat/fit/compliance are problems",
    description:
      "Wearing a mask under a helmet is uncomfortable in Indonesian heat and humidity. Fogging, fit issues, and inconsistent use reduce real-world protection.",
    color: "#F5C842",
  },
];

const solutionCards = [
  {
    icon: Shield,
    title: "AirShield = Integrated filtered airflow",
    description:
      "A full-face helmet with built-in H13 HEPA filtration, positive pressure airflow, and active ventilation designed for Indonesia's climate.",
    color: "#00D4AA",
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF4D1C]/30 bg-[#FF4D1C]/10">
            <AlertTriangle className="w-4 h-4 text-[#FF4D1C]" />
            <span className="font-mono-label text-xs text-[#FF4D1C] uppercase tracking-wider">
              The Problem
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight">
            YOU DON'T FEEL PM2.5.
            <br />
            <span className="text-[#FF4D1C]">YOU BREATHE IT.</span>
          </h2>
          <p className="text-lg text-[#8A8A93] max-w-3xl mx-auto leading-relaxed">
            PM2.5 is fine particulate pollution from traffic, combustion, industry, and burning.
            It is small enough to travel deep into the respiratory system. For riders, the commute
            is not only transportation — it is a daily exposure event.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {problemCards.map((card) => (
            <div
              key={card.title}
              className="p-6 rounded-2xl bg-[#0D0D10] border border-[#1A1A22] hover:border-[#FF4D1C]/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{card.title}</h3>
                  <p className="text-sm text-[#8A8A93] leading-relaxed">{card.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Arrow divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#8A8A93]/30" />
          <span className="font-mono-label text-xs text-[#8A8A93] uppercase tracking-widest">
            The Solution
          </span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#00D4AA]/30" />
        </div>

        {/* Solution card */}
        <div className="max-w-2xl mx-auto">
          {solutionCards.map((card) => (
            <div
              key={card.title}
              className="p-8 rounded-2xl bg-gradient-to-br from-[#00D4AA]/10 to-[#0D0D10] border border-[#00D4AA]/30 hover:border-[#00D4AA]/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <card.icon className="w-7 h-7" style={{ color: card.color }} />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-xl">{card.title}</h3>
                  <p className="text-[#8A8A93] leading-relaxed">{card.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
