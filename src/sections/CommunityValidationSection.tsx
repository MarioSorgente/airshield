import { Users, MapPin, Palette, MessageSquare, BarChart3 } from "lucide-react";

export default function CommunityValidationSection() {
  return (
    <section id="community" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="font-mono-label text-xs text-[#00D4AA] uppercase tracking-widest">
            Community Driven
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight">
            BUILT WITH RIDERS, NOT GUESSED IN A ROOM.
          </h2>
          <p className="text-[#8A8A93] max-w-3xl mx-auto leading-relaxed">
            We are collecting feedback from Indonesian riders before manufacturing. Your signup helps us
            understand where demand is strongest, what price makes sense, and which version should be built first.
          </p>
        </div>

        {/* Stats placeholder */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Users,
              label: "Early access interest",
              value: "Validation",
              subtext: "dashboard coming soon",
              color: "#00D4AA",
            },
            {
              icon: MapPin,
              label: "Top city",
              value: "Collecting",
              subtext: "data from signups",
              color: "#F5C842",
            },
            {
              icon: Palette,
              label: "Most requested color",
              value: "Analyzing",
              subtext: "variant selections",
              color: "#FF4D1C",
            },
            {
              icon: MessageSquare,
              label: "Most common objection",
              value: "Tracking",
              subtext: "feedback responses",
              color: "#8A8A93",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl bg-[#0D0D10] border border-[#1A1A22] text-center space-y-3"
            >
              <div
                className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="font-mono-label text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs text-[#8A8A93] mt-1">{stat.label}</p>
                <p className="text-xs text-[#8A8A93]/60">{stat.subtext}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Share your feedback",
              description:
                "Answer questions about your riding habits, price sensitivity, and concerns. Every response shapes the product.",
            },
            {
              step: "02",
              title: "We analyze demand",
              description:
                "We aggregate responses by city, use case, and preference to understand where AirShield should launch first.",
            },
            {
              step: "03",
              title: "Prototype & test",
              description:
                "If demand is strong enough, we build the first prototype and invite beta testers from our early access list.",
            },
          ].map((step) => (
            <div
              key={step.step}
              className="p-6 rounded-2xl bg-[#0D0D10] border border-[#1A1A22] space-y-4"
            >
              <span className="font-mono-label text-4xl font-bold text-[#00D4AA]/20">
                {step.step}
              </span>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-[#8A8A93] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Dashboard note */}
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[#13131A] border border-[#1A1A22] w-fit mx-auto">
          <BarChart3 className="w-5 h-5 text-[#8A8A93]" />
          <p className="text-sm text-[#8A8A93]">
            Live validation dashboard coming once we reach 100 responses
          </p>
        </div>
      </div>
    </section>
  );
}
