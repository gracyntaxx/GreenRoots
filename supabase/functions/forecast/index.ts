import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";

function formatForecast(f: any) {
  return {
    id: f.id,
    region: f.region,
    season: f.season,
    wasteType: f.waste_type,
    historicalPricePerKg: Number(f.historical_price_per_kg || 0),
    predictedPricePerKg: Number(f.predicted_price_per_kg || 0),
    confidence: Number(f.confidence || 0),
    limitedData: Boolean(f.limited_data),
    harvestPeakStart: f.harvest_peak_start || "",
    harvestPeakEnd: f.harvest_peak_end || "",
    sampleCount: Number(f.sample_count || 0),
    explanation: f.explanation || "",
    trend: f.trend || "Stable",
  };
}

export async function handleForecastRequest(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/(?:forecast|forecasts)\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /forecasts/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const { data, error } = await supabase.from("forecasts").select("*");
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatForecast));
    }

    // 2. /forecasts/get
    if (subpath === "get" || subpath.endsWith("/get")) {
      const id = url.searchParams.get("id") || (await req.json().catch(() => ({}))).id;
      if (!id) throw new ApiError(400, "Forecast id required", "VALIDATION");

      const { data, error } = await supabase
        .from("forecasts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) throw new ApiError(404, "Forecast not found", "NOT_FOUND");

      return jsonResponse(formatForecast(data));
    }

    // 3. /forecasts/for-season
    if (subpath === "for-season" || subpath.endsWith("/for-season")) {
      const region = url.searchParams.get("region") || (await req.json().catch(() => ({}))).region;
      const season = url.searchParams.get("season") || (await req.json().catch(() => ({}))).season;

      let query = supabase.from("forecasts").select("*");
      if (region) query = query.eq("region", region);
      if (season) query = query.eq("season", season);

      const { data, error } = await query.limit(1).maybeSingle();
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse(data ? formatForecast(data) : null);
    }

    throw new ApiError(404, `Forecast endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handleForecastRequest);

