import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { listingService } from "@/services/listingService";
import { collectionService } from "@/services/collectionService";
import { paymentService } from "@/services/paymentService";
import { orderService } from "@/services/orderService";
import { SandboxStrip } from "@/components/shared/Marks";
import { StatusTriad } from "@/components/shared/StatusTriad";
import { RateText } from "@/components/shared/Numbers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PayPalSandboxModal } from "./PayPalSandboxModal";
import { useConnectivity } from "@/lib/connectivity";
import { WASTE_LABELS, type Order, type Payment } from "@/types";
import { formatMoney } from "@/lib/money";
import { uid } from "@/lib/utils";

type Stage = "ready" | "creating" | "paypal" | "awaiting" | "success" | "cancelled" | "failed" | "orderFailed";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { listingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const online = useConnectivity();

  const initialQty = (location.state as { quantityKg?: number } | null)?.quantityKg;
  const [qty, setQty] = useState(initialQty ?? 0);
  const [stage, setStage] = useState<Stage>("ready");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paypalOpen, setPaypalOpen] = useState(false);
  const keyRef = useRef(uid("pay"));

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
    if (listing.data && !initialQty) setQty(listing.data.quantityKg);
    if (listing.data && initialQty) setQty(Math.min(initialQty, listing.data.quantityKg));
  }, [listing.data, initialQty]);

  if (profile.role !== "buyer") {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          title="Checkout is for buyers"
          body="Sign in with a buyer account to complete a purchase."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/app/market")}>
              {t("common.back")}
            </Button>
          }
        />
      </div>
    );
  }

  if (listing.isLoading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (listing.isError || !listing.data) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          title={t("checkout.noListing")}
          body="It may have been sold or removed."
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
  const safeQty = Math.max(0, Math.min(qty, l.quantityKg));
  const total = Math.round(safeQty * l.ratePerKg);
  const busy = stage === "creating" || stage === "awaiting";
  const canPay =
    safeQty > 0 && safeQty <= l.quantityKg && l.status === "Active" && online && !busy && stage !== "orderFailed";

  const startPayment = async () => {
    setError(null);
    if (stage === "cancelled" || stage === "failed") {
      keyRef.current = uid("pay");
      setPayment(null);
    }
    setStage("creating");
    try {
      const p = await paymentService.createPaypalOrder({
        scope: "order",
        referenceId: l.id,
        amount: total,
        idempotencyKey: keyRef.current,
      });
      setPayment(p);
      setStage("paypal");
      setPaypalOpen(true);
    } catch (e) {
      setStage("ready");
      setError(e instanceof Error ? e.message : "Could not start the PayPal Sandbox.");
    }
  };

  const createOrder = async (paid: Payment) => {
    try {
      const created = await orderService.create({
        listingId: l.id,
        buyer: profile,
        quantityKg: safeQty,
        payment: paid,
      });
      setOrder(created);
      setStage("success");
      pushToast({ title: t("checkout.captured"), description: t("checkout.capturedBody"), variant: "success" });
    } catch (e) {
      setStage("orderFailed");
      setError(
        e instanceof Error
          ? `${e.message} Payment was captured — do not pay again.`
          : "Payment was captured but the order could not be created. Do not pay again."
      );
    }
  };

  const retryOrder = async () => {
    if (!payment) return;
    setStage("awaiting");
    await createOrder(payment);
  };

  const retryPayment = () => {
    keyRef.current = uid("pay");
    setPayment(null);
    setError(null);
    setStage("ready");
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <SandboxStrip className="mb-3 rounded-lg border" />

      {stage === "success" && order ? (
        <Card className="p-5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-forest" aria-hidden="true" />
          <h1 className="mt-2 text-xl font-bold text-ink">{t("checkout.captured")}</h1>
          <p className="mt-1 text-sm text-muted">{t("checkout.capturedBody")}</p>
          <p className="num mt-2 text-[12px] font-semibold text-muted">Order {order.id}</p>
          <StatusTriad
            fulfilment={order.fulfilment}
            payment={order.payment}
            payout={order.payout}
            className="mt-4 text-left"
          />
          <Button variant="primary" size="field" className="mt-4 w-full" onClick={() => navigate(`/app/orders/${order.id}`)}>
            {t("checkout.viewOrder")}
          </Button>
        </Card>
      ) : (
        <>
          <h1 className="text-xl font-bold text-ink">{t("checkout.title")}</h1>

          <Card className="mt-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold text-ink">{WASTE_LABELS[l.wasteType]}</p>
                <p className="text-[12px] text-muted">
                  {l.farmerName} · {l.village}
                </p>
              </div>
              <RateText rate={l.ratePerUnit} unit={l.rateUnit} className="text-[13px] font-bold text-forest" />
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="checkout-qty" className="mb-0">
                  {t("checkout.selectQty")}
                </Label>
                <span className="num text-[11px] text-muted">{t("checkout.maxQty", { qty: l.quantityKg })}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  id="checkout-qty"
                  type="number"
                  min={1}
                  max={l.quantityKg}
                  value={safeQty || ""}
                  disabled={busy}
                  onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
                  className="num min-h-12 text-lg font-semibold"
                />
                <span className="text-sm font-semibold text-muted">kg</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">
                  {safeQty} kg × {formatMoney(l.ratePerKg)}/kg
                </span>
                <span className="num font-semibold text-ink">{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Platform fee to buyer</span>
                <span className="num font-semibold text-ink">₹0</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2">
                <span className="font-semibold text-ink">{t("checkout.total")}</span>
                <span className="num text-xl font-bold text-forest">{formatMoney(total)}</span>
              </div>
            </div>
          </Card>

          {point && (
            <Card className="mt-3 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("checkout.pickupPoint")}</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink">{point.name}</p>
              <p className="flex items-center gap-1 text-[12px] text-muted">
                <MapPin className="h-3.5 w-3.5" /> {point.village} · {point.hours}
              </p>
            </Card>
          )}

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-escrow/25 bg-[#EFF6FF] p-3 text-[12px] text-navy">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t("checkout.buyerNote")}</p>
              <p className="mt-0.5 text-navy/80">
                We never see or store your card or bank details. PayPal handles the payment.
              </p>
            </div>
          </div>

          {stage === "awaiting" && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-settle/40 bg-[#FFFBEB] p-3 text-[12px] text-[#92400E]">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t("checkout.awaiting")}</p>
                <p className="mt-0.5">{t("checkout.awaitingBody")}</p>
              </div>
            </div>
          )}

          {stage === "cancelled" && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-canvas p-3 text-[12px] text-muted">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink">{t("checkout.cancelled")}</p>
                <p>{t("checkout.cancelledBody")}</p>
              </div>
            </div>
          )}

          {stage === "failed" && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-[12px] text-error">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t("checkout.failed")}</p>
                <p>{t("checkout.failedBody")}</p>
              </div>
            </div>
          )}

          {stage === "orderFailed" && (
            <div className="mt-3 rounded-xl border border-error/30 bg-error/10 p-3 text-[12px] text-error">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Payment captured, order not created
              </p>
              <p className="mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-2 border-error/30 bg-white text-error" onClick={retryOrder}>
                Retry order creation
              </Button>
            </div>
          )}

          {error && stage === "ready" && (
            <p className="mt-3 rounded-lg border border-error/30 bg-error/10 p-2.5 text-[12px] font-medium text-error">
              {error}
            </p>
          )}

          <Button
            variant="paypal"
            size="field"
            className="mt-4 w-full"
            disabled={!canPay}
            onClick={startPayment}
          >
            {stage === "creating" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            {stage === "cancelled" || stage === "failed" ? t("checkout.retry") : t("checkout.paypal")}
          </Button>
          {(stage === "cancelled" || stage === "failed") && (
            <button type="button" onClick={retryPayment} className="mt-2 w-full text-center text-[12px] font-semibold text-forest">
              Start a fresh payment
            </button>
          )}
          <p className="mt-2 text-center text-[11px] text-muted">{t("checkout.sandboxNote")}</p>
          {!online && <p className="mt-1 text-center text-[11px] font-semibold text-settle">Reconnect to pay.</p>}
        </>
      )}

      <PayPalSandboxModal
        open={paypalOpen}
        payment={payment}
        amount={total}
        description={`${WASTE_LABELS[l.wasteType]} · ${safeQty} kg`}
        onOpenChange={setPaypalOpen}
        onVerifying={() => setStage("awaiting")}
        onVerified={(paid) => {
          void createOrder(paid);
        }}
        onAborted={(outcome) => {
          setStage(outcome === "cancel" ? "cancelled" : "failed");
        }}
      />
    </div>
  );
}
