import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, MapPin, ReceiptText } from "lucide-react";
import { useSession } from "@/store/session";
import { orderService } from "@/services/orderService";
import { collectionService } from "@/services/collectionService";
import { StatusTriad } from "@/components/shared/StatusTriad";
import { SandboxStrip } from "@/components/shared/Marks";
import { QrSlip } from "@/components/shared/QrSlip";
import { QtyText } from "@/components/shared/Numbers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { WASTE_LABELS } from "@/types";
import { formatMoney } from "@/lib/money";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

const dotTone: Record<string, string> = {
  done: "border-forest bg-forest text-white",
  current: "border-forest bg-meadow text-forest",
  upcoming: "border-line bg-surface text-muted",
  error: "border-error bg-error/10 text-error",
};

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;

  const order = useQuery({ queryKey: ["order", orderId], queryFn: () => orderService.get(orderId!), enabled: !!orderId });
  const points = useQuery({
    queryKey: ["collection-points", profile.id],
    queryFn: () => collectionService.list(profile),
  });

  if (order.isLoading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (order.isError || !order.data) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          icon={<ReceiptText className="h-7 w-7" />}
          title={t("orders.noOrders")}
          body="This order may not exist."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/app/orders")}>
              {t("common.back")}
            </Button>
          }
        />
      </div>
    );
  }

  const o = order.data;
  const allowed = profile.role === "admin" || o.buyerId === profile.id || o.farmerId === profile.id;
  if (!allowed) {
    return (
      <div className="px-4 pt-6">
        <EmptyState title="This order is not yours" body="Switch accounts to view it." />
      </div>
    );
  }

  const point = (points.data ?? []).find((p) => p.id === o.collectionPointId);

  return (
    <div className="px-4 pt-4 pb-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink">{WASTE_LABELS[o.wasteType]}</h1>
          <p className="num text-[12px] text-muted">{t("orders.orderNumber", { id: o.id })}</p>
          <p className="text-[11px] text-muted">{t("orders.placedOn", { date: formatDate(o.createdAt) })}</p>
        </div>
        <span className="rounded-full border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
          {profile.role === "buyer" ? `Farmer: ${o.farmerName}` : `Buyer: ${o.buyerName}`}
        </span>
      </div>

      <StatusTriad fulfilment={o.fulfilment} payment={o.payment} payout={o.payout} className="mt-3" />
      <p className="mt-1.5 px-1 text-[11px] leading-relaxed text-muted">{t("orders.statusExplainer")}</p>

      <Card className="mt-3 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("orders.amountBreakdown")}</p>
        <div className="mt-2 space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted">{t("orders.quantity")}</span>
            <QtyText kg={o.quantityKg} className="font-semibold text-ink" />
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t("orders.rate")}</span>
            <span className="num font-semibold text-ink">
              {formatMoney(o.ratePerUnit)} / {o.rateUnit}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2">
            <span className="font-semibold text-ink">{t("common.total")}</span>
            <span className="num text-xl font-bold text-forest">{formatMoney(o.totalAmount)}</span>
          </div>
        </div>
      </Card>

      <Card className="mt-3 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("orders.payment")}</p>
        <SandboxStrip compact className="mt-2 rounded-lg border" />
        <div className="mt-2 space-y-1.5 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("orders.paypalRef")}</span>
            <span className="num font-semibold text-ink">{o.paypalOrderRef ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Capture reference</span>
            <span className="num font-semibold text-ink">{o.paypalCaptureRef ?? "Not captured"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("status.payment")}</span>
            <span className="flex items-center gap-1 font-semibold text-ink">
              <BadgeCheck className="h-3.5 w-3.5 text-navy" /> {t(`status.${o.payment}`)}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          GreenRoots confirms the payment directly with PayPal. A redirect alone is never treated as proof.
        </p>
      </Card>

      {point && (
        <Card className="mt-3 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("orders.collectionPoint")}</p>
          <p className="mt-0.5 text-[14px] font-semibold text-ink">{point.name}</p>
          <p className="flex items-center gap-1 text-[12px] text-muted">
            <MapPin className="h-3.5 w-3.5" /> {point.village} · {point.hours}
          </p>
        </Card>
      )}

      <div className="mt-3">
        <p className="mb-2 text-[15px] font-bold text-ink">{t("orders.timeline")}</p>
        <ol className="space-y-0">
          {o.timeline.map((event, i) => (
            <li key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                    dotTone[event.state]
                  )}
                  aria-hidden="true"
                >
                  {event.state === "done" ? "✓" : event.state === "error" ? "!" : i + 1}
                </span>
                {i < o.timeline.length - 1 && <span className="my-0.5 w-0.5 flex-1 bg-line" aria-hidden="true" />}
              </div>
              <div className="pb-3">
                <p className={cn("text-[13px] font-semibold", event.state === "upcoming" ? "text-muted" : "text-ink")}>
                  {event.label}
                </p>
                {event.detail && <p className="text-[11px] leading-snug text-muted">{event.detail}</p>}
                <p className="num mt-0.5 text-[10px] text-muted">{formatDateTime(event.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-2">
        <p className="mb-2 text-[15px] font-bold text-ink">{t("orders.dropOffSlip")}</p>
        <p className="mb-2 text-[12px] text-muted">{t("orders.showAtPoint")}</p>
        <QrSlip order={o} collectionPointName={point?.name ?? "Collection point"} />
      </div>
    </div>
  );
}
