import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/store/session";
import { homeForRole } from "@/lib/routing";

import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { LandingHero } from "@/features/landing/LandingHero";
import { ValuePropositionSection } from "@/features/landing/ValuePropositionSection";
import { WhyItMattersSection } from "@/features/landing/WhyItMattersSection";
import { SuccessStoriesSection } from "@/features/landing/SuccessStoriesSection";
import { SustainableTomorrowSection } from "@/features/landing/SustainableTomorrowSection";
import { SmartPackagingSection } from "@/features/landing/SmartPackagingSection";
import { LandingFooter } from "@/features/landing/LandingFooter";
import { LanguageModal } from "@/features/landing/LanguageModal";
import { ContactModal } from "@/features/landing/ContactModal";

export default function WelcomePage() {
  const profile = useSession((s) => s.profile);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // If already logged in, redirect to user role's primary screen
  if (profile) return <Navigate to={homeForRole(profile.role)} replace />;

  return (
    <div className="min-h-screen botanical-mist text-bark selection:bg-[#F6DFC9] selection:text-moss-deep antialiased">
      {/* 1. Navbar (~72px, sticky, brand logo, nav links, contact button, language switcher) */}
      <LandingNavbar
        onOpenLangModal={() => setLangModalOpen(true)}
        onOpenContactModal={() => setContactModalOpen(true)}
      />

      <main>
        {/* 2. Hero Section: "Turn Waste Into Opportunity. Smarter Scrap Recycling Starts Here" */}
        <LandingHero />

        {/* 3. Value Proposition: "Turning Scrap Into Sustainable Value" (How it works + 80% stat card) */}
        <ValuePropositionSection />

        {/* 4. Why It Matters: Interactive Accordion with #0E4D2F active state & CTA */}
        <WhyItMattersSection />

        {/* 5. Success Stories: Oversized Watermark, Rubin Ahmed Testimonial, 48px Avatar Grid */}
        <SuccessStoriesSection />

        {/* 6. Together for a Sustainable Tomorrow: 3 Equal Cards with Circular Arrow Buttons */}
        <SustainableTomorrowSection />

        {/* 7. Environmental Impact with Smart Packaging: Full-width Image Strip & Solutions CTA */}
        <SmartPackagingSection />
      </main>

      {/* 8. Dark Green Footer (#0A3A24): 4 Columns, Social Icons, Legal & Copyright */}
      <LandingFooter onOpenContact={() => setContactModalOpen(true)} />

      {/* Interactive Modals */}
      <LanguageModal open={langModalOpen} onClose={() => setLangModalOpen(false)} />
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
}
