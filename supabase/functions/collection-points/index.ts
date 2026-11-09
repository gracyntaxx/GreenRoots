import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { haversineKm, twoOptOptimization, partitionRouteByCapacity, RouteStop } from "../_shared/tsp.ts";
import { logAudit } from "../_shared/audit.ts";

function parsePoint(loc: any): { lat: number; lng: number } {
  if (!loc) return { lat: 28.18, lng: 76.62 };
  if (typeof loc === "object" && typeof loc.lat === "number") return loc;
  if (typeof loc === "string") {
    const m = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
  }
  return { lat: 28.18, lng: 76.62 };
}

function formatCollectionPoint(c: any, origin?: { lat: number; lng: number }) {
  const point = parsePoint(c.location);
  const distanceKm = origin ? haversineKm(origin, point) : 0;

  return {
    id: c.id,
    name: c.name,
    village: c.village,
    district: c.district,
    state: c.state,
    location: point,
    capacityTonnes: Number(c.capacity_tonnes || 50),
    hours: c.hours || "6:00 AM – 6:00 PM",
    active: Boolean(c.active),
    dropOffsToday: Number(c.dropoffs_today || 0),
    distanceKm,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/collection-points\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /collection-points/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const body = await req.json().catch(() => ({}));
      const origin = body.origin || { lat: 28.61, lng: 77.2 };

      const { data, error } = await supabase.from("collection_points").select("*");
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      const rows = (data || [])
        .map((c: any) => formatCollectionPoint(c, origin))
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

      return jsonResponse(rows);
    }

    // 2. /collection-points/get
    if (subpath === "get" || subpath.endsWith("/get")) {
      const id = url.searchParams.get("id") || (await req.json().catch(() => ({}))).id;
      if (!id) throw new ApiError(400, "Collection point id required", "VALIDATION");

      const { data, error } = await supabase
        .from("collection_points")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) throw new ApiError(404, "Collection point not found", "NOT_FOUND");

      return jsonResponse(formatCollectionPoint(data));
    }

    // 3. /collection-points/suggest
    if (subpath === "suggest" || subpath.endsWith("/suggest")) {
      const body = await req.json().catch(() => ({}));
      const target = body.destination || body.origin || { lat: 28.61, lng: 77.2 };

      const { data, error } = await supabase
        .from("collection_points")
        .select("*")
        .eq("active", true);

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");
      if (!data || !data.length) throw new ApiError(404, "No active collection points nearby.", "NOT_FOUND");

      const ranked = data
        .map((c: any) => formatCollectionPoint(c, target))
        .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

      return jsonResponse(ranked[0]);
    }

    // 4. POST /collection-points/save
    if (subpath === "save" || subpath.endsWith("/save")) {
      const point = await req.json().catch(() => ({}));

      const locationStr = point.location
        ? `SRID=4326;POINT(${point.location.lng} ${point.location.lat})`
        : `SRID=4326;POINT(76.6200 28.1800)`;

      if (point.id) {
        const { data: updated, error } = await supabase
          .from("collection_points")
          .update({
            name: point.name,
            village: point.village,
            district: point.district,
            state: point.state,
            capacity_tonnes: point.capacityTonnes,
            hours: point.hours,
            active: point.active,
            location: locationStr,
          })
          .eq("id", point.id)
          .select()
          .single();

        if (error || !updated) throw new ApiError(500, error?.message || "Failed to update", "DATABASE_ERROR");

        await logAudit({
          actor: "Admin",
          actorRole: "admin",
          action: "Collection Point updated",
          reference: point.id,
        });

        return jsonResponse(formatCollectionPoint(updated));
      }

      const newId = `cp_${Date.now()}`;
      const { data: created, error } = await supabase
        .from("collection_points")
        .insert({
          id: newId,
          name: point.name || "New collection point",
          village: point.village || "",
          district: point.district || "",
          state: point.state || "",
          capacity_tonnes: point.capacityTonnes || 50,
          hours: point.hours || "6:00 AM – 6:00 PM",
          active: point.active ?? true,
          dropoffs_today: 0,
          location: locationStr,
        })
        .select()
        .single();

      if (error || !created) throw new ApiError(500, error?.message || "Failed to create", "DATABASE_ERROR");

      await logAudit({
        actor: "Admin",
        actorRole: "admin",
        action: "Collection Point created",
        reference: newId,
      });

      return jsonResponse(formatCollectionPoint(created));
    }

    // 5. POST /collection-points/route (TSP and route partitioning)
    if (subpath === "route" || subpath.endsWith("/route")) {
      const body = await req.json().catch(() => ({}));
      const start = body.start || { lat: 28.18, lng: 76.62 };
      const stops: RouteStop[] = (body.stops || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        location: parsePoint(s.location),
        quantityKg: Number(s.quantityKg || s.quantity_kg || 0),
      }));

      const vehicleCapacityKg = Number(body.vehicleCapacityKg || 5000);
      const partitions = partitionRouteByCapacity(start, stops, vehicleCapacityKg);
      const overall = twoOptOptimization(start, stops);

      return jsonResponse({
        overallRoute: overall,
        vehiclePartitions: partitions,
      });
    }

    throw new ApiError(404, `Collection points endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

