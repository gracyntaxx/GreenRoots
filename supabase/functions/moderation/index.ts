import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { logAudit } from "../_shared/audit.ts";

function formatFlag(row: any) {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetSummary: row.target_summary,
    reason: row.reason,
    reporter: row.reporter,
    status: row.status,
    decisionReason: row.decision_reason || undefined,
    flaggedAt: row.flagged_at || row.created_at,
    decidedAt: row.decided_at || undefined,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/moderation\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /moderation/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const { data, error } = await supabase
        .from("moderation_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatFlag));
    }

    // 2. POST /moderation/decide
    if (subpath === "decide" || subpath.endsWith("/decide")) {
      const body = await req.json().catch(() => ({}));
      const { id, decision, reason } = body;

      if (!id || !decision) {
        throw new ApiError(400, "Flag id and decision are required.", "VALIDATION");
      }

      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from("moderation_flags")
        .update({
          status: decision,
          decision_reason: reason || null,
          decided_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (error || !updated) {
        throw new ApiError(500, error?.message || "Decision failed", "DATABASE_ERROR");
      }

      // If removed, mark target listing or requirement inactive/removed
      if (decision === "Removed") {
        if (updated.target_type === "listing") {
          await supabase.from("listings").update({ status: "Inactive" }).eq("id", updated.target_id);
        } else if (updated.target_type === "requirement") {
          await supabase.from("requirements").update({ status: "Cancelled" }).eq("id", updated.target_id);
        }
      }

      await logAudit({
        actor: "Admin",
        actorRole: "admin",
        action: `Moderation ${decision}`,
        reference: id,
        aiPreparedSummary: `Moderation decision ${decision} for ${updated.target_type} ${updated.target_id}: ${reason}`,
      });

      return jsonResponse(formatFlag(updated));
    }

    throw new ApiError(404, `Moderation endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

