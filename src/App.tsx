import { useEffect } from "react";
import HeroSection from "./sections/HeroSection";
import ProductCardSection from "./sections/ProductCardSection";
import PriceTestSection from "./sections/PriceTestSection";
import ProblemSection from "./sections/ProblemSection";
import ExposureCalculator from "./sections/ExposureCalculator";
import FilterSubscriptionSection from "./sections/FilterSubscriptionSection";
import UseCaseSection from "./sections/UseCaseSection";
import ObjectionCaptureSection from "./sections/ObjectionCaptureSection";
import CommunityValidationSection from "./sections/CommunityValidationSection";
import BetaCTASection from "./sections/BetaCTASection";
import ScienceSection from "./sections/ScienceSection";
import FooterSection from "./sections/FooterSection";
import StickyCTA from "./sections/StickyCTA";

export default function App() {
  useEffect(() => {
    // Track page load
    console.log("[AirShield] Page loaded");
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-[#F4F1EC] font-body overflow-x-hidden">
      <HeroSection />
      <ProductCardSection />
      <PriceTestSection />
      <ProblemSection />
      <ExposureCalculator />
      <FilterSubscriptionSection />
      <UseCaseSection />
      <ObjectionCaptureSection />
      <CommunityValidationSection />
      <BetaCTASection />
      <ScienceSection />
      <FooterSection />
      <StickyCTA />
    </div>
  );
}
