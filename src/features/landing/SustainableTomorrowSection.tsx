import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export function SustainableTomorrowSection() {
  const cards = [
    {
      title: "Waste Solutions",
      subtitle: "Industrial Biomass Co-Firing",
      description:
        "High-density pelletization turns bulky crop residue into standardized fuel for thermal boilers, cutting coal reliance and industrial carbon footprints by up to 80%.",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=80",
      tag: "Renewable Fuel",
      link: "/signup?role=industry",
    },
    {
      title: "Organic Living",
      subtitle: "Biochar & Topsoil Health",
      description:
        "Pyrolyzed agricultural residue produces nutrient-rich biochar that locks atmospheric carbon into farmland for decades, enhancing water retention and organic yield.",
      image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=700&q=80",
      tag: "Soil Regeneration",
      link: "/signup?role=farmer",
    },
    {
      title: "Natural Balance",
      subtitle: "Transparent Collective Trade",
      description:
        "Smallholder farmers pool their harvests through village collection hubs. Direct reverse-auctions eliminate exploitative intermediaries and protect ecological equilibrium.",
      image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=700&q=80",
      tag: "Circular Economy",
      link: "/signup?role=buyer",
    },
  ];

  return (
    <section id="sustainable-tomorrow" className="bg-[#F1F6F2] py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="rounded-full bg-[#E3EFE8] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1B3B2B]">
            Ecosystem Solutions
          </span>
          <h2 className="font-heading mt-3 text-3xl sm:text-4xl lg:text-[40px] font-bold leading-[1.2] tracking-[-0.015em] text-[#18261F]">
            Together for a Sustainable Tomorrow
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-[1.6] text-[#52635A]">
            Building a resilient agricultural economy through circular biomass processing, organic soil regeneration, and fair-market pooling.
          </p>
        </div>

        {/* 3 Equal Cards Grid (as specified: image top, title, short text, circular arrow button) */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="group flex flex-col justify-between overflow-hidden rounded-[20px] bg-white p-7 sm:p-8 shadow-[0_8px_24px_rgba(16,26,18,0.06)] border border-[#DCE4DF] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(16,26,18,0.12)]"
            >
              <div>
                {/* Image Top */}
                <div className="relative overflow-hidden rounded-[16px] aspect-[16/10] bg-[#F1F6F2]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1B3B2B] shadow-sm">
                    {card.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="mt-6">
                  <p className="text-xs font-semibold text-[#52635A] uppercase tracking-wider">
                    {card.subtitle}
                  </p>
                  <h3 className="font-heading mt-1 text-xl sm:text-2xl font-bold text-[#18261F] group-hover:text-[#1B3B2B] transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#52635A]">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Card Footer with 40px Circular Arrow Button */}
              <div className="mt-8 pt-5 border-t border-[#DCE4DF] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#18261F] group-hover:text-[#1B3B2B] transition-colors">
                  Learn more
                </span>
                <Link
                  to={card.link}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-[#DCE4DF] text-[#18261F] shadow-sm transition-all duration-200 group-hover:bg-[#1B3B2B] group-hover:text-white group-hover:border-[#1B3B2B] group-hover:rotate-45"
                  aria-label={`Learn more about ${card.title}`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

