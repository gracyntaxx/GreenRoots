import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Leaf, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";

export function LandingHero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-white pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      {/* Subtle organic ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-[#DFF1E5]/60 blur-3xl opacity-70"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow / Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE5DE] bg-[#F3F7F4] px-4 py-1.5 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#0E4D2F] animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0E4D2F]">
            Sustainable Agro-Waste & Biomass Recycling
          </span>
          <span className="rounded-full bg-[#DFF1E5] px-2 py-0.5 text-[10px] font-bold text-[#0E4D2F]">
            Live in North India
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="font-heading mt-6 text-[38px] leading-[1.12] sm:text-[52px] lg:text-[64px] font-bold tracking-[-0.02em] text-[#101A12] max-w-4xl mx-auto">
          Turn Waste Into Opportunity. <br className="hidden sm:inline" />
          <span className="text-[#0E4D2F]">Smarter Scrap Recycling</span> Starts Here
        </h1>

        {/* Hero Subheadline */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl leading-[1.6] text-[#5C6B60] max-w-2xl mx-auto font-normal">
          Help businesses and communities recycle efficiently, reduce environmental impact, and unlock value from scrap materials and agricultural crop residue.
        </p>

        {/* Primary and Secondary CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#0E4D2F] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(14,77,47,0.25)] hover:bg-[#0A3A24] hover:shadow-[0_12px_24px_rgba(10,58,36,0.3)] transition-all active:scale-[0.98]"
          >
            Get Started Today
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#value-proposition"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-[#DCE5DE] bg-white px-8 py-4 text-[15px] font-semibold text-[#101A12] hover:bg-[#F3F7F4] hover:border-[#0E4D2F]/40 transition-all shadow-sm"
          >
            Explore How It Works
          </a>
        </div>

        {/* Quick Trust Signals Row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-[#5C6B60]">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#0E4D2F]" /> Zero residue burning
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#0E4D2F]" /> Direct farmer payments
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#0E4D2F]" /> Verified PayPal escrow
          </span>
        </div>

        {/* Full-width Green Photo Collage */}
        <div className="relative mt-12 sm:mt-16 lg:mt-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-center">
            {/* Left Image: Agro Waste Baling */}
            <div className="md:col-span-4 relative group overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgba(16,26,18,0.08)] border border-[#E7ECE8]">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
                alt="Golden agricultural crop residue ready for sustainable recycling"
                className="h-64 sm:h-72 lg:h-80 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3A24]/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                  Crop Residue Baling
                </span>
                <p className="mt-1 text-sm font-bold">Paddy & Wheat Straw Collection</p>
              </div>
            </div>

            {/* Center Dominant Image: Clean Bio-Energy Facility & Rural Greenery */}
            <div className="md:col-span-5 relative group overflow-hidden rounded-[20px] shadow-[0_12px_32px_rgba(16,26,18,0.12)] border border-[#0E4D2F]/20">
              <img
                src="https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=1000&q=80"
                alt="Modern sustainable biomass facility transforming scrap into energy"
                className="h-72 sm:h-80 lg:h-96 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3A24]/90 via-[#0E4D2F]/20 to-transparent" />

              {/* Floating Stat Chip inside Image */}
              <div className="absolute top-4 right-4 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 shadow-md flex items-center gap-2">
                <Leaf className="h-4 w-4 text-[#0E4D2F]" />
                <span className="text-xs font-bold text-[#101A12]">100% Clean Energy</span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 text-left text-white">
                <span className="rounded-full bg-[#0E4D2F] px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                  Bio-Energy Pellets
                </span>
                <h3 className="font-heading mt-2 text-lg sm:text-xl font-bold">
                  Replacing Coal with Sustainable Agricultural Biomass
                </h3>
                <p className="mt-1 text-xs text-white/80 line-clamp-2">
                  Supplying thermal power plants and bio-CNG boilers across Haryana & Punjab.
                </p>
              </div>
            </div>

            {/* Right Image: Farmer & Community Verification */}
            <div className="md:col-span-3 space-y-4">
              <div className="relative group overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgba(16,26,18,0.08)] border border-[#E7ECE8]">
                <img
                  src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80"
                  alt="Farmer receiving verified payout settlement for crop residue"
                  className="h-44 sm:h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A3A24]/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-left text-white">
                  <p className="text-xs font-bold">Village Collection Hubs</p>
                  <p className="text-[10px] text-white/80">Rewari · Panipat · Sangrur</p>
                </div>
              </div>

              {/* Stat Highlight Card */}
              <div className="rounded-[20px] bg-[#F3F7F4] border border-[#DCE5DE] p-5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5C6B60]">Farmer Impact</span>
                  <TrendingUp className="h-4 w-4 text-[#0E4D2F]" />
                </div>
                <p className="font-heading mt-2 text-2xl font-bold text-[#0E4D2F]">₹4.8 Cr+</p>
                <p className="mt-0.5 text-xs text-[#5C6B60]">
                  Paid directly to farmers with zero intermediary deduction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

