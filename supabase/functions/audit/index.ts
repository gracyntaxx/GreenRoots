import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";

function formatAudit(row: any) {
  return {
    id: row.id,
    at: row.created_at,
    actor: row.actor,
    actorRole: row.actor_role,
    aiPreparedSummary: row.ai_prepared_summary || undefined,
    confirmedBy: row.confirmed_by || undefined,
    action: row.action,
    reference: row.reference || undefined,
    outcome: row.outcome || undefined,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/audit\/?/, "");
    const supabase = getAdminSupabaseClient();

    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatAudit));
    }

    throw new ApiError(404, `Audit endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

