import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight, Layers, MapPin, Users } from "lucide-react";
import { useSession } from "@/store/session";
import { poolService, type PoolWithMeta } from "@/services/poolService";
import { PoolProgress } from "@/components/shared/PoolProgress";
import { RateText } from "@/components/shared/Numbers";
import { VerifiedMark } from "@/components/shared/Marks";
import { WasteImage } from "@/components/shared/WasteImage";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PageContainer } from "@/components/shared/PageContainer";
import { WASTE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

function PoolCard({ pool }: { pool: PoolWithMeta }) {
  const { t } = useTranslation();
  const matchScore = Math.max(82, Math.min(99, Math.round(100 - pool.distanceKm * 0.3)));

  return (
    <Link to={`/app/pools/${pool.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-panel border border-line/80 bg-white/95 backdrop-blur-md shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-forest/40 hover:shadow-pop dark:bg-portal-surface">
        {/* Real agricultural crop imagery header with soft botanical gradient mask */}
        <div className="relative h-36 w-full overflow-hidden bg-sage">
          <WasteImage
            wasteType={pool.wasteType}
            alt={WASTE_LABELS[pool.wasteType]}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#152E21] via-[#152E21]/40 to-transparent" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="rounded-full bg-[#152E21]/85 px-2.5 py-0.5 text-[11px] font-bold text-wheat backdrop-blur-md border border-wheat/30 shadow-xs">
              {matchScore}% AI Match
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs",
                pool.status === "Settled"
                  ? "bg-sage text-moss border border-moss/30"
                  : pool.status === "Ready for Pickup"
                  ? "bg-growth text-moss font-extrabold"
                  : "bg-terracotta text-white"
              )}
            >
              {pool.status === "Open" ? "Pool Filling" : pool.status}
            </span>
          </div>

          <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
            <h3 className="font-heading text-xl font-bold leading-tight drop-shadow-sm text-white">
              {WASTE_LABELS[pool.wasteType]}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/90">
              <span className="font-semibold">{pool.industryName}</span>
              {pool.industryVerified && <VerifiedMark label={t("common.verified")} />}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-2.5 text-xs text-muted dark:border-portal-line/60">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-terracotta" /> {pool.village} · {pool.distanceKm.toFixed(0)} km
            </span>
            <span className="flex items-center gap-1 font-semibold text-moss dark:text-growth">
              <CalendarClock className="h-3.5 w-3.5 text-terracotta" />
              {pool.daysLeft > 0 ? `${pool.daysLeft}d left` : t("home.overdue")}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Guaranteed Rate</span>
            <RateText rate={pool.ratePerUnit} unit={pool.rateUnit} className="num text-base font-bold text-moss dark:text-growth" />
          </div>

          <PoolProgress
            committedKg={pool.committedKg}
            targetKg={pool.targetKg}
            status={pool.status}
            className="mt-3 flex-1"
            showStages={true}
          />

          <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 dark:border-portal-line/70">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Users className="h-3.5 w-3.5 text-forest" /> {t("pools.farmersContributing", { count: pool.contributionCount })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-sage px-3 py-1 text-xs font-bold text-moss transition duration-200 group-hover:bg-terracotta group-hover:text-white dark:bg-portal-line dark:text-portal-ink">
              {t("common.view")} <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function PoolsPage() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile)!;
  const isFarmer = profile.role === "farmer";
  const [tab, setTab] = useState("open");

  const pools = useQuery({ queryKey: ["pools", profile.id], queryFn: () => poolService.list(profile) });
  const mine = useQuery({
    queryKey: ["my-pools", profile.id],
    queryFn: () => poolService.myPools(profile.id, profile),
    enabled: isFarmer,
  });

  const open = (pools.data ?? []).filter((p) => p.status === "Open");
  const settled = (pools.data ?? []).filter((p) => p.status === "Settled" || p.status === "Ready for Pickup");
  const minePools = (mine.data ?? []).filter((p) => p.status === "Open");

  return (
    <PageContainer>
      <div className="border-b border-line/80 pb-5 dark:border-portal-line">
        <span className="eyebrow mb-2">Circular Agri-Exchange</span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-moss dark:text-portal-ink">{t("pools.title")}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted dark:text-portal-muted">{t("pools.subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="w-full sm:w-84 bg-sage/60 p-1">
          <TabsTrigger value="open" className="flex-1 font-bold">
            Open Demand Pools ({open.length})
          </TabsTrigger>
          {isFarmer && (
            <TabsTrigger value="mine" className="flex-1 font-bold">
              My Commitments ({minePools.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="settled" className="flex-1 font-bold">
            Settled / Ready ({settled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pools.isLoading && [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
          {!pools.isLoading && open.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={<Layers className="h-7 w-7" />} title={t("pools.noPools")} body={t("pools.noPoolsBody")} />
            </div>
          )}
          {open.map((p) => (
            <PoolCard key={p.id} pool={p} />
          ))}
        </TabsContent>

        {isFarmer && (
          <TabsContent value="mine" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
            {!mine.isLoading && minePools.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={<Layers className="h-7 w-7" />}
                  title={t("home.noPools")}
                  body="Commit to a nearby pool and it will appear here."
                />
              </div>
            )}
            {minePools.map((p) => (
              <PoolCard key={p.id} pool={p} />
            ))}
          </TabsContent>
        )}

        <TabsContent value="settled" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pools.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
          {!pools.isLoading && settled.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={<Layers className="h-7 w-7" />} title="No settled pools yet" />
            </div>
          )}
          {settled.map((p) => (
            <div key={p.id} className={cn(p.status === "Settled" && "opacity-90")}>
              <PoolCard pool={p} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
