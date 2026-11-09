import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { verifyPaypalWebhookSignature } from "../_shared/paypal.ts";
import { processCaptureAndSettlement } from "../_shared/settlement.ts";
import { logAudit } from "../_shared/audit.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const headers = {
      authAlgo: req.headers.get("paypal-auth-algo"),
      certUrl: req.headers.get("paypal-cert-url"),
      transmissionId: req.headers.get("paypal-transmission-id"),
      transmissionSig: req.headers.get("paypal-transmission-sig"),
      transmissionTime: req.headers.get("paypal-transmission-time"),
    };

    const event = await req.json().catch(() => null);
    if (!event || !event.event_type) {
      throw new ApiError(400, "Invalid webhook event payload", "INVALID_PAYLOAD");
    }

    // Verify PayPal signature
    const isValid = await verifyPaypalWebhookSignature(headers, event);
    if (!isValid) {
      console.error("[PayPal Webhook] Signature verification failed");
      throw new ApiError(401, "Webhook signature verification failed", "INVALID_SIGNATURE");
    }

    const eventId = event.id || `evt_${Date.now()}`;
    const eventType = event.event_type;
    const resource = event.resource || {};
    const supabase = getAdminSupabaseClient();

    // Idempotency check on webhook event
    const { data: existingEvent } = await supabase
      .from("payment_webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .single();

    if (existingEvent) {
      console.log(`[PayPal Webhook] Event ${eventId} already processed.`);
      return jsonResponse({ received: true, duplicate: true });
    }

    // Record webhook event in audit table
    await supabase.from("payment_webhook_events").insert({
      event_id: eventId,
      event_type: eventType,
      payload: event,
      signature_verified: true,
    });

    // Handle relevant PayPal event types
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const captureId = resource.id;
      const paypalOrderRef = resource.supplementary_data?.related_ids?.order_id;

      // Find matching payment record
      let paymentQuery = supabase.from("payments").select("*");
      if (paypalOrderRef) {
        paymentQuery = paymentQuery.eq("paypal_order_ref", paypalOrderRef);
      } else {
        paymentQuery = paymentQuery.eq("capture_ref", captureId);
      }

      const { data: payment } = await paymentQuery.single();

      if (payment && payment.status !== "Captured") {
        await processCaptureAndSettlement(payment.id, captureId);
        await logAudit({
          actor: "PayPal Webhook",
          action: "Payment Captured Webhook",
          reference: payment.id,
          aiPreparedSummary: `Capture ${captureId} verified by webhook`,
        });
      }
    } else if (eventType === "CHECKOUT.ORDER.APPROVED") {
      const orderId = resource.id;
      await supabase
        .from("payments")
        .update({ status: "Approved" })
        .eq("paypal_order_ref", orderId)
        .eq("status", "Initiated");
    }

    return jsonResponse({ received: true, eventId, eventType });
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[PayPal Webhook Error]:", err);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

