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
  return (
    <Link to={`/app/pools/${pool.id}`} className="block">
      <Card className="p-3.5 transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3">
          <WasteImage
            wasteType={pool.wasteType}
            alt={WASTE_LABELS[pool.wasteType]}
            className="h-14 w-14 shrink-0 rounded-xl object-cover border border-line dark:border-portal-line"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[15px] font-bold text-ink dark:text-portal-ink">{WASTE_LABELS[pool.wasteType]}</p>
                  {pool.industryVerified && <VerifiedMark label={t("common.verified")} />}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted dark:text-portal-muted">{pool.industryName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted dark:text-portal-muted">
                  <MapPin className="h-3 w-3" /> {pool.village} · {pool.distanceKm.toFixed(0)} km
                  {pool.expanded && pool.expandedToKm ? ` · reaches ${pool.expandedToKm} km` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <RateText rate={pool.ratePerUnit} unit={pool.rateUnit} className="text-[13px] font-bold text-forest dark:text-growth" />
                <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted dark:text-portal-muted">
                  <CalendarClock className="h-3 w-3" />
                  {pool.daysLeft > 0 ? `${pool.daysLeft}d` : t("home.overdue")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <PoolProgress
          committedKg={pool.committedKg}
          targetKg={pool.targetKg}
          status={pool.status}
          className="mt-2.5"
          showStages={false}
        />
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 dark:border-portal-line">
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted dark:text-portal-muted">
            <Users className="h-3.5 w-3.5" /> {t("pools.farmersContributing", { count: pool.contributionCount })}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-forest dark:text-growth">
            {t("common.view")} <ChevronRight className="h-3.5 w-3.5" />
          </span>
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
      <div className="border-b border-line pb-4 dark:border-portal-line">
        <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">{t("pools.title")}</h1>
        <p className="mt-1 text-sm text-muted dark:text-portal-muted">{t("pools.subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="w-full sm:w-80">
          <TabsTrigger value="open" className="flex-1">
            Open
          </TabsTrigger>
          {isFarmer && (
            <TabsTrigger value="mine" className="flex-1">
              Mine
            </TabsTrigger>
          )}
          <TabsTrigger value="settled" className="flex-1">
            Settled
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
