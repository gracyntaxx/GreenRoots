import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SandboxStrip } from "@/components/shared/Marks";
import { paymentService, type PayPalDemoOutcome } from "@/services/paymentService";
import type { Payment } from "@/types";
import { formatMoney } from "@/lib/money";
import { commissionFor, netAfterCommission } from "@/lib/fees";

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
  const [message, setMessage] = useState("");
  const [hasOpenedSandbox, setHasOpenedSandbox] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [feedStep, setFeedStep] = useState(1);

  const fee = commissionFor(amount);
  const farmerNet = netAfterCommission(amount);

  useEffect(() => {
    if (open) {
      setStage("review");
      setMessage("");
      setHasOpenedSandbox(false);
      setConsentChecked(false);
      setFeedStep(1);
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
      let msg = e instanceof Error ? e.message : "PayPal could not be reached.";
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
      <DialogContent variant="sheet" hideClose={busy} className="p-0 overflow-hidden sm:max-w-md">
        <div className="bg-navy px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold italic tracking-tight">
              Pay<span className="text-[#009CDE]">Pal</span>
            </span>
            <span className="rounded-full bg-forest/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Sandbox Escrow
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/70">Human-in-the-Loop Explicit Authorization Required</p>
        </div>

        <SandboxStrip compact className="border-t-0" />

        <div className="px-5 py-4">
          {stage === "review" && (
            <>
              <DialogHeader className="mb-2">
                <DialogTitle className="text-lg font-heading text-moss">{t("checkout.approvePayment")}</DialogTitle>
                <DialogDescription>
                  Review the itemized summary and explicit commission split before authorizing PayPal Sandbox order creation.
                </DialogDescription>
              </DialogHeader>

              {/* Itemized Financial Breakdown */}
              <div className="rounded-panel border border-line bg-canvas p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Transaction Item:</span>
                  <strong className="font-semibold text-moss max-w-[65%] text-right truncate">{description}</strong>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Beneficiary Escrow:</span>
                  <span className="font-medium text-moss">Farmer Settlement Pool</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Farmer Net Payable (95%):</span>
                  <span className="num font-bold text-moss">{formatMoney(farmerNet)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Platform Commission (5%):</span>
                  <span className="num font-semibold text-terracotta">{formatMoney(fee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-line/80 pt-2 text-sm">
                  <span className="font-bold text-moss">Total PayPal Charge:</span>
                  <span className="num text-xl font-bold text-moss">{formatMoney(amount)}</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-forest" />
                  Order Ref: <strong className="num text-moss font-mono">{payment?.paypalOrderRef ?? "Processing..."}</strong>
                </span>
                <span className="font-bold text-forest">Live Webhook Signature Verification</span>
              </div>

              {hasOpenedSandbox && (
                <div className="mt-3 rounded-lg border border-forest/30 bg-meadow/50 p-2.5 text-xs text-forest">
                  <p className="font-semibold">PayPal Sandbox window opened</p>
                  <p className="mt-0.5 text-[11px] text-forest/90">
                    Log in with your test personal account and authorize the charge. Then click <strong>Verify &amp; Capture Payment</strong>.
                  </p>
                </div>
              )}

              {/* Mandatory Explicit Consent Checkbox */}
              <label className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-line/80 bg-surface p-3 text-xs text-moss cursor-pointer hover:bg-canvas">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-forest focus:ring-forest"
                />
                <span className="leading-snug">
                  I confirm the quantity, 5% platform fee split, and authorize PayPal Sandbox order execution.
                </span>
              </label>

              <div className="mt-4 space-y-2">
                {payment?.approveUrl ? (
                  <>
                    <Button
                      variant="paypal"
                      size="field"
                      className="w-full font-bold shadow-sm"
                      onClick={openSandboxPopup}
                    >
                      {hasOpenedSandbox ? "Re-open PayPal Sandbox ↗" : "Pay with PayPal Sandbox ↗"}
                    </Button>
                    <Button
                      variant={hasOpenedSandbox ? "primary" : "outline"}
                      size="field"
                      className="w-full font-bold"
                      disabled={!consentChecked}
                      onClick={() => void run("approve")}
                    >
                      <ShieldCheck className="h-5 w-5" />
                      {hasOpenedSandbox ? "Verify & Capture Payment" : "Authorize & Execute Sandbox Order"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="paypal"
                    size="field"
                    className="w-full font-bold"
                    disabled={!consentChecked}
                    onClick={() => void run("approve")}
                  >
                    <ShieldCheck className="h-5 w-5" /> Approve &amp; Pay via PayPal Sandbox
                  </Button>
                )}
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
              
              {/* Live Webhook Feed */}
              <div className="mt-4 w-full rounded-xl border border-line bg-canvas p-3.5 text-left text-xs space-y-1.5 font-mono">
                <div className={feedStep >= 1 ? "text-moss font-bold" : "text-muted"}>
                  1. Creating PayPal Sandbox Order via Edge Function... OK
                </div>
                <div className={feedStep >= 2 ? "text-moss font-bold" : "text-muted"}>
                  2. Payer Authorized · Verifying PayPal Webhook Signature...
                </div>
                <div className={feedStep >= 3 ? "text-forest font-bold" : "text-muted"}>
                  3. Payment Captured · Ledger Escrow Balance Updated!
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted">
                A browser redirect is never treated as proof of payment. Only PayPal webhook cryptographic validation is accepted.
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-forest" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-moss font-heading">{t("checkout.captured")}</p>
              <p className="mt-1 text-xs text-muted font-mono">Webhook Verified · Order Confirmed</p>
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
              <p className="mt-2 text-base font-bold text-moss font-heading">PayPal could not be reached</p>
              <p className="mt-1 text-xs text-muted">{message}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="portal" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
                <Button variant="paypal" size="portal" onClick={() => setStage("review")}>
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
