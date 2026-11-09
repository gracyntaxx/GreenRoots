import { getAdminSupabaseClient } from "./supabase.ts";

export interface LogAuditParams {
  actor?: string;
  actorRole?: "farmer" | "buyer" | "industry" | "admin" | "system";
  action: string;
  reference?: string;
  aiPreparedSummary?: string;
  confirmedBy?: string;
  outcome?: string;
  metadata?: Record<string, unknown>;
}

export interface LogAiAuditParams {
  endpoint: string;
  actorId?: string;
  promptText?: string;
  responsePayload: Record<string, unknown>;
  confidenceScores?: Record<string, number>;
  userConfirmed?: boolean;
}

/**
 * Append an entry to the append-only audit_log table.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = getAdminSupabaseClient();
    const { error } = await supabase.from("audit_log").insert({
      actor: params.actor || "System",
      actor_role: params.actorRole || "system",
      action: params.action,
      reference: params.reference || null,
      ai_prepared_summary: params.aiPreparedSummary || null,
      confirmed_by: params.confirmedBy || null,
      outcome: params.outcome || null,
      metadata: params.metadata || {},
    });
    if (error) {
      console.error("[AuditLog] Failed to insert audit log:", error);
    }
  } catch (err) {
    console.error("[AuditLog] Unexpected error writing audit:", err);
  }
}

/**
 * Append an entry to the ai_action_audit table for AI governance.
 */
export async function logAiAudit(params: LogAiAuditParams): Promise<void> {
  try {
    const supabase = getAdminSupabaseClient();
    const { error } = await supabase.from("ai_action_audit").insert({
      endpoint: params.endpoint,
      actor_id: params.actorId || null,
      prompt_text: params.promptText || null,
      response_payload: params.responsePayload,
      confidence_scores: params.confidenceScores || {},
      user_confirmed: params.userConfirmed ?? false,
    });
    if (error) {
      console.error("[AiActionAudit] Failed to insert AI audit:", error);
    }
  } catch (err) {
    console.error("[AiActionAudit] Unexpected error writing AI audit:", err);
  }
}

