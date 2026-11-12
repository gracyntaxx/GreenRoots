import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Layers,
  Leaf,
  MapPin,
  Mic,
  ReceiptText,
  ShoppingBasket,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useFieldShell } from "@/app/FieldShellContext";
import { orderService } from "@/services/orderService";
import { payoutService } from "@/services/payoutService";
import { poolService } from "@/services/poolService";
import { requirementService } from "@/services/requirementService";
import { notificationService } from "@/services/notificationService";
import { SEASONAL_ALERT } from "@/mocks/seed";
import { ReputationBadge } from "@/components/shared/ReputationBadge";
import { PoolProgress } from "@/components/shared/PoolProgress";
import { PageContainer } from "@/components/shared/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";
import { WASTE_LABELS } from "@/types";
import { WasteImage } from "@/components/shared/WasteImage";
import { useState } from "react";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;
  const { openVoice } = useFieldShell();
  const [alertOpen, setAlertOpen] = useState(false);

  const payables = useQuery({ queryKey: ["payouts", profile.id], queryFn: () => payoutService.list() });
  const orders = useQuery({ queryKey: ["orders", profile.id], queryFn: () => orderService.list(profile) });
  const pools = useQuery({ queryKey: ["my-pools", profile.id], queryFn: () => poolService.myPools(profile.id, profile) });
  const requirements = useQuery({
    queryKey: ["requirements", profile.id],
    queryFn: () => requirementService.list(profile),
  });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => notificationService.list() });

  const myPayables = (payables.data ?? []).filter((p) => p.farmerId === profile.id);
  const paid = myPayables
    .filter((p) => p.payout === "Completed" || p.payout === "Simulated")
    .reduce((s, p) => s + p.net, 0);
  const pending = myPayables
    .filter((p) => p.payout === "Pending" || p.payout === "Processing")
    .reduce((s, p) => s + p.net, 0);
  const activePools = (pools.data ?? []).filter((p) => p.status === "Open").slice(0, 2);
  const nearbyDemand = (requirements.data ?? [])
    .filter((r) => r.status === "Open" && r.distanceKm <= 80)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 2);
  const seasonal = (notifications.data ?? []).find((n) => n.group === "Seasonal");
  const isLoading = payables.isLoading || pools.isLoading || requirements.isLoading;

  return (
    <PageContainer className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-line/80 pb-5 dark:border-portal-line sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow mb-2">Farm workspace</span>
          <h1 className="font-heading text-[32px] font-bold leading-[1.05] text-moss dark:text-portal-ink sm:text-[38px]">{t("home.greeting", { name: (profile?.name || "Farmer").split(" ")[0] })}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted dark:text-portal-muted">
            <MapPin className="h-4 w-4 text-terracotta" aria-hidden="true" />
            {t("home.villageLine", { village: profile?.village || "Rewari", state: profile?.state || "Haryana" })}
          </p>
        </div>
        <ReputationBadge score={profile?.reputation ?? 4.5} factors={profile?.reputationFactors ?? []} showScore />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { to: "/app/market", label: t("common.market"), detail: "Direct farm lots", icon: ShoppingBasket },
          { to: "/app/pools", label: t("common.pools"), detail: "Village demand", icon: Layers },
          { to: "/app/orders", label: t("common.orders"), detail: "Payout ledger", icon: ReceiptText },
          { to: "/app/collection-points", label: t("collection.title"), detail: "Pickup route", icon: MapPin },
        ].map(({ to, label, detail, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group glass-panel flex items-center gap-2.5 rounded-panel p-3 transition hover:-translate-y-0.5 hover:border-terracotta/30 hover:shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage text-moss transition group-hover:bg-wheat-soft group-hover:text-terracotta-dark">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-moss dark:text-portal-ink">{label}</span>
              <span className="block truncate text-[10px] text-muted">{detail}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-moss/20 p-0">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#1B3B2B_0%,#2E6F40_100%)] px-4 pb-4 pt-3.5 text-white">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-wheat/20 blur-2xl" aria-hidden="true" />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FDE68A]">{t("home.seasonEarnings")}</p>
            <p className="num mt-1 text-[30px] font-bold leading-none sm:text-[34px]">{formatMoney(paid + pending)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 backdrop-blur">
                <p className="text-white/65">{t("home.paid")}</p>
                <p className="num font-bold">{formatMoney(paid)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 backdrop-blur">
                <p className="text-white/65">{t("home.pendingPayout")}</p>
                <p className="num font-bold">{formatMoney(pending)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted dark:text-portal-muted">
              <Layers className="h-4 w-4 text-forest" aria-hidden="true" />
              Active pools: <strong className="num text-ink dark:text-portal-ink">{activePools.length}</strong>
            </span>
            <Link to="/app/orders" className="flex items-center gap-0.5 text-xs font-bold text-forest hover:underline">
              {t("common.orders")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        <div className="rounded-xl border border-settle/40 bg-[#FFFBEB] p-4 dark:border-settle/30 dark:bg-[#2A2110]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-settle/20 text-[#92400E] dark:bg-settle/30">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#92400E]">{t("home.seasonalAlert")}</p>
              <p className="mt-1 text-sm font-bold leading-snug text-ink dark:text-portal-ink">
                {seasonal?.title ?? SEASONAL_ALERT.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted dark:text-portal-muted">
                {seasonal?.body ?? SEASONAL_ALERT.body}
              </p>
              <Button variant="outline" size="sm" className="mt-2.5 border-settle/40 bg-white text-[#92400E] dark:bg-portal-surface" onClick={() => setAlertOpen(true)}>
                {t("home.prepare")}
              </Button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openVoice}
          className="group flex min-h-[72px] items-center gap-3 rounded-organic border border-terracotta/20 bg-[linear-gradient(135deg,#FEF6E4_0%,#F4E6D5_100%)] px-4 py-3 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-glass sm:col-span-2 lg:col-span-1"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#D96B27_0%,#EAB308_100%)] text-moss-deep shadow-md">
            <Mic className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-moss">{t("home.voiceAction")}</span>
            <span className="block text-xs text-muted">Say what you have. Check draft. Confirm and list.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-terracotta" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">{t("home.activePools")}</h2>
          <Link to="/app/pools" className="text-[12px] font-semibold text-forest">
            {t("common.viewAll")}
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : activePools.length === 0 ? (
          <Card className="p-4 text-center">
            <Leaf className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-ink">{t("home.noPools")}</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => navigate("/app/pools")}>
              {t("home.noPoolsAction")}
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {activePools.map((pool) => (
              <Link key={pool.id} to={`/app/pools/${pool.id}`} className="block">
                <Card className="p-3.5 transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-start gap-3">
                    <WasteImage
                      wasteType={pool.wasteType}
                      alt={WASTE_LABELS[pool.wasteType]}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover border border-line dark:border-portal-line"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-bold text-ink dark:text-portal-ink">{WASTE_LABELS[pool.wasteType]}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted dark:text-portal-muted">
                            <MapPin className="h-3 w-3" /> {pool.village} · {pool.distanceKm.toFixed(0)} km
                          </p>
                        </div>
                        <span className="flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[11px] font-semibold text-muted dark:bg-portal-bg dark:text-portal-muted">
                          <CalendarClock className="h-3 w-3" />
                          {pool.daysLeft > 0 ? t("home.deadline", { days: pool.daysLeft }) : t("home.overdue")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <PoolProgress committedKg={pool.committedKg} targetKg={pool.targetKg} status={pool.status} showStages={false} />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="pb-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">{t("home.demandNearYou")}</h2>
          <Link to="/app/pools" className="text-[12px] font-semibold text-forest">
            {t("common.viewAll")}
          </Link>
        </div>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : nearbyDemand.length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted">{t("home.noDemand")}</Card>
        ) : (
          <div className="space-y-2">
            {nearbyDemand.map((r) => (
              <Link key={r.id} to={`/app/pools`} className="block">
                <Card className="flex items-center gap-3 p-3.5 transition-shadow hover:shadow-md">
                  <WasteImage
                    wasteType={r.wasteType}
                    alt={WASTE_LABELS[r.wasteType]}
                    className="h-11 w-11 shrink-0 rounded-lg object-cover border border-line dark:border-portal-line"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-ink dark:text-portal-ink">{WASTE_LABELS[r.wasteType]}</p>
                    <p className="text-[11px] text-muted dark:text-portal-muted">
                      {r.industryName} · {r.distanceKm.toFixed(0)} km
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted dark:text-portal-muted">
                      {t("home.remaining", { qty: kgToBestDisplay(r.remainingKg) })} ·{" "}
                      <span className="num">
                        {formatMoney(r.ratePerUnit)}/{r.rateUnit}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-forest dark:text-growth">
                      {r.deadline
                        ? `${Math.max(0, Math.ceil((new Date(r.deadline).getTime() - Date.now()) / 86400000))} days`
                        : ""}
                    </p>
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 text-muted dark:text-portal-muted" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      </div>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent variant="center">
          <DialogHeader>
            <DialogTitle>{t("home.prepareTitle")}</DialogTitle>
            <DialogDescription>{seasonal?.body ?? SEASONAL_ALERT.body}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {SEASONAL_ALERT.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-ink">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-meadow text-[10px] font-bold text-forest">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Button variant="primary" size="field" className="mt-4 w-full" onClick={() => setAlertOpen(false)}>
            {t("common.done")}
          </Button>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
