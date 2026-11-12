import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Factory, FileUp, Loader2, ShoppingBasket, Sprout } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/form";
import { LogoMark } from "@/components/shared/Brand";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { authService } from "@/services/authService";
import { COLLECTION_POINTS } from "@/mocks/seed";
import { homeForRole } from "@/lib/routing";
import { cn } from "@/lib/utils";
import type { Language, Role } from "@/types";

type SignupRole = Exclude<Role, "admin">;

const roleCards: { role: SignupRole; title: string; body: string; icon: typeof Sprout }[] = [
  { role: "farmer", title: "Farmer", body: "List residue, join pools, get paid.", icon: Sprout },
  { role: "buyer", title: "Buyer", body: "Buy residue from nearby farmers.", icon: ShoppingBasket },
  { role: "industry", title: "Industry", body: "Publish requirements and source biomass.", icon: Factory },
];

const baseSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number."),
  village: z.string().min(1, "Choose your village."),
});

const industrySchema = z.object({
  companyName: z.string().min(2, "Enter the company name."),
  contactPerson: z.string().min(2, "Enter a contact person."),
  email: z.string().email("Enter a valid work email."),
  password: z.string().min(6, "Use at least 6 characters."),
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number.").optional().or(z.literal("")),
  licenseNumber: z.string().min(3, "Enter your licence number."),
  village: z.string().min(1, "Choose the plant location."),
});

const states = ["Haryana", "Punjab", "Uttar Pradesh", "Rajasthan", "Maharashtra", "Madhya Pradesh"];
const villages = [...new Set(COLLECTION_POINTS.map((c) => c.village))];

