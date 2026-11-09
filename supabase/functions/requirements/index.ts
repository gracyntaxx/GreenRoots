import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { KG_PER_UNIT, toKg, QtyUnit } from "../_shared/units.ts";
import { haversineKm } from "../_shared/tsp.ts";
import { logAudit } from "../_shared/audit.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/requirements\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /requirements/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const body = await req.json().catch(() => ({}));
      const origin = body.origin || { lat: 28.61, lng: 77.2 };

      const { data: reqs, error: reqErr } = await supabase
        .from("requirements")
        .select(`
          *,
          industry:profiles!requirements_industry_id_fkey(name, reputation, phone, village)
        `);

      if (reqErr) throw new ApiError(500, reqErr.message, "DATABASE_ERROR");

      const { data: pools } = await supabase.from("pools").select("id, requirement_id, committed_kg");
      const poolMap = new Map<string, any>((pools || []).map((p: any) => [p.requirement_id || p.id, p]));

      const rows = (reqs || []).map((r: any) => {
        const point = parsePoint(r.location);
        const distanceKm = haversineKm(origin, point);
        const rateUnit = (r.rate_unit || "tonne") as QtyUnit;
        const ratePerKg = Number(r.rate_per_unit || 0) / KG_PER_UNIT[rateUnit];
        const pool = poolMap.get(r.id) || poolMap.get(r.pool_id);
        const committedKg = Number(pool?.committed_kg || 0);
        const targetKg = Number(r.target_kg);

        return {
          id: r.id,
          industryId: r.industry_id,
          industryName: r.industry?.name || "Industry Partner",
          wasteType: r.waste_type,
          targetKg,
          ratePerUnit: Number(r.rate_per_unit),
          rateUnit,
          ratePerKg,
          committedKg,
          remainingKg: Math.max(0, targetKg - committedKg),
          deadline: r.deadline,
          status: r.status,
          poolId: r.pool_id,
          village: r.village,
          location: point,
          distanceKm,
          notes: r.notes,
          createdAt: r.created_at,
        };
      });

      return jsonResponse(rows);
    }

    // 2. /requirements/get
    if (subpath === "get" || subpath.endsWith("/get")) {
      const id = url.searchParams.get("id") || (await req.json().catch(() => ({}))).id;
      if (!id) throw new ApiError(400, "Requirement id is required", "VALIDATION");

      const { data: r, error } = await supabase
        .from("requirements")
        .select(`
          *,
          industry:profiles!requirements_industry_id_fkey(name, reputation, phone, village)
        `)
        .eq("id", id)
        .single();

      if (error || !r) throw new ApiError(404, "Requirement not found", "NOT_FOUND");

      const { data: pool } = await supabase
        .from("pools")
        .select("committed_kg")
        .eq("id", r.pool_id)
        .single();

      const point = parsePoint(r.location);
      const origin = { lat: 28.61, lng: 77.2 };
      const rateUnit = (r.rate_unit || "tonne") as QtyUnit;
      const committedKg = Number(pool?.committed_kg || 0);
      const targetKg = Number(r.target_kg);

      return jsonResponse({
        id: r.id,
        industryId: r.industry_id,
        industryName: r.industry?.name || "Industry Partner",
        wasteType: r.waste_type,
        targetKg,
        ratePerUnit: Number(r.rate_per_unit),
        rateUnit,
        ratePerKg: Number(r.rate_per_unit || 0) / KG_PER_UNIT[rateUnit],
        committedKg,
        remainingKg: Math.max(0, targetKg - committedKg),
        deadline: r.deadline,
        status: r.status,
        poolId: r.pool_id,
        village: r.village,
        location: point,
        distanceKm: haversineKm(origin, point),
        notes: r.notes,
        createdAt: r.created_at,
      });
    }

    // 3. POST /requirements/create
    if (subpath === "create" || subpath.endsWith("/create")) {
      const body = await req.json().catch(() => ({}));
      const { industry, wasteType, quantity, unit = "tonne", rate, rateUnit, deadline, village, location, notes } = body;

      if (!wasteType || !quantity || !rate || !deadline) {
        throw new ApiError(400, "Some required details are missing.", "VALIDATION");
      }

      const industryId = industry?.id || body.industryId || "demo_industry";
      const targetKg = toKg(Number(quantity), unit as QtyUnit);
      const point = location || { lat: 28.18, lng: 76.62 };
      const pointStr = `SRID=4326;POINT(${point.lng} ${point.lat})`;

      const reqId = `req_${Date.now()}`;
      const poolId = `pool_${Date.now()}`;

      // Insert requirement
      const { data: reqRow, error: reqErr } = await supabase
        .from("requirements")
        .insert({
          id: reqId,
          industry_id: industryId,
          waste_type: wasteType,
          target_kg: targetKg,
          rate_per_unit: Number(rate),
          rate_unit: rateUnit || unit,
          deadline,
          status: "Open",
          pool_id: poolId,
          village: village || industry?.village || "Bawal",
          location: pointStr,
          notes: notes || null,
        })
        .select(`
          *,
          industry:profiles!requirements_industry_id_fkey(name)
        `)
        .single();

      if (reqErr) throw new ApiError(500, reqErr.message, "DATABASE_ERROR");

      // Auto-create matching pool
      const { error: poolErr } = await supabase.from("pools").insert({
        id: poolId,
        requirement_id: reqId,
        industry_id: industryId,
        waste_type: wasteType,
        target_kg: targetKg,
        committed_kg: 0,
        rate_per_unit: Number(rate),
        rate_unit: rateUnit || unit,
        deadline,
        radius_km: 15,
        stage: "Open for Commitments",
        village: village || industry?.village || "Bawal",
        location: pointStr,
        contribution_count: 0,
      });

      if (poolErr) {
        console.error("[Pool Auto-create Error]:", poolErr);
      }

      await logAudit({
        actor: industry?.name || "Industry Partner",
        actorRole: "industry",
        action: "Requirement created",
        reference: reqId,
        aiPreparedSummary: `Created requirement ${wasteType} target=${targetKg}kg rate=₹${rate}/${unit}`,
      });

      return jsonResponse({
        requirement: {
          id: reqRow.id,
          industryId: reqRow.industry_id,
          industryName: reqRow.industry?.name || "Industry Partner",
          wasteType: reqRow.waste_type,
          targetKg: Number(reqRow.target_kg),
          ratePerUnit: Number(reqRow.rate_per_unit),
          rateUnit: reqRow.rate_unit,
          deadline: reqRow.deadline,
          status: reqRow.status,
          poolId: poolId,
          village: reqRow.village,
          location: point,
          notes: reqRow.notes,
          createdAt: reqRow.created_at,
        },
        poolId,
      });
    }

    throw new ApiError(404, `Requirements endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parsePoint(loc: any): { lat: number; lng: number } {
  if (!loc) return { lat: 28.18, lng: 76.62 };
  if (typeof loc === "object" && typeof loc.lat === "number") return loc;
  if (typeof loc === "string") {
    const m = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
  }
  return { lat: 28.18, lng: 76.62 };
}

