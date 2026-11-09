import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Leaf, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/Brand";
import { useUi } from "@/store/ui";
import { useSession } from "@/store/session";
import { LANGUAGES, type Language } from "@/types";
import { homeForRole } from "@/lib/routing";
import { cn } from "@/lib/utils";

export default function WelcomePage() {
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const language = useUi((s) => s.language);
  const setLanguage = useUi((s) => s.setLanguage);

  if (profile) return <Navigate to={homeForRole(profile.role)} replace />;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[1.05fr_1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-forest px-6 py-8 text-white lg:rounded-r-[2rem] lg:px-12 lg:py-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-growth/20 blur-2xl" aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <LogoMark className="h-7 w-7" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none">GreenRoots</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-meadow/80">Crop residue marketplace</p>
              </div>
            </div>

            <h1 className="mt-10 max-w-md text-[2rem] font-bold leading-[1.15] sm:text-[2.6rem]">
              Sell crop residue,
              <br />
              not smoke.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-meadow/90">
              List what is left after harvest, join a pool with other farmers, and receive verified payment settlement with zero residue burning.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-2.5">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-growth" aria-hidden="true" />
                Speak in your language and we turn it into a listing draft.
              </li>
              <li className="flex items-start gap-2.5">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-growth" aria-hidden="true" />
                Fulfilment, payment and payout are always shown separately.
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-growth" aria-hidden="true" />
                AI only suggests. You review and confirm every field.
              </li>
            </ul>
          </div>

          <p className="relative mt-10 max-w-sm text-[11px] leading-relaxed text-meadow/70">
            GreenRoots Sustainable Agri Exchange. Payments settled securely via PayPal. No card or bank details are ever stored.
          </p>
        </section>

        <section className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-forest">Step 1 of 2</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Choose your language</h2>
            <p className="mt-1 text-sm text-muted">
              Pick the script you read most easily. You can change it any time from the top bar.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Language">
              {LANGUAGES.map((l) => {
                const active = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLanguage(l.code as Language)}
                    className={cn(
                      "flex min-h-[72px] items-center justify-between rounded-xl border-[1.5px] px-3.5 text-left transition-colors",
                      active ? "border-forest bg-meadow" : "border-line bg-surface hover:border-forest/40"
                    )}
                  >
                    <span>
                      <span className="block text-lg font-semibold leading-tight text-ink">{l.native}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {l.label}
                        {l.partial ? " · partly translated" : ""}
                      </span>
                    </span>
                    {active && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-white">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="field"
              className="mt-6 w-full"
              onClick={() => navigate("/login")}
            >
              Continue
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>

            <p className="mt-4 text-center text-sm text-muted">
              New to GreenRoots?{" "}
              <Link to="/signup" className="font-semibold text-forest underline-offset-2 hover:underline">
                Create an account
              </Link>
            </p>
            <p className="mt-1 text-center text-[12px] text-muted">
              Quick one-tap sign-in is available on the sign-in screen.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
