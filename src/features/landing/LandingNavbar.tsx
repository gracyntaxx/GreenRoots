import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, Menu, X, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/shared/Brand";
import { useUi } from "@/store/ui";
import { LANGUAGES } from "@/types";

export function LandingNavbar({
  onOpenLangModal,
  onOpenContactModal,
}: {
  onOpenLangModal: () => void;
  onOpenContactModal: () => void;
}) {
  const navigate = useNavigate();
  const language = useUi((s) => s.language);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "About Us", href: "#value-proposition" },
    { label: "Why It Matters", href: "#why-it-matters" },
    { label: "Success Stories", href: "#success-stories" },
    { label: "Solutions", href: "#sustainable-tomorrow" },
    { label: "Resources", href: "#smart-packaging" },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-oat/85 backdrop-blur-xl shadow-[0_2px_18px_rgba(27,59,43,0.07)] border-b border-[#DCE4DF]/80"
          : "bg-oat/70 border-b border-transparent backdrop-blur-md"
      }`}
      style={{ height: "72px" }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/welcome" className="flex items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3B2B] shadow-[3px_3px_0_#EAB308] text-white shadow-sm transition-transform group-hover:scale-105">
            <LogoMark className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <span className="font-heading text-xl font-bold tracking-tight text-[#18261F]">
              Green<span className="text-[#1B3B2B]">Roots</span>
            </span>
            <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.12em] text-[#52635A]">
              Eco Waste Exchange
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
              className="text-[15px] font-medium text-[#52635A] hover:text-[#1B3B2B] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Action Items */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Switcher Pill */}
          <button
            type="button"
            onClick={onOpenLangModal}
            className="flex items-center gap-1.5 rounded-full border border-[#DCE4DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#18261F] hover:border-[#1B3B2B] hover:bg-[#F1F6F2] transition-all"
            title="Change Language"
          >
            <Globe className="h-3.5 w-3.5 text-[#1B3B2B]" />
            <span>{currentLangObj.native}</span>
          </button>

          {/* Log In Link */}
          <Link
            to="/login"
            className="rounded-full px-5 py-2 text-sm font-semibold text-[#18261F] hover:text-[#1B3B2B] transition-colors"
          >
            Log in
          </Link>

          {/* Contact (primary button as requested in JSON) */}
          <button
            type="button"
            onClick={onOpenContactModal}
            className="rounded-full bg-[linear-gradient(135deg,#D96B27_0%,#EAB308_100%)] px-6 py-2.5 text-sm font-bold text-[#152E21] shadow-[0_6px_16px_rgba(217,107,39,0.22)] hover:brightness-95 transition-all active:scale-[0.98]"
          >
            Contact
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={onOpenLangModal}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE4DF] text-[#1B3B2B]"
            aria-label="Language selector"
          >
            <Globe className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE4DF] text-[#18261F] hover:bg-[#F1F6F2]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[72px] z-50 border-b border-[#DCE4DF] bg-white px-6 py-6 shadow-xl lg:hidden animate-fade-in">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="text-base font-medium text-[#18261F] hover:text-[#1B3B2B]"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-[#DCE4DF] flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full border border-[#DCE4DF] text-sm font-semibold text-[#18261F]"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-[linear-gradient(135deg,#D96B27_0%,#EAB308_100%)] text-sm font-bold text-[#152E21] shadow-sm"
              >
                Get Started Today
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenContactModal();
                }}
                className="w-full text-center py-2 rounded-full text-xs font-semibold text-[#52635A] hover:text-[#1B3B2B]"
              >
                Contact Support
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

