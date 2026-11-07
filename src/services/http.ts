import { withLatency } from "@/mocks/store";

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

const BASE = import.meta.env.VITE_SUPABASE_URL ?? "";

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
  const res = await fetch(`${BASE}/functions/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = "The service did not respond. Please try again.";
    try {
      const body = await res.json();
      message = body?.error ?? message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}
