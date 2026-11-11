import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SandboxStrip } from "@/components/shared/Marks";
import { paymentService, type PayPalDemoOutcome } from "@/services/paymentService";
import type { Payment } from "@/types";
import { formatMoney } from "@/lib/money";

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

  useEffect(() => {
    if (open) {
      setStage("review");
      setMessage("");
      setHasOpenedSandbox(false);
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
      onVerifying?.();
    }
    try {
      const updated = await paymentService.confirm(payment.id, outcome);
      if (outcome === "approve") {
        setStage("done");
        onVerified(updated);
        setTimeout(() => onOpenChange(false), 900);
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
              Secure Checkout
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/70">Encrypted 256-bit SSL transaction</p>
        </div>

        <SandboxStrip compact className="border-t-0" />

        <div className="px-5 py-4">
          {stage === "review" && (
            <>
              <DialogHeader className="mb-2">
                <DialogTitle className="text-lg">{t("checkout.approvePayment")}</DialogTitle>
                <DialogDescription>Review and complete your payment via PayPal.</DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="flex items-center justify-between text-[12px] text-muted">
                  <span>Merchant</span>
                  <span className="font-semibold text-ink">GreenRoots</span>
                </div>
                <div className="mt-1.5 flex items-start justify-between gap-3 text-[12px] text-muted">
                  <span>Item</span>
                  <span className="max-w-[60%] text-right font-medium text-ink">{description}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                  <span className="text-[12px] font-semibold text-muted">Amount</span>
                  <span className="num text-xl font-bold text-ink">{formatMoney(amount)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Order: <strong className="num text-ink">{payment?.paypalOrderRef ?? "Processing..."}</strong>
                </span>
                <span className="text-[10px] uppercase font-bold text-forest">Live Sandbox API</span>
              </div>

              {hasOpenedSandbox && (
                <div className="mt-3 rounded-lg border border-forest/30 bg-meadow/50 p-2.5 text-xs text-forest">
                  <p className="font-semibold">PayPal Sandbox window opened!</p>
                  <p className="mt-0.5 text-[11px] text-forest/90">
                    Log in with your test personal account and authorize the charge. Then click <strong>Capture Payment</strong> below.
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {payment?.approveUrl ? (
                  <>
                    <Button variant="paypal" size="field" className="w-full font-bold shadow-sm" onClick={openSandboxPopup}>
                      {hasOpenedSandbox ? "Re-open PayPal Sandbox ↗" : "Pay with PayPal Sandbox ↗"}
                    </Button>
                    <Button
                      variant={hasOpenedSandbox ? "primary" : "outline"}
                      size="field"
                      className="w-full"
                      onClick={() => void run("approve")}
                    >
                      <ShieldCheck className="h-5 w-5" />
                      {hasOpenedSandbox ? "Verify & Capture Payment" : "Quick Approve (Hackathon Demo)"}
                    </Button>
                  </>
                ) : (
                  <Button variant="paypal" size="field" className="w-full" onClick={() => void run("approve")}>
                    <ShieldCheck className="h-5 w-5" /> Approve payment
                  </Button>
                )}
                <Button variant="ghost" size="portal" className="w-full text-xs text-muted" onClick={() => void run("cancel")}>
                  Cancel and return
                </Button>
              </div>
            </>
          )}

          {stage === "verifying" && (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-escrow" aria-hidden="true" />
              <p className="mt-3 text-base font-bold text-ink">{t("checkout.awaiting")}</p>
              <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-muted">{t("checkout.awaitingBody")}</p>
              <p className="mt-3 rounded-lg bg-canvas px-3 py-1.5 text-[11px] font-semibold text-muted">
                A browser redirect is not proof of payment.
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-11 w-11 text-forest" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-ink">{t("checkout.captured")}</p>
              <p className="mt-1 text-[12px] text-muted">{t("checkout.capturedBody")}</p>
            </div>
          )}

          {stage === "cancelled" && (
            <div className="flex flex-col items-center py-8 text-center">
              <XCircle className="h-11 w-11 text-muted" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-ink">{t("checkout.cancelled")}</p>
              <p className="mt-1 text-[12px] text-muted">{t("checkout.cancelledBody")}</p>
              <Button variant="outline" size="portal" className="mt-4" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </div>
          )}

          {stage === "failed" && (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertTriangle className="h-11 w-11 text-error" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-ink">{t("checkout.failed")}</p>
              <p className="mt-1 text-[12px] text-muted">{t("checkout.failedBody")}</p>
              <Button variant="outline" size="portal" className="mt-4" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </div>
          )}

          {stage === "error" && (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertTriangle className="h-11 w-11 text-error" aria-hidden="true" />
              <p className="mt-2 text-base font-bold text-ink">PayPal could not be reached</p>
              <p className="mt-1 text-[12px] text-muted">{message}</p>
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
