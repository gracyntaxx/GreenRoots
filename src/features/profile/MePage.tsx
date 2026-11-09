import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  Languages,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { useDraft } from "@/store/draft";
import { useFieldShell } from "@/app/FieldShellContext";
import { authService } from "@/services/authService";
import { ReputationBadge } from "@/components/shared/ReputationBadge";
import { VerifiedMark } from "@/components/shared/Marks";
import { ConfirmSheet } from "@/components/shared/ConfirmSheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/PageContainer";
import { Input, Label, Select } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LANGUAGES, ROLE_LABELS, type Language } from "@/types";
import { COLLECTION_POINTS } from "@/mocks/seed";
import { cn, formatDate } from "@/lib/utils";

export default function MePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile)!;
  const setProfile = useSession((s) => s.setProfile);
  const logoutSession = useSession((s) => s.logout);
  const language = useUi((s) => s.language);
  const setLanguage = useUi((s) => s.setLanguage);
  const pushToast = useUi((s) => s.pushToast);
  const clearDrafts = useDraft((s) => s.clearDrafts);
  const { openOnboarding } = useFieldShell();

  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [village, setVillage] = useState(profile.village);

  const isFarmer = profile.role === "farmer";

  const saveProfile = () => {
    setProfile({ ...profile, name: name.trim() || profile.name, village });
    setEditOpen(false);
    pushToast({ title: "Profile updated", variant: "success" });
  };

  const doLogout = async () => {
    await authService.logout();
    logoutSession();
    clearDrafts();
    qc.clear();
    navigate("/login");
  };

  return (
    <PageContainer className="pb-8">
      {/* Profile Header */}
      <div className="flex items-start gap-4 border-b border-line pb-5 dark:border-portal-line">
        <span className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-forest text-2xl sm:text-3xl font-bold text-white shadow-md">
          {profile.avatarInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">{profile.name}</h1>
            {profile.verified ? <VerifiedMark /> : null}
          </div>
          <p className="text-sm font-semibold text-forest dark:text-growth">{ROLE_LABELS[profile.role]}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-muted dark:text-portal-muted">
            <MapPin className="h-4 w-4 text-forest" /> {profile.village}, {profile.state}
          </p>
          <p className="text-xs text-muted dark:text-portal-muted mt-0.5">{t("me.joined", { date: formatDate(profile.joined) })}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label={t("me.editProfile")}
          className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted hover:bg-canvas hover:text-ink transition-colors dark:border-portal-line dark:bg-portal-surface dark:text-portal-muted"
        >
          <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left Column: Reputation & Payout */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-portal-muted">{t("me.reputation")}</p>
                <p className="mt-0.5 text-xs text-muted dark:text-portal-muted">{t("me.calculatedFrom")}</p>
              </div>
              <ReputationBadge score={profile.reputation} factors={profile.reputationFactors} showScore />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {profile.reputationFactors.map((f) => (
                <div key={f.key} className="rounded-xl border border-line bg-canvas p-3 dark:border-portal-line dark:bg-portal-bg">
                  <p className="text-[11px] leading-tight text-muted dark:text-portal-muted">{f.label}</p>
                  <p className="num mt-1 text-sm sm:text-base font-bold text-ink dark:text-portal-ink">{f.value}</p>
                </div>
              ))}
              {profile.reputationFactors.length === 0 && (
                <p className="col-span-2 rounded-xl border border-line bg-canvas p-3 text-xs text-muted dark:border-portal-line dark:bg-portal-bg">
                  No transaction history yet. Your score appears after your first completed delivery.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm sm:text-base font-bold text-ink dark:text-portal-ink">
                <Wallet className="h-5 w-5 text-forest" /> {t("me.payoutReadiness")}
              </p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-bold",
                  profile.payoutReadiness === "Ready"
                    ? "bg-meadow text-forest dark:bg-[#123524] dark:text-growth"
                    : profile.payoutReadiness === "Pending verification"
                    ? "bg-settle/15 text-[#92400E]"
                    : "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted"
                )}
              >
                {profile.payoutReadiness === "Ready"
                  ? t("me.ready")
                  : profile.payoutReadiness === "Pending verification"
                  ? t("me.pendingVerification")
                  : t("me.notSetUp")}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted dark:text-portal-muted">{t("me.payoutNote")}</p>
            <Button
              variant="outline"
              size="portal"
              className="mt-3 w-full font-semibold"
              onClick={() =>
                pushToast({
                  title: t("me.digilocker"),
                  description: "Sandbox only. No identity documents are stored in this demo.",
                  variant: "info",
                })
              }
            >
              <ShieldCheck className="h-4 w-4" /> {t("me.digilockerStart")}
            </Button>
            <p className="mt-1.5 text-center text-[11px] text-muted dark:text-portal-muted">{t("me.digilockerNote")}</p>
          </Card>
        </div>

        {/* Right Column: Language, Links & Logout */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-sm sm:text-base font-bold text-ink dark:text-portal-ink">
              <Languages className="h-5 w-5 text-forest" /> {t("me.languagePref")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code as Language)}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-xl border px-3 text-left transition-colors",
                    language === l.code ? "border-forest bg-meadow dark:border-forest/50 dark:bg-[#0F2A1B]" : "border-line bg-surface hover:bg-canvas dark:border-portal-line dark:bg-portal-surface"
                  )}
                >
                  <span>
                    <span className="block text-sm font-bold text-ink dark:text-portal-ink">{l.native}</span>
                    <span className="block text-[11px] text-muted dark:text-portal-muted">
                      {l.partial ? t("me.languageNote") : l.label}
                    </span>
                  </span>
                  {language === l.code && <BadgeCheck className="h-5 w-5 text-forest dark:text-growth" />}
                </button>
              ))}
            </div>
          </Card>

          <div className="overflow-hidden rounded-xl border border-line bg-surface dark:border-portal-line dark:bg-portal-surface divide-y divide-line dark:divide-portal-line">
            {isFarmer && (
              <Link to="/app/listings" className="flex min-h-14 items-center gap-3 px-4 text-sm font-semibold text-ink dark:text-portal-ink hover:bg-canvas dark:hover:bg-portal-bg transition-colors">
                <FileText className="h-5 w-5 text-muted" /> My listings
                <ChevronRight className="ml-auto h-4 w-4 text-muted" />
              </Link>
            )}
            <Link to="/app/orders" className="flex min-h-14 items-center gap-3 px-4 text-sm font-semibold text-ink dark:text-portal-ink hover:bg-canvas dark:hover:bg-portal-bg transition-colors">
              <Wallet className="h-5 w-5 text-muted" /> {t("common.orders")}
              <ChevronRight className="ml-auto h-4 w-4 text-muted" />
            </Link>
            <Link to="/app/collection-points" className="flex min-h-14 items-center gap-3 px-4 text-sm font-semibold text-ink dark:text-portal-ink hover:bg-canvas dark:hover:bg-portal-bg transition-colors">
              <MapPin className="h-5 w-5 text-muted" /> {t("collection.title")}
              <ChevronRight className="ml-auto h-4 w-4 text-muted" />
            </Link>
            <Link to="/app/notifications" className="flex min-h-14 items-center gap-3 px-4 text-sm font-semibold text-ink dark:text-portal-ink hover:bg-canvas dark:hover:bg-portal-bg transition-colors">
              <Bell className="h-5 w-5 text-muted" /> {t("common.notifications")}
              <ChevronRight className="ml-auto h-4 w-4 text-muted" />
            </Link>
            <button
              type="button"
              onClick={openOnboarding}
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-semibold text-ink dark:text-portal-ink hover:bg-canvas dark:hover:bg-portal-bg transition-colors"
            >
              <HelpCircle className="h-5 w-5 text-muted" /> {t("me.reopenOnboarding")}
              <ChevronRight className="ml-auto h-4 w-4 text-muted" />
            </button>
            <div className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-portal-ink">
                <Info className="h-4 w-4 text-muted" /> {t("me.about")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted dark:text-portal-muted">{t("me.aboutBody")}</p>
            </div>
          </div>

          <Button variant="outline" size="portal" className="w-full border-error/40 text-error hover:bg-error/10 font-bold" onClick={() => setLogoutOpen(true)}>
            <LogOut className="h-4 w-4" /> {t("me.logout")}
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent variant="sheet">
          <DialogHeader>
            <DialogTitle>{t("me.editProfile")}</DialogTitle>
            <DialogDescription>Changes are kept on this device for the demo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-village">Village</Label>
              <Select id="edit-village" value={village} onChange={(e) => setVillage(e.target.value)}>
                {[...new Set(COLLECTION_POINTS.map((c) => c.village))].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="primary" size="field" className="w-full" onClick={saveProfile}>
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmSheet
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title={t("me.logoutConfirm")}
        description={t("me.logoutBody")}
        confirmLabel={t("me.logout")}
        destructive
        onConfirm={doLogout}
      />
    </PageContainer>
  );
}
