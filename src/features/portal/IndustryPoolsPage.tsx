import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight, Layers, Users } from "lucide-react";
import { useSession } from "@/store/session";
import { poolService } from "@/services/poolService";
import { PortalPageHeader } from "@/components/shared/PageHeader";
import { PageContainer } from "@/components/shared/PageContainer";
import { PoolProgress } from "@/components/shared/PoolProgress";
import { PortalCard } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { WASTE_LABELS } from "@/types";
import { formatMoney } from "@/lib/money";
import { cn, formatDate } from "@/lib/utils";

const statusTone: Record<string, string> = {
  Open: "bg-meadow text-forest dark:bg-[#123524] dark:text-growth",
  "Ready for Pickup": "bg-[#E0EAFF] text-navy dark:bg-[#101E36] dark:text-[#8FB4FF]",
  Settled: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
  Expired: "bg-error/10 text-error",
};

export default function IndustryPoolsPage() {
  const profile = useSession((s) => s.profile)!;
  const [filter, setFilter] = useState<"active" | "all">("active");

  const pools = useQuery({
    queryKey: ["pools", profile.id],
    queryFn: () => poolService.list(profile, { industryId: profile.id }),
  });

  const rows = (pools.data ?? []).filter((p) => (filter === "active" ? p.status === "Open" || p.status === "Ready for Pickup" : true));

  return (
    <PageContainer>
      <PortalPageHeader
        title="Pools"
        description="Each pool aggregates nearby farmers toward one requirement. Expand the area or extend the deadline when supply is short."
        actions={
          <div className="flex rounded-portal border border-line bg-surface p-0.5 dark:border-portal-line dark:bg-portal-surface">
            {(["active", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "h-9 rounded-lg px-3 text-[12px] font-semibold capitalize",
                  filter === f ? "bg-meadow text-forest dark:bg-portal-line dark:text-growth" : "text-muted dark:text-portal-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {pools.isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {!pools.isLoading && rows.length === 0 && (
        <EmptyState
          icon={<Layers className="h-7 w-7" />}
          title="No pools here"
          body="Publish a requirement to open a pool. Nearby farmers will be able to commit supply."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 pb-6">
        {rows.map((p) => {
          const ratePerKg = p.ratePerUnit / (p.rateUnit === "tonne" ? 1000 : p.rateUnit === "quintal" ? 100 : 1);
          return (
            <Link key={p.id} to={`/portal/pools/${p.id}`}>
              <PortalCard className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[15px] font-bold">{WASTE_LABELS[p.wasteType]}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusTone[p.status])}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted dark:text-portal-muted">
                      {p.village} · {formatDate(p.deadline)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted dark:text-portal-muted">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {p.contributionCount} farmers
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" /> {p.daysLeft > 0 ? `${p.daysLeft}d left` : "deadline passed"}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-[13px] font-bold text-forest dark:text-growth">
                      {formatMoney(p.ratePerUnit)} / {p.rateUnit}
                    </p>
                    <p className="num text-[11px] text-muted dark:text-portal-muted">₹{ratePerKg.toFixed(2)} / kg</p>
                  </div>
                </div>

                <PoolProgress committedKg={p.committedKg} targetKg={p.targetKg} status={p.status} className="mt-3" showStages={false} />

                <div className="mt-2 flex items-center justify-between border-t border-line pt-2 dark:border-portal-line">
                  <span className="text-[11px] text-muted dark:text-portal-muted">
                    {p.expanded && p.expandedToKm ? `Expanded to ${p.expandedToKm} km` : `Reach ${p.radiusKm} km`}
                  </span>
                  <span className="flex items-center gap-0.5 text-[12px] font-semibold text-forest dark:text-growth">
                    Manage <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </PortalCard>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
