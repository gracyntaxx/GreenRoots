import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { haversineKm } from "../_shared/tsp.ts";
import { logAudit } from "../_shared/audit.ts";

function daysUntil(iso: string): number {
  const d = new Date(iso);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function parsePoint(loc: any): { lat: number; lng: number } {
  if (!loc) return { lat: 28.18, lng: 76.62 };
  if (typeof loc === "object" && typeof loc.lat === "number") return loc;
  if (typeof loc === "string") {
    const m = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
  }
  return { lat: 28.18, lng: 76.62 };
}

function formatPoolMeta(pool: any, origin: { lat: number; lng: number }) {
  const point = parsePoint(pool.location);
  const targetKg = Number(pool.target_kg);
  const committedKg = Number(pool.committed_kg);
  const distanceKm = haversineKm(origin, point);
  const percent = Math.min(100, Math.round((committedKg / (targetKg || 1)) * 100));
  const remainingKg = Math.max(0, targetKg - committedKg);
  const daysLeft = daysUntil(pool.deadline);

  return {
    id: pool.id,
    industryId: pool.industry_id,
    industryName: pool.industry?.name || "Industry Partner",
    wasteType: pool.waste_type,
    targetKg,
    committedKg,
    ratePerUnit: Number(pool.rate_per_unit),
    rateUnit: pool.rate_unit,
    deadline: pool.deadline,
    radiusKm: Number(pool.radius_km || 15),
    stage: pool.stage,
    village: pool.village,
    location: point,
    contributionCount: Number(pool.contribution_count || 0),
    distanceKm,
    percent,
    remainingKg,
    daysLeft,
    createdAt: pool.created_at,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/pools\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /pools/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const body = await req.json().catch(() => ({}));
      const origin = body.origin || { lat: 28.61, lng: 77.2 };
      const industryId = body.industryId || url.searchParams.get("industryId");

      let query = supabase.from("pools").select(`
        *,
        industry:profiles!pools_industry_id_fkey(name, reputation, phone, village)
      `);

      if (industryId) {
        query = query.eq("industry_id", industryId);
      }

      const { data, error } = await query;
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((p: any) => formatPoolMeta(p, origin));
      return jsonResponse(rows);
    }

    // 2. /pools/get
    if (subpath === "get" || subpath.endsWith("/get")) {
      const id = url.searchParams.get("id") || (await req.json().catch(() => ({}))).id;
      if (!id) throw new ApiError(400, "Pool id required", "VALIDATION");

      const origin = { lat: 28.61, lng: 77.2 };
      const { data: pool, error } = await supabase
        .from("pools")
        .select(`
          *,
          industry:profiles!pools_industry_id_fkey(name, reputation, phone, village)
        `)
        .eq("id", id)
        .single();

      if (error || !pool) throw new ApiError(404, "Pool not found", "NOT_FOUND");

      return jsonResponse(formatPoolMeta(pool, origin));
    }

    // 3. /pools/contributions
    if (subpath === "contributions" || subpath.endsWith("/contributions")) {
      const poolId = url.searchParams.get("poolId") || (await req.json().catch(() => ({}))).poolId;
      if (!poolId) throw new ApiError(400, "poolId required", "VALIDATION");

      const { data, error } = await supabase
        .from("pool_contributions")
        .select(`
          *,
          farmer:profiles!pool_contributions_farmer_id_fkey(name, reputation, phone),
          collection_point:collection_points!pool_contributions_collection_point_id_fkey(name, village)
        `)
        .eq("pool_id", poolId);

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((c: any) => ({
        id: c.id,
        poolId: c.pool_id,
        farmerId: c.farmer_id,
        farmerName: c.farmer?.name || "Farmer",
        farmerReputation: Number(c.farmer?.reputation || 4.5),
        committedKg: Number(c.committed_kg),
        acceptedKg: c.accepted_kg !== null ? Number(c.accepted_kg) : undefined,
        collectionPointId: c.collection_point_id,
        collectionPointName: c.collection_point?.name || "Collection Point",
        dropOffToken: c.dropoff_token,
        qrPayload: c.qr_payload,
        stage: c.stage,
        payment: c.payment,
        createdAt: c.created_at,
      }));

      return jsonResponse(rows);
    }

    // 4. /pools/mine
    if (subpath === "mine" || subpath.endsWith("/mine")) {
      const body = await req.json().catch(() => ({}));
      const farmerId = body.farmerId || url.searchParams.get("farmerId");
      const origin = body.origin || { lat: 28.61, lng: 77.2 };

      if (!farmerId) throw new ApiError(400, "farmerId required", "VALIDATION");

      const { data: contribs } = await supabase
        .from("pool_contributions")
        .select("pool_id")
        .eq("farmer_id", farmerId);

      const poolIds = Array.from(new Set((contribs || []).map((c: any) => c.pool_id)));

      if (!poolIds.length) return jsonResponse([]);

      const { data: pools, error } = await supabase
        .from("pools")
        .select(`
          *,
          industry:profiles!pools_industry_id_fkey(name, reputation, phone, village)
        `)
        .in("id", poolIds);

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((pools || []).map((p: any) => formatPoolMeta(p, origin)));
    }

    // 5. POST /pools/commit
    if (subpath === "commit" || subpath.endsWith("/commit")) {
      const body = await req.json().catch(() => ({}));
      const { poolId, farmer, quantityKg, collectionPointId } = body;

      if (!poolId || !quantityKg || quantityKg <= 0) {
        throw new ApiError(400, "Valid poolId and positive quantity are required.", "VALIDATION");
      }

      const farmerId = farmer?.id || body.farmerId || "demo_farmer";

      // Fetch current pool state
      const { data: pool, error: poolErr } = await supabase
        .from("pools")
        .select(`
          *,
          industry:profiles!pools_industry_id_fkey(name, reputation, phone, village)
        `)
        .eq("id", poolId)
        .single();

      if (poolErr || !pool) throw new ApiError(404, "Pool not found", "NOT_FOUND");

      const newCommitted = Number(pool.committed_kg) + Number(quantityKg);
      const newCount = Number(pool.contribution_count || 0) + 1;
      const targetKg = Number(pool.target_kg);
      const nextStage = newCommitted >= targetKg ? "Ready for Pickup" : pool.stage;

      // Update pool
      await supabase
        .from("pools")
        .update({
          committed_kg: newCommitted,
          contribution_count: newCount,
          stage: nextStage,
        })
        .eq("id", poolId);

      // Create contribution
      const token = `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const contribId = `contrib_${Date.now()}`;
      const qrPayload = JSON.stringify({
        token,
        poolId,
        farmerId,
        quantityKg,
        cp: collectionPointId,
      });

      const { data: contrib, error: cErr } = await supabase
        .from("pool_contributions")
        .insert({
          id: contribId,
          pool_id: poolId,
          farmer_id: farmerId,
          committed_kg: quantityKg,
          collection_point_id: collectionPointId,
          dropoff_token: token,
          qr_payload: qrPayload,
          stage: "Committed",
          payment: "Pending",
        })
        .select()
        .single();

      if (cErr) throw new ApiError(500, cErr.message, "DATABASE_ERROR");

      // Also get collection point name
      const { data: cp } = await supabase
        .from("collection_points")
        .select("name")
        .eq("id", collectionPointId)
        .single();

      const origin = farmer?.location || { lat: 28.61, lng: 77.2 };
      const updatedPoolMeta = formatPoolMeta(
        { ...pool, committed_kg: newCommitted, contribution_count: newCount, stage: nextStage },
        origin
      );

      const contributionResult = {
        id: contrib.id,
        poolId: contrib.pool_id,
        farmerId: contrib.farmer_id,
        farmerName: farmer?.name || "Farmer",
        farmerReputation: Number(farmer?.reputation || 4.5),
        committedKg: Number(contrib.committed_kg),
        acceptedKg: undefined,
        collectionPointId: contrib.collection_point_id,
        collectionPointName: cp?.name || "Collection Point",
        dropOffToken: token,
        qrPayload,
        stage: contrib.stage,
        payment: contrib.payment,
        createdAt: contrib.created_at,
      };

      await logAudit({
        actor: farmer?.name || "Farmer",
        actorRole: "farmer",
        action: "Committed to pool",
        reference: poolId,
        aiPreparedSummary: `Committed ${quantityKg}kg to pool ${poolId}`,
      });

      return jsonResponse({
        pool: updatedPoolMeta,
        contribution: contributionResult,
      });
    }

    // 6. POST /pools/expand
    if (subpath === "expand" || subpath.endsWith("/expand")) {
      const body = await req.json().catch(() => ({}));
      const { id, km } = body;
      if (!id || !km) throw new ApiError(400, "Pool id and km are required", "VALIDATION");

      const { data: pool, error } = await supabase
        .from("pools")
        .update({ radius_km: km })
        .eq("id", id)
        .select(`
          *,
          industry:profiles!pools_industry_id_fkey(name, reputation, phone, village)
        `)
        .single();

      if (error || !pool) throw new ApiError(500, error?.message || "Pool update failed", "DATABASE_ERROR");

      await supabase.from("pool_change_proposals").insert({
        pool_id: id,
        change_type: "Radius Expansion",
        proposed_by_role: "industry",
        current_value: `${pool.radius_km} km`,
        proposed_value: `${km} km`,
        ai_rationale: `Expanding search radius to reach additional farming clusters within ${km} km.`,
        status: "Approved",
      });

      return jsonResponse(formatPoolMeta(pool, { lat: 28.61, lng: 77.2 }));
    }

    // 7. POST /pools/extend
    if (subpath === "extend" || subpath.endsWith("/extend")) {
      const body = await req.json().catch(() => ({}));
      const { id, deadline } = body;
      if (!id || !deadline) throw new ApiError(400, "Pool id and deadline are required", "VALIDATION");

      const { data: pool, error } = await supabase
        .from("pools")
        .update({ deadline })
        .eq("id", id)
        .select(`
          *,
          industry:profiles!pools_industry_id_fkey(name, reputation, phone, village)
        `)
        .single();

      if (error || !pool) throw new ApiError(500, error?.message || "Pool update failed", "DATABASE_ERROR");

      return jsonResponse(formatPoolMeta(pool, { lat: 28.61, lng: 77.2 }));
    }

    throw new ApiError(404, `Pools endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

