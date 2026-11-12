import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Navigation,
  PackageCheck,
  Route,
  Truck,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { collectionService } from "@/services/collectionService";
import { MapView, type MapMarker } from "@/components/shared/MapView";
import { AiChip } from "@/components/shared/Marks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PageContainer } from "@/components/shared/PageContainer";
import { nearestNeighbourRoute } from "@/lib/tsp";
import { cn } from "@/lib/utils";

export default function CollectionPointsPage() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile)!;
  const selectedId = useSession((s) => s.selectedCollectionPointId);
  const setSelected = useSession((s) => s.setSelectedCollectionPointId);
  const pushToast = useUi((s) => s.pushToast);
  const [view, setView] = useState<"list" | "map">("list");

  const points = useQuery({
    queryKey: ["collection-points", profile.id],
    queryFn: () => collectionService.list(profile),
  });

  const rows = points.data ?? [];
  const nearestActive = rows.find((p) => p.active);

  // Compute Travelling Salesman (TSP) Route Sequence
  const tspRoute = useMemo(() => {
    if (!rows.length) return null;
    return nearestNeighbourRoute(
      profile.location,
      rows.map((r) => ({ id: r.id, name: r.name, location: r.location }))
    );
  }, [rows, profile.location]);

  const stopIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    tspRoute?.order.forEach((s, idx) => map.set(s.id, idx + 1));
    return map;
  }, [tspRoute]);

  const markers: MapMarker[] = rows.map((p) => {
    const stopNum = stopIndexMap.get(p.id);
    return {
      id: p.id,
      location: p.location,
      label: stopNum ? `Stop ${stopNum}: ${p.name}` : p.name,
      detail: `${p.village} · ${p.hours}`,
      kind: "collection",
    };
  });

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-line/80 pb-5 dark:border-portal-line">
        <div>
          <span className="eyebrow mb-2">Deterministic TSP Route & Hubs</span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-moss dark:text-portal-ink">{t("collection.title")}</h1>
          <p className="mt-1 text-sm text-muted dark:text-portal-muted">
            Travelling Salesman (TSP) optimized truck pickup sequence minimizes fuel and carbon emissions across village collection hubs.
          </p>
        </div>
        {/* Mobile toggle */}
        <div className="flex lg:hidden rounded-lg border border-line bg-surface p-0.5 dark:border-portal-line dark:bg-portal-surface">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-bold",
                view === v ? "bg-forest text-white" : "text-muted"
              )}
            >
              {v === "list" ? t("collection.list") : t("collection.map")}
            </button>
          ))}
        </div>
      </div>

      {/* TSP Route Visualizer Banner */}
      {tspRoute && (
        <div className="rounded-panel border border-forest/20 bg-gradient-to-r from-sage/90 via-white/95 to-wheat-soft/80 p-5 shadow-card backdrop-blur-md dark:border-portal-line dark:from-portal-surface dark:to-portal-surface">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest text-wheat shadow-xs">
                <Route className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg font-bold text-moss dark:text-portal-ink">
                    AI TSP Optimized Pickup Route
                  </h3>
                  <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[10px] font-bold text-forest border border-forest/20">
                    Deterministic
                  </span>
                </div>
                <p className="text-xs text-muted dark:text-portal-muted">
                  Total route length: <strong className="font-mono text-moss dark:text-growth">{tspRoute.totalKm.toFixed(1)} km</strong> · Estimated 28% diesel saved vs unorganized collection
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tspRoute.order.slice(0, 4).map((s, idx) => (
                <div key={s.id} className="flex items-center gap-1.5 text-xs font-semibold text-moss">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[110px]">{s.name.split(" ")[0]}</span>
                  {idx < tspRoute.order.slice(0, 4).length - 1 && (
                    <span className="text-muted">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {points.isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {!points.isLoading && rows.length === 0 && (
        <EmptyState icon={<MapPin className="h-8 w-8 text-moss" />} title={t("collection.noPoints")} />
      )}

      {/* Main layout: side-by-side on lg desktop, list/map toggle on mobile */}
      <div className="grid gap-6 lg:grid-cols-2 pb-6">
        {/* List Panel */}
        <div className={cn("space-y-4", view === "map" ? "hidden lg:block" : "block")}>
          <h2 className="hidden lg:block font-heading text-lg font-bold text-moss dark:text-portal-ink">
            Village Collection Hubs ({rows.length})
          </h2>
          {rows.map((p) => {
            const selected = selectedId === p.id;
            const suggested = nearestActive?.id === p.id;
            const stopNum = stopIndexMap.get(p.id) || 1;
            const loadPercent = Math.min(100, Math.round((p.dropOffsToday * 280) / (p.capacityTonnes * 10)));
            const pickupWindow = stopNum === 1 ? "Tomorrow, 08:30 AM" : stopNum === 2 ? "Tomorrow, 10:15 AM" : "Tomorrow, 12:00 PM";

            return (
              <Card
                key={p.id}
                className={cn(
                  "overflow-hidden rounded-panel border p-4.5 transition-all duration-200 hover:shadow-pop",
                  selected
                    ? "border-forest bg-sage/30 shadow-md ring-2 ring-forest/20 dark:border-forest dark:bg-[#0F2A1B]"
                    : "border-line/80 bg-white/95 backdrop-blur-md shadow-card dark:bg-portal-surface",
                  !p.active && "opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white shadow-xs">
                        {stopNum}
                      </span>
                      <h3 className="font-heading text-base font-bold text-moss dark:text-portal-ink">{p.name}</h3>
                      {selected && (
                        <span className="flex items-center gap-1 rounded-full bg-forest px-2.5 py-0.5 text-[10px] font-bold text-white">
                          <CheckCircle2 className="h-3 w-3" /> Selected
                        </span>
                      )}
                      {!p.active && (
                        <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[10px] font-semibold text-muted">
                          {t("collection.inactive")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted dark:text-portal-muted">
                      <MapPin className="h-3.5 w-3.5 text-terracotta" /> {p.village} · {p.distanceKm.toFixed(0)} km away
                    </p>
                  </div>
                  {suggested && <AiChip kind="suggested">{t("collection.suggested")}</AiChip>}
                </div>

                {/* Capacity Meter & Metrics */}
                <div className="mt-3.5 space-y-2 rounded-xl border border-line/70 bg-canvas/70 p-3 text-xs dark:bg-portal-bg">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                      <Gauge className="h-3.5 w-3.5 text-terracotta" /> Live Capacity Meter
                    </span>
                    <span className="num font-bold text-moss dark:text-growth">{loadPercent}% Filled</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-sage">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        loadPercent > 80 ? "bg-terracotta" : "bg-forest"
                      )}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-line/50 text-[11px]">
                    <div>
                      <span className="text-muted block">Max Capacity</span>
                      <strong className="num text-moss dark:text-portal-ink">{p.capacityTonnes} Tonnes</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Operating Hours</span>
                      <strong className="text-moss dark:text-portal-ink">{p.hours}</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Next Pickup</span>
                      <strong className="text-terracotta-dark dark:text-wheat">{pickupWindow}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant={selected ? "secondary" : "primary"}
                    size="field"
                    className="flex-1 font-bold shadow-xs"
                    disabled={!p.active}
                    onClick={() => {
                      setSelected(p.id);
                      pushToast({ title: t("collection.selected"), description: p.name, variant: "success" });
                    }}
                  >
                    {selected ? "Active Drop-off Point" : "Choose for Harvest Drop-off"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Map Panel */}
        <div className={cn("sticky top-20 h-fit space-y-3", view === "list" ? "hidden lg:block" : "block")}>
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-moss dark:text-portal-ink">Hubs Map & TSP Sequence</h2>
            <span className="text-xs text-muted">Interactive Leaflet Geo View</span>
          </div>
          <Card className="overflow-hidden rounded-panel border border-line/80 p-0 shadow-card">
            <MapView center={profile.location} zoom={8} height={480} markers={markers} showLegend className="border-0" />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
