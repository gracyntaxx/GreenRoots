import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoMark } from "@/components/shared/Brand";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { authService } from "@/services/authService";
import { homeForRole } from "@/lib/routing";
import type { Profile } from "@/types";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const setOnboardingSeen = useSession((s) => s.setOnboardingSeen);
  const pushToast = useUi((s) => s.pushToast);

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

  const requestOtp = async () => {
    setError(null);
    setOtpLoading(true);
    try {
      const res = await authService.requestOtp(phone);
      setOtpSent(true);
      setOtpHint(res.hint);
      pushToast({ title: "OTP sent", description: res.hint, variant: "info" });
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
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-panel border border-line/80 bg-white/95 shadow-card backdrop-blur-md dark:border-portal-line dark:bg-portal-surface grid lg:grid-cols-2">
        {/* Left Side: Editorial Botanical Backdrop */}
        <div className="relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-[#152E21] via-[#1B3B2B] to-[#2E6F40] text-white">
          <div className="relative z-10">
            <Link to="/welcome" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-wheat hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to GreenRoots
            </Link>
            <div className="mt-8">
              <span className="inline-block rounded-full bg-wheat/20 px-3 py-1 text-xs font-bold text-wheat border border-wheat/30">
                Circular Agriculture · Fintech Verified
              </span>
              <h2 className="font-heading mt-4 text-3xl font-bold leading-tight text-white">
                Turn crop residue into guaranteed farm income.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Join over 1,200 farmers and verified green industries trading biomass, preventing stubble fires, and settling via PayPal escrow.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wheat text-forest-900 font-bold">
                PR
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ramesh Patil · Farmer</p>
                <p className="text-[11px] text-white/70">Rewari Cluster · 4.92 Trust Score</p>
              </div>
            </div>
            <p className="mt-2.5 text-xs italic text-white/90">
              "I listed 200 kg of rice husk using my voice in Hindi. The buyer funded the pool via PayPal, and the payout was instant at the weighbridge."
            </p>
          </div>

          {/* Background Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EAB308_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        {/* Right Side: Sign-in Form */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white shadow-xs">
              <LogoMark className="h-7 w-7" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold leading-tight text-moss dark:text-portal-ink">
                Sign in to GreenRoots
              </h1>
              <p className="text-xs text-muted">Farmers, buyers, industries and governance</p>
            </div>
          </div>

          <Tabs defaultValue="email" className="w-full" onValueChange={() => setError(null)}>
            <TabsList className="w-full bg-sage/60 p-1">
              <TabsTrigger value="email" className="flex-1 font-bold">
                Email &amp; Password
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex-1 font-bold">
                <Smartphone className="h-4 w-4" /> Phone OTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
              <form onSubmit={submitEmail} className="space-y-3.5">
                <div>
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
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
                  <div className="mt-1 text-right">
                    <Link to="/forgot-password" className="text-xs font-semibold text-terracotta hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <Button type="submit" variant="primary" size="field" className="w-full font-bold shadow-sm" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="mt-4">
              <form onSubmit={submitPhone} className="space-y-3.5">
                <div>
                  <Label htmlFor="login-phone">Mobile Number</Label>
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
                    <Label htmlFor="login-otp">One-time code (OTP)</Label>
                    <Input
                      id="login-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="num tracking-[0.4em] font-bold text-center"
                      required
                    />
                    {otpHint && <p className="mt-1.5 text-xs font-semibold text-terracotta">{otpHint}</p>}
                  </div>
                )}

                {!otpSent ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="field"
                    className="w-full font-bold shadow-sm"
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
                    <Button type="submit" variant="primary" size="field" className="flex-1 font-bold shadow-sm" disabled={otp.length !== 6 || busy}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Verify & Sign In
                    </Button>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>

          <FieldError>{error}</FieldError>

          <div className="mt-6 border-t border-line/70 pt-4 text-center">
            <p className="text-sm text-muted">
              New to GreenRoots?{" "}
              <Link to="/signup" className="font-bold text-forest hover:text-terracotta transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
