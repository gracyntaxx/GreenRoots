import { getAdminSupabaseClient } from "./supabase.ts";
import { ApiError } from "./errors.ts";
import { splitPoolCommission } from "./fees.ts";

export async function processCaptureAndSettlement(paymentId: string, captureRef: string) {
  const supabase = getAdminSupabaseClient();
  const now = new Date().toISOString();

  // Update payment status to Captured
  const { data: updatedPayment, error: pErr } = await supabase
    .from("payments")
    .update({
      status: "Captured",
      payer_verified: true,
      capture_ref: captureRef,
      verified_at: now,
    })
    .eq("id", paymentId)
    .select()
    .single();

  if (pErr || !updatedPayment) {
    throw new ApiError(500, pErr?.message || "Failed to update payment", "DATABASE_ERROR");
  }

  // If pool settlement, accept all contributions and create farmer_payables
  if (updatedPayment.scope === "pool") {
    const poolId = updatedPayment.reference_id;

    // 1. Mark contributions as Accepted and Captured
    const { data: contribs } = await supabase
      .from("pool_contributions")
      .select("*, farmer:profiles!pool_contributions_farmer_id_fkey(name)")
      .eq("pool_id", poolId);

    if (contribs && contribs.length > 0) {
      await supabase
        .from("pool_contributions")
        .update({
          payment: "Captured",
          stage: "Ready for Pickup",
        })
        .eq("pool_id", poolId);

      // 2. Calculate split using exact largest-remainder Hare-Niemeyer method
      const totalPaise = Number(updatedPayment.amount_inr_paise);
      const shares = contribs.map((c: any) => ({
        id: c.id,
        farmerId: c.farmer_id,
        farmerName: c.farmer?.name || "Farmer",
        kg: Number(c.committed_kg),
      }));

      const { splits, totalNetPaise } = splitPoolCommission(totalPaise, shares);

      // 3. Upsert into farmer_payables
      for (const split of splits) {
        const payableId = `pay_${poolId}_${split.farmerId}`;
        await supabase.from("farmer_payables").upsert({
          id: payableId,
          pool_id: poolId,
          farmer_id: split.farmerId,
          farmer_name: split.farmerName,
          verified_kg: split.kg,
          share_percent: Number(split.sharePercent.toFixed(2)),
          gross_paise: split.grossPaise,
          fee_paise: split.feePaise,
          net_paise: split.netPaise,
          payout_status: "Pending",
        });
      }

      // Update pool stage to Closed/Complete
      await supabase.from("pools").update({ stage: "Closed" }).eq("id", poolId);
    }
  }

  return updatedPayment;
}

