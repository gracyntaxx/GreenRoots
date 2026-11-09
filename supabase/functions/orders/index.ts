import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { calculatePlatformFee } from "../_shared/fees.ts";
import { logAudit } from "../_shared/audit.ts";

function formatOrder(row: any) {
  const totalAmountPaise = Number(row.total_amount_paise || row.total_price_paise || 0);
  const totalRupees = Math.round(totalAmountPaise / 100);
  const feePaise = Number(row.platform_fee_paise || Math.round(totalAmountPaise * 0.05));
  const netPaise = Number(row.farmer_net_paise || (totalAmountPaise - feePaise));

  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    buyerName: row.buyer?.name || "Buyer",
    farmerId: row.farmer_id,
    farmerName: row.farmer?.name || "Farmer",
    wasteType: row.waste_type,
    quantityKg: Number(row.quantity_kg),
    ratePerUnit: Number(row.rate_per_unit || 0),
    rateUnit: row.rate_unit || "quintal",
    totalAmount: totalRupees,
    totalPrice: totalRupees,
    platformFee: Math.round(feePaise / 100),
    farmerPayout: Math.round(netPaise / 100),
    collectionPointId: row.collection_point_id,
    collectionPointName: row.collection_point?.name || "Collection Point",
    stage: row.fulfilment || row.stage || "Ready for Pickup",
    fulfilment: row.fulfilment || row.stage || "Ready for Pickup",
    payment: row.payment || row.payment_status || "Initiated",
    paymentStatus: row.payment || row.payment_status || "Initiated",
    payout: row.payout || "Not Yet Due",
    payoutStatus: row.payout || "Not Yet Due",
    paypalOrderRef: row.paypal_order_ref,
    paypalCaptureRef: row.paypal_capture_ref,
    qrPayload: row.qr_payload || `{"order":"${row.id}"}`,
    dropOffToken: row.dropoff_token || row.id,
    timeline: row.timeline || [
      { id: "tl_1", at: row.created_at, label: "Order Created", state: "done" },
      { id: "tl_2", at: row.created_at, label: "Payment Captured", state: "done" },
    ],
    createdAt: row.created_at,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/orders\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /orders/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const body = await req.json().catch(() => ({}));
      const profile = body.profile || {};
      const role = profile.role || url.searchParams.get("role");
      let userId = profile.id || url.searchParams.get("userId");
      if (userId === "demo_buyer") userId = "b0000000-0000-0000-0000-000000000001";
      if (userId === "demo_farmer") userId = "a0000000-0000-0000-0000-000000000001";

      let query = supabase.from("orders").select(`
        *,
        buyer:profiles!orders_buyer_id_fkey(name),
        farmer:profiles!orders_farmer_id_fkey(name),
        collection_point:collection_points!orders_collection_point_id_fkey(name)
      `);

      if (role === "buyer" && userId) {
        query = query.eq("buyer_id", userId);
      } else if (role === "farmer" && userId) {
        query = query.eq("farmer_id", userId);
      } else if (userId && role !== "admin") {
        query = query.or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatOrder));
    }

    // 2. /orders/get
    if (subpath === "get" || subpath.endsWith("/get")) {
      const id = url.searchParams.get("id") || (await req.json().catch(() => ({}))).id;
      if (!id) throw new ApiError(400, "Order id required", "VALIDATION");

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(name),
          farmer:profiles!orders_farmer_id_fkey(name),
          collection_point:collection_points!orders_collection_point_id_fkey(name)
        `)
        .eq("id", id)
        .single();

      if (error || !data) throw new ApiError(404, "Order not found", "NOT_FOUND");

      return jsonResponse(formatOrder(data));
    }

    // 3. POST /orders/create
    if (subpath === "create" || subpath.endsWith("/create")) {
      const body = await req.json().catch(() => ({}));
      const { listingId, buyer, quantityKg, payment } = body;

      if (!listingId || !quantityKg || quantityKg <= 0) {
        throw new ApiError(400, "Valid listingId and quantity required", "VALIDATION");
      }

      const buyerId = (buyer?.id && buyer.id.includes("-")) ? buyer.id : "b0000000-0000-0000-0000-000000000001";

      // Check listing
      const { data: listing, error: lErr } = await supabase
        .from("listings")
        .select(`
          *,
          farmer:profiles!listings_farmer_id_fkey(name)
        `)
        .eq("id", listingId)
        .single();

      if (lErr || !listing) throw new ApiError(404, "Listing not found", "NOT_FOUND");

      const availableKg = Number(listing.quantity_kg);
      if (quantityKg > availableKg) {
        throw new ApiError(400, "That is more than the farmer has available.", "VALIDATION");
      }

      // Calculate fee & net in paise
      const ratePerKg = Number(listing.rate_per_unit || 0) / (listing.rate_unit === "tonne" ? 1000 : 100);
      const totalRupees = Math.round(quantityKg * ratePerKg);
      const totalPaise = totalRupees * 100;
      const { feePaise, netPaise } = calculatePlatformFee(totalPaise);

      const remainingKg = availableKg - quantityKg;
      const nextStatus = remainingKg <= 0 ? "Sold" : listing.status;

      // Update listing
      await supabase
        .from("listings")
        .update({
          quantity_kg: remainingKg,
          status: nextStatus,
        })
        .eq("id", listingId);

      const orderId = `order_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const { data: newOrder, error: oErr } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          listing_id: listingId,
          buyer_id: buyerId,
          farmer_id: listing.farmer_id,
          waste_type: listing.waste_type,
          quantity_kg: quantityKg,
          rate_per_unit: listing.rate_per_unit,
          rate_unit: listing.rate_unit,
          total_amount_paise: Number(totalPaise),
          collection_point_id: listing.collection_point_id,
          fulfilment: "Ready for Pickup",
          payment: payment?.status || "Captured",
          payout: "Not Yet Due",
          paypal_order_ref: payment?.paypalOrderRef || null,
          paypal_capture_ref: payment?.captureRef || null,
          timeline: [
            { id: "tl_1", at: nowIso, label: "Order Created", state: "done" },
            { id: "tl_2", at: nowIso, label: "Payment Captured", state: "done" },
          ],
        })
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(name),
          farmer:profiles!orders_farmer_id_fkey(name),
          collection_point:collection_points!orders_collection_point_id_fkey(name)
        `)
        .single();

      if (oErr) {
        console.error("[Orders] Create error:", oErr);
        throw new ApiError(500, oErr.message, "DATABASE_ERROR");
      }

      if (payment?.id) {
        await supabase
          .from("payments")
          .update({ reference_id: orderId })
          .eq("id", payment.id);
      }

      await logAudit({
        actor: buyer?.name || "Buyer",
        actorRole: "buyer",
        action: "Order created",
        reference: orderId,
        aiPreparedSummary: `Created direct order for ${quantityKg}kg ${listing.waste_type}`,
      });

      return jsonResponse(formatOrder(newOrder));
    }

    throw new ApiError(404, `Orders endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

