import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Banknote,
  ClipboardList,
  Flag,
  Layers,
  PackageSearch,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useSession } from "@/store/session";
import { authService } from "@/services/authService";
import { requirementService } from "@/services/requirementService";
import { poolService } from "@/services/poolService";
import { payoutService } from "@/services/payoutService";
import { forecastService } from "@/services/forecastService";
import { adminService } from "@/services/adminService";
import { moderationService } from "@/services/moderationService";
import { auditService } from "@/services/auditService";
import { PortalPageHeader, StatCard, SectionTitle } from "@/components/shared/PageHeader";
import { PageContainer } from "@/components/shared/PageContainer";
import { PoolProgress } from "@/components/shared/PoolProgress";
import { VerifiedMark, AiChip } from "@/components/shared/Marks";
import { PortalCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";
import { WASTE_LABELS } from "@/types";
import { formatMoney } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";
import { timeAgo } from "@/lib/utils";

export default function OverviewPage() {
  const profile = useSession((s) => s.profile)!;
  const isAdmin = profile.role === "admin";

  const requirements = useQuery({ queryKey: ["requirements", profile.id], queryFn: () => requirementService.list(profile) });
  const pools = useQuery({
    queryKey: ["pools", profile.id],
    queryFn: () => poolService.list(profile, isAdmin ? undefined : { industryId: profile.id }),
  });
  const payables = useQuery({ queryKey: ["payouts"], queryFn: () => payoutService.list() });
  const forecasts = useQuery({ queryKey: ["forecasts"], queryFn: () => forecastService.list() });
  const verifications = useQuery({ queryKey: ["verifications"], queryFn: () => adminService.verifications(), enabled: isAdmin });
  const flags = useQuery({ queryKey: ["flags"], queryFn: () => moderationService.list(), enabled: isAdmin });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => adminService.users(), enabled: isAdmin });
  const listings = useQuery({ queryKey: ["admin-listings"], queryFn: () => adminService.listings(), enabled: isAdmin });
  const audit = useQuery({ queryKey: ["audit"], queryFn: () => auditService.list(), enabled: isAdmin });

  const verification = authService.getIndustryVerification(profile.id);
  const myPools = (pools.data ?? []).filter((p) => p.industryId === profile.id);
  const myPoolIds = new Set(myPools.map((p) => p.id));
  const myPayables = (payables.data ?? []).filter((p) => myPoolIds.has(p.poolId));
  const pendingPayout = myPayables
    .filter((p) => p.payout === "Pending" || p.payout === "Processing")
    .reduce((s, p) => s + p.net, 0);
  const openRequirements = (requirements.data ?? []).filter((r) => r.industryId === profile.id && r.status === "Open");
  const activePools = myPools.filter((p) => p.status === "Open");
  const highForecast = (forecasts.data ?? []).find((f) => f.confidence === "High");

  if (isAdmin) {
    const pendingVer = (verifications.data ?? []).filter((v) => v.status === "Pending");
    const openFlags = (flags.data ?? []).filter((f) => f.status === "Open");
    const activeListings = (listings.data ?? []).filter((l) => l.status === "Active");
    const pendingPay = (payables.data ?? []).filter((p) => p.payout === "Pending" || p.payout === "Processing");
    const unusual = (payables.data ?? []).filter((p) => p.net > 50000);

    return (
      <PageContainer>
        <PortalPageHeader
          title={`Good to see you, ${(profile?.name || "Partner").split(" ")[0]}`}
          description="Operations overview. Every AI-prepared action below still needs a human decision."
          actions={
            <Link
              to="/portal/admin/moderation"
              className="inline-flex h-10 items-center gap-2 rounded-portal border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-canvas dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink dark:hover:bg-portal-bg"
            >
              <Flag className="h-4 w-4" /> Review flags
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Pending verifications" value={pendingVer.length} sub="Awaiting human decision" tone={pendingVer.length ? "warning" : "success"} icon={<BadgeCheck className="h-5 w-5 text-settle" />} />
          <StatCard label="Open moderation flags" value={openFlags.length} sub={`${(flags.data ?? []).length} total flags`} tone={openFlags.length ? "warning" : "success"} icon={<ShieldAlert className="h-5 w-5 text-settle" />} />
          <StatCard label="Active listings" value={activeListings.length} sub={`${(listings.data ?? []).length} listings on record`} icon={<PackageSearch className="h-5 w-5 text-forest" />} />
          <StatCard label="Payouts pending" value={formatMoney(pendingPay.reduce((s, p) => s + p.net, 0))} sub={`${pendingPay.length} farmer payables`} icon={<Banknote className="h-5 w-5 text-navy" />} />
        </div>

        {unusual.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-portal border border-settle/40 bg-[#FFFBEB] p-3 text-[13px] text-[#92400E] dark:bg-[#2A2110]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{unusual.length} payables look unusual</p>
              <p className="mt-0.5 text-[12px]">
                Net above ₹50,000 needs a closer look.{" "}
                <Link to="/portal/admin/payables" className="font-semibold underline">
                  Open payables
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <PortalCard className="p-4">
            <SectionTitle
              title="Verification queue"
              action={
                <Link to="/portal/admin/verification" className="text-[12px] font-semibold text-forest dark:text-growth">
                  View all
                </Link>
              }
            />
            {verifications.isLoading && <Skeleton className="h-24 w-full" />}
            <div className="space-y-2">
              {pendingVer.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-2.5 dark:border-portal-line">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{v.businessName}</p>
                    <p className="num text-[11px] text-muted dark:text-portal-muted">{v.licenseNumber}</p>
                  </div>
                  <Link to="/portal/admin/verification" className="text-[11px] font-semibold text-forest dark:text-growth">
                    Review
                  </Link>
                </div>
              ))}
              {!verifications.isLoading && pendingVer.length === 0 && (
                <p className="rounded-lg bg-canvas p-3 text-[12px] text-muted dark:bg-portal-bg dark:text-portal-muted">
                  No verifications waiting.
                </p>
              )}
            </div>
          </PortalCard>

          <PortalCard className="p-4">
            <SectionTitle
              title="Recent AI actions"
              action={
                <Link to="/portal/admin/audit" className="text-[12px] font-semibold text-forest dark:text-growth">
                  Audit log
                </Link>
              }
            />
            {audit.isLoading && <Skeleton className="h-24 w-full" />}
            <div className="space-y-2">
              {(audit.data ?? []).slice(0, 3).map((a) => (
                <div key={a.id} className="rounded-lg border border-line p-2.5 dark:border-portal-line">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold">{a.action}</p>
                    <AiChip kind="explanation" iconOnly />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted dark:text-portal-muted">{a.aiPreparedSummary}</p>
                  <p className="text-[10px] text-muted dark:text-portal-muted">
                    Confirmed by {a.confirmedBy} · {timeAgo(a.at)}
                  </p>
                </div>
              ))}
            </div>
          </PortalCard>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PortalPageHeader
        title={`Good to see you, ${(profile?.name || "Partner").split(" ")[0]}`}
        description="Your sourcing pipeline at a glance. AI prepares drafts; you confirm every action."
        actions={
          <Link
            to="/portal/requirements/new"
            className="inline-flex h-10 items-center gap-2 rounded-portal bg-forest px-4 text-sm font-semibold text-white hover:bg-[#116b33]"
          >
            <ClipboardList className="h-4 w-4" /> New requirement
          </Link>
        }
      />

      {verification && verification.status !== "Verified" && (
        <div className="mb-4 flex items-start gap-2 rounded-portal border border-settle/40 bg-[#FFFBEB] p-3 text-[13px] text-[#92400E] dark:bg-[#2A2110]">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Verification pending</p>
            <p className="mt-0.5 text-[12px]">
              Publishing requirements stays disabled until an admin verifies your licence. You can explore and prepare
              drafts in the meantime.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open requirements" value={openRequirements.length} sub={`${(requirements.data ?? []).filter((r) => r.industryId === profile.id).length} total`} icon={<ClipboardList className="h-5 w-5 text-forest" />} />
        <StatCard label="Active pools" value={activePools.length} sub={`${myPools.length} pools on record`} icon={<Layers className="h-5 w-5 text-navy" />} />
        <StatCard
          label="Committed supply"
          value={kgToBestDisplay(activePools.reduce((s, p) => s + p.committedKg, 0))}
          sub={`of ${kgToBestDisplay(activePools.reduce((s, p) => s + p.targetKg, 0))} targeted`}
          tone="success"
          icon={<TrendingUp className="h-5 w-5 text-growth" />}
        />
        <StatCard label="Farmer payouts pending" value={formatMoney(pendingPayout)} sub={`${myPayables.length} payables`} icon={<Wallet className="h-5 w-5 text-settle" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <PortalCard className="p-4">
          <SectionTitle
            title="Pools in progress"
            action={
              <Link to="/portal/pools" className="text-[12px] font-semibold text-forest dark:text-growth">
                Manage pools
              </Link>
            }
          />
          {pools.isLoading && <Skeleton className="h-40 w-full" />}
          <div className="space-y-3">
            {myPools.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/portal/pools/${p.id}`} className="block rounded-lg border border-line p-3 hover:bg-canvas/60 dark:border-portal-line dark:hover:bg-portal-bg/60">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{WASTE_LABELS[p.wasteType]}</p>
                    <p className="text-[11px] text-muted dark:text-portal-muted">
                      {p.village} · {p.contributionCount} farmers · {p.daysLeft > 0 ? `${p.daysLeft}d left` : "deadline passed"}
                    </p>
                  </div>
                  {p.industryVerified && <VerifiedMark />}
                </div>
                <PoolProgress committedKg={p.committedKg} targetKg={p.targetKg} status={p.status} showStages={false} />
              </Link>
            ))}
            {!pools.isLoading && myPools.length === 0 && (
              <p className="rounded-lg bg-canvas p-4 text-center text-[13px] text-muted dark:bg-portal-bg dark:text-portal-muted">
                No pools yet. Publish a requirement to open one.
              </p>
            )}
          </div>
        </PortalCard>

        <div className="space-y-4">
          <PortalCard className="p-4">
            <SectionTitle
              title="Seasonal forecast"
              action={
                <Link to="/portal/forecast" className="text-[12px] font-semibold text-forest dark:text-growth">
                  Details
                </Link>
              }
            />
            {forecasts.isLoading && <Skeleton className="h-20 w-full" />}
            {highForecast && (
              <div>
                <div className="flex items-center gap-1.5">
                  <AiChip kind="forecast" />
                  <span className="text-[11px] font-semibold text-muted dark:text-portal-muted">
                    {highForecast.confidence} confidence
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] font-semibold">
                  {WASTE_LABELS[highForecast.wasteType]} · {highForecast.region}
                </p>
                <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-muted dark:text-portal-muted">
                  {highForecast.explanation}
                </p>
              </div>
            )}
          </PortalCard>

          <PortalCard className="p-4">
            <SectionTitle title="Quick actions" />
            <div className="grid gap-2">
              <Link to="/portal/matches" className="flex items-center gap-2 rounded-lg border border-line p-2.5 text-[13px] font-semibold hover:bg-canvas dark:border-portal-line dark:hover:bg-portal-bg">
                <Users className="h-4 w-4 text-forest" /> Find farmer matches
              </Link>
              <Link to="/portal/payments" className="flex items-center gap-2 rounded-lg border border-line p-2.5 text-[13px] font-semibold hover:bg-canvas dark:border-portal-line dark:hover:bg-portal-bg">
                <Wallet className="h-4 w-4 text-navy" /> Payments & payouts
              </Link>
              <Link to="/portal/profile" className="flex items-center gap-2 rounded-lg border border-line p-2.5 text-[13px] font-semibold hover:bg-canvas dark:border-portal-line dark:hover:bg-portal-bg">
                <BadgeCheck className="h-4 w-4 text-settle" /> Company profile
              </Link>
            </div>
          </PortalCard>
        </div>
      </div>
    </PageContainer>
  );
}
