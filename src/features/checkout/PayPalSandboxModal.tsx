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

  useEffect(() => {
    if (open) {
      setStage("review");
      setMessage("");
    }
  }, [open]);

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
      setMessage(e instanceof Error ? e.message : "The PayPal Sandbox could not be reached.");
    }
  };

  const busy = stage === "verifying";

  return (
    <Dialog open={open} onOpenChange={(v) => (!busy ? onOpenChange(v) : undefined)}>
      <DialogContent variant="center" hideClose={busy} className="max-w-sm overflow-hidden p-0">
        <div className="bg-navy px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold italic tracking-tight">
              Pay<span className="text-[#009CDE]">Pal</span>
            </span>
            <span className="rounded-full bg-settle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3b2a05]">
              Sandbox
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/70">Test environment · no real money moves</p>
        </div>

        <SandboxStrip compact className="border-t-0" />

        <div className="px-5 py-4">
          {stage === "review" && (
            <>
              <DialogHeader className="mb-2">
                <DialogTitle className="text-lg">{t("checkout.approvePayment")}</DialogTitle>
                <DialogDescription>{t("checkout.sandboxNote")}</DialogDescription>
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

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Sandbox buyer · {payment?.paypalOrderRef ?? "PP-XXXXXXX"}
              </div>

              <div className="mt-4 space-y-2">
                <Button variant="paypal" size="field" className="w-full" onClick={() => void run("approve")}>
                  <ShieldCheck className="h-5 w-5" /> Approve payment
                </Button>
                <Button variant="outline" size="portal" className="w-full" onClick={() => void run("cancel")}>
                  Cancel and return
                </Button>
                <button
                  type="button"
                  onClick={() => void run("fail")}
                  className="w-full py-1 text-center text-[11px] font-semibold text-error underline-offset-2 hover:underline"
                >
                  Demo control: simulate a failed payment
                </button>
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
