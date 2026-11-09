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
import { PageContainer } from "@/components/shared/PageContainer";
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
      setError(e instanceof Error ? e.message : "Could not start the PayPal payment.");
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
    <PageContainer className="pb-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest dark:text-portal-muted dark:hover:text-growth"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <SandboxStrip className="mb-4 rounded-xl border" />

      {stage === "success" && order ? (
        <Card className="mx-auto max-w-xl p-6 sm:p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto h-14 w-14 text-forest dark:text-growth" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-bold text-ink dark:text-portal-ink">{t("checkout.captured")}</h1>
          <p className="mt-1 text-sm text-muted dark:text-portal-muted">{t("checkout.capturedBody")}</p>
          <p className="num mt-2 text-xs font-semibold text-muted dark:text-portal-muted">Order ID: {order.id}</p>
          <StatusTriad
            fulfilment={order.fulfilment}
            payment={order.payment}
            payout={order.payout}
            className="mt-6 text-left"
          />
          <Button variant="primary" size="field" className="mt-6 w-full" onClick={() => navigate(`/app/orders/${order.id}`)}>
            {t("checkout.viewOrder")}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Column: Order items and pickup */}
          <div className="space-y-4 lg:col-span-3">
            <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">{t("checkout.title")}</h1>

            <Card className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base sm:text-lg font-bold text-ink dark:text-portal-ink">{WASTE_LABELS[l.wasteType]}</p>
                  <p className="text-xs text-muted dark:text-portal-muted">
                    {l.farmerName} · {l.village}
                  </p>
                </div>
                <RateText rate={l.ratePerUnit} unit={l.rateUnit} className="text-sm sm:text-base font-bold text-forest dark:text-growth" />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="checkout-qty" className="mb-0 text-sm font-bold">
                    {t("checkout.selectQty")}
                  </Label>
                  <span className="num text-xs text-muted dark:text-portal-muted">{t("checkout.maxQty", { qty: l.quantityKg })}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    id="checkout-qty"
                    type="number"
                    min={1}
                    max={l.quantityKg}
                    value={safeQty || ""}
                    disabled={busy}
                    onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
                    className="num min-h-12 text-lg font-bold"
                  />
                  <span className="text-sm font-bold text-muted dark:text-portal-muted">kg</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-line pt-3.5 text-sm dark:border-portal-line">
                <div className="flex justify-between">
                  <span className="text-muted dark:text-portal-muted">
                    {safeQty} kg × {formatMoney(l.ratePerKg)}/kg
                  </span>
                  <span className="num font-semibold text-ink dark:text-portal-ink">{formatMoney(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted dark:text-portal-muted">Platform fee to buyer</span>
                  <span className="num font-semibold text-ink dark:text-portal-ink">₹0</span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2.5 dark:border-portal-line">
                  <span className="font-bold text-ink dark:text-portal-ink">{t("checkout.total")}</span>
                  <span className="num text-xl sm:text-2xl font-bold text-forest dark:text-growth">{formatMoney(total)}</span>
                </div>
              </div>
            </Card>

            {point && (
              <Card className="p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-portal-muted">{t("checkout.pickupPoint")}</p>
                <p className="mt-1 text-base font-bold text-ink dark:text-portal-ink">{point.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted dark:text-portal-muted">
                  <MapPin className="h-4 w-4 text-forest" /> {point.village} · {point.hours}
                </p>
              </Card>
            )}

            <div className="flex items-start gap-2.5 rounded-xl border border-escrow/25 bg-[#EFF6FF] p-3.5 text-xs text-navy dark:border-escrow/20 dark:bg-[#101E36] dark:text-[#8FB4FF]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">{t("checkout.buyerNote")}</p>
                <p className="mt-0.5 opacity-80 leading-relaxed">
                  We never see or store your card or bank details. PayPal handles the verification.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Action & Status */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-bold text-ink dark:text-portal-ink">Payment method</h2>

            <Card className="p-4 sm:p-5 shadow-md">
              <div className="flex items-center justify-between border-b border-line pb-3 dark:border-portal-line">
                <span className="text-base font-bold italic tracking-tight">
                  Pay<span className="text-[#009CDE]">Pal</span>
                </span>
                <span className="rounded-full bg-forest/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Verified
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted dark:text-portal-muted">Total payable</span>
                <span className="num text-xl font-bold text-ink dark:text-portal-ink">{formatMoney(total)}</span>
              </div>

              {stage === "awaiting" && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-settle/40 bg-[#FFFBEB] p-3 text-xs text-[#92400E] dark:bg-[#2A2110]">
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                  <div>
                    <p className="font-bold">{t("checkout.awaiting")}</p>
                    <p className="mt-0.5">{t("checkout.awaitingBody")}</p>
                  </div>
                </div>
              )}

              {stage === "cancelled" && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-canvas p-3 text-xs text-muted dark:border-portal-line dark:bg-portal-bg">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-ink dark:text-portal-ink">{t("checkout.cancelled")}</p>
                    <p>{t("checkout.cancelledBody")}</p>
                  </div>
                </div>
              )}

              {stage === "failed" && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-bold">{t("checkout.failed")}</p>
                    <p>{t("checkout.failedBody")}</p>
                  </div>
                </div>
              )}

              {stage === "orderFailed" && (
                <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error">
                  <p className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4" /> Payment captured, order not created
                  </p>
                  <p className="mt-1">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2 border-error/30 bg-white text-error" onClick={retryOrder}>
                    Retry order creation
                  </Button>
                </div>
              )}

              {error && stage === "ready" && (
                <p className="mt-4 rounded-xl border border-error/30 bg-error/10 p-2.5 text-xs font-semibold text-error">
                  {error}
                </p>
              )}

              <div className="mt-5 sticky bottom-20 sm:static">
                <Button
                  variant="paypal"
                  size="field"
                  className="w-full shadow-lg"
                  disabled={!canPay}
                  onClick={startPayment}
                >
                  {stage === "creating" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                  {stage === "cancelled" || stage === "failed" ? t("checkout.retry") : t("checkout.paypal")}
                </Button>
              </div>

              {(stage === "cancelled" || stage === "failed") && (
                <button type="button" onClick={retryPayment} className="mt-2.5 w-full text-center text-xs font-bold text-forest hover:underline">
                  Start a fresh payment
                </button>
              )}
              <p className="mt-2 text-center text-xs text-muted dark:text-portal-muted">{t("checkout.sandboxNote")}</p>
              {!online && <p className="mt-1.5 text-center text-xs font-bold text-settle">Reconnect to pay.</p>}
            </Card>
          </div>
        </div>
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
    </PageContainer>
  );
}
