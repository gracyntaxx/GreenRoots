import { Quote, Star, ShieldCheck, CheckCircle2 } from "lucide-react";

export function SuccessStoriesSection() {
  const avatars = [
    {
      name: "Rubin Ahmed",
      role: "Operations Manager, Panipat Biomass",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      active: true,
    },
    {
      name: "Ramesh Yadav",
      role: "Farmer, Rewari (38 Deliveries)",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Sunita Devi",
      role: "Farmer, Bawal (61 Deliveries)",
      img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Gurpreet Kaur",
      role: "Farmer, Ludhiana (4.8 Rating)",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Amit Kumar",
      role: "Procurement Lead, Amit Traders",
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Fatima Begum",
      role: "Farmer, Panipat (4.6 Rating)",
      img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Balwinder Singh",
      role: "Aggregator, Sangrur",
      img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Anil Patil",
      role: "Farmer, Nashik",
      img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Mahender Singh",
      role: "Farmer, Panipat",
      img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Rajesh Kumar",
      role: "Farmer, Karnal",
      img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    },
  ];

  return (
    <section id="success-stories" className="relative overflow-hidden bg-white py-14 sm:py-20 lg:py-28">
      {/* Oversized Watermark Background Text: SUCCESS STORIES in #E7ECE8 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-center font-heading text-[70px] sm:text-[120px] lg:text-[170px] font-extrabold uppercase tracking-tight text-[#E7ECE8]/70 whitespace-nowrap z-0"
        aria-hidden="true"
      >
        SUCCESS STORIES
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="rounded-full bg-[#DFF1E5] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0E4D2F]">
            Voices of Impact
          </span>
          <h2 className="font-heading mt-3 text-3xl sm:text-4xl lg:text-[40px] font-bold leading-[1.2] tracking-[-0.015em] text-[#101A12]">
            Trusted by Farmers and Clean Industries
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5C6B60]">
            Over 1,200 rural producers and 40+ industrial buyers rely on GreenRoots for reliable crop scrap recycling.
          </p>
        </div>

        {/* Central Testimonial Card */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto rounded-[20px] bg-white p-8 sm:p-10 shadow-[0_12px_36px_rgba(16,26,18,0.08)] border border-[#E7ECE8] relative">
          <Quote className="h-10 w-10 text-[#DFF1E5] absolute top-6 right-6 pointer-events-none" />

          {/* Rating Stars */}
          <div className="flex items-center gap-1 text-[#F59E0B]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
            <span className="ml-2 text-xs font-bold text-[#101A12]">5.0 Verified Settlement</span>
          </div>

          <blockquote className="mt-5 font-heading text-lg sm:text-xl lg:text-2xl font-bold leading-snug text-[#101A12]">
            “GreenRoots completely solved our biomass supply chain volatility. Before, procuring 10,000 tonnes of paddy straw meant dealing with dozens of unreliable brokers. Now, reverse-auction pooling delivers certified moisture-tested residue straight to our boilers with automated PayPal escrow release.”
          </blockquote>

          <div className="mt-8 flex items-center justify-between border-t border-[#E7ECE8] pt-6 flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={avatars[0].img}
                alt={avatars[0].name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-[#0E4D2F]"
              />
              <div>
                <p className="font-heading text-base font-bold text-[#101A12] flex items-center gap-1.5">
                  {avatars[0].name}
                  <CheckCircle2 className="h-4 w-4 text-[#0E4D2F]" />
                </p>
                <p className="text-xs text-[#5C6B60]">{avatars[0].role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-[#F3F7F4] px-3.5 py-1.5 text-xs font-semibold text-[#0E4D2F]">
              <ShieldCheck className="h-4 w-4" />
              Verified Industry Partner
            </div>
          </div>
        </div>

        {/* Avatar Grid: Row of 8-10 circular avatars, 48px each as requested in JSON */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5C6B60] mb-5">
            Connecting Progressive Farmers, Aggregators & Biomass Plants
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto">
            {avatars.map((item, idx) => (
              <div
                key={idx}
                className="group relative"
                title={`${item.name} · ${item.role}`}
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className={`h-12 w-12 rounded-full object-cover border-2 transition-all duration-200 group-hover:scale-110 group-hover:z-10 ${
                    item.active
                      ? "border-[#0E4D2F] ring-2 ring-[#DFF1E5]"
                      : "border-white shadow-sm hover:border-[#0E4D2F]"
                  }`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

