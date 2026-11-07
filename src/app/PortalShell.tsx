import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Banknote,
  Building2,
  ChevronLeft,
  ClipboardList,
  Flag,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Search,
  Sun,
  TrendingUp,
  Users,
  Wallet,
  MapPin,
  PackageSearch,
  X,
} from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { OnboardingDialog } from "@/app/OnboardingDialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { useDraft } from "@/store/draft";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const industryNav: NavItem[] = [
  { to: "/portal/overview", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/portal/requirements", label: "Requirements", icon: ClipboardList },
  { to: "/portal/pools", label: "Pools", icon: Layers },
  { to: "/portal/matches", label: "Farmer matches", icon: Users },
  { to: "/portal/payments", label: "Payments", icon: Wallet },
  { to: "/portal/forecast", label: "Forecast", icon: TrendingUp },
  { to: "/portal/profile", label: "Company profile", icon: Building2 },
];

const adminNav: NavItem[] = [
  { to: "/portal/overview", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/portal/admin/verification", label: "Industry verification", icon: BadgeCheck },
  { to: "/portal/admin/users", label: "Users", icon: Users },
  { to: "/portal/admin/listings", label: "Listings", icon: PackageSearch },
  { to: "/portal/admin/requirements", label: "Requirements", icon: ClipboardList },
  { to: "/portal/admin/collection-points", label: "Collection points", icon: MapPin },
  { to: "/portal/admin/moderation", label: "Moderation flags", icon: Flag },
  { to: "/portal/admin/payables", label: "Payables & payouts", icon: Banknote },
  { to: "/portal/admin/audit", label: "AI audit log", icon: ScrollText },
];

const crumbLabels: Record<string, string> = {
  portal: "Portal",
  overview: "Overview",
  requirements: "Requirements",
  new: "New requirement",
  pools: "Pools",
  matches: "Farmer matches",
  payments: "Payments",
  forecast: "Forecast",
  profile: "Company profile",
  admin: "Admin",
  verification: "Industry verification",
  users: "Users",
  listings: "Listings",
  "collection-points": "Collection points",
  moderation: "Moderation flags",
  payables: "Payables & payouts",
  audit: "AI audit log",
};

export function PortalShell() {
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const onboardingSeen = useSession((s) => s.onboardingSeen);
  const theme = useUi((s) => s.theme);
  const toggleTheme = useUi((s) => s.toggleTheme);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const clearDrafts = useDraft((s) => s.clearDrafts);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (profile?.role === "industry" && !onboardingSeen) setOnboardingOpen(true);
  }, [profile?.role, onboardingSeen]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => document.documentElement.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isAdmin = profile?.role === "admin";
  const nav = isAdmin ? adminNav : industryNav;
  const verification = profile?.role === "industry" ? authService.getIndustryVerification(profile.id) : undefined;
  const isVerified = verification?.status === "Verified";
  const showLabels = !collapsed;

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
    setProfile(null);
    clearDrafts();
    qc.clear();
    navigate("/login");
  };

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3" aria-label="Portal navigation">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          title={item.label}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
              isActive
                ? "bg-meadow text-forest dark:bg-portal-line dark:text-growth"
                : "text-muted hover:bg-canvas hover:text-ink dark:text-portal-muted dark:hover:bg-portal-bg dark:hover:text-portal-ink",
              !showLabels && "justify-center px-0"
            )
          }
        >
          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {showLabels && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className={cn("border-t border-line px-3 py-3 dark:border-portal-line", !showLabels && "px-1")}>
      {!isAdmin && (
        <div
          className={cn(
            "mb-3 rounded-lg px-2.5 py-2 text-[11px] leading-snug",
            isVerified
              ? "bg-meadow text-forest dark:bg-portal-line dark:text-growth"
              : "bg-settle/10 text-settle"
          )}
          title={isVerified ? "Industry verified" : "Verification pending"}
        >
          {showLabels ? (
            isVerified ? (
              <span className="flex items-center gap-1.5 font-semibold">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified industry
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold">
                <BadgeCheck className="h-3.5 w-3.5" /> Verification pending
              </span>
            )
          ) : (
            <BadgeCheck className={cn("mx-auto h-4 w-4", isVerified ? "text-forest" : "text-settle")} />
          )}
        </div>
      )}
      <button
        type="button"
        onClick={toggleSidebar}
        className={cn(
          "hidden min-h-[40px] w-full items-center gap-2 rounded-lg px-2 text-[12px] font-semibold text-muted hover:bg-canvas dark:text-portal-muted dark:hover:bg-portal-bg xl:flex",
          !showLabels && "justify-center px-0"
        )}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        {showLabels && "Collapse"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas dark:bg-portal-bg">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-all dark:border-portal-line dark:bg-portal-surface md:flex",
          collapsed ? "w-16" : "w-16 xl:w-60"
        )}
      >
        <div className={cn("flex min-h-[64px] items-center border-b border-line px-3 dark:border-portal-line", !showLabels && "justify-center px-0")}>
          <Link to="/portal/overview" aria-label="GreenRoots portal home">
            <Brand compact={!showLabels} />
          </Link>
        </div>
        {navList()}
        {sidebarFooter}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-ink/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-64 flex-col bg-surface dark:bg-portal-surface">
            <div className="flex min-h-[64px] items-center justify-between border-b border-line px-4 dark:border-portal-line">
              <Brand />
              <button type="button" aria-label="Close" onClick={() => setMobileOpen(false)} className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="[&_nav_a]:justify-start [&_nav_a]:px-3 [&_nav_a_span]:inline">
              {navList(() => setMobileOpen(false))}
            </div>
          </div>
        </div>
      )}

      <div className={cn("transition-all", collapsed ? "md:pl-16" : "md:pl-16 xl:pl-60")}>
        <header className="sticky top-0 z-30 flex min-h-[64px] items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur dark:border-portal-line dark:bg-portal-surface/95 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-canvas dark:hover:bg-portal-bg md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 overflow-hidden text-[13px]">
              {crumbs.map((c) => (
                <li key={c.to} className="flex min-w-0 items-center gap-1.5">
                  {c.last ? (
                    <span className="truncate font-semibold text-ink dark:text-portal-ink">{c.label}</span>
                  ) : (
                    <>
                      <Link to={c.to} className="truncate text-muted hover:text-forest dark:text-portal-muted">
                        {c.label}
                      </Link>
                      <span className="text-line dark:text-portal-line" aria-hidden>
                        /
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search portal"
                placeholder="Search requirements, pools, farmers…"
                className="h-10 w-64 rounded-lg border border-line bg-canvas pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-forest focus:outline-none dark:border-portal-line dark:bg-portal-bg dark:text-portal-ink"
              />
            </div>
          </div>

          <NotificationBell />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-canvas dark:text-portal-muted dark:hover:bg-portal-bg"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full pl-1 pr-2 hover:bg-canvas dark:hover:bg-portal-bg"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
                  {profile?.name?.slice(0, 1).toUpperCase() ?? "G"}
                </span>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[160px] truncate text-[13px] font-semibold text-ink dark:text-portal-ink">
                    {profile?.name}
                  </span>
                  <span className="block text-[11px] text-muted dark:text-portal-muted">
                    {isAdmin ? "GreenRoots Admin" : "Industry account"}
                  </span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="mb-2 border-b border-line pb-2 dark:border-portal-line">
                <p className="font-semibold">{profile?.name}</p>
                <p className="text-[12px] text-muted dark:text-portal-muted">{profile?.email}</p>
                {verification && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                    <BadgeCheck
                      className={cn("h-3.5 w-3.5", isVerified ? "text-forest" : "text-settle")}
                    />
                    {isVerified ? "Verified industry" : "Verification pending"}
                  </p>
                )}
              </div>
              <Link
                to={isAdmin ? "/portal/overview" : "/portal/profile"}
                className="block rounded-lg px-2 py-2 text-[13px] font-medium hover:bg-canvas dark:hover:bg-portal-bg"
              >
                {isAdmin ? "Admin overview" : "Company profile"}
              </Link>
              <button
                type="button"
                onClick={() => setOnboardingOpen(true)}
                className="block w-full rounded-lg px-2 py-2 text-left text-[13px] font-medium hover:bg-canvas dark:hover:bg-portal-bg"
              >
                Getting started
              </button>
              <button
                type="button"
                onClick={logout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-semibold text-error hover:bg-error/10"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </PopoverContent>
          </Popover>
        </header>

        <main className="mx-auto w-full max-w-[1400px] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <OnboardingDialog open={onboardingOpen} onOpenChange={setOnboardingOpen} />
      <div className="fixed bottom-3 left-1/2 z-20 hidden -translate-x-1/2 md:block">
        <Button variant="ghost" size="sm" onClick={() => setOnboardingOpen(true)} className="text-[11px] text-muted">
          Need a tour?
        </Button>
      </div>
    </div>
  );
}
