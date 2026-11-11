import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, Menu, X, ArrowRight, Sparkles } from "lucide-react";
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
          ? "bg-white/95 backdrop-blur-md shadow-[0_2px_12px_rgba(16,26,18,0.06)] border-b border-[#E7ECE8]"
          : "bg-white border-b border-[#E7ECE8]/60"
      }`}
      style={{ height: "72px" }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/welcome" className="flex items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E4D2F] text-white shadow-sm transition-transform group-hover:scale-105">
            <LogoMark className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <span className="font-heading text-xl font-bold tracking-tight text-[#101A12]">
              Green<span className="text-[#0E4D2F]">Roots</span>
            </span>
            <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.12em] text-[#5C6B60]">
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
              className="text-[15px] font-medium text-[#5C6B60] hover:text-[#0E4D2F] transition-colors"
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
            className="flex items-center gap-1.5 rounded-full border border-[#DCE5DE] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#101A12] hover:border-[#0E4D2F] hover:bg-[#F3F7F4] transition-all"
            title="Change Language"
          >
            <Globe className="h-3.5 w-3.5 text-[#0E4D2F]" />
            <span>{currentLangObj.native}</span>
          </button>

          {/* Log In Link */}
          <Link
            to="/login"
            className="rounded-full px-5 py-2 text-sm font-semibold text-[#101A12] hover:text-[#0E4D2F] transition-colors"
          >
            Log in
          </Link>

          {/* Contact (primary button as requested in JSON) */}
          <button
            type="button"
            onClick={onOpenContactModal}
            className="rounded-full bg-[#0E4D2F] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0A3A24] transition-all active:scale-[0.98]"
          >
            Contact
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={onOpenLangModal}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE5DE] text-[#0E4D2F]"
            aria-label="Language selector"
          >
            <Globe className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE5DE] text-[#101A12] hover:bg-[#F3F7F4]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[72px] z-50 border-b border-[#E7ECE8] bg-white px-6 py-6 shadow-xl lg:hidden animate-fade-in">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="text-base font-medium text-[#101A12] hover:text-[#0E4D2F]"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-[#E7ECE8] flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full border border-[#DCE5DE] text-sm font-semibold text-[#101A12]"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-[#0E4D2F] text-sm font-semibold text-white shadow-sm"
              >
                Get Started Today
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenContactModal();
                }}
                className="w-full text-center py-2 rounded-full text-xs font-semibold text-[#5C6B60] hover:text-[#0E4D2F]"
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

