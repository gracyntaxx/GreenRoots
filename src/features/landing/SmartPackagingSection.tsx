import { Link } from "react-router-dom";
import { ArrowRight, Box, CheckCircle2, Recycle, TreePine } from "lucide-react";

export function SmartPackagingSection() {
  const images = [
    {
      title: "Agro-Waste Pulp & Molded Trays",
      subtitle: "100% Biodegradable",
      img: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Straw-Based Protective Packaging",
      subtitle: "Replaces Styrofoam",
      img: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Bagasse Tableware & Eco Containers",
      subtitle: "Compostable in 90 Days",
      img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Bio-Composite Corrugated Boards",
      subtitle: "Zero Wood Logging",
      img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <section id="smart-packaging" className="bg-white py-14 sm:py-20 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Centered Heading */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="rounded-full bg-[#DFF1E5] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0E4D2F]">
            Sustainable Materials
          </span>
          <h2 className="font-heading mt-3 text-3xl sm:text-4xl lg:text-[40px] font-bold leading-[1.2] tracking-[-0.015em] text-[#101A12]">
            Environmental Impact with Smart Packaging
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-[1.6] text-[#5C6B60]">
            Converting crop stubble and bagasse into high-performance industrial molded packaging, replacing single-use styrofoam and saving millions of trees.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs sm:text-sm text-[#5C6B60]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Recycle className="h-4 w-4 text-[#0E4D2F]" /> Zero Plastic Added
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <TreePine className="h-4 w-4 text-[#0E4D2F]" /> Zero Deforestation
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Box className="h-4 w-4 text-[#0E4D2F]" /> Circular Supply Chain
            </span>
          </div>

          <div className="mt-8">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[#0E4D2F] px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(14,77,47,0.2)] hover:bg-[#0A3A24] transition-all"
            >
              Explore Our Solutions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Full-width Image Strip (as specified in layout) */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {images.map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-[20px] aspect-[4/5] bg-[#F3F7F4] shadow-sm border border-[#E7ECE8]"
            >
              <img
                src={item.img}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3A24]/90 via-[#0E4D2F]/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#DFF1E5] block">
                  {item.subtitle}
                </span>
                <p className="font-heading mt-0.5 text-xs sm:text-sm font-bold leading-snug">
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

