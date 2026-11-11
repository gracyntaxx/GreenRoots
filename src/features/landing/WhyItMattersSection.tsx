import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight, Wind, Zap, BadgeDollarSign, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bulletPoints: string[];
  icon: typeof Wind;
}

export function WhyItMattersSection() {
  const [activeId, setActiveId] = useState<string>("stubble-cleaning");

  const items: AccordionItem[] = [
    {
      id: "stubble-cleaning",
      title: "Stubble & Scrap Cleaning",
      subtitle: "Eliminating open-field crop burning across northern plains",
      description:
        "Every harvest season, over 35 million tonnes of crop stubble are burned in northern India, triggering acute smog crises. GreenRoots gives farmers a mechanized, profitable alternative by turning waste into valuable industrial feedstock.",
      bulletPoints: [
        "Prevents severe Air Quality Index (AQI 500+) spikes in Delhi NCR, Haryana & Punjab",
        "Preserves 100% of soil microbial biodiversity and natural nitrogen-potassium levels",
        "Direct field pick-up reduces farm preparation time by up to 14 days",
      ],
      icon: Wind,
    },
    {
      id: "clean-energy",
      title: "Clean Energy & Biochar",
      subtitle: "Replacing fossil coal in thermal boilers with dense biomass",
      description:
        "Harvested straw is processed into high-calorific bio-pellets and biochar. Power generation plants use this clean fuel for mandate-compliant co-firing, slashing carbon footprints while creating decentralized energy hubs.",
      bulletPoints: [
        "Co-firing 7–10% agro-biomass in industrial thermal plants",
        "Zero sulfur emissions and net-negative carbon cycle biochar production",
        "Provides reliable, stable supply contracts for bio-CNG plants",
      ],
      icon: Zap,
    },
    {
      id: "farmer-prosperity",
      title: "Guaranteed Farmer Prosperity",
      subtitle: "Turning an expense into an immediate income stream",
      description:
        "Farmers used to spend ₹2,000–₹3,500 per acre just to burn or dispose of stubble. GreenRoots inverts this economic model: farmers earn verified market rates per quintal, deposited securely through PayPal escrow.",
      bulletPoints: [
        "Transparent real-time market pricing with zero predatory middlemen",
        "Fair platform commission (5%) with largest-remainder exact payouts",
        "Instant weighbridge drop-off receipts and tracked payment milestones",
      ],
      icon: BadgeDollarSign,
    },
    {
      id: "rural-education",
      title: "Rural Education & Community",
      subtitle: "Hands-on village training, AI voice tools, and collective pooling",
      description:
        "Technology must be accessible to every farmer regardless of literacy. Our multilingual AI voice assistant interprets local vernacular into official listing drafts, while village workshops educate on soil conservation.",
      bulletPoints: [
        "Spoken voice listings in Hindi, Punjabi, Marathi, and regional dialects",
        "Collective pooling lets smallholder farmers meet 100+ tonne industry requirements",
        "Village youth employed as certified collection point weighbridge managers",
      ],
      icon: GraduationCap,
    },
  ];

  return (
    <section id="why-it-matters" className="bg-white py-14 sm:py-20 lg:py-28 border-b border-[#E7ECE8]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="rounded-full bg-[#DFF1E5] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0E4D2F]">
            Environmental & Economic Impact
          </span>
          <h2 className="font-heading mt-3 text-3xl sm:text-4xl lg:text-[40px] font-bold leading-[1.2] tracking-[-0.015em] text-[#101A12]">
            Why It Matters
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-[1.6] text-[#5C6B60]">
            From stopping toxic smog to ensuring farmer livelihoods, our circular model turns agricultural residue into a win for the climate and rural economy.
          </p>
        </div>

        {/* Accordion Component */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto space-y-3.5">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={cn(
                  "overflow-hidden rounded-[16px] transition-all duration-300",
                  isActive
                    ? "bg-[#0E4D2F] text-white shadow-[0_12px_28px_rgba(14,77,47,0.22)]"
                    : "bg-white text-[#101A12] border border-[#DCE5DE] hover:border-[#0E4D2F]/50 hover:bg-[#F3F7F4]/60"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(isActive ? "" : item.id)}
                  className="w-full flex items-center justify-between p-5 sm:px-6 text-left transition-colors"
                  aria-expanded={isActive}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isActive ? "bg-white/15 text-white" : "bg-[#DFF1E5] text-[#0E4D2F]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3
                        className={cn(
                          "font-heading text-lg sm:text-xl font-bold leading-tight",
                          isActive ? "text-white" : "text-[#101A12]"
                        )}
                      >
                        {item.title}
                      </h3>
                      <p
                        className={cn(
                          "mt-0.5 text-xs sm:text-sm font-medium",
                          isActive ? "text-[#DFF1E5]" : "text-[#5C6B60]"
                        )}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300",
                      isActive ? "bg-white/20 text-white rotate-180" : "bg-[#F3F7F4] text-[#101A12]"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                {isActive && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-7 pt-1 text-left animate-fade-in border-t border-white/10">
                    <p className="text-sm sm:text-[15px] leading-relaxed text-white/90">
                      {item.description}
                    </p>
                    <ul className="mt-4 space-y-2 text-xs sm:text-sm text-white/85">
                      {item.bulletPoints.map((bp, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" />
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2.5 rounded-full bg-[#0E4D2F] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(14,77,47,0.22)] hover:bg-[#0A3A24] transition-all active:scale-[0.98]"
          >
            Start Your Recycling Journey
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

