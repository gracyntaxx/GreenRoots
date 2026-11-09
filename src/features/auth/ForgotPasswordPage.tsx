import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { cn, sleep } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await sleep(700);
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        <div className="mt-4 rounded-2xl border-[1.5px] border-line bg-surface p-6 shadow-sm">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-11 w-11 text-forest" aria-hidden="true" />
              <h1 className="mt-3 text-xl font-bold text-ink">Check your email</h1>
              <p className="mt-1 text-sm text-muted">
                If an account exists for <span className="font-semibold text-ink">{email}</span>, a password reset link
                has been dispatched to your inbox.
              </p>
              <Link to="/login" className={cn(buttonVariants({ variant: "primary", size: "field" }), "mt-5 w-full")}>
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-meadow text-forest">
                <Mail className="h-5 w-5" />
              </span>
              <h1 className="mt-3 text-xl font-bold text-ink">Reset your password</h1>
              <p className="mt-1 text-sm text-muted">
                Enter the email you use for your industry or admin account. We will send a reset link.
              </p>
              <form onSubmit={submit} className="mt-5 space-y-3">
                <div>
                  <Label htmlFor="reset-email">Work email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="primary" size="field" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
              <p className="mt-3 text-[11px] text-muted">
                Farmer and buyer accounts sign in with a phone OTP and do not use passwords.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
