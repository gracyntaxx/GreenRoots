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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="px-4 pt-4 pb-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-xl font-bold text-ink">{WASTE_LABELS[l.wasteType]}</h1>
              {l.source === "voice" && (
                <span className="flex items-center gap-0.5 rounded-full bg-aitint px-2 py-0.5 text-[10px] font-semibold text-ai">
                  <Mic className="h-2.5 w-2.5" /> voice listing
                </span>
              )}
              {!active && (
                <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">{l.status}</span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
              <MapPin className="h-3.5 w-3.5" /> {l.village} · {l.distanceKm.toFixed(0)} km away
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t("common.rate")}</p>
            <RateText rate={l.ratePerUnit} unit={l.rateUnit} className="text-lg font-bold text-forest" />
            <p className="num text-[11px] text-muted">{formatMoney(l.ratePerKg)} / kg</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-canvas p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t("common.quantity")}</p>
            <QtyText kg={l.quantityKg} className="text-[15px] font-bold text-ink" />
          </div>
          <div className="rounded-lg bg-canvas p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t("voice.availableFrom")}</p>
            <p className="flex items-center gap-1 text-[13px] font-semibold text-ink">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(l.createdAt)}
            </p>
          </div>
        </div>

        {l.aiConfidence != null && (
          <div className="mt-3 flex items-center gap-2">
            <AiChip>{t("common.aiSuggested")}</AiChip>
            <span className="text-[11px] text-muted">
              AI read the farmer&apos;s words; the farmer reviewed and confirmed every field.
            </span>
          </div>
        )}
      </Card>

      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("common.farmer")}</p>
            <p className="text-[15px] font-bold text-ink">{l.farmerName}</p>
            <p className="text-[12px] text-muted">{l.farmerVillage}</p>
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
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-meadow/60 p-2.5 text-[12px] text-forest">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Quantity and rate are confirmed by the farmer. Final payout uses the verified accepted quantity at the
            collection point.
          </span>
        </div>
      </Card>

      {point && (
        <Card className="mt-3 overflow-hidden p-0">
          <div className="p-4 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("checkout.pickupPoint")}</p>
            <p className="mt-0.5 text-[15px] font-bold text-ink">{point.name}</p>
            <p className="text-[12px] text-muted">
              {point.village} · {point.hours}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-forest">
              <PackageCheck className="h-3.5 w-3.5" /> {point.distanceKm.toFixed(0)} km from you
            </p>
          </div>
          <MapView
            center={point.location}
            zoom={12}
            height={170}
            className="rounded-none border-x-0 border-b-0"
            markers={[
              { id: point.id, location: point.location, label: point.name, detail: point.village, kind: "collection" },
            ]}
          />
        </Card>
      )}

      {isOwn ? (
        <Card className="mt-3 p-4 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-forest" aria-hidden="true" />
          <p className="mt-1.5 text-sm font-semibold text-ink">This is your listing.</p>
          <p className="text-[12px] text-muted">Manage quantity, pause or remove it from My listings.</p>
          <Button variant="secondary" size="field" className="mt-3 w-full" onClick={() => navigate("/app/listings")}>
            {t("me.editProfile")}
          </Button>
        </Card>
      ) : isBuyer ? (
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="buy-qty" className="mb-0">
              {t("checkout.selectQty")}
            </Label>
            <span className="num text-[11px] text-muted">{t("checkout.maxQty", { qty: l.quantityKg })}</span>
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
                  className="min-h-12 rounded-lg border border-line bg-surface px-2.5 text-[12px] font-semibold text-muted"
                >
                  {f === 1 ? "All" : `${f * 100}%`}
                </button>
              ))}
            </div>
          </div>
          <ConversionLine value={qty} unit="kg" className="mt-1.5 block" />

          <div className="mt-3 rounded-xl border border-line bg-canvas p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">
                {qty} kg × {formatMoney(l.ratePerKg)}/kg
              </span>
              <span className="num text-lg font-bold text-ink">{formatMoney(total)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">Final amount is confirmed on the review screen.</p>
          </div>

          <Button
            variant="primary"
            size="field"
            className="mt-3 w-full"
            disabled={!canBuy}
            onClick={() => navigate(`/app/checkout/${l.id}`, { state: { quantityKg: qty } })}
          >
            {t("checkout.title")}
          </Button>
          {!online && <p className="mt-1.5 text-center text-[11px] font-semibold text-settle">Reconnect to buy.</p>}
          {!active && <p className="mt-1.5 text-center text-[11px] text-muted">This listing is no longer available.</p>}
        </Card>
      ) : (
        <Card className="mt-3 p-4 text-center">
          <p className="text-sm font-semibold text-ink">Buying is a buyer action.</p>
          <p className="text-[12px] text-muted">Switch to a buyer account to purchase this residue.</p>
          <Button variant="secondary" size="field" className="mt-3 w-full" onClick={openVoice}>
            <Mic className="h-5 w-5" /> {t("market.listOnMarket")}
          </Button>
        </Card>
      )}

      <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted">
        <Star className="h-3 w-3 fill-settle text-settle" /> Farmer reputation comes from real transaction history.
      </p>
    </div>
  );
}
