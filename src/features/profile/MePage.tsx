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
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-start gap-3">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest text-xl font-bold text-white">
          {profile.avatarInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="truncate text-xl font-bold text-ink">{profile.name}</h1>
            {profile.verified ? <VerifiedMark /> : null}
          </div>
          <p className="text-[12px] font-semibold text-forest">{ROLE_LABELS[profile.role]}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
            <MapPin className="h-3.5 w-3.5" /> {profile.village}, {profile.state}
          </p>
          <p className="text-[11px] text-muted">{t("me.joined", { date: formatDate(profile.joined) })}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label={t("me.editProfile")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("me.reputation")}</p>
            <p className="mt-0.5 text-[12px] text-muted">{t("me.calculatedFrom")}</p>
          </div>
          <ReputationBadge score={profile.reputation} factors={profile.reputationFactors} showScore />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {profile.reputationFactors.map((f) => (
            <div key={f.key} className="rounded-lg bg-canvas px-2.5 py-2">
              <p className="text-[10px] leading-tight text-muted">{f.label}</p>
              <p className="num mt-0.5 text-[13px] font-bold text-ink">{f.value}</p>
            </div>
          ))}
          {profile.reputationFactors.length === 0 && (
            <p className="col-span-2 rounded-lg bg-canvas p-2.5 text-[12px] text-muted">
              No transaction history yet. Your score appears after your first completed delivery.
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <Wallet className="h-4 w-4 text-forest" /> {t("me.payoutReadiness")}
          </p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              profile.payoutReadiness === "Ready"
                ? "bg-meadow text-forest"
                : profile.payoutReadiness === "Pending verification"
                ? "bg-settle/15 text-[#92400E]"
                : "bg-canvas text-muted"
            )}
          >
            {profile.payoutReadiness === "Ready"
              ? t("me.ready")
              : profile.payoutReadiness === "Pending verification"
              ? t("me.pendingVerification")
              : t("me.notSetUp")}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{t("me.payoutNote")}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
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
        <p className="mt-1 text-center text-[10px] text-muted">{t("me.digilockerNote")}</p>
      </Card>

      <Card className="mt-3 p-4">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          <Languages className="h-4 w-4 text-forest" /> {t("me.languagePref")}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code as Language)}
              className={cn(
                "flex min-h-11 items-center justify-between rounded-lg border px-2.5 text-left",
                language === l.code ? "border-forest bg-meadow" : "border-line bg-surface"
              )}
            >
              <span>
                <span className="block text-[13px] font-semibold text-ink">{l.native}</span>
                <span className="block text-[10px] text-muted">
                  {l.partial ? t("me.languageNote") : l.label}
                </span>
              </span>
              {language === l.code && <BadgeCheck className="h-4 w-4 text-forest" />}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-3 overflow-hidden rounded-xl border-[1.5px] border-line bg-surface">
        {isFarmer && (
          <Link to="/app/listings" className="flex min-h-14 items-center gap-3 border-b border-line px-4 text-[13px] font-semibold text-ink">
            <FileText className="h-4 w-4 text-muted" /> My listings
            <ChevronRight className="ml-auto h-4 w-4 text-muted" />
          </Link>
        )}
        <Link to="/app/orders" className="flex min-h-14 items-center gap-3 border-b border-line px-4 text-[13px] font-semibold text-ink">
          <Wallet className="h-4 w-4 text-muted" /> {t("common.orders")}
          <ChevronRight className="ml-auto h-4 w-4 text-muted" />
        </Link>
        <Link to="/app/collection-points" className="flex min-h-14 items-center gap-3 border-b border-line px-4 text-[13px] font-semibold text-ink">
          <MapPin className="h-4 w-4 text-muted" /> {t("collection.title")}
          <ChevronRight className="ml-auto h-4 w-4 text-muted" />
        </Link>
        <Link to="/app/notifications" className="flex min-h-14 items-center gap-3 border-b border-line px-4 text-[13px] font-semibold text-ink">
          <Bell className="h-4 w-4 text-muted" /> {t("common.notifications")}
          <ChevronRight className="ml-auto h-4 w-4 text-muted" />
        </Link>
        <button
          type="button"
          onClick={openOnboarding}
          className="flex min-h-14 w-full items-center gap-3 border-b border-line px-4 text-left text-[13px] font-semibold text-ink"
        >
          <HelpCircle className="h-4 w-4 text-muted" /> {t("me.reopenOnboarding")}
          <ChevronRight className="ml-auto h-4 w-4 text-muted" />
        </button>
        <div className="px-4 py-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <Info className="h-4 w-4 text-muted" /> {t("me.about")}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{t("me.aboutBody")}</p>
        </div>
      </div>

      <Button variant="outline" size="field" className="mt-3 w-full border-error/30 text-error" onClick={() => setLogoutOpen(true)}>
        <LogOut className="h-5 w-5" /> {t("me.logout")}
      </Button>

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
    </div>
  );
}
