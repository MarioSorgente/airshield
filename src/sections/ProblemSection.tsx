import { Wind, AlertTriangle, Shield, VenetianMask, XCircle, Sparkles, Dumbbell, Wallet } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import SectionShell from "@/components/SectionShell";
import SectionHeader from "@/components/SectionHeader";

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

// The maintenance tax: what that exposure actually costs you — felt, weekly,
// in three currencies riders notice long before any death certificate.
const taxCards = [
  {
    icon: Sparkles,
    title: "Your face keeps the receipt",
    description:
      "The grey, tired face in the lift mirror after the ride — that's not age, it's exhaust. Blackheads along the jaw where the strap traps city air, a breakout after every heavy-traffic week, hair that stays dry and brittle no matter the conditioner.",
    color: "#FF4D1C",
  },
  {
    icon: Dumbbell,
    title: "Your training pays a tax",
    description:
      "You add weight to the bar, but your resting heart rate keeps creeping up. The easy run leaves your chest tight; eight hours of sleep and you still wake up flat. The cardio plateau you can't explain — you train clean, you breathe dirty.",
    color: "#FF4D1C",
  },
  {
    icon: Wallet,
    title: "You already pay to undo it",
    description:
      "The vitamin C, the facials, the deep-conditioning, the recovery supplements. Quietly, every month, you spend to patch what the air does — and it adds up to millions of Rupiah a year. AirShield costs less than a year of patching it.",
    color: "#FF4D1C",
  },
];

export default function ProblemSection() {
  return (
    <SectionShell id="problem" variant="feature" glow="orange">
      <SectionHeader
        icon={AlertTriangle}
        eyebrow="The Problem"
        tone="orange"
        titleClassName="lg:text-6xl"
        title={
          <>
            YOU DON'T FEEL PM2.5.
            <br />
            <span className="text-[#FF4D1C]">YOU BREATHE IT.</span>
          </>
        }
        description="PM2.5 is fine particulate pollution from traffic, combustion, industry, and burning. It is small enough to travel deep into the respiratory system. For riders, the commute is not only transportation — it is a daily exposure event."
      />

      {/* Problem cards */}
      <StaggerContainer className="grid sm:grid-cols-2 gap-6">
        {problemCards.map((card) => (
          <StaggerItem
            key={card.title}
            whileHover={{ y: -4 }}
            className="p-6 rounded-2xl bg-[#0D0D10] border border-[#1A1A22] transition-[border-color,box-shadow] duration-300 hover:border-[#FF4D1C]/40 hover:shadow-[0_0_40px_-12px_rgba(255,77,28,0.35)]"
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
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Second beat: the maintenance tax — what the exposure actually costs you */}
      <div className="mt-20 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="font-mono-label text-xs uppercase tracking-widest text-[#FF4D1C]">
            The bill you don't see
          </p>
          <h3 className="font-heading text-3xl sm:text-4xl tracking-tight">
            IT DOESN'T WAIT DECADES.
            <br />
            <span className="text-[#FF4D1C]">IT BILLS YOU EVERY WEEK.</span>
          </h3>
          <p className="text-[#8A8A93] leading-relaxed">
            Forget "PM2.5" for a second. Here's what riding through it actually costs
            you — in the mirror, at the gym, and in everything you buy to fix it.
          </p>
        </div>

        <StaggerContainer className="grid sm:grid-cols-3 gap-6">
          {taxCards.map((card) => (
            <StaggerItem
              key={card.title}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-[#0D0D10] border border-[#1A1A22] transition-[border-color,box-shadow] duration-300 hover:border-[#FF4D1C]/40 hover:shadow-[0_0_40px_-12px_rgba(255,77,28,0.35)]"
            >
              <div className="space-y-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">{card.title}</h4>
                  <p className="text-sm text-[#8A8A93] leading-relaxed">{card.description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </SectionShell>
  );
}
