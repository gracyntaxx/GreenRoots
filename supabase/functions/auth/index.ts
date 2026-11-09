import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getAdminSupabaseClient } from "../_shared/supabase.ts";
import { ApiError, jsonResponse } from "../_shared/errors.ts";
import { logAudit } from "../_shared/audit.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const subpath = url.pathname.replace(/^\/auth\/?/, "");
    const supabase = getAdminSupabaseClient();

    // 1. POST /auth/demo-login
    if (subpath === "demo-login" || subpath.endsWith("/demo-login")) {
      const body = await req.json().catch(() => ({}));
      const role = body.role || url.searchParams.get("role");

      if (!role) {
        throw new ApiError(400, "Role is required for demo login", "VALIDATION");
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error || !profile) {
        throw new ApiError(404, `No demo account found for role: ${role}`, "NOT_FOUND");
      }

      await logAudit({
        actor: profile.name,
        actorRole: profile.role,
        action: "Demo Login",
        reference: profile.id,
      });

      return jsonResponse(formatProfile(profile));
    }

    // 2. POST /auth/request-otp
    if (subpath === "request-otp" || subpath.endsWith("/request-otp")) {
      const body = await req.json().catch(() => ({}));
      const phone = body.phone;
      if (!phone || !/^\d{10}$/.test(phone)) {
        throw new ApiError(400, "Enter a 10-digit phone number.", "VALIDATION");
      }

      return jsonResponse({
        sent: true,
        hint: "Demo OTP is 123456",
      });
    }

    // 3. POST /auth/login-phone
    if (subpath === "login-phone" || subpath.endsWith("/login-phone")) {
      const body = await req.json().catch(() => ({}));
      const { phone, otp } = body;

      if (otp !== "123456") {
        throw new ApiError(401, "That OTP is not correct. Use 123456 in the demo.", "AUTH");
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone", phone)
        .in("role", ["farmer", "buyer"])
        .single();

      if (error || !profile) {
        throw new ApiError(404, "No account found for this phone number.", "NOT_FOUND");
      }

      await logAudit({
        actor: profile.name,
        actorRole: profile.role,
        action: "Phone Login",
        reference: profile.id,
      });

      return jsonResponse(formatProfile(profile));
    }

    // 4. POST /auth/login-email
    if (subpath === "login-email" || subpath.endsWith("/login-email")) {
      const body = await req.json().catch(() => ({}));
      const { email, password } = body;

      if (!email || !password) {
        throw new ApiError(400, "Email and password are required.", "VALIDATION");
      }
      if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters.", "VALIDATION");
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", email.trim().toLowerCase())
        .maybeSingle();

      if (error || !profile) {
        throw new ApiError(404, "No account found for this email address.", "NOT_FOUND");
      }

      await logAudit({
        actor: profile.name,
        actorRole: profile.role,
        action: "Email Login",
        reference: profile.id,
      });

      return jsonResponse(formatProfile(profile));
    }

    // 5. POST /auth/signup
    if (subpath === "signup" || subpath.endsWith("/signup")) {
      const body = await req.json().catch(() => ({}));
      const {
        role,
        name,
        phone,
        email,
        password,
        village,
        district,
        state,
        language = "en",
        licenseNumber,
        companyName,
        contactPerson,
      } = body;

      if (!role || !name || !village) {
        throw new ApiError(400, "Role, name and village are required.", "VALIDATION");
      }
      if (role === "industry" && !licenseNumber) {
        throw new ApiError(400, "A licence number is required for industry accounts.", "VALIDATION");
      }

      const displayName = role === "industry" ? (companyName || name) : name;
      const initials = name
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "GR";

      // 1. Check if profile already exists for this phone or email
      if (phone) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("*")
          .eq("phone", phone)
          .maybeSingle();
        if (existing) {
          return jsonResponse(formatProfile(existing));
        }
      }
      if (email) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", email.trim().toLowerCase())
          .maybeSingle();
        if (existing) {
          return jsonResponse(formatProfile(existing));
        }
      }

      // 2. Create user in auth.users
      let userId: string;
      const userEmail = email ? email.toLowerCase().trim() : `farmer_${phone || Date.now()}@greenroots.internal`;
      const userPassword = password || "GreenRoots2026!";

      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { name: displayName, role },
      });

      if (authErr) {
        // If user already exists in auth, retrieve user id
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData?.users?.find(
          (u) => (userEmail && u.email?.toLowerCase() === userEmail.toLowerCase())
        );
        if (found) {
          userId = found.id;
        } else {
          // If auth creation fails, generate UUID
          userId = crypto.randomUUID();
        }
      } else {
        userId = authUser.user.id;
      }

      // 3. Insert into profiles
      const { data: profile, error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          name: displayName,
          role,
          phone: phone || null,
          email: email ? email.toLowerCase() : null,
          village,
          district: district || village,
          state: state || "",
          language,
          location: `SRID=4326;POINT(77.2000 28.6100)`,
          reputation_score: 4.5,
          reputation_factors: [],
          payout_readiness: "Not set up",
          verified: role !== "industry",
          avatar_initials: initials,
        })
        .select()
        .single();

      if (error) {
        throw new ApiError(500, `Failed to create profile: ${error.message}`, "DATABASE_ERROR");
      }

      if (role === "industry") {
        await supabase.from("industry_verifications").upsert({
          id: `ver_${userId}`,
          industry_id: userId,
          business_name: companyName || name,
          license_number: licenseNumber || "",
          registered_address: [village, state].filter(Boolean).join(", "),
          contact_person: contactPerson || name,
          documents: [],
          status: "Pending",
        });
      }

      await logAudit({
        actor: displayName,
        actorRole: role,
        action: "User Registered",
        reference: userId,
      });

      return jsonResponse(formatProfile(profile));
    }

    throw new ApiError(404, `Auth endpoint not found: ${subpath}`, "NOT_FOUND");
  } catch (err: unknown) {
    const rawStatus = (err && typeof err === "object" && ("statusCode" in err || "status" in err))
      ? Number((err as any).statusCode || (err as any).status)
      : (err instanceof ApiError ? err.status : 500);
    const status = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatProfile(p: Record<string, unknown>) {
  const rep = p.reputation !== undefined && p.reputation !== null
    ? Number(p.reputation)
    : (p.reputation_score !== undefined && p.reputation_score !== null ? Number(p.reputation_score) : 4.5);
  return {
    id: p.id,
    name: p.name || "User",
    role: p.role,
    phone: p.phone,
    email: p.email,
    village: p.village,
    district: p.district || p.village,
    state: p.state || "",
    language: p.language || "en",
    location: { lat: 28.61, lng: 77.2 },
    reputation: rep,
    reputationFactors: Array.isArray(p.reputation_factors) ? p.reputation_factors : [],
    payoutReadiness: p.payout_readiness || "Not set up",
    verified: Boolean(p.verified),
    avatarInitials: p.avatar_initials || "GR",
    joined: p.created_at ? String(p.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}
