import type { FarmerPayable } from "@/types";
import { call } from "./http";
import { approvePayout, getState, MockError } from "@/mocks/store";

export const payoutService = {
  list(poolId?: string): Promise<FarmerPayable[]> {
    return call("payouts/list", undefined, () => {
      const rows = getState().payables;
      return poolId ? rows.filter((p) => p.poolId === poolId) : rows;
    });
  },

  approve(payableId: string, simulated = false): Promise<FarmerPayable> {
    return call(
      "payouts/approve",
      { method: "POST", body: JSON.stringify({ payableId, simulated }) },
      () => approvePayout(payableId, simulated),
      { mutation: true }
    );
  },

  summary(rows: FarmerPayable[]) {
    const totalNet = rows.reduce((s, r) => s + r.net, 0);
    const completed = rows.filter((r) => r.payout === "Completed" || r.payout === "Simulated");
    const pending = rows.filter((r) => r.payout === "Pending" || r.payout === "Processing");
    const unusual = rows.filter((r) => r.net > 50000);
    return {
      totalNet,
      completedCount: completed.length,
      pendingCount: pending.length,
      unusualCount: unusual.length,
      unusualRows: unusual,
    };
  },

  get(id: string) {
    const row = getState().payables.find((p) => p.id === id);
    if (!row) throw new MockError("Payable not found", "NOT_FOUND");
    return row;
  },
};
