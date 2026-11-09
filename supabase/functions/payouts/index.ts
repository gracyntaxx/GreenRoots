import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { createPaypalPayoutBatch } from "../_shared/paypal.ts";
import { logAudit } from "../_shared/audit.ts";

function formatPayable(p: any) {
  const gross = Number(p.gross_paise || 0);
  const fee = Number(p.commission_paise || p.fee_paise || Math.round(gross * 0.05));
  const net = Number(p.net_paise || (gross - fee));

  return {
    id: p.id,
    poolId: p.pool_id,
    farmerId: p.farmer_id,
    farmerName: p.farmer_name || p.farmer?.name || "Farmer",
    verifiedKg: Number(p.accepted_kg || p.verified_kg || 0),
    sharePercent: Number(p.share_percent || 0),
    gross: Math.round(gross / 100),
    fee: Math.round(fee / 100),
    net: Math.round(net / 100),
    payout: p.payout || p.payout_status || "Pending",
    payoutBatchId: p.payout_batch_id || undefined,
    paidAt: p.paid_at || undefined,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/payouts\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /payouts/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const poolId = url.searchParams.get("poolId");
      let query = supabase.from("farmer_payables").select("*");

      if (poolId) {
        query = query.eq("pool_id", poolId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatPayable));
    }

    // 2. POST /payouts/approve
    if (subpath === "approve" || subpath.endsWith("/approve")) {
      const body = await req.json().catch(() => ({}));
      const { payableId, simulated = false } = body;

      if (!payableId) throw new ApiError(400, "payableId is required", "VALIDATION");

      const { data: payable, error: pErr } = await supabase
        .from("farmer_payables")
        .select(`
          *,
          farmer:profiles!farmer_payables_farmer_id_fkey(email, phone)
        `)
        .eq("id", payableId)
        .single();

      if (pErr || !payable) throw new ApiError(404, "Payable record not found", "NOT_FOUND");

      const batchId = `pb_${Date.now()}`;
      const farmerEmail = payable.farmer?.email || `${payable.farmer_id}@greenroots.test`;

      // Execute payout batch
      const payoutResult = await createPaypalPayoutBatch(
        batchId,
        [
          {
            receiverEmail: farmerEmail,
            amountPaise: Number(payable.net_paise),
            payableId,
            note: `GreenRoots residue payout for ${payable.farmer_name}`,
          },
        ],
        Boolean(simulated)
      );

      const nextStatus = simulated || payoutResult.status === "SIMULATED" ? "Simulated" : "Completed";
      const now = new Date().toISOString();

      // Update payable row
      const { data: updatedPayable, error: uErr } = await supabase
        .from("farmer_payables")
        .update({
          payout_status: nextStatus,
          payout_batch_id: payoutResult.batchHeaderId,
          paid_at: now,
        })
        .eq("id", payableId)
        .select()
        .single();

      if (uErr) throw new ApiError(500, uErr.message, "DATABASE_ERROR");

      // Record in payouts table
      await supabase.from("payouts").insert({
        id: `payout_${Date.now()}`,
        payable_id: payableId,
        farmer_id: payable.farmer_id,
        pool_id: payable.pool_id,
        amount_paise: payable.net_paise,
        paypal_payout_batch_id: payoutResult.batchHeaderId,
        status: nextStatus,
        simulated: Boolean(simulated || payoutResult.status === "SIMULATED"),
      });

      await logAudit({
        actor: "Admin",
        actorRole: "admin",
        action: "Payout Approved",
        reference: payableId,
        aiPreparedSummary: `Approved payout ₹${Math.round(Number(payable.net_paise) / 100)} to ${payable.farmer_name} (${nextStatus})`,
      });

      return jsonResponse(formatPayable(updatedPayable));
    }

    throw new ApiError(404, `Payouts endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