export default function SignupPage() {
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const setOnboardingSeen = useSession((s) => s.setOnboardingSeen);
  const pushToast = useUi((s) => s.pushToast);
  const language = useUi((s) => s.language);

  const [role, setRole] = useState<SignupRole | null>(null);
  const [state, setState] = useState("Haryana");
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const villagesForState = useMemo(() => villages, []);

  if (profile) return <Navigate to={homeForRole(profile.role)} replace />;

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setErrors({});

    if (role === "industry") {
      const parsed = industrySchema.safeParse(form);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        parsed.error.issues.forEach((i) => {
          next[String(i.path[0])] = i.message;
        });
        setErrors(next);
        return;
      }
      setBusy(true);
      try {
        const p = await authService.signup({
          role,
          name: parsed.data.companyName,
          companyName: parsed.data.companyName,
          contactPerson: parsed.data.contactPerson,
          email: parsed.data.email,
          password: parsed.data.password,
          phone: form.phone || undefined,
          village: parsed.data.village,
          state,
          language: language as Language,
          licenseNumber: parsed.data.licenseNumber,
        });
        if (!p || !p.role) {
          throw new Error("Could not initialize your profile. Please try signing in.");
        }
        setProfile(p);
        setOnboardingSeen(false);
        pushToast({
          title: "Industry account created",
          description: "An admin will verify your licence. You can explore the portal now.",
          variant: "success",
        });
        navigate(homeForRole(p.role), { replace: true });
      } catch (err) {
        setErrors({ form: err instanceof Error ? err.message : "Could not create the account." });
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsed = baseSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        next[String(i.path[0])] = i.message;
      });
      setErrors(next);
      return;
    }
    setBusy(true);
    try {
      const p = await authService.signup({
        role,
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        phone: parsed.data.phone,
        village: parsed.data.village,
        state,
        language: language as Language,
      });
      if (!p || !p.role) {
        throw new Error("Could not initialize your profile. Please try signing in.");
      }
      setProfile(p);
      setOnboardingSeen(false);
      pushToast({ title: "Welcome to GreenRoots", description: "Your account is ready.", variant: "success" });
      navigate(homeForRole(p.role), { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not create the account." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-panel border border-line/80 bg-white/95 shadow-card backdrop-blur-md dark:border-portal-line dark:bg-portal-surface grid lg:grid-cols-2">
        {/* Left Side: Editorial Context & Role Explainer */}
        <div className="relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-[#152E21] via-[#1B3B2B] to-[#2E6F40] text-white">
          <div className="relative z-10">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-wheat hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
            <div className="mt-8">
              <span className="inline-block rounded-full bg-wheat/20 px-3 py-1 text-xs font-bold text-wheat border border-wheat/30">
                Onboarding & Verification
              </span>
              <h2 className="font-heading mt-4 text-3xl font-bold leading-tight text-white">
                Join the verified circular bio-economy.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Whether you are a farmer selling stubble, a buyer sourcing organic coir, or an industrial bio-pellet plant, GreenRoots guarantees transparent weighbridge tracking and PayPal settlement.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-wheat">
              <Check className="h-4 w-4 text-wheat" /> Multi-lingual AI Voice & Text listings
            </div>
            <div className="flex items-center gap-2 text-xs text-wheat">
              <Check className="h-4 w-4 text-wheat" /> Pro-rata pooled contracts with guaranteed pricing
            </div>
            <div className="flex items-center gap-2 text-xs text-wheat">
              <Check className="h-4 w-4 text-wheat" /> Official business license vetting for industries
            </div>
          </div>

          {/* Background Decorative Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EAB308_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        {/* Right Side: Onboarding & Signup Form */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white shadow-xs">
              <LogoMark className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold leading-tight text-moss dark:text-portal-ink">
                Create your account
              </h1>
              <p className="text-xs text-muted">
                {role ? `Step 2 of 2 · ${roleCards.find((r) => r.role === role)?.title} Profile` : "Step 1 of 2 · Choose your role"}
              </p>
            </div>
          </div>

          {!role ? (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Select your primary role:</p>
              <div className="space-y-2.5">
                {roleCards.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setRole(r.role)}
                    className="flex min-h-[72px] w-full items-center gap-3.5 rounded-xl border-[1.5px] border-line/80 bg-white p-3.5 text-left transition-all hover:border-forest hover:bg-sage/40 hover:shadow-xs group"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage text-moss group-hover:bg-wheat-soft group-hover:text-terracotta-dark transition-colors">
                      <r.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-moss">{r.title}</span>
                      <span className="block text-xs text-muted">{r.body}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted group-hover:translate-x-1 group-hover:text-terracotta transition-all" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-line/70 bg-canvas/70 p-3 text-[11px] leading-relaxed text-muted">
                <span className="font-bold text-moss">Admin accounts:</span> Managed directly by GreenRoots operations cluster governance.
              </div>
              <p className="pt-2 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-forest hover:text-terracotta transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-3">
              {role === "industry" ? (
                <>
                  <div>
                    <Label htmlFor="su-company">Company name</Label>
                    <Input
                      id="su-company"
                      value={form.companyName ?? ""}
                      onChange={(e) => set("companyName", e.target.value)}
                      placeholder="e.g. Panipat Biomass Energy Ltd"
                    />
                    <FieldError>{errors.companyName}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-contact">Contact person</Label>
                    <Input
                      id="su-contact"
                      value={form.contactPerson ?? ""}
                      onChange={(e) => set("contactPerson", e.target.value)}
                      placeholder="Full name"
                    />
                    <FieldError>{errors.contactPerson}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-email">Work email</Label>
                    <Input
                      id="su-email"
                      type="email"
                      value={form.email ?? ""}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@company.com"
                    />
                    <FieldError>{errors.email}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-password">Password</Label>
                    <Input
                      id="su-password"
                      type="password"
                      value={form.password ?? ""}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="At least 6 characters"
                    />
                    <FieldError>{errors.password}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-license">Business Licence Number</Label>
                    <Input
                      id="su-license"
                      value={form.licenseNumber ?? ""}
                      onChange={(e) => set("licenseNumber", e.target.value)}
                      placeholder="e.g. HR-PNP-2024-00871"
                    />
                    <FieldError>{errors.licenseNumber}</FieldError>

                    {/* Official Business License Uploader */}
                    <div className="mt-2.5 rounded-xl border border-dashed border-line/80 bg-canvas/70 p-3 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileUp className="h-5 w-5 text-terracotta mb-1" />
                        <span className="text-xs font-bold text-moss">Upload Business Certificate (PDF, PNG, JPG)</span>
                        <span className="text-[10px] text-muted">Official plant licence or state pollution board consent</span>
                        <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-moss shadow-xs border border-line hover:border-moss">
                          <span>Browse Document</span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={() => pushToast({ title: "License uploaded", description: "Document queued for admin verification.", variant: "success" })}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="su-phone">Contact phone number</Label>
                    <Input
                      id="su-phone"
                      inputMode="numeric"
                      value={form.phone ?? ""}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number (optional)"
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="su-name">{role === "farmer" ? "Your name" : "Business name"}</Label>
                    <Input
                      id="su-name"
                      value={form.name ?? ""}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder={role === "farmer" ? "Full name" : "e.g. Amit Traders"}
                      required
                    />
                    <FieldError>{errors.name}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email address</Label>
                    <Input
                      id="su-email"
                      type="email"
                      autoComplete="email"
                      value={form.email ?? ""}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                    <FieldError>{errors.email}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-password">Password</Label>
                    <Input
                      id="su-password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password ?? ""}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="At least 6 characters"
                      required
                    />
                    <FieldError>{errors.password}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-phone">Phone number</Label>
                    <Input
                      id="su-phone"
                      inputMode="numeric"
                      value={form.phone ?? ""}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      required
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="su-village">{role === "industry" ? "Plant location" : "Village"}</Label>
                <select
                  id="su-village"
                  value={form.village ?? ""}
                  onChange={(e) => set("village", e.target.value)}
                  className="min-h-14 w-full rounded-field border-[1.5px] border-line bg-surface px-4 text-base text-ink focus:border-forest focus:outline-none"
                >
                  <option value="">Choose a village</option>
                  {villagesForState.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.village}</FieldError>
              </div>

              <div>
                <Label htmlFor="su-state">State</Label>
                <select
                  id="su-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="min-h-14 w-full rounded-field border-[1.5px] border-line bg-surface px-4 text-base text-ink focus:border-forest focus:outline-none"
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {role === "industry" && (
                <div className="rounded-lg border border-settle/40 bg-settle/10 p-3 text-[11px] leading-relaxed text-ink">
                  Publishing requirements stays disabled until an admin verifies your licence. You can browse,
                  explore pools and build drafts in the meantime.
                </div>
              )}

              <FieldError>{errors.form}</FieldError>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="field"
                  onClick={() => {
                    setRole(null);
                    setErrors({});
                  }}
                >
                  Change role
                </Button>
                <Button type="submit" variant="primary" size="field" className="flex-1" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create account
                </Button>
              </div>

              <p className="text-center text-[11px] text-muted">
                By continuing you agree to the GreenRoots Terms of Service and Privacy Policy.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
