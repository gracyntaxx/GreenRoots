import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SandboxStrip } from "@/components/shared/Marks";
import { paymentService, type PayPalDemoOutcome } from "@/services/paymentService";
import type { Payment } from "@/types";
import { formatMoney } from "@/lib/money";
import { commissionFor, netAfterCommission } from "@/lib/fees";
import { qrMatrix, qrSvgPath } from "@/lib/qr";
import { cn } from "@/lib/utils";

type Stage = "review" | "verifying" | "done" | "cancelled" | "failed" | "error";

export function PayPalSandboxModal({
  open,
  payment,
  amount,
  description,
  onOpenChange,
  onVerifying,
  onVerified,
  onAborted,
}: {
  open: boolean;
  payment: Payment | null;
  amount: number;
  description: string;
  onOpenChange: (o: boolean) => void;
  onVerifying?: () => void;
  onVerified: (payment: Payment) => void;
  onAborted: (outcome: "cancel" | "fail") => void;
}) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("review");
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "paypal">("qr");
  const [message, setMessage] = useState("");
  const [hasOpenedSandbox, setHasOpenedSandbox] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [feedStep, setFeedStep] = useState(1);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fee = commissionFor(amount);
  const farmerNet = netAfterCommission(amount);

  const upiId = "greenroots.escrow@icici";
  const upiPayload = `upi://pay?pa=${upiId}&pn=GreenRoots%20Escrow&am=${amount}&cu=INR&tn=${encodeURIComponent(description || "Biomass Escrow Order")}`;
  const qrGrid = qrMatrix(upiPayload, 25);
  const qrSize = qrGrid.length * 4;

  const handleCopyUpi = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  useEffect(() => {
    if (open) {
      setStage("review");
      setMessage("");
      setHasOpenedSandbox(false);
      setConsentChecked(false);
      setFeedStep(1);
      setPaymentMethod("qr");
      setCopiedUpi(false);
    }
  }, [open]);

  const openSandboxPopup = () => {
    if (payment?.approveUrl) {
      setHasOpenedSandbox(true);
      window.open(payment.approveUrl, "paypal_sandbox_checkout", "width=520,height=700,scrollbars=yes");
    }
  };

  const run = async (outcome: PayPalDemoOutcome) => {
    if (!payment) return;
    if (outcome === "approve") {
      setStage("verifying");
      setFeedStep(1);
      setTimeout(() => setFeedStep(2), 600);
      setTimeout(() => setFeedStep(3), 1200);
      onVerifying?.();
    }
    try {
      const updated = await paymentService.confirm(payment.id, outcome);
      if (outcome === "approve") {
        setStage("done");
        onVerified(updated);
        setTimeout(() => onOpenChange(false), 1400);
      } else if (outcome === "cancel") {
        setStage("cancelled");
        onAborted("cancel");
      } else {
        setStage("failed");
        onAborted("fail");
      }
    } catch (e) {
      setStage("error");
      let msg = e instanceof Error ? e.message : "Payment gateway could not be reached.";
      try {
        if (msg.includes("{")) {
          const jsonStart = msg.indexOf("{");
          const parsed = JSON.parse(msg.slice(jsonStart));
          msg = parsed.details?.[0]?.description || parsed.message || msg;
        }
      } catch {
        /* keep original msg */
      }
      setMessage(msg);
    }
  };

  const busy = stage === "verifying";

  return (
    <Dialog open={open} onOpenChange={(v) => (!busy ? onOpenChange(v) : undefined)}>
      <DialogContent variant="sheet" hideClose={busy} className="p-0 overflow-hidden sm:max-w-md max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-navy px-5 py-3.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">GreenRoots <span className="text-[#009CDE]">Pay</span></span>
              <span className="rounded-full bg-forest/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Escrow Protected
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white/80">{formatMoney(amount)}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/70">Verified Encrypted Multi-Rail Settlement</p>
        </div>

        <div className="px-5 py-4">
          {stage === "review" && (
            <>
              <DialogHeader className="mb-2">
                <DialogTitle className="text-lg font-heading text-moss">Select Payment Method</DialogTitle>
                <DialogDescription>
                  Choose between Instant UPI Demo QR Code or PayPal Sandbox to authorize payment.
                </DialogDescription>
              </DialogHeader>

              {/* Payment Method Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 bg-canvas rounded-xl border border-line text-xs font-bold gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qr")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all",
                    paymentMethod === "qr"
                      ? "bg-white text-forest shadow-sm border border-line dark:bg-[#1E293B] dark:text-growth dark:border-portal-line"
                      : "text-muted hover:text-ink"
                  )}
                >
                  <QrCode className="h-4 w-4 text-forest" />
                  <span>Demo QR / UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all",
                    paymentMethod === "paypal"
                      ? "bg-white text-forest shadow-sm border border-line dark:bg-[#1E293B] dark:text-growth dark:border-portal-line"
                      : "text-muted hover:text-ink"
                  )}
                >
                  <span className="font-bold italic">Pay<span className="text-[#009CDE]">Pal</span></span> Sandbox
                </button>
              </div>

              {/* Tab 1: Demo QR Code / UPI */}
              {paymentMethod === "qr" && (
                <div className="rounded-xl border border-line bg-canvas p-3.5 space-y-3 text-center">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink dark:text-portal-ink flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-forest" /> Scan &amp; Pay (Demo UPI)
                    </span>
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      Live Simulation
                    </span>
                  </div>

                  {/* QR Code Graphic */}
                  <div className="flex flex-col items-center justify-center py-1">
                    <div className="rounded-xl bg-white p-2.5 shadow-sm border border-line text-slate-900 inline-block">
                      <svg
                        width={qrSize}
                        height={qrSize}
                        viewBox={`0 0 ${qrSize} ${qrSize}`}
                        role="img"
                        aria-label="Demo UPI Payment QR Code"
                        className="rounded"
                      >
                        <rect width={qrSize} height={qrSize} fill="#ffffff" />
                        <path d={qrSvgPath(qrGrid)} fill="#0F172A" />
                      </svg>
                    </div>

                    <p className="mt-2 text-xs font-bold text-ink dark:text-portal-ink">
                      Amount: <span className="num font-extrabold text-forest text-sm">{formatMoney(amount)}</span>
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                      <span>UPI ID: <strong className="font-mono text-ink dark:text-portal-ink">{upiId}</strong></span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-1 hover:text-forest transition-colors rounded"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="h-3.5 w-3.5 text-forest" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed">
                    Scan using Google Pay, PhonePe, Paytm, or BHIM. For instant demo verification, click <strong>Confirm Payment</strong> below.
                  </p>
                </div>
              )}

              {/* Tab 2: PayPal Sandbox */}
              {paymentMethod === "paypal" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-line bg-canvas p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-muted">
                      <span>Gateway Provider:</span>
                      <strong className="font-semibold text-moss">PayPal Escrow Services</strong>
                    </div>
                    <div className="flex items-center justify-between text-muted">
                      <span>Environment:</span>
                      <span className="font-mono text-terracotta font-semibold">Sandbox / Verified</span>
                    </div>
                    <div className="flex items-center justify-between text-muted">
                      <span>Order Ref:</span>
                      <strong className="num text-moss font-mono">{payment?.paypalOrderRef ?? "Processing..."}</strong>
                    </div>
                  </div>

                  {payment?.approveUrl && (
                    <Button
                      variant="outline"
                      size="field"
                      className="w-full font-bold border-navy/30 text-navy hover:bg-navy/5 dark:text-white"
                      onClick={openSandboxPopup}
                    >
                      {hasOpenedSandbox ? "Re-open PayPal Window ↗" : "Open PayPal Sandbox ↗"}
                    </Button>
                  )}

                  {hasOpenedSandbox && (
                    <div className="rounded-lg border border-forest/30 bg-meadow/50 p-2 text-xs text-forest">
                      <p className="font-semibold">PayPal authorization window opened</p>
                      <p className="mt-0.5 text-[11px] text-forest/90">
                        Authorize in PayPal, then click <strong>Confirm Payment</strong> below.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Itemized Financial Breakdown */}
              <div className="mt-3 rounded-panel border border-line bg-canvas p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Transaction Item:</span>
                  <strong className="font-semibold text-moss max-w-[65%] text-right truncate">{description}</strong>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Farmer Net Payable (95%):</span>
                  <span className="num font-bold text-moss">{formatMoney(farmerNet)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Platform Commission (5%):</span>
                  <span className="num font-semibold text-terracotta">{formatMoney(fee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-line/80 pt-1.5 text-sm">
                  <span className="font-bold text-moss">Total Payable:</span>
                  <span className="num text-lg font-bold text-moss">{formatMoney(amount)}</span>
                </div>
              </div>

              {/* Mandatory Explicit Consent Checkbox */}
              <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-line/80 bg-surface p-2.5 text-xs text-moss cursor-pointer hover:bg-canvas">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-forest focus:ring-forest"
                />
                <span className="leading-snug">
                  I confirm the order quantity, 5% escrow commission split, and authorize payment execution.
                </span>
              </label>

              {/* Primary Action Button */}
              <div className="mt-3.5 space-y-2">
                <Button
                  variant="primary"
                  size="field"
                  className="w-full font-bold shadow-md bg-forest hover:bg-forest/90 text-white"
                  disabled={!consentChecked}
                  onClick={() => void run("approve")}
                >
                  <CheckCircle2 className="h-5 w-5 mr-1" /> Confirm Payment
                </Button>
                <Button variant="ghost" size="portal" className="w-full text-xs text-muted" onClick={() => void run("cancel")}>
                  Cancel and return
                </Button>
              </div>
            </>
          )}

          {stage === "verifying" && (
            <div className="flex flex-col items-center py-6 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-forest" aria-hidden="true" />
              <p className="mt-3 text-base font-bold text-moss font-heading">{t("checkout.awaiting")}</p>
              
              {/* Payment Verification Steps */}
              <div className="mt-4 w-full rounded-xl border border-line bg-canvas p-3.5 text-left text-xs space-y-1.5 font-mono">
                <div className={feedStep >= 1 ? "text-moss font-bold" : "text-muted"}>
                  1. Initializing secure escrow payment... OK
                </div>
                <div className={feedStep >= 2 ? "text-moss font-bold" : "text-muted"}>
                  2. Verifying encrypted QR / PayPal signature...
                </div>
                <div className={feedStep >= 3 ? "text-forest font-bold" : "text-muted"}>
                  3. Payment verified · Escrow funds secured!
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted">
                Securely encrypted transaction. Payouts are protected in escrow.
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-forest" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-moss font-heading">{t("checkout.captured")}</p>
              <p className="mt-1 text-xs text-muted font-mono">Verified · Generating Official Invoice...</p>
            </div>
          )}

          {stage === "cancelled" && (
            <div className="flex flex-col items-center py-8 text-center">
              <XCircle className="h-11 w-11 text-muted" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-moss font-heading">{t("checkout.cancelled")}</p>
              <p className="mt-1 text-xs text-muted">{t("checkout.cancelledBody")}</p>
              <Button variant="outline" size="portal" className="mt-4" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </div>
          )}

          {stage === "failed" && (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertTriangle className="h-11 w-11 text-error" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-moss font-heading">{t("checkout.failed")}</p>
              <p className="mt-1 text-xs text-muted">{t("checkout.failedBody")}</p>
              <Button variant="outline" size="portal" className="mt-4" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </div>
          )}

          {stage === "error" && (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertTriangle className="h-11 w-11 text-error" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-moss font-heading">Payment gateway could not be reached</p>
              <p className="mt-1 text-xs text-muted">{message}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="portal" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
                <Button variant="primary" size="portal" onClick={() => setStage("review")}>
                  {t("checkout.retry")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
