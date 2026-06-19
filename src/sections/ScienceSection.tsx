import { BookOpen, ExternalLink } from "lucide-react";

const sources = [
  {
    title: "PM2.5 and Life Expectancy Research",
    description:
      "Fine particulate matter (PM2.5) is associated with reduced life expectancy. The Air Quality Life Index (AQLI) methodology quantifies the relationship between long-term PM2.5 exposure and life expectancy.",
    source: "Air Quality Life Index (AQLI), University of Chicago",
    link: "https://aqli.epic.uchicago.edu/",
  },
  {
    title: "AQLI Methodology",
    description:
      "The AQLI converts particulate pollution concentrations into their impact on life expectancy, developed from peer-reviewed research on the causal relationship between pollution and mortality.",
    source: "EPIC, University of Chicago",
    link: "https://aqli.epic.uchicago.edu/methodology/",
  },
  {
    title: "IQAir PM2.5 Data",
    description:
      "IQAir publishes annual world air quality reports based on ground-level monitoring stations. Jakarta and other Indonesian cities consistently rank among the most polluted globally.",
    source: "IQAir World Air Quality Reports",
    link: "https://www.iqair.com/world-most-polluted-cities",
  },
  {
    title: "State of Global Air",
    description:
      "The State of Global Air report provides comprehensive data on air quality and health, including mortality attributable to PM2.5 exposure across countries.",
    source: "Health Effects Institute & IHME",
    link: "https://www.stateofglobalair.org/",
  },
  {
    title: "Indonesia Motorcycle Fleet Data",
    description:
      "Indonesia has one of the largest motorcycle fleets in the world. The majority of commuters in major cities rely on two-wheelers for daily transportation.",
    source: "Indonesia Ministry of Transport, BPS Statistics",
    link: null,
  },
  {
    title: "Motorcycle Helmet Market",
    description:
      "The Indonesian motorcycle helmet market is substantial, with increasing interest in premium safety features as rider awareness grows.",
    source: "Industry market analysis",
    link: null,
  },
  {
    title: "Transport Microenvironment Exposure",
    description:
      "Studies show that commuters on motorcycles experience elevated exposure to traffic-related air pollution compared to car commuters or subway riders, due to proximity to vehicle exhaust.",
    source: "Environmental Science & Technology journals",
    link: null,
  },
  {
    title: "Mask Fit and Compliance Studies",
    description:
      "Research indicates that mask effectiveness depends heavily on fit, consistent use, and environmental conditions. Heat and humidity reduce compliance and comfort in tropical climates.",
    source: "Occupational Health & Safety research",
    link: null,
  },
];

export default function ScienceSection() {
  return (
    <section id="science" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3A7CA5]/30 bg-[#3A7CA5]/10">
            <BookOpen className="w-4 h-4 text-[#3A7CA5]" />
            <span className="font-mono-label text-xs text-[#3A7CA5] uppercase tracking-wider">
              Sources
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight">
            THE SCIENCE BEHIND THE PROBLEM
          </h2>
          <p className="text-[#8A8A93] max-w-3xl mx-auto">
            We believe in transparency. These are the sources and methodologies that inform our understanding
            of the problem. We make conservative claims and distinguish between established science and our
            concept product.
          </p>
        </div>

        {/* Source cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {sources.map((source) => (
            <div
              key={source.title}
              className="p-5 rounded-xl bg-[#0D0D10] border border-[#1A1A22] hover:border-[#3A7CA5]/30 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-sm">{source.title}</h3>
                {source.link && (
                  <a
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3A7CA5] hover:text-[#00D4AA] transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm text-[#8A8A93] leading-relaxed">{source.description}</p>
              <p className="text-xs text-[#8A8A93]/60 font-mono-label">Source: {source.source}</p>
            </div>
          ))}
        </div>

        {/* Conservative claims note */}
        <div className="p-6 rounded-xl bg-[#13131A] border border-[#1A1A22] space-y-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[#3A7CA5] flex-shrink-0 mt-0.5" />
            <div className="space-y-3">
              <p className="font-medium text-[#3A7CA5]">Our commitment to honest claims</p>
              <ul className="space-y-2 text-sm text-[#8A8A93]">
                <li className="flex items-start gap-2">
                  <span className="text-[#00D4AA] mt-1">•</span>
                  <span>
                    We cite established research on PM2.5 health impacts, but we do not claim AirShield
                    will deliver specific health outcomes until validated through testing.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D4AA] mt-1">•</span>
                  <span>
                    H13 HEPA media performance is rated in controlled lab conditions. Real-world helmet
                    performance depends on seal integrity, airflow design, fit, maintenance, and user behavior.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D4AA] mt-1">•</span>
                  <span>
                    SNI certification is a design target, not a completed status. We will pursue certification
                    before any commercial launch.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00D4AA] mt-1">•</span>
                  <span>
                    Price estimates are for market validation only. Final pricing depends on manufacturing
                    costs, component sourcing, and certification requirements.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
