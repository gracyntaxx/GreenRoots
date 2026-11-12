import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Leaf,
  Mic,
  PackageSearch,
  ShieldCheck,
  ShoppingBasket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

const roles = [
  { label: "Farmer", to: "/signup?role=farmer", icon: Leaf },
  { label: "Buyer", to: "/signup?role=buyer", icon: ShoppingBasket },
  { label: "Industry", to: "/signup?role=industry", icon: Building2 },
  { label: "Admin", to: "/login", icon: ShieldCheck },
];

const quickLaunch = [
  { label: "Speak a listing", detail: "Voice-first harvest draft", icon: Mic, to: "/signup?role=farmer" },
  { label: "Browse marketplace", detail: "Fresh residue lots", icon: PackageSearch, to: "/signup?role=buyer" },
  { label: "Join demand pools", detail: "Pool with your village", icon: Users, to: "/signup?role=farmer" },
  { label: "Track settlements", detail: "PayPal verified payouts", icon: Wallet, to: "/signup?role=industry" },
];

export function LandingHero() {
  return (
    <section id="hero" className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sage/80 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-64 h-96 w-96 rounded-full bg-cream/90 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div className="eyebrow">
              <Leaf className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
              Zero stubble burning · Instant PayPal settlement
            </div>

            <h1 className="organic-title mt-5 max-w-2xl text-[42px] font-bold leading-[1.02] sm:text-[58px] lg:text-[66px]">
              Turn crop residue into <span className="text-terracotta">verified farm income.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Speak or type in your local language to list rice husk, wheat straw, or bagasse. Intelligent AI matches
              your harvest with verified industries while secure escrow keeps every settlement transparent.
            </p>

            <div className="mt-6 flex flex-wrap gap-2" aria-label="Choose your workspace role">
              {roles.map(({ label, to, icon: Icon }, index) => (
                <Link
                  key={label}
                  to={to}
                  className={
                    index === 0
                      ? "inline-flex items-center gap-1.5 rounded-full bg-moss px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-moss-deep"
                      : "inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3.5 py-2 text-xs font-bold text-muted backdrop-blur transition hover:border-moss/30 hover:bg-sage-light hover:text-moss"
                  }
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label} view
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#D96B27_0%,#EAB308_100%)] px-8 text-sm font-bold text-moss-deep shadow-[0_10px_26px_rgba(217,107,39,0.26)] transition hover:brightness-95 active:scale-[0.985]"
              >
                Get started today
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#value-proposition"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-line bg-white/75 px-8 text-sm font-bold text-moss shadow-sm backdrop-blur transition hover:border-moss/30 hover:bg-sage-light"
              >
                Explore how it works
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-growth" aria-hidden="true" /> Zero residue burning
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-growth" aria-hidden="true" /> Direct farmer payouts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-growth" aria-hidden="true" /> Human-reviewed AI
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative overflow-hidden rounded-[32px] border-2 border-moss/90 bg-moss shadow-[10px_10px_0_#EAB308]">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
                alt="Golden harvest fields with baled crop residue ready for recycling"
                className="h-[420px] w-full object-cover sm:h-[500px]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(21,46,33,0.92),rgba(27,59,43,0.2)_55%,transparent)]" />
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                <Leaf className="h-3.5 w-3.5 text-[#FDE68A]" aria-hidden="true" />
                Live in North India
              </div>

              <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDE68A]">
                      Verified circular harvest
                    </p>
                    <h2 className="mt-1 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                      From village stubble to industrial feedstock.
                    </h2>
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-white/15 p-3 text-white backdrop-blur-md sm:block">
                    <BadgeCheck className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["14,280 kg", "diverted this week"],
                    ["₹4.8 Cr+", "farmer payouts"],
                    ["98.4%", "pool fulfilment"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md">
                      <p className="num text-sm font-bold text-white sm:text-base">{value}</p>
                      <p className="mt-0.5 text-[9px] font-semibold leading-tight text-white/70 sm:text-[10px]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -left-3 top-24 hidden rounded-2xl border border-line bg-white/95 p-3 shadow-glass backdrop-blur-lg sm:block">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage text-moss">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">AI draft ready</p>
                  <p className="num text-sm font-bold text-moss">200 kg rice husk</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 right-4 hidden rounded-2xl border border-line bg-white/95 p-3 shadow-glass backdrop-blur-lg sm:block">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-growth">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Escrow protected</p>
                  <p className="text-xs font-bold text-moss">PayPal Escrow</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-3 sm:mt-16 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {quickLaunch.map(({ label, detail, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="group glass-panel flex items-center gap-3 rounded-panel p-4 transition-all hover:-translate-y-0.5 hover:border-terracotta/30 hover:shadow-glass"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-moss transition group-hover:bg-wheat-soft group-hover:text-terracotta-dark">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-moss">{label}</span>
                <span className="block truncate text-[11px] font-medium text-muted">{detail}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-terracotta" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
