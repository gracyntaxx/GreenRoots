import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Mic,
  PackageCheck,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useFieldShell } from "@/app/FieldShellContext";
import { listingService } from "@/services/listingService";
import { collectionService } from "@/services/collectionService";
import { ReputationBadge } from "@/components/shared/ReputationBadge";
import { RateText, QtyText, ConversionLine } from "@/components/shared/Numbers";
import { MapView } from "@/components/shared/MapView";
import { AiChip } from "@/components/shared/Marks";
import { WasteImage } from "@/components/shared/WasteImage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/PageContainer";
import { Input, Label } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { useConnectivity } from "@/lib/connectivity";
import { WASTE_LABELS } from "@/types";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default function ListingDetailPage() {
  const { t } = useTranslation();
  const { listingId } = useParams();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;
  const { openVoice } = useFieldShell();
  const online = useConnectivity();
  const [qty, setQty] = useState<number>(0);

  const listing = useQuery({
    queryKey: ["listing", listingId, profile.id],
    queryFn: () => listingService.get(listingId!, profile),
    enabled: !!listingId,
  });
  const points = useQuery({
    queryKey: ["collection-points", profile.id],
    queryFn: () => collectionService.list(profile),
  });

  useEffect(() => {
    if (listing.data) setQty(listing.data.quantityKg);
  }, [listing.data]);

  if (listing.isLoading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (listing.isError || !listing.data) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          title={t("checkout.noListing")}
          body="The listing may have been sold or removed."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/app/market")}>
              {t("common.back")}
            </Button>
          }
        />
      </div>
    );
  }

  const l = listing.data;
  const point = (points.data ?? []).find((p) => p.id === l.collectionPointId);
  const isOwn = l.farmerId === profile.id;
  const isBuyer = profile.role === "buyer";
  const total = Math.round(qty * l.ratePerKg);
  const active = l.status === "Active";
  const canBuy = isBuyer && active && !isOwn && qty > 0 && qty <= l.quantityKg && online;

  return (
    <PageContainer className="pb-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest dark:text-portal-muted dark:hover:text-growth"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Details & Hub */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="overflow-hidden p-0">
            <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-canvas dark:bg-portal-bg">
              <WasteImage
                wasteType={l.wasteType}
                alt={WASTE_LABELS[l.wasteType]}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <span className="rounded-full bg-forest/90 backdrop-blur-xs px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                  {WASTE_LABELS[l.wasteType]}
                </span>
                <span className="rounded-full bg-black/50 backdrop-blur-xs px-2.5 py-1 text-xs font-medium text-white/90">
                  Residue Photography
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">{WASTE_LABELS[l.wasteType]}</h1>
                    {l.source === "voice" && (
                      <span className="flex items-center gap-1 rounded-full bg-aitint px-2 py-0.5 text-xs font-semibold text-ai">
                        <Mic className="h-3 w-3" /> voice listing
                      </span>
                    )}
                    {!active && (
                      <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-semibold text-muted dark:bg-portal-bg dark:text-portal-muted">{l.status}</span>
                    )}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted dark:text-portal-muted">
                    <MapPin className="h-4 w-4 text-forest" /> {l.village} · {l.distanceKm.toFixed(0)} km away
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-portal-muted">{t("common.rate")}</p>
                  <RateText rate={l.ratePerUnit} unit={l.rateUnit} className="text-xl sm:text-2xl font-bold text-forest dark:text-growth" />
                  <p className="num text-xs text-muted dark:text-portal-muted">{formatMoney(l.ratePerKg)} / kg</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-canvas p-3 dark:border-portal-line dark:bg-portal-bg">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">{t("common.quantity")}</p>
                  <QtyText kg={l.quantityKg} className="text-base sm:text-lg font-bold text-ink dark:text-portal-ink" />
                </div>
                <div className="rounded-xl border border-line bg-canvas p-3 dark:border-portal-line dark:bg-portal-bg">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">{t("voice.availableFrom")}</p>
                  <p className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-ink dark:text-portal-ink">
                    <CalendarDays className="h-4 w-4 text-forest" /> {formatDate(l.createdAt)}
                  </p>
                </div>
              </div>

              {l.aiConfidence != null && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-aitint/40 p-3 border border-ai/20">
                  <AiChip>{t("common.aiSuggested")}</AiChip>
                  <span className="text-xs text-muted dark:text-portal-muted">
                    AI parsed the farmer&apos;s speech; farmer reviewed and confirmed every field.
                  </span>
                </div>
              )}
            </div>
          </Card>

          {point && (
            <Card className="overflow-hidden p-0">
              <div className="p-4 sm:p-5 pb-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">{t("checkout.pickupPoint")}</p>
                <p className="mt-1 text-base sm:text-lg font-bold text-ink dark:text-portal-ink">{point.name}</p>
                <p className="text-sm text-muted dark:text-portal-muted">
                  {point.village} · {point.hours}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-forest dark:text-growth">
                  <PackageCheck className="h-4 w-4" /> {point.distanceKm.toFixed(0)} km from you
                </p>
              </div>
              <MapView
                center={point.location}
                zoom={12}
                height={220}
                className="rounded-none border-x-0 border-b-0"
                markers={[
                  { id: point.id, location: point.location, label: point.name, detail: point.village, kind: "collection" },
                ]}
              />
            </Card>
          )}
        </div>

        {/* Right Column: Seller & Buy Action */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">{t("common.farmer")}</p>
                <p className="text-base font-bold text-ink dark:text-portal-ink">{l.farmerName}</p>
                <p className="text-xs text-muted dark:text-portal-muted">{l.farmerVillage}</p>
              </div>
              <ReputationBadge
                score={l.farmerReputation}
                factors={[
                  { key: "deliveries", label: "Completed deliveries", value: "on record", weight: 30 },
                  { key: "ontime", label: "On-time rate", value: "good", weight: 25 },
                ]}
                showScore
              />
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-meadow/60 p-3 text-xs text-forest dark:bg-[#123524] dark:text-growth">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Quantity and rate are confirmed by the farmer. Payout uses verified accepted weight at collection weighbridge.
              </span>
            </div>
          </Card>

          {isOwn ? (
            <Card className="p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-forest dark:text-growth" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-ink dark:text-portal-ink">This is your listing.</p>
              <p className="mt-1 text-xs text-muted dark:text-portal-muted">Manage quantity, pause or remove it from My listings.</p>
              <Button variant="secondary" size="field" className="mt-4 w-full" onClick={() => navigate("/app/listings")}>
                View in My Listings
              </Button>
            </Card>
          ) : isBuyer ? (
            <Card className="p-4 sm:p-5 shadow-md">
              <div className="flex items-center justify-between">
                <Label htmlFor="buy-qty" className="mb-0 text-sm font-bold">
                  {t("checkout.selectQty")}
                </Label>
                <span className="num text-xs text-muted dark:text-portal-muted">{t("checkout.maxQty", { qty: l.quantityKg })}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  id="buy-qty"
                  type="number"
                  min={1}
                  max={l.quantityKg}
                  value={qty || ""}
                  onChange={(e) => setQty(Math.min(l.quantityKg, Math.max(0, Number(e.target.value))))}
                  className="num min-h-12 text-lg font-semibold"
                />
                <div className="flex gap-1">
                  {[0.25, 0.5, 1].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setQty(Math.max(1, Math.round(l.quantityKg * f)))}
                      className="min-h-12 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-muted hover:text-ink hover:bg-canvas transition-colors dark:border-portal-line dark:bg-portal-surface dark:text-portal-muted"
                    >
                      {f === 1 ? "All" : `${f * 100}%`}
                    </button>
                  ))}
                </div>
              </div>
              <ConversionLine value={qty} unit="kg" className="mt-2 block text-xs" />

              <div className="mt-4 rounded-xl border border-line bg-canvas p-3.5 dark:border-portal-line dark:bg-portal-bg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted dark:text-portal-muted">
                    {qty} kg × {formatMoney(l.ratePerKg)}/kg
                  </span>
                  <span className="num text-xl font-bold text-ink dark:text-portal-ink">{formatMoney(total)}</span>
                </div>
                <p className="mt-1 text-xs text-muted dark:text-portal-muted">Final amount is confirmed on review screen.</p>
              </div>

              <div className="mt-4 sticky bottom-20 sm:static">
                <Button
                  variant="primary"
                  size="field"
                  className="w-full shadow-lg"
                  disabled={!canBuy}
                  onClick={() => navigate(`/app/checkout/${l.id}`, { state: { quantityKg: qty } })}
                >
                  {t("checkout.title")} · {formatMoney(total)}
                </Button>
                {!online && <p className="mt-1.5 text-center text-xs font-semibold text-settle">Reconnect to buy.</p>}
                {!active && <p className="mt-1.5 text-center text-xs text-muted">This listing is no longer available.</p>}
              </div>
            </Card>
          ) : (
            <Card className="p-5 text-center">
              <p className="text-sm font-semibold text-ink dark:text-portal-ink">Buying is a buyer action.</p>
              <p className="mt-1 text-xs text-muted dark:text-portal-muted">Switch to a buyer account to purchase this residue.</p>
              <Button variant="secondary" size="field" className="mt-4 w-full" onClick={openVoice}>
                <Mic className="h-4 w-4" /> {t("market.listOnMarket")}
              </Button>
            </Card>
          )}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted dark:text-portal-muted">
            <Star className="h-3.5 w-3.5 fill-settle text-settle" /> Farmer reputation comes from real transaction history.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
