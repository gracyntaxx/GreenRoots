import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { haversineKm } from "../_shared/tsp.ts";

export interface MatchScoreResult {
  id: string;
  poolId: string;
  poolLabel: string;
  farmer: {
    id: string;
    name: string;
    village: string;
    reputation: number;
    phone?: string;
  };
  distanceKm: number;
  availableKg: number;
  quantityFit: number;
  priceFit: number;
  trust: number;
  pastDeals: number;
  score: number;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/matching\/?/, "");
    const supabase = getAdminSupabaseClient();

    // POST /matching/recommend-farmers-for-industry
    const body = await req.json().catch(() => ({}));
    const industryId = body.industryId || url.searchParams.get("industryId") || "demo_industry";

    // 1. Fetch industry's pools
    const { data: pools } = await supabase
      .from("pools")
      .select("*")
      .eq("industry_id", industryId);

    // 2. Fetch farmers
    const { data: farmers } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "farmer");

    if (!pools?.length || !farmers?.length) {
      return jsonResponse([]);
    }

    const matches: MatchScoreResult[] = [];

    for (const pool of pools) {
      const poolLoc = parsePoint(pool.location);
      const targetKg = Number(pool.target_kg);

      for (const farmer of farmers) {
        const farmerLoc = parsePoint(farmer.location);
        const distanceKm = haversineKm(poolLoc, farmerLoc);
        const rep = Number(farmer.reputation || 4.5);

        // Proximity score (30% weight): 100 within 0km down to 0 at 100km
        const proximityScore = Math.max(0, Math.min(100, Math.round(100 - distanceKm)));

        // Available quantity estimate and fit (20% weight)
        const availableKg = 5000 + Math.round(rep * 2000);
        const quantityFit = Math.min(100, Math.round((availableKg / (targetKg || 1)) * 100));

        // Price fit (15% weight)
        const priceFit = Math.min(100, Math.round(rep * 20));

        // Trust score (15% weight)
        const trust = Math.min(100, Math.round(rep * 20));

        // Past deals (10% weight)
        const pastDeals = Math.max(0, Math.round(rep * 2) - 2);
        const pastDealsScore = Math.min(100, pastDeals * 25);

        // Popularity / activity (10% weight)
        const popularityScore = 80;

        // Composite weighted score
        const score = Math.round(
          proximityScore * 0.30 +
          quantityFit * 0.20 +
          priceFit * 0.15 +
          trust * 0.15 +
          pastDealsScore * 0.10 +
          popularityScore * 0.10
        );

        matches.push({
          id: `${pool.id}-${farmer.id}`,
          poolId: pool.id,
          poolLabel: `${pool.waste_type.replace("_", " ")} · ${pool.village}`,
          farmer: {
            id: farmer.id,
            name: farmer.name,
            village: farmer.village,
            reputation: rep,
            phone: farmer.phone,
          },
          distanceKm: Math.round(distanceKm),
          availableKg,
          quantityFit,
          priceFit,
          trust,
          pastDeals,
          score,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return jsonResponse(matches);
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

