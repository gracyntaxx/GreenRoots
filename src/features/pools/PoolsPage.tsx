import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, ChevronRight, Layers, MapPin, Users } from "lucide-react";
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
import { DijkstraPoolMap } from "@/components/shared/DijkstraPoolMap";
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

      {/* Featured 4-Farmer Collaborative Aggregation Pool with Dijkstra Logistics Map at the Side */}
      <section className="mt-5 rounded-2xl border border-forest/25 bg-gradient-to-br from-emerald-50/60 via-white to-meadow/30 p-4 sm:p-5 shadow-sm dark:border-portal-line dark:from-[#0E2419] dark:via-portal-surface dark:to-[#0F2D1E]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-line/60 pb-3 dark:border-portal-line">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-white font-bold text-xs shadow-xs">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest dark:text-growth">
                Live Reverse-Auction Aggregation · 4 Farmers Pooled
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-moss dark:text-portal-ink">
                Verna Bio-Energy Stubble Pool (40,000 kg Target)
              </h2>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-forest/10 px-3 py-1 text-xs font-bold text-forest border border-forest/20 dark:bg-growth/10 dark:text-growth">
            100% Target Met · Ready for Weighbridge Drop-off
          </span>
        </div>

        {/* Side-by-Side: Left = Pool Listing Card & 4 Farmers Breakdown, Right = Dijkstra Logistics Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Pool Listing Details & The 4 Contributing Farmers */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="rounded-xl border border-line bg-white/90 p-4 shadow-xs dark:bg-portal-surface dark:border-portal-line">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Procuring Industry</span>
                  <h3 className="font-heading text-base font-bold text-ink dark:text-portal-ink">Verna Agro Pellets (Goa)</h3>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-terracotta" /> Verna Industrial Estate · Central Goa
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Fixed Rate</span>
                  <p className="num text-base font-bold text-forest dark:text-growth">₹1,200/tonne</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 pt-3 border-t border-line/60 dark:border-portal-line/60">
                <div className="flex justify-between text-xs mb-1.5 font-semibold">
                  <span className="text-muted">Target: 40,000 kg</span>
                  <span className="text-forest dark:text-growth font-bold">40,000 kg (100% Filled)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-line dark:bg-portal-line overflow-hidden">
                  <div className="h-full bg-forest rounded-full transition-all duration-500 w-full" />
                </div>
              </div>
            </div>

            {/* The 4 Contributing Farmers List */}
            <div className="rounded-xl border border-forest/15 bg-white/95 p-3.5 shadow-xs dark:bg-portal-surface dark:border-portal-line">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-growth flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 4 Contributing Farmers in this Pool
                </h4>
                <span className="text-[10px] text-muted font-mono font-semibold">Shortest Dijkstra Paths</span>
              </div>

              <div className="divide-y divide-line/60 dark:divide-portal-line text-xs">
                {/* Farmer 1 */}
                <div className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">1</span>
                    <div>
                      <p className="font-bold text-ink dark:text-portal-ink">Sunita Devi</p>
                      <p className="text-[10px] text-muted">Vasco da Gama · 14.8 km to hub</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="num font-bold text-ink dark:text-portal-ink">10,000 kg</p>
                    <span className="text-[10px] text-forest font-semibold">₹12,000</span>
                  </div>
                </div>

                {/* Farmer 2 */}
                <div className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">2</span>
                    <div>
                      <p className="font-bold text-ink dark:text-portal-ink">Ramesh Yadav</p>
                      <p className="text-[10px] text-muted">Margao · 9.4 km to hub</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="num font-bold text-ink dark:text-portal-ink">12,000 kg</p>
                    <span className="text-[10px] text-forest font-semibold">₹14,400</span>
                  </div>
                </div>

                {/* Farmer 3 */}
                <div className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">3</span>
                    <div>
                      <p className="font-bold text-ink dark:text-portal-ink">Fatima Begum</p>
                      <p className="text-[10px] text-muted">Panjim · 18.4 km to hub</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="num font-bold text-ink dark:text-portal-ink">8,000 kg</p>
                    <span className="text-[10px] text-forest font-semibold">₹9,600</span>
                  </div>
                </div>

                {/* Farmer 4 */}
                <div className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-[10px] font-bold">4</span>
                    <div>
                      <p className="font-bold text-ink dark:text-portal-ink">Rajesh Kumar</p>
                      <p className="text-[10px] text-muted">Mapusa · 30.4 km to hub</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="num font-bold text-ink dark:text-portal-ink">10,000 kg</p>
                    <span className="text-[10px] text-forest font-semibold">₹12,000</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-line/70 flex items-center justify-between">
                <Link
                  to="/app/pools/pool_cotton_sangrur"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-forest text-white text-xs font-bold hover:bg-forest/90 transition-colors shadow-xs"
                >
                  Open This Pool Detail Page <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Dijkstra Shortest Path Map at the side */}
          <div className="lg:col-span-7">
            <DijkstraPoolMap />
          </div>
        </div>
      </section>

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
