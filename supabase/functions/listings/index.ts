import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { KG_PER_UNIT, toKg, QtyUnit, WasteType } from "../_shared/units.ts";
import { haversineKm } from "../_shared/tsp.ts";
import { logAudit } from "../_shared/audit.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/listings\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /listings/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const body = await req.json().catch(() => ({}));
      const origin = body.origin || { lat: 28.61, lng: 77.2 };

      let query = supabase.from("listings").select(`
        *,
        farmer:profiles!listings_farmer_id_fkey(name, reputation, phone, village)
      `);

      if (body.farmerId) {
        query = query.eq("farmer_id", body.farmerId);
      }
      if (body.status && body.status !== "all") {
        query = query.eq("status", body.status);
      } else if (!body.farmerId) {
        query = query.eq("status", "Active");
      }
      if (body.wasteType && body.wasteType !== "all") {
        query = query.eq("waste_type", body.wasteType);
      }
      if (body.collectionPointId) {
        query = query.eq("collection_point_id", body.collectionPointId);
      }

      const { data, error } = await query;
      if (error) {
        throw new ApiError(500, error.message, "DATABASE_ERROR");
      }

      let rows = (data || []).map((row: any) => {
        const point = parsePoint(row.location);
        const distanceKm = haversineKm(origin, point);
        const rateUnit = (row.rate_unit || "quintal") as QtyUnit;
        const ratePerKg = Number(row.rate_per_unit || 0) / KG_PER_UNIT[rateUnit];

        return {
          id: row.id,
          farmerId: row.farmer_id,
          farmerName: row.farmer?.name || "Farmer",
          farmerReputation: Number(row.farmer?.reputation || 4.5),
          farmerPhone: row.farmer?.phone || "",
          wasteType: row.waste_type,
          quantityKg: Number(row.quantity_kg),
          ratePerUnit: Number(row.rate_per_unit),
          rateUnit,
          ratePerKg,
          village: row.village,
          collectionPointId: row.collection_point_id,
          location: point,
          distanceKm,
          status: row.status,
          cropSeason: row.crop_season,
          notes: row.notes,
          createdAt: row.created_at,
        };
      });

      if (body.q) {
        const q = String(body.q).toLowerCase();
        rows = rows.filter(
          (l) =>
            l.wasteType.replace("_", " ").includes(q) ||
            l.farmerName.toLowerCase().includes(q) ||
            l.village.toLowerCase().includes(q)
        );
      }
      if (body.maxDistanceKm) rows = rows.filter((l) => l.distanceKm <= body.maxDistanceKm);
      if (body.minQtyKg) rows = rows.filter((l) => l.quantityKg >= body.minQtyKg);
      if (body.maxQtyKg) rows = rows.filter((l) => l.quantityKg <= body.maxQtyKg);
      if (body.maxRatePerKg) rows = rows.filter((l) => l.ratePerKg <= body.maxRatePerKg);

      switch (body.sort) {
        case "price":
          rows.sort((a, b) => a.ratePerKg - b.ratePerKg);
          break;
        case "trusted":
          rows.sort((a, b) => b.farmerReputation - a.farmerReputation);
          break;
        default:
          rows.sort((a, b) => a.distanceKm - b.distanceKm);
      }

      return jsonResponse(rows);
    }

    // 2. /listings/get
    if (subpath === "get" || subpath.endsWith("/get")) {
      const id = url.searchParams.get("id") || (await req.json().catch(() => ({}))).id;
      if (!id) throw new ApiError(400, "Listing id is required", "VALIDATION");

      const { data: row, error } = await supabase
        .from("listings")
        .select(`
          *,
          farmer:profiles!listings_farmer_id_fkey(name, reputation, phone, village)
        `)
        .eq("id", id)
        .single();

      if (error || !row) throw new ApiError(404, "Listing not found", "NOT_FOUND");

      const point = parsePoint(row.location);
      const origin = { lat: 28.61, lng: 77.2 };
      const rateUnit = (row.rate_unit || "quintal") as QtyUnit;

      return jsonResponse({
        id: row.id,
        farmerId: row.farmer_id,
        farmerName: row.farmer?.name || "Farmer",
        farmerReputation: Number(row.farmer?.reputation || 4.5),
        farmerPhone: row.farmer?.phone || "",
        wasteType: row.waste_type,
        quantityKg: Number(row.quantity_kg),
        ratePerUnit: Number(row.rate_per_unit),
        rateUnit,
        ratePerKg: Number(row.rate_per_unit || 0) / KG_PER_UNIT[rateUnit],
        village: row.village,
        collectionPointId: row.collection_point_id,
        location: point,
        distanceKm: haversineKm(origin, point),
        status: row.status,
        cropSeason: row.crop_season,
        notes: row.notes,
        createdAt: row.created_at,
      });
    }

    // 3. POST /listings/create
    if (subpath === "create" || subpath.endsWith("/create")) {
      const body = await req.json().catch(() => ({}));
      const { draft, collectionPointId, farmer } = body;

      if (!draft || !draft.wasteType || !draft.quantity || !draft.rate) {
        throw new ApiError(400, "Some required details are missing.", "VALIDATION");
      }
      if (Number(draft.quantity) <= 0) {
        throw new ApiError(400, "Quantity must be more than zero.", "VALIDATION");
      }

      const farmerId = farmer?.id || body.farmerId || "demo_farmer";
      const quantityKg = toKg(Number(draft.quantity), draft.unit || "quintal");
      const village = draft.village || farmer?.village || "Rewari";

      const { data: newRow, error } = await supabase
        .from("listings")
        .insert({
          farmer_id: farmerId,
          waste_type: draft.wasteType,
          quantity_kg: quantityKg,
          rate_per_unit: Number(draft.rate),
          rate_unit: draft.rateUnit || draft.unit || "quintal",
          village,
          collection_point_id: collectionPointId || null,
          location: `SRID=4326;POINT(76.6200 28.1800)`,
          status: "Active",
          notes: draft.rawText || null,
        })
        .select(`
          *,
          farmer:profiles!listings_farmer_id_fkey(name, reputation, phone)
        `)
        .single();

      if (error) {
        throw new ApiError(500, error.message, "DATABASE_ERROR");
      }

      await logAudit({
        actor: farmer?.name || "Farmer",
        actorRole: "farmer",
        action: "Listing created",
        reference: newRow.id,
        aiPreparedSummary: `Created listing for ${draft.wasteType} ${draft.quantity} ${draft.unit}`,
      });

      return jsonResponse({
        id: newRow.id,
        farmerId: newRow.farmer_id,
        farmerName: newRow.farmer?.name || farmer?.name || "Farmer",
        farmerReputation: Number(newRow.farmer?.reputation || 4.5),
        farmerPhone: newRow.farmer?.phone || "",
        wasteType: newRow.waste_type,
        quantityKg: Number(newRow.quantity_kg),
        ratePerUnit: Number(newRow.rate_per_unit),
        rateUnit: newRow.rate_unit,
        village: newRow.village,
        collectionPointId: newRow.collection_point_id,
        location: parsePoint(newRow.location),
        status: newRow.status,
        cropSeason: newRow.crop_season,
        notes: newRow.notes,
        createdAt: newRow.created_at,
      });
    }

    // 4. POST /listings/update
    if (subpath === "update" || subpath.endsWith("/update")) {
      const body = await req.json().catch(() => ({}));
      const { id, patch } = body;
      if (!id || !patch) throw new ApiError(400, "Id and patch are required", "VALIDATION");

      const updateData: Record<string, unknown> = {};
      if (patch.quantityKg !== undefined) updateData.quantity_kg = patch.quantityKg;
      if (patch.ratePerUnit !== undefined) updateData.rate_per_unit = patch.ratePerUnit;
      if (patch.rateUnit !== undefined) updateData.rate_unit = patch.rateUnit;
      if (patch.status !== undefined) updateData.status = patch.status;
      if (patch.notes !== undefined) updateData.notes = patch.notes;

      const { data: updated, error } = await supabase
        .from("listings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error || !updated) throw new ApiError(500, error?.message || "Update failed", "DATABASE_ERROR");

      return jsonResponse(updated);
    }

    // 5. POST /listings/delete
    if (subpath === "delete" || subpath.endsWith("/delete")) {
      const body = await req.json().catch(() => ({}));
      const id = body.id || url.searchParams.get("id");
      if (!id) throw new ApiError(400, "Listing id required", "VALIDATION");

      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse({ ok: true });
    }

    // 6. /listings/recommend
    if (subpath === "recommend" || subpath.endsWith("/recommend")) {
      const body = await req.json().catch(() => ({}));
      const origin = body.origin || { lat: 28.61, lng: 77.2 };

      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          farmer:profiles!listings_farmer_id_fkey(name, reputation, phone, village)
        `)
        .eq("status", "Active")
        .limit(10);

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || []).map((row: any) => {
        const point = parsePoint(row.location);
        const distanceKm = haversineKm(origin, point);
        const rateUnit = (row.rate_unit || "quintal") as QtyUnit;
        const ratePerKg = Number(row.rate_per_unit || 0) / KG_PER_UNIT[rateUnit];
        const reputation = Number(row.farmer?.reputation || 4.5);

        const distanceScore = Math.max(0, 40 - distanceKm);
        const trustScore = reputation * 8;
        const priceScore = Math.max(0, 30 - ratePerKg);

        return {
          listing: {
            id: row.id,
            farmerId: row.farmer_id,
            farmerName: row.farmer?.name || "Farmer",
            farmerReputation: reputation,
            farmerPhone: row.farmer?.phone || "",
            wasteType: row.waste_type,
            quantityKg: Number(row.quantity_kg),
            ratePerUnit: Number(row.rate_per_unit),
            rateUnit,
            ratePerKg,
            village: row.village,
            collectionPointId: row.collection_point_id,
            location: point,
            distanceKm,
            status: row.status,
            cropSeason: row.crop_season,
            notes: row.notes,
            createdAt: row.created_at,
          },
          score: distanceScore + trustScore + priceScore,
        };
      });

      rows.sort((a: any, b: any) => b.score - a.score);
      const top3 = rows.slice(0, 3).map(({ listing }: any, i: number) => ({
        listing,
        reason:
          i === 0
            ? `Nearest active listing (${listing.distanceKm.toFixed(0)} km) with a trusted seller.`
            : i === 1
            ? `Good price at ₹${listing.ratePerKg.toFixed(0)}/kg, ${listing.distanceKm.toFixed(0)} km away.`
            : `Reliable seller rated ${listing.farmerReputation.toFixed(1)} with verified quality.`,
      }));

      return jsonResponse(top3);
    }

    throw new ApiError(404, `Listings endpoint not found: ${subpath}`, "NOT_FOUND");
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
  if (!loc) return { lat: 28.61, lng: 77.2 };
  if (typeof loc === "object" && typeof loc.lat === "number") return loc;
  if (typeof loc === "string") {
    const m = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
  }
  return { lat: 28.61, lng: 77.2 };
}

