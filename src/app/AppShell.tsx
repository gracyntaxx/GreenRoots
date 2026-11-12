import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Banknote,
  Building2,
  ChevronRight,
  ClipboardList,
  Flag,
  HelpCircle,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Mic,
  Moon,
  MoreHorizontal,
  PackageSearch,
  ReceiptText,
  ScrollText,
  Search,
  ShoppingBasket,
  Sun,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { OfflineBanner } from "@/components/shared/Connectivity";
import { OnboardingDialog } from "@/app/OnboardingDialog";
import { AppShellContext } from "@/app/FieldShellContext";
import { VoiceSheet } from "@/features/voice/VoiceSheet";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { useDraft } from "@/store/draft";
import { authService } from "@/services/authService";
import { ROLE_LABELS, type Role } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
}

const crumbLabels: Record<string, string> = {
  app: "App",
  portal: "Portal",
  home: "Home",
  market: "Marketplace",
  listings: "My Listings",
  pools: "Supply Pools",
  orders: "Orders",
  "collection-points": "Collection Points",
  me: "My Profile",
  checkout: "Checkout",
  overview: "Overview",
  requirements: "Requirements",
  new: "New Requirement",
  matches: "Farmer Matches",
  payments: "Payments & Settlements",
  forecast: "Demand Forecast",
  profile: "Company Profile",
  admin: "Admin",
  verification: "Industry Verification",
  users: "Users",
  moderation: "Moderation Flags",
  payables: "Payables & Payouts",
  audit: "AI Audit Log",
};

