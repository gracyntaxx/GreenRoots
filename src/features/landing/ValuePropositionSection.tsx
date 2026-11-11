import { ArrowRight, CheckCircle2, Factory, Flame, Layers, ShieldCheck, Zap } from "lucide-react";

export function ValuePropositionSection() {
  const steps = [
    {
      number: "01",
      title: "Farmers List Crop Scrap & Stubble",
      desc: "Farmers speak in their regional dialect (Hindi, Punjabi, English) to instantly generate verified listing drafts for paddy straw, wheat stubble, mustard, and bagasse.",
    },
    {
      number: "02",
      title: "Bio-Energy Aggregation & Reverse Auctions",
      desc: "Local village farmers pool residue together to hit industrial tonnage targets. Bio-energy plants bid transparent market rates with zero broker friction.",
    },
    {
      number: "03",
      title: "Weighbridge Check & PayPal Settlement",
      desc: "Residue is delivered to village collection points. Verified weights release guaranteed payments from escrow directly to the farmer.",
    },
  ];

  return (
    <section id="value-proposition" className="bg-[#F3F7F4] py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Headline, How It Works (3-step list), CTA */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="rounded-full bg-[#DFF1E5] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0E4D2F]">
                How It Works
              </span>
              <h2 className="font-heading mt-3 text-3xl sm:text-4xl lg:text-[40px] font-bold leading-[1.2] tracking-[-0.015em] text-[#101A12]">
                Turning Scrap Into Sustainable Value
              </h2>
              <p className="mt-4 text-base sm:text-lg leading-[1.6] text-[#5C6B60]">
                We transform hazardous crop residue from an environmental liability into a high-demand renewable commodity for clean bio-energy boilers and packaging.
              </p>
            </div>

            {/* 3-Step Cards */}
            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-[20px] bg-white p-6 sm:p-7 shadow-[0_8px_24px_rgba(16,26,18,0.06)] border border-[#E7ECE8] flex items-start gap-4 transition-transform hover:-translate-y-0.5 duration-200"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DFF1E5] font-heading text-lg font-bold text-[#0E4D2F]">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#101A12]">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#5C6B60]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Secondary CTA Button */}
            <div>
              <a
                href="#why-it-matters"
                className="inline-flex items-center gap-2 rounded-full border border-[#DCE5DE] bg-white px-7 py-3.5 text-[15px] font-semibold text-[#101A12] shadow-sm hover:bg-[#F3F7F4] hover:border-[#0E4D2F]/40 transition-colors"
              >
                Explore Our Impact
                <ArrowRight className="h-4 w-4 text-[#0E4D2F]" />
              </a>
            </div>
          </div>

          {/* Right Column: Stat Card (Up to 80% Energy Savings) & Image Grid */}
          <div className="lg:col-span-5 space-y-6">
            {/* Stat Card: Up to 80% Energy Savings */}
            <div className="relative overflow-hidden rounded-[20px] bg-[#0E4D2F] p-8 text-white shadow-[0_16px_32px_rgba(14,77,47,0.22)]">
              {/* Background circular decorative flare */}
              <div
                className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-[#22C55E]/20 blur-2xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#DFF1E5]">
                  Verified Eco Metric
                </span>
                <Zap className="h-5 w-5 text-[#22C55E]" />
              </div>

              <div className="mt-6">
                <span className="text-xs uppercase tracking-wider text-[#DFF1E5]/80 font-semibold block">
                  Emissions & Fuel Reduction
                </span>
                <p className="font-heading mt-1 text-5xl sm:text-6xl font-bold tracking-tight text-white">
                  Up to 80%
                </p>
                <p className="font-heading text-xl font-bold text-[#DFF1E5] mt-1">
                  Energy & Carbon Savings
                </p>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/85">
                Every tonne of agricultural scrap co-fired in bio-boilers prevents 1.4 tonnes of toxic greenhouse gases and PM2.5 smog from open-air field burning.
              </p>

              <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="font-heading text-2xl font-bold text-white">45,000+</p>
                  <p className="text-xs text-[#DFF1E5]/80 mt-0.5">Tonnes Biomass Diverted</p>
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-white">100%</p>
                  <p className="text-xs text-[#DFF1E5]/80 mt-0.5">Verified Payout Rate</p>
                </div>
              </div>
            </div>

            {/* Supporting Visual Image Card */}
            <div className="relative group overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgba(16,26,18,0.06)] border border-[#E7ECE8]">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
                alt="Green circular economy and bio-pellet recycling facility"
                className="h-64 sm:h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3A24]/85 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white text-left">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#DFF1E5]">
                    End-to-End Traceability
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold">
                  From farm collection point directly to high-efficiency industrial pelletizers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

