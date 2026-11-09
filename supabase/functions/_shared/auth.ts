// Authentication & Role Authorization Helpers
import { getServiceClient } from "./supabase.ts";
import { ApiError } from "./errors.ts";

export interface AuthUser {
  id: string;
  role: "farmer" | "buyer" | "industry" | "admin";
  name: string;
  email?: string;
  phone?: string;
  village: string;
  district: string;
  state: string;
  language: string;
  location: { lat: number; lng: number };
  verified: boolean;
  reputation: number;
}

export async function getAuthProfile(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const supabase = getServiceClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, name, email, phone, village, district, state, language, location, verified, reputation_score")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Parse location coordinates from GeoJSON or point
  let lat = 28.197;
  let lng = 76.617;
  if (profile.location) {
    if (typeof profile.location === "object" && "coordinates" in profile.location) {
      lng = (profile.location as { coordinates: number[] }).coordinates[0];
      lat = (profile.location as { coordinates: number[] }).coordinates[1];
    } else if (typeof profile.location === "object" && "lat" in profile.location) {
      lat = (profile.location as { lat: number; lng: number }).lat;
      lng = (profile.location as { lat: number; lng: number }).lng;
    }
  }

  return {
    id: profile.id,
    role: profile.role,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    village: profile.village,
    district: profile.district,
    state: profile.state,
    language: profile.language ?? "en",
    location: { lat, lng },
    verified: profile.verified,
    reputation: Number(profile.reputation_score ?? 4.0),
  };
}

export async function requireAuth(req: Request): Promise<AuthUser> {
  const profile = await getAuthProfile(req);
  if (!profile) {
    throw new ApiError("UNAUTHENTICATED", "Authentication is required to access this resource.", 401);
  }
  return profile;
}

export async function requireRole(req: Request, allowedRoles: ("farmer" | "buyer" | "industry" | "admin")[]): Promise<AuthUser> {
  const profile = await requireAuth(req);
  if (!allowedRoles.includes(profile.role)) {
    throw new ApiError("FORBIDDEN", `Access restricted to ${allowedRoles.join(", ")} accounts.`, 403);
  }
  return profile;
}

export async function requireAdmin(req: Request): Promise<AuthUser> {
  return requireRole(req, ["admin"]);
}

export async function requireVerifiedIndustry(req: Request): Promise<AuthUser> {
  const profile = await requireRole(req, ["industry", "admin"]);
  if (profile.role === "admin") return profile;

  const supabase = getServiceClient();
  const { data: ver, error } = await supabase
    .from("industry_verifications")
    .select("status")
    .eq("industry_id", profile.id)
    .single();

  if (error || ver?.status !== "Verified") {
    throw new ApiError("NOT_VERIFIED", "Your company account is pending verification. Requirements cannot be published yet.", 403);
  }

  return profile;
}

