import { useEffect } from "react";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { trackEvent } from "./lib/tracking";
import { getSessionId, getUtm } from "./lib/session";
import Reveal from "./components/Reveal";
import NavBar from "./components/NavBar";
import ScrollProgress from "./components/ScrollProgress";
import SectionDots from "./components/SectionDots";
import FirebaseConfigNotice from "./components/FirebaseConfigNotice";
import HeroSection from "./sections/HeroSection";
import ProductCardSection from "./sections/ProductCardSection";
import UseCaseSection from "./sections/UseCaseSection";
import PriceTestSection from "./sections/PriceTestSection";
import ProblemSection from "./sections/ProblemSection";
import ExposureCalculator from "./sections/ExposureCalculator";
import BetaCTASection from "./sections/BetaCTASection";
import ScienceSection from "./sections/ScienceSection";
import FooterSection from "./sections/FooterSection";
import StickyCTA from "./sections/StickyCTA";

export default function App() {
  useEffect(() => {
    // Establish session + capture campaign attribution, then record the visit
    // so the dashboard's traffic/funnel/UTM panels have data.
    getSessionId();
    getUtm();
    trackEvent("page_view");
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-[#F4F1EC] font-body overflow-x-hidden">
      <ScrollProgress />
      <NavBar />
      <SectionDots />
      <Reveal><HeroSection /></Reveal>
      <Reveal><ProblemSection /></Reveal>
      <Reveal><ExposureCalculator /></Reveal>
      <Reveal><ProductCardSection /></Reveal>
      <Reveal><UseCaseSection /></Reveal>
      <Reveal><ScienceSection /></Reveal>
      <Reveal><PriceTestSection /></Reveal>
      <Reveal><BetaCTASection /></Reveal>
      <FooterSection />
      <div className="lg:hidden">
        <StickyCTA />
      </div>
      <Toaster theme="dark" position="top-center" richColors />
      <FirebaseConfigNotice />
      <Analytics />
    </div>
  );
}
