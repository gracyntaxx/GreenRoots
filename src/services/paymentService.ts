import type { Payment } from "@/types";
import { call } from "./http";
import {
  addPayablesForPool,
  createPaymentRecord,
  getState,
  MockError,
  updatePaymentStatus,
} from "@/mocks/store";
import { sleep } from "@/lib/utils";

function makePaypalOrderRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `PP-${s}`;
}
function makeCaptureRef() {
  const chars = "ABCDEF0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `CAP-${s}`;
}

export type PayPalDemoOutcome = "approve" | "cancel" | "fail";

export const paymentService = {
  createPaypalOrder(input: {
    scope: "order" | "pool";
    referenceId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<Payment> {
    return call(
      "payments/create-order",
      { method: "POST", body: JSON.stringify(input) },
      () => {
        if (input.amount <= 0) throw new MockError("The amount must be more than zero.", "VALIDATION");
        const ref = makePaypalOrderRef();
        const payment = createPaymentRecord({
          ...input,
          paypalOrderRef: ref,
          status: "Initiated",
        });
        return payment;
      },
      { mutation: true }
    );
  },

  /**
   * A browser redirect is not proof of payment. This mock deliberately waits,
   * then returns a PayPal-verified state. The UI shows "Awaiting verification"
   * while this is in flight.
   */
  async confirm(paymentId: string, outcome: PayPalDemoOutcome): Promise<Payment> {
    return call(
      "payments/confirm",
      { method: "POST", body: JSON.stringify({ paymentId, outcome }) },
      async () => {
        const payment = getState().payments.find((p) => p.id === paymentId);
        if (!payment) throw new MockError("Payment not found", "NOT_FOUND");
        if (payment.status === "Captured") return payment;

        if (outcome === "cancel") {
          return updatePaymentStatus(paymentId, "Cancelled", "Buyer cancelled in the PayPal Sandbox.");
        }
        if (outcome === "fail") {
          return updatePaymentStatus(paymentId, "Failed", "PayPal Sandbox reported the payment failed.");
        }

        updatePaymentStatus(paymentId, "Approved", "Buyer approved in the PayPal Sandbox.");
        await sleep(2200);
        const captureRef = makeCaptureRef();
        const updated = updatePaymentStatus(
          paymentId,
          "Captured",
          "Verified directly with PayPal. Capture reference recorded.",
          captureRef
        );
        if (updated.scope === "pool") {
          getState()
            .contributions.filter((c) => c.poolId === updated.referenceId)
            .forEach((c) => {
              c.acceptedKg = c.committedKg;
              c.payment = "Captured";
            });
          addPayablesForPool(updated.referenceId);
        }
        return updated;
      },
      { mutation: true }
    );
  },

  status(paymentId: string): Promise<Payment> {
    return call(`payments/status?paymentId=${encodeURIComponent(paymentId)}`, undefined, () => {
      const p = getState().payments.find((x) => x.id === paymentId);
      if (!p) throw new MockError("Payment not found", "NOT_FOUND");
      return p;
    });
  },

  list(): Promise<Payment[]> {
    return call("payments/list", undefined, () => getState().payments);
  },
};
