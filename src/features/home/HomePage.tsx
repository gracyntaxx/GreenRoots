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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";
import { WASTE_LABELS } from "@/types";
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
    <div className="space-y-4 px-4 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-muted">{t("home.greeting", { name: profile.name.split(" ")[0] })}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t("home.villageLine", { village: profile.village, state: profile.state })}
          </p>
        </div>
        <ReputationBadge score={profile.reputation} factors={profile.reputationFactors} />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="bg-forest px-4 pb-4 pt-3 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-meadow/80">{t("home.seasonEarnings")}</p>
          <p className="num mt-1 text-[30px] font-bold leading-none">{formatMoney(paid + pending)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
              <p className="text-meadow/80">{t("home.paid")}</p>
              <p className="num font-bold">{formatMoney(paid)}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
              <p className="text-meadow/80">{t("home.pendingPayout")}</p>
              <p className="num font-bold">{formatMoney(pending)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
            <Layers className="h-4 w-4 text-forest" aria-hidden="true" />
            Active pools: <strong className="num text-ink">{activePools.length}</strong>
          </span>
          <Link to="/app/orders" className="flex items-center gap-0.5 text-[12px] font-semibold text-forest">
            {t("common.orders")} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Card>

      <button
        type="button"
        onClick={openVoice}
        className="flex min-h-[64px] w-full items-center gap-3 rounded-xl border-[1.5px] border-forest/30 bg-meadow px-4 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-white">
          <Mic className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-forest">{t("home.voiceAction")}</span>
          <span className="block text-[12px] text-forest/80">Say what you have. Check the draft. Confirm.</span>
        </span>
        <ArrowRight className="h-5 w-5 text-forest" aria-hidden="true" />
      </button>

      <div className="rounded-xl border border-settle/40 bg-[#FFFBEB] p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-settle/15 text-[#92400E]">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#92400E]">{t("home.seasonalAlert")}</p>
            <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink">
              {seasonal?.title ?? SEASONAL_ALERT.title}
            </p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted">
              {seasonal?.body ?? SEASONAL_ALERT.body}
            </p>
            <Button variant="outline" size="sm" className="mt-2 border-settle/40 bg-white text-[#92400E]" onClick={() => setAlertOpen(true)}>
              {t("home.prepare")}
            </Button>
          </div>
        </div>
      </div>

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
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-bold text-ink">{WASTE_LABELS[pool.wasteType]}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <MapPin className="h-3 w-3" /> {pool.village} · {pool.distanceKm.toFixed(0)} km
                      </p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[11px] font-semibold text-muted">
                      <CalendarClock className="h-3 w-3" />
                      {pool.daysLeft > 0 ? t("home.deadline", { days: pool.daysLeft }) : t("home.overdue")}
                    </span>
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
                <Card className="flex items-center gap-3 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-meadow text-forest">
                    <Sprout className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-ink">{WASTE_LABELS[r.wasteType]}</p>
                    <p className="text-[11px] text-muted">
                      {r.industryName} · {r.distanceKm.toFixed(0)} km
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {t("home.remaining", { qty: kgToBestDisplay(r.remainingKg) })} ·{" "}
                      <span className="num">
                        {formatMoney(r.ratePerUnit)}/{r.rateUnit}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-forest">
                      {r.deadline
                        ? `${Math.max(0, Math.ceil((new Date(r.deadline).getTime() - Date.now()) / 86400000))} days`
                        : ""}
                    </p>
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 text-muted" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

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
    </div>
  );
}
