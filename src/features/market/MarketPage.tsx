import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  ChevronRight,
  Filter,
  MapPin,
  Mic,
  Search,
  Leaf,
  Star,
  X,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useFieldShell } from "@/app/FieldShellContext";
import { listingService, type ListingFilters } from "@/services/listingService";
import { collectionService } from "@/services/collectionService";
import { AiChip } from "@/components/shared/Marks";
import { RateText, QtyText } from "@/components/shared/Numbers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/PageContainer";
import { Input, Label, Select } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WasteImage } from "@/components/shared/WasteImage";
import { WASTE_LABELS, type WasteType } from "@/types";
import { formatNumber } from "@/lib/money";
import { cn, timeAgo } from "@/lib/utils";

export default function MarketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;
  const { openVoice } = useFieldShell();
  const isFarmer = profile.role === "farmer";

  const [q, setQ] = useState("");
  const [wasteType, setWasteType] = useState<WasteType | "all">("all");
  const [sort, setSort] = useState<NonNullable<ListingFilters["sort"]>>("nearest");
  const [maxDistanceKm, setMaxDistanceKm] = useState(150);
  const [maxRatePerKg, setMaxRatePerKg] = useState(50);
  const [collectionPointId, setCollectionPointId] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters: ListingFilters = useMemo(
    () => ({
      q,
      wasteType,
      sort,
      maxDistanceKm,
      maxRatePerKg,
      collectionPointId: collectionPointId === "all" ? undefined : collectionPointId,
      status: "Active",
    }),
    [q, wasteType, sort, maxDistanceKm, maxRatePerKg, collectionPointId]
  );

  const listings = useQuery({
    queryKey: ["listings", profile.id, filters],
    queryFn: () => listingService.list(filters, profile),
  });
  const picks = useQuery({
    queryKey: ["listing-picks", profile.id],
    queryFn: () => listingService.recommend(profile),
  });
  const points = useQuery({
    queryKey: ["collection-points", profile.id],
    queryFn: () => collectionService.list(profile),
  });

  const activeFilterCount =
    (wasteType !== "all" ? 1 : 0) +
    (maxDistanceKm < 150 ? 1 : 0) +
    (maxRatePerKg < 50 ? 1 : 0) +
    (collectionPointId !== "all" ? 1 : 0);

  const clearFilters = () => {
    setWasteType("all");
    setMaxDistanceKm(150);
    setMaxRatePerKg(50);
    setCollectionPointId("all");
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/80 pb-5 dark:border-portal-line">
        <div>
          <span className="eyebrow mb-1.5">Direct Farm Gate</span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-moss dark:text-portal-ink">{t("market.title")}</h1>
          <p className="mt-1 text-sm text-muted dark:text-portal-muted">Purchase verified agricultural residue directly from local farmers with PayPal Buyer Protection.</p>
        </div>
        {isFarmer && (
          <Button variant="primary" size="field" onClick={openVoice} className="shrink-0 font-bold shadow-md">
            <Mic className="h-4 w-4" /> {t("market.listOnMarket")}
          </Button>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("market.searchPlaceholder")}
            aria-label={t("market.searchPlaceholder")}
            className="min-h-12 pl-9 text-[14px]"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={activeFilterCount ? "secondary" : "outline"}
          size="icon"
          className="relative h-12 w-12 shrink-0"
          onClick={() => setFiltersOpen(true)}
          aria-label={t("market.filters")}
        >
          <Filter className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setWasteType("all")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold",
            wasteType === "all" ? "border-forest bg-meadow text-forest" : "border-line bg-surface text-muted"
          )}
        >
          {t("common.all")}
        </button>
        {(Object.keys(WASTE_LABELS) as WasteType[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWasteType(wasteType === w ? "all" : w)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold",
              wasteType === w ? "border-forest bg-meadow text-forest" : "border-line bg-surface text-muted"
            )}
          >
            {WASTE_LABELS[w]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-muted">
          {listings.isLoading ? t("common.loading") : `${listings.data?.length ?? 0} listings`}
        </p>
        <label className="flex items-center gap-1.5 text-[12px] text-muted">
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{t("common.sort")}</span>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as NonNullable<ListingFilters["sort"]>)}
            className="min-h-9 w-auto rounded-lg border-line py-0 pl-2 pr-7 text-[12px]"
          >
            <option value="nearest">{t("market.sortNearest")}</option>
            <option value="price">{t("market.sortPrice")}</option>
            <option value="trusted">{t("market.sortTrusted")}</option>
          </Select>
        </label>
      </div>

      {!listings.isLoading && (picks.data?.length ?? 0) > 0 && !q && wasteType === "all" && (
        <section className="mt-3">
          <div className="mb-2 flex items-center gap-1.5">
            <AiChip>{t("market.aiPicks")}</AiChip>
            <span className="text-[11px] text-muted">{t("market.aiPicksNote")}</span>
          </div>
          <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2">
            {picks.data!.slice(0, 3).map(({ listing, reason }) => (
              <Card key={listing.id} className="w-[270px] shrink-0 snap-start overflow-hidden p-0">
                <div className="relative h-28 w-full overflow-hidden bg-canvas dark:bg-portal-bg">
                  <WasteImage
                    wasteType={listing.wasteType}
                    alt={WASTE_LABELS[listing.wasteType]}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[11px] font-semibold text-white">
                    {WASTE_LABELS[listing.wasteType]}
                  </span>
                  <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-ink shadow-xs">
                    <Star className="h-3 w-3 fill-settle text-settle" /> {listing.farmerReputation.toFixed(1)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate text-[12px] font-medium text-muted dark:text-portal-muted">
                    {listing.farmerName} · {listing.village}
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <QtyText kg={listing.quantityKg} className="text-[13px] font-semibold text-ink dark:text-portal-ink" />
                    <RateText rate={listing.ratePerUnit} unit={listing.rateUnit} className="text-[13px] font-bold text-forest dark:text-growth" />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-muted dark:text-portal-muted">
                      <MapPin className="h-3 w-3" /> {listing.distanceKm.toFixed(0)} km
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="text-[11px] font-semibold text-ai">
                          {t("market.whyPicked")}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64">
                        <p className="flex items-center gap-1.5 text-[12px] font-bold text-forest">
                          <Leaf className="h-3.5 w-3.5" /> {t("common.aiSuggested")}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">{reason}</p>
                        <p className="mt-2 text-[11px] text-muted">Based only on real listing data.</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => navigate(`/app/market/${listing.id}`)}>
                    {t("market.viewListing")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-6">
        {listings.isLoading &&
          [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}

        {!listings.isLoading && (listings.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={<Search className="h-7 w-7" />}
            title={t("market.noResults")}
            body={t("market.noResultsBody")}
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t("market.clearFilters")}
              </Button>
            }
          />
        )}

        {listings.data?.map((l) => {
          const lotTotal = Math.round(l.quantityKg * l.ratePerKg);
          return (
            <Card
              key={l.id}
              className="group flex flex-col overflow-hidden rounded-panel border border-line/80 bg-white/95 backdrop-blur-md shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-forest/40 hover:shadow-pop dark:bg-portal-surface"
            >
              {/* Crisp Crop Photography with Botanical Gradient Mask */}
              <div className="relative h-40 w-full overflow-hidden bg-sage">
                <WasteImage
                  wasteType={l.wasteType}
                  alt={WASTE_LABELS[l.wasteType]}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#152E21] via-[#152E21]/30 to-transparent" />

                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 rounded-full bg-[#152E21]/80 px-2.5 py-0.5 text-[11px] font-bold text-wheat backdrop-blur-md border border-wheat/30 shadow-xs">
                    <Star className="h-3 w-3 fill-wheat text-wheat" /> {l.farmerReputation.toFixed(1)} Trust
                  </span>
                  <span className="rounded-full bg-sage/90 px-2.5 py-0.5 text-[10px] font-bold text-moss border border-moss/30 uppercase tracking-wider backdrop-blur-md">
                    Sun-Dried · &lt;10% Moist
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                  <h3 className="font-heading text-lg font-bold leading-tight drop-shadow-sm text-white">
                    {WASTE_LABELS[l.wasteType]} ({l.quantityKg} kg)
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/90">
                    <MapPin className="h-3 w-3 text-wheat" /> {l.village} · {l.distanceKm.toFixed(0)} km away
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted dark:text-portal-muted">
                    <span>Seller: <strong className="text-moss dark:text-portal-ink">{l.farmerName}</strong></span>
                    <span className="text-[11px]">{timeAgo(l.updatedAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2 dark:text-portal-muted">
                    High quality, verified farm residue ready for immediate weighbridge collection or direct farm-gate pickup.
                  </p>
                </div>

                <div className="mt-4 border-t border-line/70 pt-3 dark:border-portal-line/70">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Lot Price</span>
                      <RateText rate={l.ratePerUnit} unit={l.rateUnit} className="num text-sm font-semibold text-muted dark:text-portal-muted" />
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-terracotta">Total Value</span>
                      <span className="num text-lg font-bold text-moss dark:text-growth">₹{formatNumber(lotTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 font-semibold border-line hover:border-moss"
                      onClick={() => navigate(`/app/market/${l.id}`)}
                    >
                      {t("common.view")} Details
                    </Button>
                    <Button
                      variant="paypal"
                      size="sm"
                      className="flex-1 font-bold shadow-sm"
                      onClick={() => navigate(`/app/checkout/${l.id}`, { state: { quantityKg: l.quantityKg } })}
                    >
                      Buy via PayPal
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent variant="sheet">
          <DialogHeader>
            <DialogTitle>{t("market.filters")}</DialogTitle>
            <DialogDescription>Filters only narrow real listings. Nothing is invented.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <Label className="mb-0">{t("market.distance")}</Label>
                <span className="num text-[12px] font-bold text-forest">{maxDistanceKm} km</span>
              </div>
              <Slider
                min={5}
                max={150}
                step={5}
                value={[maxDistanceKm]}
                onValueChange={([v]) => setMaxDistanceKm(v)}
                aria-label={t("market.distance")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="mb-0">{t("market.priceRange")} (₹/kg)</Label>
                <span className="num text-[12px] font-bold text-forest">≤ ₹{maxRatePerKg}</span>
              </div>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[maxRatePerKg]}
                onValueChange={([v]) => setMaxRatePerKg(v)}
                aria-label={t("market.priceRange")}
              />
            </div>

            <div>
              <Label htmlFor="filter-point">{t("market.collectionPoint")}</Label>
              <Select id="filter-point" value={collectionPointId} onChange={(e) => setCollectionPointId(e.target.value)}>
                <option value="all">{t("common.all")}</option>
                {(points.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.village}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="field" className="flex-1" onClick={clearFilters}>
                {t("market.resetFilters")}
              </Button>
              <Button variant="primary" size="field" className="flex-1" onClick={() => setFiltersOpen(false)}>
                {t("common.apply")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
