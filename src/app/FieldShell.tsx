import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Layers, Mic, ShoppingBasket, User, ReceiptText } from "lucide-react";
import { Brand } from "@/components/shared/Brand";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { OfflineBanner } from "@/components/shared/Connectivity";
import { OnboardingDialog } from "@/app/OnboardingDialog";
import { FieldShellContext } from "@/app/FieldShellContext";
import { VoiceSheet } from "@/features/voice/VoiceSheet";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";

function FieldTab({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold",
          isActive ? "text-forest" : "text-muted"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("h-5 w-5", isActive && "stroke-[2.4]")} aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function FieldShell() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile);
  const onboardingSeen = useSession((s) => s.onboardingSeen);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!onboardingSeen) setOnboardingOpen(true);
  }, [onboardingSeen]);

  useEffect(() => {
    setVoiceOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const openVoice = () => setVoiceOpen(true);
    window.addEventListener("greenroots-open-voice", openVoice);
    return () => window.removeEventListener("greenroots-open-voice", openVoice);
  }, []);

  const openVoice = useCallback(() => setVoiceOpen(true), []);
  const openOnboarding = useCallback(() => setOnboardingOpen(true), []);
  const api = useMemo(() => ({ openVoice, openOnboarding }), [openVoice, openOnboarding]);

  const isFarmer = profile?.role === "farmer";

  return (
    <FieldShellContext.Provider value={api}>
      <div className="phone-surround flex min-h-screen justify-center">
        <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-canvas shadow-2xl">
          <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between gap-2 border-b border-line bg-surface/95 px-4 backdrop-blur">
            <Brand compact />
            <div className="flex items-center gap-1">
              <NotificationBell />
              <LanguageSwitcher compact />
            </div>
          </header>
          <OfflineBanner />

          <main className="flex-1 pb-32">
            <Outlet />
          </main>

          <nav
            aria-label="Main navigation"
            className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur"
          >
            {isFarmer ? (
              <div className="flex items-end">
                <FieldTab to="/app/home" icon={Home} label={t("common.home")} />
                <FieldTab to="/app/market" icon={ShoppingBasket} label={t("common.market")} />
                <div className="flex flex-1 flex-col items-center">
                  <button
                    type="button"
                    onClick={openVoice}
                    aria-label={t("home.voiceAction")}
                    className="field-tap -mt-9 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-forest text-white shadow-[0_10px_24px_rgba(21,128,61,0.4)] ring-4 ring-surface transition-transform active:scale-95"
                  >
                    <Mic className="h-7 w-7" aria-hidden="true" />
                  </button>
                  <span className="mt-0.5 pb-1 text-[11px] font-bold text-forest">{t("common.voice")}</span>
                </div>
                <FieldTab to="/app/pools" icon={Layers} label={t("common.pools")} />
                <FieldTab to="/app/me" icon={User} label={t("common.me")} />
              </div>
            ) : (
              <div className="flex items-end">
                <FieldTab to="/app/market" icon={ShoppingBasket} label={t("common.market")} />
                <FieldTab to="/app/orders" icon={ReceiptText} label={t("common.orders")} />
                <FieldTab to="/app/pools" icon={Layers} label={t("common.pools")} />
                <FieldTab to="/app/me" icon={User} label={t("common.me")} />
              </div>
            )}
          </nav>
        </div>
      </div>

      {isFarmer && <VoiceSheet open={voiceOpen} onOpenChange={setVoiceOpen} />}
      <OnboardingDialog open={onboardingOpen} onOpenChange={setOnboardingOpen} />
    </FieldShellContext.Provider>
  );
}
