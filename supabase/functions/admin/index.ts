import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { logAudit } from "../_shared/audit.ts";

function formatVerification(v: any) {
  return {
    id: v.id,
    industryId: v.industry_id,
    businessName: v.business_name,
    licenseNumber: v.license_number,
    registeredAddress: v.registered_address,
    contactPerson: v.contact_person,
    documents: v.documents || [],
    status: v.status,
    notes: v.notes || undefined,
    submittedAt: v.submitted_at || v.created_at,
    decidedAt: v.decided_at || undefined,
    reviewedBy: v.reviewed_by || undefined,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/admin\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /admin/verifications
    if (subpath === "verifications" || subpath.endsWith("/verifications")) {
      const { data, error } = await supabase
        .from("industry_verifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatVerification));
    }

    // 2. POST /admin/verify-industry
    if (subpath === "verify-industry" || subpath.endsWith("/verify-industry")) {
      const body = await req.json().catch(() => ({}));
      const { id, decision, reason } = body;

      if (!id || !decision) {
        throw new ApiError(400, "Verification id and decision required.", "VALIDATION");
      }
      if (decision === "Rejected" && !reason?.trim()) {
        throw new ApiError(400, "A rejection reason is required.", "VALIDATION");
      }

      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from("industry_verifications")
        .update({
          status: decision,
          notes: reason || null,
          decided_at: now,
          reviewed_by: "Admin",
        })
        .eq("id", id)
        .select()
        .single();

      if (error || !updated) throw new ApiError(500, error?.message || "Verification update failed", "DATABASE_ERROR");

      // Update corresponding industry profile
      if (decision === "Verified") {
        await supabase
          .from("profiles")
          .update({ verified: true })
          .eq("id", updated.industry_id);
      }

      await logAudit({
        actor: "Admin",
        actorRole: "admin",
        action: `Industry ${decision}`,
        reference: id,
        aiPreparedSummary: `Industry verification ${id} for ${updated.business_name} set to ${decision}`,
      });

      return jsonResponse(formatVerification(updated));
    }

    // 3. /admin/users
    if (subpath === "users" || subpath.endsWith("/users")) {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        phone: p.phone,
        email: p.email,
        village: p.village,
        district: p.district,
        state: p.state,
        language: p.language,
        location: { lat: 28.61, lng: 77.2 },
        reputation: Number(p.reputation || 0),
        reputationFactors: p.reputation_factors || [],
        payoutReadiness: p.payout_readiness || "Not set up",
        verified: Boolean(p.verified),
        avatarInitials: p.avatar_initials || "GR",
        joined: p.created_at ? String(p.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
      }));

      return jsonResponse(rows);
    }

    // 4. /admin/listings
    if (subpath === "listings" || subpath.endsWith("/listings")) {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          farmer:profiles!listings_farmer_id_fkey(name, reputation, phone, village)
        `)
        .order("created_at", { ascending: false });

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((row: any) => ({
        id: row.id,
        farmerId: row.farmer_id,
        farmerName: row.farmer?.name || "Farmer",
        farmerReputation: Number(row.farmer?.reputation || 4.5),
        farmerPhone: row.farmer?.phone || "",
        wasteType: row.waste_type,
        quantityKg: Number(row.quantity_kg),
        ratePerUnit: Number(row.rate_per_unit),
        rateUnit: row.rate_unit,
        village: row.village,
        collectionPointId: row.collection_point_id,
        location: { lat: 28.61, lng: 77.2 },
        status: row.status,
        cropSeason: row.crop_season,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return jsonResponse(rows);
    }

    // 5. /admin/requirements
    if (subpath === "requirements" || subpath.endsWith("/requirements")) {
      const { data, error } = await supabase
        .from("requirements")
        .select(`
          *,
          industry:profiles!requirements_industry_id_fkey(name, reputation, phone, village)
        `)
        .order("created_at", { ascending: false });

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((r: any) => ({
        id: r.id,
        industryId: r.industry_id,
        industryName: r.industry?.name || "Industry Partner",
        wasteType: r.waste_type,
        targetKg: Number(r.target_kg),
        ratePerUnit: Number(r.rate_per_unit),
        rateUnit: r.rate_unit,
        deadline: r.deadline,
        status: r.status,
        poolId: r.pool_id,
        village: r.village,
        location: { lat: 28.18, lng: 76.62 },
        notes: r.notes,
        createdAt: r.created_at,
      }));

      return jsonResponse(rows);
    }

    // 6. POST /admin/remove-listing
    if (subpath === "remove-listing" || subpath.endsWith("/remove-listing")) {
      const body = await req.json().catch(() => ({}));
      const { id, reason } = body;
      if (!id || !reason?.trim()) throw new ApiError(400, "Id and reason required", "VALIDATION");

      await supabase.from("listings").delete().eq("id", id);

      await logAudit({
        actor: "Priya Menon",
        actorRole: "admin",
        action: "Listing removed",
        reference: id,
        aiPreparedSummary: `Remove listing ${id}`,
        confirmedBy: "Priya Menon",
        outcome: reason,
      });

      return jsonResponse({ ok: true });
    }

    // 7. POST /admin/remove-requirement
    if (subpath === "remove-requirement" || subpath.endsWith("/remove-requirement")) {
      const body = await req.json().catch(() => ({}));
      const { id, reason } = body;
      if (!id || !reason?.trim()) throw new ApiError(400, "Id and reason required", "VALIDATION");

      await supabase.from("requirements").delete().eq("id", id);

      await logAudit({
        actor: "Priya Menon",
        actorRole: "admin",
        action: "Requirement removed",
        reference: id,
        aiPreparedSummary: `Remove requirement ${id}`,
        confirmedBy: "Priya Menon",
        outcome: reason,
      });

      return jsonResponse({ ok: true });
    }

    // 8. /admin/collection-points
    if (subpath === "collection-points" || subpath.endsWith("/collection-points")) {
      const { data, error } = await supabase.from("collection_points").select("*");
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        village: c.village,
        district: c.district,
        state: c.state,
        location: { lat: 28.18, lng: 76.62 },
        capacityTonnes: Number(c.capacity_tonnes || 50),
        hours: c.hours || "6:00 AM – 6:00 PM",
        active: Boolean(c.active),
        dropOffsToday: Number(c.dropoffs_today || 0),
      }));

      return jsonResponse(rows);
    }

    // 9. /admin/payables
    if (subpath === "payables" || subpath.endsWith("/payables")) {
      const { data, error } = await supabase.from("farmer_payables").select("*");
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((p: any) => ({
        id: p.id,
        poolId: p.pool_id,
        farmerId: p.farmer_id,
        farmerName: p.farmer_name,
        verifiedKg: Number(p.verified_kg),
        sharePercent: Number(p.share_percent),
        gross: Math.round(Number(p.gross_paise) / 100),
        fee: Math.round(Number(p.fee_paise) / 100),
        net: Math.round(Number(p.net_paise) / 100),
        payout: p.payout_status,
        payoutBatchId: p.payout_batch_id || undefined,
        paidAt: p.paid_at || undefined,
      }));

      return jsonResponse(rows);
    }

    throw new ApiError(404, `Admin endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

