import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";

function formatNotification(n: any) {
  return {
    id: n.id,
    userId: n.user_id || undefined,
    title: n.title,
    body: n.body,
    type: n.type || "system",
    read: Boolean(n.read),
    referenceId: n.reference_id || undefined,
    createdAt: n.created_at,
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/notifications\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. /notifications/list
    if (subpath === "list" || subpath.endsWith("/list") || subpath === "") {
      const userId = url.searchParams.get("userId");
      let query = supabase.from("notifications").select("*");

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new ApiError(500, error.message, "DATABASE_ERROR");

      return jsonResponse((data || []).map(formatNotification));
    }

    // 2. POST /notifications/read
    if (subpath === "read" || subpath.endsWith("/read")) {
      const body = await req.json().catch(() => ({}));
      const { id, read = true } = body;
      if (!id) throw new ApiError(400, "Notification id required", "VALIDATION");

      const { data, error } = await supabase
        .from("notifications")
        .update({ read: Boolean(read) })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) throw new ApiError(404, "Notification not found", "NOT_FOUND");

      return jsonResponse(formatNotification(data));
    }

    // 3. POST /notifications/read-all
    if (subpath === "read-all" || subpath.endsWith("/read-all")) {
      const body = await req.json().catch(() => ({}));
      const userId = body.userId;

      let query = supabase.from("notifications").update({ read: true });
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      await query.eq("read", false);

      const { data: all } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      return jsonResponse((all || []).map(formatNotification));
    }

    // 4. POST /notifications/register-token
    if (subpath === "register-token" || subpath.endsWith("/register-token")) {
      const body = await req.json().catch(() => ({}));
      const { userId, token, platform = "expo" } = body;
      if (!userId || !token) throw new ApiError(400, "userId and token required", "VALIDATION");

      await supabase.from("push_tokens").upsert({
        user_id: userId,
        token,
        platform,
      });

      return jsonResponse({ registered: true });
    }

    throw new ApiError(404, `Notifications endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

