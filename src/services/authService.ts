import type { IndustryVerification, Language, Profile, Role } from "@/types";
import { call } from "./http";
import {
  clearIdempotency,
  findProfile,
  getState,
  MockError,
} from "@/mocks/store";
import { DEMO_ACCOUNTS } from "@/mocks/seed";

const DEMO_PASSWORD = "demo1234";

export const authService = {
  demoLogin(role: Role): Promise<Profile> {
    return call("auth/demo-login", undefined, () => {
      const account = DEMO_ACCOUNTS.find((a) => a.role === role);
      const profile = account ? findProfile(account.id) : undefined;
      if (!profile) throw new MockError("Demo account not found", "NOT_FOUND");
      return profile;
    });
  },

  requestOtp(phone: string): Promise<{ sent: boolean; hint: string }> {
    return call("auth/request-otp", { method: "POST", body: JSON.stringify({ phone }) }, () => {
      if (!/^\d{10}$/.test(phone)) {
        throw new MockError("Enter a 10-digit phone number.", "VALIDATION");
      }
      return { sent: true, hint: "Demo OTP is 123456" };
    });
  },

  loginPhone(phone: string, otp: string): Promise<Profile> {
    return call("auth/login-phone", { method: "POST", body: JSON.stringify({ phone, otp }) }, () => {
      if (otp !== "123456") throw new MockError("That OTP is not correct. Use 123456 in the demo.", "AUTH");
      const profile = getState().profiles.find(
        (p) => p.phone === phone && (p.role === "farmer" || p.role === "buyer")
      );
      if (!profile) throw new MockError("No account found for this phone number.", "NOT_FOUND");
      return profile;
    });
  },

  loginEmail(email: string, password: string): Promise<Profile> {
    return call("auth/login-email", { method: "POST", body: JSON.stringify({ email, password }) }, () => {
      const profile = getState().profiles.find(
        (p) => p.email?.toLowerCase() === email.toLowerCase() && (p.role === "industry" || p.role === "admin")
      );
      if (!profile) throw new MockError("No account found for this email.", "NOT_FOUND");
      if (password.length < 6) throw new MockError("Password must be at least 6 characters.", "VALIDATION");
      return profile;
    });
  },

  signup(input: {
    role: Exclude<Role, "admin">;
    name: string;
    phone?: string;
    email?: string;
    village: string;
    district?: string;
    state?: string;
    language: Language;
    licenseNumber?: string;
    companyName?: string;
    contactPerson?: string;
  }): Promise<Profile> {
    return call("auth/signup", { method: "POST", body: JSON.stringify(input) }, () => {
      if (input.role === "industry" && !input.licenseNumber) {
        throw new MockError("A licence number is required for industry accounts.", "VALIDATION");
      }
      const initials = input.name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const profile: Profile = {
        id: `new_${Date.now()}`,
        name: input.role === "industry" ? input.companyName ?? input.name : input.name,
        role: input.role,
        phone: input.phone,
        email: input.email,
        village: input.village,
        district: input.district ?? input.village,
        state: input.state ?? "",
        language: input.language,
        location: { lat: 28.61, lng: 77.2 },
        reputation: 0,
        reputationFactors: [],
        payoutReadiness: "Not set up",
        verified: input.role !== "industry",
        avatarInitials: initials || "GR",
        joined: new Date().toISOString().slice(0, 10),
      };
      getState().profiles.push(profile);
      if (input.role === "industry") {
        const verification: IndustryVerification = {
          id: `ver_${profile.id}`,
          industryId: profile.id,
          businessName: input.companyName ?? input.name,
          licenseNumber: input.licenseNumber ?? "",
          registeredAddress: [input.village, input.state].filter(Boolean).join(", "),
          contactPerson: input.contactPerson ?? input.name,
          documents: [],
          status: "Pending",
          submittedAt: new Date().toISOString().slice(0, 10),
        };
        getState().verifications.push(verification);
      }
      return profile;
    }, { mutation: true });
  },

  getIndustryVerification(industryId: string): IndustryVerification | undefined {
    return getState().verifications.find((v) => v.industryId === industryId);
  },

  logout() {
    clearIdempotency();
  },

  demoPasswordHint: DEMO_PASSWORD,
};
