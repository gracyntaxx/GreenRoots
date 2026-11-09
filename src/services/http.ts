import { withLatency } from "@/mocks/store";
import { supabase } from "@/lib/supabaseClient";

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

const BASE = import.meta.env.VITE_SUPABASE_URL ?? "";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * One call shape for every service. In mock mode the in-memory implementation
 * runs behind simulated latency. In real mode the same function calls the
 * Supabase Edge Function path, so screens never change when the backend lands.
 */
export async function call<T>(
  path: string,
  init: RequestInit | undefined,
  mock: () => T | Promise<T>,
  opts?: { mutation?: boolean }
): Promise<T> {
  if (USE_MOCKS) return withLatency(mock, opts);

  // Retrieve current session token if available, otherwise use anon key
  let token = ANON_KEY;
  try {
    const sessionRes = await supabase.auth.getSession();
    if (sessionRes?.data?.session?.access_token) {
      token = sessionRes.data.session.access_token;
    }
  } catch {
    // Keep anon key fallback
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}/functions/v1/${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch (err: unknown) {
    // If AI service is not reachable over network, fall back to mock parsing
    if (path.startsWith("ai/") || path.startsWith("ai-assistant/")) {
      console.warn("AI service unreachable, falling back to local engine:", err);
      return mock();
    }
    throw new Error(
      "Network error: Unable to reach the server. Please check your internet connection."
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (res.status === 403) {
      throw new Error("Permission denied. You do not have access to this resource.");
    }

    // Graceful fallback for AI services if server returns error or 5xx
    if (path.startsWith("ai/") || path.startsWith("ai-assistant/")) {
      console.warn(`AI service returned ${res.status}, using deterministic fallback.`);
      return mock();
    }

    let message = "The service did not respond. Please try again.";
    try {
      const body = await res.json();
      message = body?.error ?? body?.message ?? message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as any;
  if (data && typeof data === "object" && data.error && !("id" in data && "role" in data)) {
    throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
  }
  return data as T;
}
