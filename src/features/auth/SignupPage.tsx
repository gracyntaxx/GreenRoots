import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Factory, Loader2, ShoppingBasket, Sprout } from "lucide-react";
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
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number."),
  village: z.string().min(1, "Choose your village."),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

const industrySchema = z.object({
  companyName: z.string().min(2, "Enter the company name."),
  contactPerson: z.string().min(2, "Enter a contact person."),
  email: z.string().email("Enter a valid work email."),
  password: z.string().min(6, "Use at least 6 characters."),
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
          village: parsed.data.village,
          state,
          language: language as Language,
          licenseNumber: parsed.data.licenseNumber,
        });
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
    if (parsed.data.otp !== "123456") {
      setErrors({ otp: "That code is not correct. Use 123456 in the demo." });
      return;
    }
    setBusy(true);
    try {
      const p = await authService.signup({
        role,
        name: parsed.data.name,
        phone: parsed.data.phone,
        village: parsed.data.village,
        state,
        language: language as Language,
      });
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
    <div className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <Link to="/login" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        <div className="mt-4 rounded-2xl border-[1.5px] border-line bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white">
              <LogoMark className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-xl font-bold leading-tight text-ink">Create your account</h1>
              <p className="text-[12px] text-muted">
                {role ? `Step 2 of 2 · ${roleCards.find((r) => r.role === role)?.title}` : "Step 1 of 2 · Choose your role"}
              </p>
            </div>
          </div>

          {!role ? (
            <div className="mt-5">
              <div className="space-y-2.5">
                {roleCards.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setRole(r.role)}
                    className="flex min-h-[76px] w-full items-center gap-3 rounded-xl border-[1.5px] border-line bg-surface px-4 text-left transition-colors hover:border-forest/50 hover:bg-canvas"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-meadow text-forest">
                      <r.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-ink">{r.title}</span>
                      <span className="block text-[12px] text-muted">{r.body}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-muted" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-line bg-canvas p-3 text-[11px] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Admin accounts cannot be self-assigned.</span> GreenRoots
                operations creates admin accounts directly.
              </div>
              <p className="mt-4 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-forest hover:underline">
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
                    <Label htmlFor="su-license">Licence number</Label>
                    <Input
                      id="su-license"
                      value={form.licenseNumber ?? ""}
                      onChange={(e) => set("licenseNumber", e.target.value)}
                      placeholder="e.g. HR-PNP-2024-00871"
                    />
                    <FieldError>{errors.licenseNumber}</FieldError>
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
                    />
                    <FieldError>{errors.name}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="su-phone">Phone number</Label>
                    <Input
                      id="su-phone"
                      inputMode="numeric"
                      value={form.phone ?? ""}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
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

              {role !== "industry" && (
                <div>
                  <Label htmlFor="su-otp">Phone verification code</Label>
                  <Input
                    id="su-otp"
                    inputMode="numeric"
                    value={form.otp ?? ""}
                    onChange={(e) => set("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className="num tracking-[0.4em]"
                  />
                  <FieldHint>Demo OTP is 123456. In production this is sent by SMS.</FieldHint>
                  <FieldError>{errors.otp}</FieldError>
                </div>
              )}

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
                By continuing you agree to the GreenRoots demo terms. No real payments are taken.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
