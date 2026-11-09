import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import {
  parseListingText,
  parseRequirementText,
  explainPoolProgress,
} from "../_shared/gemini.ts";
import { logAiAudit } from "../_shared/audit.ts";

export async function handleAiRequest(req: Request): Promise<Response> {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/(?:ai|ai-assistant)\/?/, "");

    // 1. POST /parse-listing
    if (subpath === "parse-listing" || subpath.endsWith("/parse-listing")) {
      const body = await req.json().catch(() => ({}));
      const text = body.text || "";
      const result = await parseListingText(text);

      await logAiAudit({
        endpoint: "ai/parse-listing",
        promptText: text,
        responsePayload: result as unknown as Record<string, unknown>,
        confidenceScores: result.confidence,
      });

      return jsonResponse(result);
    }

    // 2. POST /parse-requirement
    if (subpath === "parse-requirement" || subpath.endsWith("/parse-requirement")) {
      const body = await req.json().catch(() => ({}));
      const text = body.text || "";
      const result = await parseRequirementText(text);

      await logAiAudit({
        endpoint: "ai/parse-requirement",
        promptText: text,
        responsePayload: result as unknown as Record<string, unknown>,
        confidenceScores: result.confidence,
      });

      return jsonResponse(result);
    }

    // 3. /explain-pool
    if (subpath === "explain-pool" || subpath.endsWith("/explain-pool")) {
      const body = await req.json().catch(() => ({}));
      const committedKg = Number(body.committedKg || 12000);
      const targetKg = Number(body.targetKg || 25000);
      const deadline = body.deadline || new Date(Date.now() + 86400000 * 5).toISOString();
      const contributionCount = Number(body.contributionCount || 3);

      const result = await explainPoolProgress({
        committedKg,
        targetKg,
        deadline,
        contributionCount,
      });

      await logAiAudit({
        endpoint: "ai/explain-pool",
        promptText: `Pool progress committed=${committedKg} target=${targetKg}`,
        responsePayload: result as unknown as Record<string, unknown>,
      });

      return jsonResponse(result);
    }

    // 4. /explain-forecast
    if (subpath === "explain-forecast" || subpath.endsWith("/explain-forecast")) {
      const body = await req.json().catch(() => ({}));
      if (body.limitedData) {
        return jsonResponse(
          "There is not enough history for this region and season. I have not produced a number because that would be a guess."
        );
      }
      const explanation =
        body.explanation ||
        "Based on past harvest cycles, crop residue peak in northern plains begins mid-October with high demand from bio-pellet and power plants.";

      await logAiAudit({
        endpoint: "ai/explain-forecast",
        promptText: `Forecast explanation query`,
        responsePayload: { explanation },
      });

      return jsonResponse(explanation);
    }

    // 5. /explain-match
    if (subpath === "explain-match" || subpath.endsWith("/explain-match")) {
      const body = await req.json().catch(() => ({}));
      const farmerName = body.farmerName || "Farmer";
      const distanceKm = Number(body.distanceKm || 12);
      const pastDeals = Number(body.pastDeals || 1);

      const explanation = `${farmerName} is ${distanceKm.toFixed(
        0
      )} km from the pool and has ${pastDeals} past deal${
        pastDeals === 1 ? "" : "s"
      } with you. The quantity fit and trust score are the main reasons for this rank.`;

      await logAiAudit({
        endpoint: "ai/explain-match",
        promptText: `Match explanation for ${farmerName}`,
        responsePayload: { explanation },
      });

      return jsonResponse(explanation);
    }

    throw new ApiError(404, `AI endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handleAiRequest);

