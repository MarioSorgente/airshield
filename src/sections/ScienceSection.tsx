import { BookOpen, ExternalLink } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/motion";

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
    <section id="science" className="py-24 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8">
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
            These are the sources and methodologies behind the numbers on this page.
          </p>
        </div>

        {/* Source cards */}
        <StaggerContainer className="grid sm:grid-cols-2 gap-4">
          {sources.map((source) => (
            <StaggerItem
              key={source.title}
              whileHover={{ y: -4 }}
              className="p-5 rounded-xl bg-[#0D0D10] border border-[#1A1A22] transition-[border-color,box-shadow] duration-300 hover:border-[#3A7CA5]/50 hover:shadow-[0_0_40px_-12px_rgba(58,124,165,0.35)] space-y-3"
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
            </StaggerItem>
          ))}
        </StaggerContainer>

      </div>
    </section>
  );
}
