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

          <Tabs defaultValue="email" className="mt-5" onValueChange={() => setError(null)}>
            <TabsList className="w-full">
              <TabsTrigger value="email" className="flex-1">
                Email &amp; password
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex-1">
                <Smartphone className="h-4 w-4" /> Phone OTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={submitEmail} className="space-y-3">
                <div>
                  <Label htmlFor="login-email">Email address</Label>
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
                  Sign in with your registered email and password.
                </p>
              </form>
            </TabsContent>

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
                <p className="text-[11px] text-muted">Use your registered 10-digit mobile number to receive a verification code.</p>
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
          GreenRoots Agri Platform · Secure Agricultural Waste Exchange
        </p>
      </div>
    </div>
  );
}
