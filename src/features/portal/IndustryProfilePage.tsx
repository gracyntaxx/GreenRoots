import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  FileText,
  Globe2,
  LogOut,
  Mail,
  MapPin,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { useDraft } from "@/store/draft";
import { authService } from "@/services/authService";
import { poolService } from "@/services/poolService";
import { requirementService } from "@/services/requirementService";
import { payoutService } from "@/services/payoutService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { VerifiedMark, SandboxStrip } from "@/components/shared/Marks";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ConfirmSheet } from "@/components/shared/ConfirmSheet";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { formatMoney } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";
import { formatDate, cn } from "@/lib/utils";
import { LANGUAGES } from "@/types";

export default function IndustryProfilePage() {
  const profile = useSession((s) => s.profile)!;
  const setProfile = useSession((s) => s.setProfile);
  const clearDrafts = useDraft((s) => s.clearDrafts);
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const verification = authService.getIndustryVerification(profile.id);
  const pools = useQuery({
    queryKey: ["pools", profile.id],
    queryFn: () => poolService.list(profile, { industryId: profile.id }),
  });
  const requirements = useQuery({
    queryKey: ["requirements", profile.id],
    queryFn: () => requirementService.list(profile),
  });
  const payables = useQuery({ queryKey: ["payouts"], queryFn: () => payoutService.list() });

  const myPools = pools.data ?? [];
  const myPoolIds = new Set(myPools.map((p) => p.id));
  const myPayables = (payables.data ?? []).filter((p) => myPoolIds.has(p.poolId));
  const myRequirements = (requirements.data ?? []).filter((r) => r.industryId === profile.id);
  const verified = verification?.status === "Verified";
  const language = LANGUAGES.find((l) => l.code === profile.language);

  const logout = async () => {
    await authService.logout();
    setProfile(null);
    clearDrafts();
    qc.clear();
    pushToast({ title: "Signed out", variant: "info" });
    navigate("/login");
  };

  return (
    <div>
      <PortalPageHeader
        title="Company profile"
        description="Registered details, verification status and settlement readiness. Verified details are locked to protect farmers."
        actions={<VerifiedMark label={verified ? "Licence verified" : "Verification pending"} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requirements" value={myRequirements.length} sub={`${myRequirements.filter((r) => r.status === "Open").length} open`} icon={<Building2 className="h-5 w-5 text-forest" />} />
        <StatCard label="Pools" value={myPools.length} sub={`${kgToBestDisplay(myPools.reduce((s, p) => s + p.committedKg, 0))} committed`} icon={<BadgeCheck className="h-5 w-5 text-navy" />} />
        <StatCard
          label="Farmer payables"
          value={formatMoney(myPayables.reduce((s, p) => s + p.net, 0))}
          sub={`${myPayables.length} records`}
          icon={<Wallet className="h-5 w-5 text-settle" />}
        />
        <StatCard
          label="Member since"
          value={<span className="text-lg">{formatDate(profile.joined)}</span>}
          sub={profile.id}
          icon={<CalendarDays className="h-5 w-5 text-muted" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <PortalCard className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-forest text-xl font-bold text-white">
                {profile.avatarInitials}
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight">{profile.name}</p>
                <p className="text-[12px] text-muted dark:text-portal-muted">Industry account · {profile.id}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", verified ? "bg-meadow text-forest dark:bg-[#123524] dark:text-growth" : "bg-settle/15 text-[#92400E]")}>
                    {verification?.status ?? "Not submitted"}
                  </span>
                  <span className="text-[11px] text-muted dark:text-portal-muted">
                    Payout readiness: <strong className="text-ink dark:text-portal-ink">{profile.payoutReadiness}</strong>
                  </span>
                </div>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 border-t border-line pt-3 dark:border-portal-line sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">
                  <Mail className="h-3.5 w-3.5" /> Email
                </dt>
                <dd className="mt-0.5 break-all text-[13px] font-medium">{profile.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </dt>
                <dd className="mt-0.5 text-[13px] font-medium">
                  {profile.village}, {profile.district}, {profile.state}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">
                  <Globe2 className="h-3.5 w-3.5" /> Portal language
                </dt>
                <dd className="mt-1">
                  <LanguageSwitcher />
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">
                  <FileText className="h-3.5 w-3.5" /> Licence
                </dt>
                <dd className="num mt-0.5 text-[13px] font-medium">{verification?.licenseNumber ?? "—"}</dd>
              </div>
            </dl>

            <p className="mt-3 rounded-lg bg-canvas p-2.5 text-[11px] leading-relaxed text-muted dark:bg-portal-bg dark:text-portal-muted">
              Registered company details are locked after verification. Contact GreenRoots support to change a legal
              name, licence number or registered address.
            </p>
          </PortalCard>

          <PortalCard className="p-4">
            <p className="text-[13px] font-bold">Verification</p>
            {verification ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      verified ? "bg-meadow text-forest dark:bg-[#123524] dark:text-growth" : "bg-settle/15 text-settle"
                    )}
                  >
                    {verified ? <BadgeCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">
                      {verified ? "Verified by GreenRoots admin" : verification.status === "Rejected" ? "Verification rejected" : "Waiting for admin review"}
                    </p>
                    <p className="text-[11px] text-muted dark:text-portal-muted">Submitted {formatDate(verification.submittedAt)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-line p-2.5 dark:border-portal-line">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Business name</p>
                    <p className="text-[12px] font-semibold">{verification.businessName}</p>
                  </div>
                  <div className="rounded-lg border border-line p-2.5 dark:border-portal-line">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Contact person</p>
                    <p className="text-[12px] font-semibold">{verification.contactPerson}</p>
                  </div>
                  <div className="rounded-lg border border-line p-2.5 dark:border-portal-line sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Registered address</p>
                    <p className="text-[12px] font-semibold">{verification.registeredAddress}</p>
                  </div>
                </div>
                {verification.rejectionReason && (
                  <p className="mt-2 rounded-lg bg-error/10 p-2 text-[11px] font-medium text-error">
                    Reason: {verification.rejectionReason}
                  </p>
                )}
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Documents</p>
                <div className="mt-1 space-y-1.5">
                  {verification.documents.length === 0 && (
                    <p className="rounded-lg bg-canvas p-2 text-[11px] text-muted dark:bg-portal-bg dark:text-portal-muted">
                      No documents uploaded.
                    </p>
                  )}
                  {verification.documents.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 rounded-lg border border-line p-2 dark:border-portal-line">
                      <FileText className="h-4 w-4 text-muted" />
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{d.name}</span>
                      <span className="text-[10px] uppercase text-muted dark:text-portal-muted">{d.type}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 rounded-lg bg-canvas p-3 text-[12px] text-muted dark:bg-portal-bg dark:text-portal-muted">
                No verification record was found for this account.
              </p>
            )}
          </PortalCard>
        </div>

        <div className="space-y-4">
          <PortalCard className="p-4">
            <p className="text-[13px] font-bold">Settlement</p>
            <SandboxStrip className="mt-2 rounded-lg border" />
            <div className="mt-2 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-muted dark:text-portal-muted">Payments captured</span>
                <span className="num font-bold">{formatMoney(myPools.length ? myPayables.reduce((s, p) => s + p.gross, 0) : 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted dark:text-portal-muted">Commission (5%)</span>
                <span className="num font-bold">{formatMoney(myPayables.reduce((s, p) => s + p.commission, 0))}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-2 dark:border-portal-line">
                <span className="text-muted dark:text-portal-muted">Farmer net</span>
                <span className="num font-bold text-forest dark:text-growth">{formatMoney(myPayables.reduce((s, p) => s + p.net, 0))}</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted dark:text-portal-muted">
              GreenRoots never stores card or bank details. Only PayPal references are kept.
            </p>
          </PortalCard>

          <PortalCard className="p-4">
            <p className="text-[13px] font-bold">Account</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted dark:text-portal-muted">
              Signed in as {profile.email ?? profile.phone ?? profile.name}.
            </p>
            <Button variant="outline" size="portal" className="mt-3 w-full" onClick={() => setLogoutOpen(true)}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
            <p className="mt-2 text-[10px] text-muted dark:text-portal-muted">
              Demo account · language: {language?.label ?? profile.language}
            </p>
          </PortalCard>
        </div>
      </div>

      <ConfirmSheet
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        variant="center"
        title="Log out of the portal?"
        description="Your drafts stay in this browser, but you will need to sign in again."
        confirmLabel="Log out"
        destructive
        onConfirm={logout}
        actor={{ name: profile.name, role: profile.role }}
      />
    </div>
  );
}
