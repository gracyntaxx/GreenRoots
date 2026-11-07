import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Factory, Loader2, ShieldCheck, ShoppingBasket, Smartphone, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoMark } from "@/components/shared/Brand";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { authService } from "@/services/authService";
import { DEMO_ACCOUNTS } from "@/mocks/seed";
import { homeForRole } from "@/lib/routing";
import type { Profile, Role } from "@/types";
import { cn } from "@/lib/utils";

const demoIcons: Record<string, typeof Sprout> = {
  sprout: Sprout,
  shopping: ShoppingBasket,
  factory: Factory,
  shield: ShieldCheck,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const setOnboardingSeen = useSession((s) => s.setOnboardingSeen);
  const pushToast = useUi((s) => s.pushToast);

  const [demoBusy, setDemoBusy] = useState<Role | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile) return <Navigate to={homeForRole(profile.role)} replace />;

  const from = (location.state as { from?: string } | null)?.from;

  const enter = (p: Profile, message?: string) => {
    setProfile(p);
    setOnboardingSeen(true);
    pushToast({ title: message ?? `Signed in as ${p.name}`, variant: "success" });
    const area = p.role === "industry" || p.role === "admin" ? "/portal" : "/app";
    navigate(from && from.startsWith(area) ? from : homeForRole(p.role), { replace: true });
  };

  const demoLogin = async (role: Role) => {
    setError(null);
    setDemoBusy(role);
    try {
      const p = await authService.demoLogin(role);
      enter(p, `Demo account: ${p.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the demo account.");
    } finally {
      setDemoBusy(null);
    }
  };

  const requestOtp = async () => {
    setError(null);
    setOtpLoading(true);
    try {
      const res = await authService.requestOtp(phone);
      setOtpSent(true);
      setOtpHint(res.hint);
      pushToast({ title: "OTP sent (demo)", description: res.hint, variant: "info" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const p = await authService.loginPhone(phone, otp);
      enter(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const p = await authService.loginEmail(email, password);
      enter(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Link to="/welcome" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-4 rounded-2xl border-[1.5px] border-line bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white">
              <LogoMark className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-xl font-bold leading-tight text-ink">Sign in to GreenRoots</h1>
              <p className="text-[12px] text-muted">Farmers, buyers, industries and admins</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-ai/30 bg-aitint p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ai">Demo accounts · one tap</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((a) => {
                const Icon = demoIcons[a.icon] ?? Sprout;
                const busyThis = demoBusy === a.role;
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={demoBusy !== null}
                    onClick={() => demoLogin(a.role)}
                    className={cn(
                      "flex min-h-[58px] items-center gap-2.5 rounded-lg border border-ai/25 bg-surface px-3 text-left transition-colors hover:border-ai/60 disabled:opacity-60"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aitint text-ai">
                      {busyThis ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">{a.name}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {a.label} · {a.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-ai/90">
              Demo shortcuts are only on this sign-in screen. Every other screen uses the real app flows.
            </p>
          </div>

          <Tabs defaultValue="phone" className="mt-5" onValueChange={() => setError(null)}>
            <TabsList className="w-full">
              <TabsTrigger value="phone" className="flex-1">
                <Smartphone className="h-4 w-4" /> Phone OTP
              </TabsTrigger>
              <TabsTrigger value="email" className="flex-1">
                Email &amp; password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phone">
              <form onSubmit={submitPhone} className="space-y-3">
                <div>
                  <Label htmlFor="login-phone">Phone number</Label>
                  <Input
                    id="login-phone"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                  />
                </div>

                {otpSent && (
                  <div>
                    <Label htmlFor="login-otp">One-time code</Label>
                    <Input
                      id="login-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="num tracking-[0.4em]"
                      required
                    />
                    {otpHint && <p className="mt-1.5 text-[12px] font-medium text-ai">{otpHint}</p>}
                  </div>
                )}

                {!otpSent ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="field"
                    className="w-full"
                    disabled={phone.length !== 10 || otpLoading}
                    onClick={requestOtp}
                  >
                    {otpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send OTP
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="field" onClick={() => setOtpSent(false)}>
                      Change
                    </Button>
                    <Button type="submit" variant="primary" size="field" className="flex-1" disabled={otp.length !== 6 || busy}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Sign in
                    </Button>
                  </div>
                )}
                <p className="text-[11px] text-muted">Demo OTP is 123456. Use a demo account phone or your signup phone.</p>
              </form>
            </TabsContent>

            <TabsContent value="email">
              <form onSubmit={submitEmail} className="space-y-3">
                <div>
                  <Label htmlFor="login-email">Work email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="mt-1.5 text-right">
                    <Link to="/forgot-password" className="text-[12px] font-semibold text-forest hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <Button type="submit" variant="primary" size="field" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
                <p className="text-[11px] text-muted">
                  Demo industry and admin accounts accept any password of 6 or more characters.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <FieldError>{error}</FieldError>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          New to GreenRoots?{" "}
          <Link to="/signup" className="font-semibold text-forest underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-[11px] text-muted">
          Sandbox demo · no real money · no card or bank details
        </p>
      </div>
    </div>
  );
}
