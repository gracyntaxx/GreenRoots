import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, MapPin, PackageCheck, Truck } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { collectionService } from "@/services/collectionService";
import { MapView, type MapMarker } from "@/components/shared/MapView";
import { AiChip } from "@/components/shared/Marks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PageContainer } from "@/components/shared/PageContainer";
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
  const markers: MapMarker[] = rows.map((p) => ({
    id: p.id,
    location: p.location,
    label: p.name,
    detail: `${p.village} · ${p.hours}`,
    kind: "collection",
  }));

  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4 dark:border-portal-line">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">{t("collection.title")}</h1>
          <p className="mt-1 text-sm text-muted dark:text-portal-muted">{t("collection.subtitle")}</p>
        </div>
        {/* Mobile toggle only */}
        <div className="flex lg:hidden rounded-lg border border-line bg-surface p-0.5 dark:border-portal-line dark:bg-portal-surface">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-bold",
                view === v ? "bg-meadow text-forest dark:bg-portal-line dark:text-growth" : "text-muted dark:text-portal-muted"
              )}
            >
              {v === "list" ? t("collection.list") : t("collection.map")}
            </button>
          ))}
        </div>
      </div>

      {points.isLoading && <Skeleton className="mt-4 h-64 w-full rounded-xl" />}

      {!points.isLoading && rows.length === 0 && (
        <div className="mt-4">
          <EmptyState icon={<MapPin className="h-7 w-7" />} title={t("collection.noPoints")} />
        </div>
      )}

      {/* Main layout: side-by-side on lg desktop, list/map toggle on mobile */}
      <div className="mt-4 grid gap-6 lg:grid-cols-2 pb-6">
        {/* List Panel (Always visible on lg, toggled on mobile) */}
        <div className={cn("space-y-3", view === "map" ? "hidden lg:block" : "block")}>
          <h2 className="hidden lg:block text-base font-bold text-ink dark:text-portal-ink">
            Available Hubs ({rows.length})
          </h2>
          {rows.map((p) => {
            const selected = selectedId === p.id;
            const suggested = nearestActive?.id === p.id;
            return (
              <Card
                key={p.id}
                className={cn(
                  "p-4 transition-all hover:shadow-md",
                  selected && "border-forest/60 bg-meadow/20 dark:border-forest/40 dark:bg-[#0F2A1B]",
                  !p.active && "opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-base font-bold text-ink dark:text-portal-ink">{p.name}</p>
                      {selected && (
                        <span className="flex items-center gap-0.5 rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold text-white">
                          <CheckCircle2 className="h-3 w-3" /> {t("collection.selected")}
                        </span>
                      )}
                      {!p.active && (
                        <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold text-muted dark:bg-portal-bg dark:text-portal-muted">
                          {t("collection.inactive")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted dark:text-portal-muted">
                      <MapPin className="h-3.5 w-3.5 text-forest" /> {p.village} · {p.distanceKm.toFixed(0)} km away
                    </p>
                  </div>
                  {suggested && <AiChip kind="suggested">{t("collection.suggested")}</AiChip>}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-line bg-canvas p-2.5 text-xs dark:border-portal-line dark:bg-portal-bg">
                  <div>
                    <p className="flex items-center gap-1 font-semibold text-muted dark:text-portal-muted">
                      <Clock className="h-3.5 w-3.5" /> {t("collection.hours")}
                    </p>
                    <p className="mt-0.5 font-bold text-ink dark:text-portal-ink">{p.hours}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-semibold text-muted dark:text-portal-muted">
                      <Truck className="h-3.5 w-3.5" /> {t("collection.capacity")}
                    </p>
                    <p className="num mt-0.5 font-bold text-ink dark:text-portal-ink">{p.capacityTonnes} t</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-semibold text-muted dark:text-portal-muted">
                      <PackageCheck className="h-3.5 w-3.5" /> {t("collection.dropOffsToday")}
                    </p>
                    <p className="num mt-0.5 font-bold text-ink dark:text-portal-ink">{p.dropOffsToday}</p>
                  </div>
                </div>

                {suggested && <p className="mt-2 text-xs text-muted dark:text-portal-muted">{t("collection.suggestedReason")}</p>}

                <Button
                  variant={selected ? "secondary" : "outline"}
                  size="portal"
                  className="mt-3 w-full font-semibold"
                  disabled={!p.active}
                  onClick={() => {
                    setSelected(p.id);
                    pushToast({ title: t("collection.selected"), description: p.name, variant: "success" });
                  }}
                >
                  {selected ? t("collection.selected") : t("collection.chooseThisPoint")}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Map Panel (Always visible on lg, toggled on mobile) */}
        <div className={cn("sticky top-20 h-fit", view === "list" ? "hidden lg:block" : "block")}>
          <h2 className="hidden lg:block mb-3 text-base font-bold text-ink dark:text-portal-ink">Hubs Map</h2>
          <Card className="overflow-hidden p-0">
            <MapView center={profile.location} zoom={8} height={460} markers={markers} showLegend className="rounded-xl border-0" />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
