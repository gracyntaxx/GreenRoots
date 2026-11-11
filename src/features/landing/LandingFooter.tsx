import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, ShieldCheck, ArrowUpRight, Github, Twitter, Linkedin, Facebook } from "lucide-react";
import { LogoMark } from "@/components/shared/Brand";

export function LandingFooter({ onOpenContact }: { onOpenContact: () => void }) {
  return (
    <footer id="footer" className="bg-[#0A3A24] text-white pt-16 pb-12 border-t border-white/10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-white/10">
          {/* Column 1: Brand + Logo + Description (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                <LogoMark className="h-6 w-6" />
              </span>
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                Green<span className="text-[#22C55E]">Roots</span>
              </span>
            </div>

            <p className="text-sm leading-relaxed text-[#DFF1E5]/80 max-w-sm">
              Empowering farmers to monetize crop residue, stop field burning, and power clean bio-energy industries with instant verified settlement.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-[#DFF1E5]/90">
              <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
              <span>Payments secured with PayPal Escrow & Webhooks</span>
            </div>
          </div>

          {/* Column 2: Quick Links (2-3 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#DFF1E5]">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <a href="#hero" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#value-proposition" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#why-it-matters" className="hover:text-white transition-colors">
                  Why It Matters
                </a>
              </li>
              <li>
                <a href="#success-stories" className="hover:text-white transition-colors">
                  Success Stories
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions / Resources (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#DFF1E5]">
              Marketplace Solutions
            </h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link to="/signup?role=farmer" className="hover:text-white transition-colors flex items-center gap-1">
                  For Farmers (Sell Residue) <ArrowUpRight className="h-3 w-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/signup?role=industry" className="hover:text-white transition-colors flex items-center gap-1">
                  For Biomass Industry (Procure) <ArrowUpRight className="h-3 w-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/signup?role=buyer" className="hover:text-white transition-colors flex items-center gap-1">
                  For Direct Buyers <ArrowUpRight className="h-3 w-3 opacity-70" />
                </Link>
              </li>
              <li>
                <a href="#smart-packaging" className="hover:text-white transition-colors">
                  Smart Agro-Packaging
                </a>
              </li>
              <li>
                <a href="#value-proposition" className="hover:text-white transition-colors">
                  Village Collection Centers
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Information + Follow Us Icons (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-[#DFF1E5]">
              Contact Information
            </h4>
            <ul className="space-y-2.5 text-xs text-white/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#22C55E] mt-0.5" />
                <span>GreenRoots Agri Hub, Rewari Central & Panipat Yard, Haryana, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#22C55E]" />
                <span>+91 98123 45670 (Toll-Free Helpline)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#22C55E]" />
                <span>support@greenroots.agri</span>
              </li>
            </ul>

            <div className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#DFF1E5]/70 mb-2">
                Follow Us
              </p>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-[#22C55E] hover:text-[#0A3A24] transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-[#22C55E] hover:text-[#0A3A24] transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-[#22C55E] hover:text-[#0A3A24] transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="ml-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  Help Desk
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright line left, Privacy Policy and Terms right */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#DFF1E5]/70">
          <p>
            &copy; {new Date().getFullYear()} GreenRoots Sustainable Agri Exchange. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#why-it-matters" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#why-it-matters" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#why-it-matters" className="hover:text-white transition-colors">
              Security & Escrow
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