export function AppShell() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const logoutSession = useSession((s) => s.logout);
  const onboardingSeen = useSession((s) => s.onboardingSeen);
  const theme = useUi((s) => s.theme);
  const toggleTheme = useUi((s) => s.toggleTheme);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const clearDrafts = useDraft((s) => s.clearDrafts);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!onboardingSeen) setOnboardingOpen(true);
  }, [onboardingSeen]);

  useEffect(() => {
    setVoiceOpen(false);
    setMoreSheetOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => document.documentElement.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    const handleVoice = () => setVoiceOpen(true);
    window.addEventListener("greenroots-open-voice", handleVoice);
    return () => window.removeEventListener("greenroots-open-voice", handleVoice);
  }, []);

  const openVoice = useCallback(() => setVoiceOpen(true), []);
  const openOnboarding = useCallback(() => setOnboardingOpen(true), []);
  const api = useMemo(() => ({ openVoice, openOnboarding }), [openVoice, openOnboarding]);

  const role: Role = profile?.role ?? "farmer";
  const isFarmer = role === "farmer";
  const isBuyer = role === "buyer";
  const isIndustry = role === "industry";
  const isAdmin = role === "admin";

  const navItems: NavItem[] = useMemo(() => {
    if (isFarmer) {
      return [
        { to: "/app/home", label: t("common.home") || "Home", icon: Home, end: true },
        { to: "/app/market", label: t("common.market") || "Market", icon: ShoppingBasket },
        { to: "/app/listings", label: "My listings", icon: ClipboardList },
        { to: "/app/pools", label: t("common.pools") || "Pools", icon: Layers },
        { to: "/app/orders", label: t("common.orders") || "Orders", icon: ReceiptText },
        { to: "/app/collection-points", label: t("collection.title") || "Collection points", icon: MapPin },
        { to: "/app/me", label: t("common.me") || "Profile", icon: User },
      ];
    }
    if (isBuyer) {
      return [
        { to: "/app/market", label: t("common.market") || "Market", icon: ShoppingBasket, end: true },
        { to: "/app/orders", label: t("common.orders") || "Orders", icon: ReceiptText },
        { to: "/app/pools", label: t("common.pools") || "Pools", icon: Layers },
        { to: "/app/collection-points", label: t("collection.title") || "Collection points", icon: MapPin },
        { to: "/app/me", label: t("common.me") || "Profile", icon: User },
      ];
    }
    if (isIndustry) {
      return [
        { to: "/portal/overview", label: "Overview", icon: LayoutDashboard, end: true },
        { to: "/portal/requirements", label: "Requirements", icon: ClipboardList },
        { to: "/portal/pools", label: "Pools", icon: Layers },
        { to: "/portal/matches", label: "Farmer matches", icon: Users },
        { to: "/portal/payments", label: "Payments", icon: Wallet },
        { to: "/portal/forecast", label: "Forecast", icon: TrendingUp },
        { to: "/portal/profile", label: "Company profile", icon: Building2 },
      ];
    }
    // Admin
    return [
      { to: "/portal/overview", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/portal/admin/verification", label: "Industry verification", icon: BadgeCheck },
      { to: "/portal/admin/payables", label: "Payables & payouts", icon: Banknote },
      { to: "/portal/admin/moderation", label: "Moderation flags", icon: Flag },
      { to: "/portal/admin/users", label: "Users", icon: Users },
      { to: "/portal/admin/listings", label: "Listings", icon: PackageSearch },
      { to: "/portal/admin/requirements", label: "Requirements", icon: ClipboardList },
      { to: "/portal/admin/collection-points", label: "Collection points", icon: MapPin },
      { to: "/portal/admin/audit", label: "AI audit log", icon: ScrollText },
    ];
  }, [isFarmer, isBuyer, isIndustry, isAdmin, t]);

  // Phone bottom bar items: 4 primary items
  const primaryBottomNav: NavItem[] = useMemo(() => {
    if (isFarmer) {
      return [
        navItems[0], // Home
        navItems[1], // Market
        navItems[3], // Pools
        navItems[6], // Me
      ];
    }
    if (isBuyer) {
      return [
        navItems[0], // Market
        navItems[1], // Orders
        navItems[2], // Pools
        navItems[4], // Me
      ];
    }
    if (isIndustry) {
      return [
        navItems[0], // Overview
        navItems[1], // Requirements
        navItems[2], // Pools
        navItems[4], // Payments
      ];
    }
    // Admin
    return [
      navItems[0], // Overview
      navItems[1], // Verification
      navItems[2], // Payables
      navItems[3], // Moderation
    ];
  }, [isFarmer, isBuyer, isIndustry, navItems]);

  // Remaining items that live in the "More" tab on phone
  const secondaryBottomNav: NavItem[] = useMemo(() => {
    const primarySet = new Set(primaryBottomNav.map((i) => i.to));
    return navItems.filter((i) => !primarySet.has(i.to));
  }, [navItems, primaryBottomNav]);

  const crumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.map((p, i) => ({
      label: crumbLabels[p] ?? (p.length > 14 ? "Detail" : p),
      to: "/" + parts.slice(0, i + 1).join("/"),
      last: i === parts.length - 1,
    }));
  }, [location.pathname]);

  const logout = async () => {
    await authService.logout();
    logoutSession();
    setProfile(null);
    clearDrafts();
    qc.clear();
    navigate("/login");
  };

  const showLabels = !collapsed;

  return (
    <AppShellContext.Provider value={api}>
      <div className="flex min-h-screen bg-transparent text-ink transition-colors dark:bg-portal-bg dark:text-portal-ink">
        {/* DESKTOP & TABLET SIDEBAR (Hidden on phone < 640px) */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden sm:flex flex-col border-r border-line/80 bg-white/80 backdrop-blur-xl transition-all duration-200 dark:border-portal-line dark:bg-portal-surface/90",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Sidebar Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/80 px-3.5 dark:border-portal-line">
            {!collapsed ? (
              <div className="flex items-center justify-between w-full">
                <Brand compact />
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Collapse sidebar"
                  className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink dark:text-portal-muted dark:hover:bg-portal-bg dark:hover:text-portal-ink"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={toggleSidebar}
                title="Expand sidebar"
                className="mx-auto rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink dark:text-portal-muted dark:hover:bg-portal-bg dark:hover:text-portal-ink"
              >
                <Brand compact />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const link = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "relative flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition-all",
                      isActive
                        ? "bg-sage text-moss shadow-[inset_3px_0_0_#D96B27] dark:bg-portal-line dark:text-growth"
                        : "text-muted hover:bg-sage-light hover:text-moss dark:text-portal-muted dark:hover:bg-portal-bg dark:hover:text-portal-ink",
                      collapsed && "justify-center px-0"
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.to} delayDuration={100}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-semibold text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-line p-2 dark:border-portal-line">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-canvas dark:hover:bg-portal-bg transition-colors",
                    collapsed && "justify-center p-1"
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-[13px] font-bold text-white">
                    {profile?.avatarInitials ?? "GR"}
                  </span>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink dark:text-portal-ink">{profile?.name}</p>
                      <p className="truncate text-[11px] text-muted dark:text-portal-muted">{ROLE_LABELS[role]}</p>
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-64 p-2 text-xs">
                <div className="border-b border-line pb-2 mb-2 dark:border-portal-line">
                  <p className="font-bold text-ink dark:text-portal-ink">{profile?.name}</p>
                  <p className="text-muted dark:text-portal-muted">{profile?.village}, {profile?.state}</p>
                  <span className="inline-block mt-1 rounded bg-meadow px-1.5 py-0.5 text-[10px] font-semibold text-forest dark:bg-portal-line dark:text-growth">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={openOnboarding}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-canvas dark:hover:bg-portal-bg text-muted hover:text-ink dark:text-portal-muted dark:hover:text-portal-ink"
                  >
                    <HelpCircle className="h-4 w-4" /> How GreenRoots works
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-error hover:bg-error/10 font-medium"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </aside>

        {/* MAIN VIEWPORT CONTAINER */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-all duration-200",
            collapsed ? "sm:pl-16" : "sm:pl-64"
          )}
        >
          {/* HEADER */}
          <header className="sticky top-0 z-20 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-line/80 bg-white/75 px-4 sm:px-6 backdrop-blur-xl dark:border-portal-line dark:bg-portal-surface/90">
            {/* Left: Mobile Brand & Desktop Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="sm:hidden">
                <Brand compact />
              </div>

              {/* Desktop Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-muted dark:text-portal-muted truncate">
                {crumbs.map((c, i) => (
                  <span key={c.to} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="opacity-40">/</span>}
                    {c.last ? (
                      <span className="font-bold text-ink dark:text-portal-ink">{c.label}</span>
                    ) : (
                      <Link to={c.to} className="hover:text-forest dark:hover:text-growth transition-colors">
                        {c.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Farmer Top "Speak" Button on Desktop / Tablet */}
              {isFarmer && (
                <Button
                  variant="secondary"
                  size="portal"
                  onClick={openVoice}
                  className="hidden sm:inline-flex items-center gap-1.5 font-bold text-forest border border-forest/25 shadow-sm"
                >
                  <Mic className="h-4 w-4" /> Speak
                </Button>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* Language Switcher */}
              <LanguageSwitcher compact />

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle color theme"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:bg-canvas hover:text-ink dark:border-portal-line dark:bg-portal-surface dark:text-portal-muted dark:hover:bg-portal-bg dark:hover:text-portal-ink"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-settle" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* User avatar on phone */}
              <button
                type="button"
                onClick={() => setMoreSheetOpen(true)}
                className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-bold text-white ml-1"
                aria-label="User menu"
              >
                {profile?.avatarInitials ?? "GR"}
              </button>
            </div>
          </header>

          {/* Offline alert strip if network is lost */}
          <OfflineBanner />

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 pb-24 sm:pb-8 min-h-[calc(100dvh-3.5rem)]">
            <Outlet />
          </main>

          {/* FARMER FLOATING VOICE BUTTON (Phone only, floating above bottom tab bar) */}
          {isFarmer && (
            <button
              type="button"
              onClick={openVoice}
              aria-label={t("home.voiceAction") || "Voice Assistant"}
              className="fixed bottom-20 right-4 z-40 sm:hidden flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#D96B27_0%,#EAB308_100%)] text-moss-deep shadow-[0_10px_26px_rgba(217,107,39,0.38)] ring-4 ring-oat active:scale-95 transition-transform"
            >
              <Mic className="h-7 w-7" aria-hidden="true" />
            </button>
          )}

          {/* FIXED BOTTOM TAB BAR (Phone only < 640px) */}
          <nav
            aria-label="Mobile navigation"
            className="fixed bottom-0 left-0 right-0 z-40 sm:hidden flex border-t border-line/80 bg-white/85 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-1 backdrop-blur-xl dark:border-portal-line dark:bg-portal-surface/90"
          >
            {primaryBottomNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold transition-colors",
                      isActive
                        ? "text-forest dark:text-growth font-bold"
                        : "text-muted dark:text-portal-muted"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("h-5 w-5", isActive && "stroke-[2.4]")} aria-hidden="true" />
                      <span className="truncate max-w-[64px]">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* "More" Tab to trigger bottom sheet */}
            <button
              type="button"
              onClick={() => setMoreSheetOpen(true)}
              className={cn(
                "flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold text-muted dark:text-portal-muted",
                moreSheetOpen && "text-forest dark:text-growth"
              )}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              <span>More</span>
            </button>
          </nav>
        </div>
      </div>

      {/* MOBILE "MORE" BOTTOM SHEET */}
      <Dialog open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <DialogContent variant="sheet">
          <DialogHeader>
            <DialogTitle>Menu &amp; More</DialogTitle>
          </DialogHeader>

          {/* User profile banner in More sheet */}
          <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 dark:border-portal-line dark:bg-portal-bg">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-base font-bold text-white">
              {profile?.avatarInitials ?? "GR"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink dark:text-portal-ink">{profile?.name}</p>
              <p className="truncate text-xs text-muted dark:text-portal-muted">{profile?.village}, {profile?.state}</p>
              <span className="mt-1 inline-block rounded bg-meadow px-1.5 py-0.5 text-[10px] font-bold text-forest dark:bg-portal-line dark:text-growth">
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>

          {/* Secondary nav items for this role */}
          {secondaryBottomNav.length > 0 && (
            <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface dark:divide-portal-line dark:border-portal-line dark:bg-portal-surface">
              {secondaryBottomNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreSheetOpen(false)}
                    className="flex min-h-[52px] items-center gap-3 px-4 text-sm font-semibold text-ink hover:bg-canvas dark:text-portal-ink dark:hover:bg-portal-bg transition-colors"
                  >
                    <Icon className="h-5 w-5 text-forest dark:text-growth shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Quick preferences */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 dark:border-portal-line dark:bg-portal-surface">
              <span className="text-sm font-semibold text-ink dark:text-portal-ink">Color theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted dark:border-portal-line dark:text-portal-muted"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-settle" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMoreSheetOpen(false);
                openOnboarding();
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left text-sm font-semibold text-ink dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
            >
              <HelpCircle className="h-5 w-5 text-muted" /> How GreenRoots works
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-sm font-bold text-error active:bg-error/20"
            >
              <LogOut className="h-5 w-5" /> Sign out
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FARMER VOICE SHEET */}
      {isFarmer && <VoiceSheet open={voiceOpen} onOpenChange={setVoiceOpen} />}

      {/* ROLE ONBOARDING DIALOG */}
      <OnboardingDialog open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </AppShellContext.Provider>
  );
}

