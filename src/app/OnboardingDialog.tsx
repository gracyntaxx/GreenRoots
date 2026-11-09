import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Mic, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { COLLECTION_POINTS } from "@/mocks/seed";
import { LANGUAGES, type Language } from "@/types";
import { cn } from "@/lib/utils";

export function OnboardingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const setOnboardingSeen = useSession((s) => s.setOnboardingSeen);
  const setLanguage = useUi((s) => s.setLanguage);
  const language = useUi((s) => s.language);
  const [step, setStep] = useState(0);
  const [village, setVillage] = useState(profile?.village ?? "");
  const [license, setLicense] = useState("");

  const role = profile?.role ?? "farmer";
  const steps = useMemo(() => {
    if (role === "industry") {
      return [
        { title: t("onboarding.industryStep1Title"), body: t("onboarding.industryStep1Body") },
        { title: t("onboarding.industryStep2Title"), body: t("onboarding.industryStep2Body") },
        { title: t("onboarding.industryStep3Title"), body: t("onboarding.industryStep3Body") },
      ];
    }
    if (role === "buyer") {
      return [
        { title: "Find waste near you", body: "Browse real listings from verified farmers. Filter by distance, quantity and price." },
        { title: "Pay through PayPal Sandbox", body: "You will review the order, then approve the payment in PayPal. No real money moves in this demo." },
        { title: "Three statuses, always separate", body: "Fulfilment, payment and farmer payout are shown separately so you always know what is real." },
      ];
    }
    return [
      { title: t("onboarding.farmerStep1Title"), body: t("onboarding.farmerStep1Body") },
      { title: t("onboarding.farmerStep2Title"), body: t("onboarding.farmerStep2Body") },
      { title: t("onboarding.farmerStep3Title"), body: t("onboarding.farmerStep3Body") },
    ];
  }, [role, t]);

  const finish = () => {
    if (profile && village && village !== profile.village) {
      setProfile({ ...profile, village });
    }
    setOnboardingSeen(true);
    setStep(0);
    onOpenChange(false);
  };

  const skip = () => {
    setOnboardingSeen(true);
    setStep(0);
    onOpenChange(false);
  };

  if (!profile) return null;
  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : skip())}>
      <DialogContent variant="sheet" className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-forest" : "w-1.5 bg-line")}
                aria-hidden="true"
              />
            ))}
            <span className="ml-auto text-[11px] font-semibold text-muted">
              {step + 1} / {steps.length}
            </span>
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.body}</DialogDescription>
        </DialogHeader>

        {role === "farmer" && step === 0 && (
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code as Language)}
                className={cn(
                  "flex min-h-14 items-center justify-between rounded-xl border-[1.5px] px-3 text-left",
                  language === l.code ? "border-forest bg-meadow" : "border-line bg-surface hover:bg-canvas"
                )}
              >
                <span>
                  <span className="block text-base font-semibold text-ink">{l.native}</span>
                  <span className="block text-[11px] text-muted">
                    {l.label}
                    {l.partial ? " · partly translated" : ""}
                  </span>
                </span>
                {language === l.code && <Check className="h-4 w-4 text-forest" />}
              </button>
            ))}
          </div>
        )}

        {role === "farmer" && step === 1 && (
          <div className="rounded-xl border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-ink">Say this:</p>
            <p className="mt-1 text-base font-medium text-ink">
              “I have 200 kg of rice husk available at this location.”
            </p>
            <Button
              variant="secondary"
              size="field"
              className="mt-3 w-full"
              onClick={() => {
                setOnboardingSeen(true);
                onOpenChange(false);
                navigate("/app/home");
                setTimeout(() => window.dispatchEvent(new CustomEvent("greenroots-open-voice")), 250);
              }}
            >
              <Mic className="h-5 w-5" aria-hidden="true" />
              Try the voice flow
            </Button>
          </div>
        )}

        {role === "farmer" && step === 2 && (
          <div>
            <Label htmlFor="onb-village">{t("onboarding.farmerStep3Title")}</Label>
            <select
              id="onb-village"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="min-h-14 w-full rounded-field border-[1.5px] border-line bg-surface px-4 text-base text-ink"
            >
              <option value="">Choose your village</option>
              {[...new Set(COLLECTION_POINTS.map((c) => c.village))].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}

        {role === "industry" && step === 0 && (
          <div>
            <Label htmlFor="onb-license">Licence number</Label>
            <Input
              id="onb-license"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="e.g. HR-PNP-2024-00871"
            />
            <p className="mt-2 flex items-start gap-1.5 text-[12px] text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
              This is checked by an admin. You can still browse while it is pending.
            </p>
          </div>
        )}

        {role === "industry" && step === 2 && (
          <Button
            variant="outline"
            size="field"
            className="w-full"
            onClick={() => {
              finish();
              navigate("/portal/requirements/new");
            }}
          >
            Preview the requirement flow
          </Button>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" size="portal" onClick={skip}>
            {t("onboarding.skip")}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="portal" onClick={() => setStep(step - 1)}>
                {t("common.back")}
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button variant="primary" size="portal" onClick={() => setStep(step + 1)}>
                {t("onboarding.next")}
              </Button>
            ) : (
              <Button variant="primary" size="portal" onClick={finish}>
                {t("onboarding.done")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
