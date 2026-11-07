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
    <div className="px-4 pt-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink">{t("collection.title")}</h1>
          <p className="mt-0.5 text-[12px] text-muted">{t("collection.subtitle")}</p>
        </div>
        <div className="flex rounded-lg border border-line bg-surface p-0.5">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold",
                view === v ? "bg-meadow text-forest" : "text-muted"
              )}
            >
              {v === "list" ? t("collection.list") : t("collection.map")}
            </button>
          ))}
        </div>
      </div>

      {points.isLoading && <Skeleton className="mt-3 h-48 w-full" />}

      {!points.isLoading && rows.length === 0 && (
        <div className="mt-3">
          <EmptyState icon={<MapPin className="h-7 w-7" />} title={t("collection.noPoints")} />
        </div>
      )}

      {view === "map" && rows.length > 0 && (
        <div className="mt-3">
          <MapView center={profile.location} zoom={8} height={360} markers={markers} showLegend />
        </div>
      )}

      {view === "list" && (
        <div className="mt-3 space-y-2.5 pb-4">
          {rows.map((p) => {
            const selected = selectedId === p.id;
            const suggested = nearestActive?.id === p.id;
            return (
              <Card
                key={p.id}
                className={cn(
                  "p-3.5",
                  selected && "border-forest/50 bg-meadow/30",
                  !p.active && "opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[15px] font-bold text-ink">{p.name}</p>
                      {selected && (
                        <span className="flex items-center gap-0.5 rounded-full bg-forest px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <CheckCircle2 className="h-2.5 w-2.5" /> {t("collection.selected")}
                        </span>
                      )}
                      {!p.active && (
                        <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold text-muted">
                          {t("collection.inactive")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {p.village} · {p.distanceKm.toFixed(0)} km
                    </p>
                  </div>
                  {suggested && <AiChip kind="suggested">{t("collection.suggested")}</AiChip>}
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg bg-canvas p-2 text-[11px]">
                  <div>
                    <p className="flex items-center gap-1 font-semibold text-muted">
                      <Clock className="h-3 w-3" /> {t("collection.hours")}
                    </p>
                    <p className="mt-0.5 font-medium text-ink">{p.hours}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-semibold text-muted">
                      <Truck className="h-3 w-3" /> {t("collection.capacity")}
                    </p>
                    <p className="num mt-0.5 font-medium text-ink">{p.capacityTonnes} t</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-semibold text-muted">
                      <PackageCheck className="h-3 w-3" /> {t("collection.dropOffsToday")}
                    </p>
                    <p className="num mt-0.5 font-medium text-ink">{p.dropOffsToday}</p>
                  </div>
                </div>

                {suggested && <p className="mt-1.5 text-[11px] text-muted">{t("collection.suggestedReason")}</p>}

                <Button
                  variant={selected ? "secondary" : "outline"}
                  size="sm"
                  className="mt-2.5 w-full"
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
      )}
    </div>
  );
}
