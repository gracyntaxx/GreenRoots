import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import {
  createPaypalOrder,
  capturePaypalOrder,
  getPaypalOrder,
} from "../_shared/paypal.ts";
import { splitPoolCommission } from "../_shared/fees.ts";
import { logAudit } from "../_shared/audit.ts";
import { processCaptureAndSettlement } from "../_shared/settlement.ts";

function formatPayment(row: any, approveUrl?: string) {
  const orderRef = row.paypal_order_ref || "";
  const fallbackApproveUrl = orderRef && !orderRef.startsWith("PP-")
    ? `https://www.sandbox.paypal.com/checkoutnow?token=${orderRef}`
    : undefined;
  return {
    id: row.id,
    scope: row.scope,
    referenceId: row.reference_id,
    amount: Math.round(Number(row.amount_inr_paise) / 100),
    currency: "INR",
    paypalOrderRef: orderRef,
    captureRef: row.capture_ref || undefined,
    status: row.status,
    payerVerified: Boolean(row.payer_verified),
    verifiedAt: row.verified_at || undefined,
    createdAt: row.created_at,
    approveUrl: approveUrl || fallbackApproveUrl,
  };
}

export async function handlePaymentRoute(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/payments\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. POST /payments/create-order or /paypal-create-order
    if (
      subpath === "create-order" ||
      subpath.endsWith("/create-order") ||
      url.pathname.includes("paypal-create-order")
    ) {
      const body = await req.json().catch(() => ({}));
      const { scope, referenceId, amount, idempotencyKey } = body;

      if (!scope || !referenceId || !amount || amount <= 0) {
        throw new ApiError(400, "Valid scope, referenceId, and positive amount are required.", "VALIDATION");
      }

      const amountInrPaise = Math.round(Number(amount) * 100);

      // Call PayPal Orders v2 API
      const paypalRes = await createPaypalOrder({
        referenceId,
        scope,
        amountInrPaise,
        idempotencyKey,
      });

      const paymentId = `pay_${Date.now()}`;
      const { data: newPayment, error: pErr } = await supabase
        .from("payments")
        .insert({
          id: paymentId,
          scope,
          reference_id: referenceId,
          amount_inr_paise: amountInrPaise,
          charge_currency: paypalRes.chargeCurrency,
          charge_amount_minor: paypalRes.chargeAmountMinor,
          fx_rate: paypalRes.fxRate,
          paypal_order_ref: paypalRes.orderId,
          status: "Initiated",
          payer_verified: false,
          idempotency_key: idempotencyKey || null,
        })
        .select()
        .single();

      if (pErr) throw new ApiError(500, pErr.message, "DATABASE_ERROR");

      await logAudit({
        actor: "Buyer/Industry",
        action: "Payment Initiated",
        reference: paymentId,
        aiPreparedSummary: `Initiated PayPal payment for ${scope} ${referenceId} (₹${amount})`,
      });

      return jsonResponse(formatPayment(newPayment, paypalRes.approveUrl));
    }

    // 2. POST /payments/confirm or /paypal-capture-order
    if (
      subpath === "confirm" ||
      subpath.endsWith("/confirm") ||
      url.pathname.includes("paypal-capture-order")
    ) {
      const body = await req.json().catch(() => ({}));
      const { paymentId, outcome = "approve" } = body;

      if (!paymentId) throw new ApiError(400, "paymentId is required", "VALIDATION");

      const { data: existing, error: eErr } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (eErr || !existing) throw new ApiError(404, "Payment not found", "NOT_FOUND");
      if (existing.status === "Captured") {
        return jsonResponse(formatPayment(existing));
      }

      if (outcome === "cancel") {
        const { data: cancelled } = await supabase
          .from("payments")
          .update({ status: "Cancelled" })
          .eq("id", paymentId)
          .select()
          .single();
        return jsonResponse(formatPayment(cancelled));
      }

      if (outcome === "fail") {
        const { data: failed } = await supabase
          .from("payments")
          .update({ status: "Failed" })
          .eq("id", paymentId)
          .select()
          .single();
        return jsonResponse(formatPayment(failed));
      }

      // Capture order via PayPal API
      const captureResult = await capturePaypalOrder(existing.paypal_order_ref || paymentId);
      const updated = await processCaptureAndSettlement(paymentId, captureResult.captureId);

      await logAudit({
        actor: "PayPal",
        action: "Payment Captured",
        reference: paymentId,
        aiPreparedSummary: `Captured payment ${paymentId} ref=${captureResult.captureId}`,
      });

      return jsonResponse(formatPayment(updated));
    }

    // 3. /payments/status or /paypal-order-status
    if (
      subpath === "status" ||
      subpath.endsWith("/status") ||
      url.pathname.includes("paypal-order-status")
    ) {
      const paymentId = url.searchParams.get("paymentId") || (await req.json().catch(() => ({}))).paymentId;
      if (!paymentId) throw new ApiError(400, "paymentId is required", "VALIDATION");

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (error || !data) throw new ApiError(404, "Payment not found", "NOT_FOUND");

      return jsonResponse(formatPayment(data));
    }

    // 4. /payments/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatPayment));
    }

    throw new ApiError(404, `Payment endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handlePaymentRoute);

