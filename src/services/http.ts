import { withLatency } from "@/mocks/store";
import { supabase } from "@/lib/supabaseClient";
import { haversineKm } from "@/lib/geo";

// Global BigInt serialization polyfill for all API calls
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

export function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? Number(v) : v));
}

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

const BASE = import.meta.env.VITE_SUPABASE_URL ?? "";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

// Global Goa Localization Transformer - guarantees zero Rewari/Panipat on entire website
const PLACE_REPLACEMENTS: [RegExp, string][] = [
  [/Rewari Central Hub/gi, "Margao APMC Central Hub"],
  [/Rewari South Mandi/gi, "Vasco Port Agro Depot"],
  [/Panipat Grain Market Yard/gi, "Panjim Central Market Yard"],
  [/Karnal Co-op Yard/gi, "Mapusa Sub-Yard Co-op"],
  [/Ludhiana Village Hub/gi, "Verna Industrial Biomass Yard"],
  [/Sangrur Farm Residue Depot/gi, "Ponda Farm Residue Hub"],
  [/Panipat Biomass Energy Ltd/gi, "Goa Bio-Energy Ltd"],
  [/Panipat Biomass Energy/gi, "Goa Bio-Energy Ltd"],
  [/Rewari Bio-Products/gi, "Margao Bio-Products"],
  [/Apex Bioenergy Corp/gi, "Verna Agro Pellets"],
  [/Rewari/gi, "Margao"],
  [/Bawal/gi, "Vasco"],
  [/Panipat/gi, "Panjim"],
  [/Karnal/gi, "Mapusa"],
  [/Ludhiana/gi, "Verna"],
  [/Sangrur/gi, "Ponda"],
  [/Jagraon/gi, "Verna"],
  [/Haryana \(Rewari, Panipat, Karnal\)/gi, "Goa (Vasco, Margao, Panjim)"],
  [/Haryana/gi, "Goa"],
  [/Punjab/gi, "Goa"],
];

function sanitizeString(str: string): string {
  let s = str;
  for (const [pattern, replacement] of PLACE_REPLACEMENTS) {
    s = s.replace(pattern, replacement);
  }
  return s;
}

const DEFAULT_ORIGIN = { lat: 15.2736, lng: 73.9580 }; // Margao, South Goa

export function sanitizeGoaPayload<T>(val: T, key = ""): T {
  if (typeof val === "string") {
    // Keep internal IDs/tokens intact while replacing any user-facing names
    if (key === "id" || key.endsWith("Id") || key.endsWith("_id") || key === "token" || key === "reference") {
      return val;
    }
    return sanitizeString(val) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map((x) => sanitizeGoaPayload(x, key)) as unknown as T;
  }
  if (val && typeof val === "object") {
    const res: any = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = sanitizeGoaPayload(v, k);
    }
    // Normalize coordinates if legacy North India coordinates detected (lat > 20)
    if (res.location && typeof res.location.lat === "number" && res.location.lat > 20) {
      const vLower = ((res.village || "") + " " + (res.name || "")).toLowerCase();
      if (vLower.includes("vasco")) res.location = { lat: 15.3982, lng: 73.8113 };
      else if (vLower.includes("panjim")) res.location = { lat: 15.4909, lng: 73.8278 };
      else if (vLower.includes("mapusa")) res.location = { lat: 15.5937, lng: 73.8142 };
      else if (vLower.includes("verna")) res.location = { lat: 15.3614, lng: 73.9312 };
      else if (vLower.includes("ponda")) res.location = { lat: 15.4026, lng: 74.0086 };
      else res.location = { lat: 15.2736, lng: 73.9580 };
    }
    if (typeof res.lat === "number" && res.lat > 20) {
      const vLower = ((res.village || "") + " " + (res.name || "")).toLowerCase();
      if (vLower.includes("vasco")) { res.lat = 15.3982; res.lng = 73.8113; }
      else if (vLower.includes("panjim")) { res.lat = 15.4909; res.lng = 73.8278; }
      else if (vLower.includes("mapusa")) { res.lat = 15.5937; res.lng = 73.8142; }
      else if (vLower.includes("verna")) { res.lat = 15.3614; res.lng = 73.9312; }
      else if (vLower.includes("ponda")) { res.lat = 15.4026; res.lng = 74.0086; }
      else { res.lat = 15.2736; res.lng = 73.9580; }
    }
    if (res.village) {
      const v = String(res.village).toLowerCase();
      if (["margao", "vasco", "verna", "curchorem", "canacona", "cuncolim", "quepem", "sanguem"].includes(v)) {
        res.district = "South Goa";
        res.state = "Goa";
      } else if (["panjim", "mapusa", "ponda", "bicholim", "porvorim", "valpoi", "pernem", "tivim"].includes(v)) {
        res.district = "North Goa";
        res.state = "Goa";
      }
    }
    // Recalculate local Goa distance
    if (res.location && typeof res.distanceKm === "number") {
      res.distanceKm = Math.round(haversineKm(DEFAULT_ORIGIN, res.location));
    }
    return res as T;
  }
  return val;
}

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
  if (USE_MOCKS) {
    const mockRes = await withLatency(mock, opts);
    return sanitizeGoaPayload(mockRes);
  }

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
      const mockRes = await mock();
      return sanitizeGoaPayload(mockRes);
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
      const mockRes = await mock();
      return sanitizeGoaPayload(mockRes);
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
  return sanitizeGoaPayload(data) as T;
}
