import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { useSession } from "@/store/session";
import { authService } from "@/services/authService";
import { requirementService } from "@/services/requirementService";
import { PortalPageHeader } from "@/components/shared/PageHeader";
import { PortalCard } from "@/components/ui/card";
import { Skeleton, Table, THead, TBody, TR, TH, TD, EmptyState } from "@/components/ui/misc";
import { WASTE_LABELS } from "@/types";
import { formatMoney } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";
import { cn, formatDate } from "@/lib/utils";

const statusTone: Record<string, string> = {
  Open: "bg-meadow text-forest dark:bg-[#123524] dark:text-growth",
  Fulfilled: "bg-[#E0EAFF] text-navy dark:bg-[#101E36] dark:text-[#8FB4FF]",
  Expired: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
  Closed: "bg-canvas text-muted dark:bg-portal-bg dark:text-portal-muted",
  Draft: "bg-settle/15 text-[#92400E]",
};

export default function RequirementsPage() {
  const profile = useSession((s) => s.profile)!;
  const requirements = useQuery({
    queryKey: ["requirements", profile.id],
    queryFn: () => requirementService.list(profile),
  });
  const verification = authService.getIndustryVerification(profile.id);
  const mine = (requirements.data ?? []).filter((r) => r.industryId === profile.id);

  return (
    <div>
      <PortalPageHeader
        title="Requirements"
        description="Each requirement opens a pool that nearby farmers can fill together."
        actions={
          <Link
            to="/portal/requirements/new"
            className="inline-flex h-10 items-center gap-2 rounded-portal bg-forest px-4 text-sm font-semibold text-white hover:bg-[#116b33]"
          >
            <Plus className="h-4 w-4" /> New requirement
          </Link>
        }
      />

      {verification && verification.status !== "Verified" && (
        <div className="mb-4 rounded-portal border border-settle/40 bg-[#FFFBEB] p-3 text-[12px] text-[#92400E] dark:bg-[#2A2110]">
          <strong>Publishing is disabled.</strong> Your licence is still being verified. You can prepare a draft but not
          publish it yet.
        </div>
      )}

      {requirements.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-7 w-7" />}
          title="No requirements yet"
          body="Describe what you need in plain words and GreenRoots will prepare a structured draft for you to check."
          action={
            <Link
              to="/portal/requirements/new"
              className="inline-flex h-10 items-center gap-2 rounded-portal bg-forest px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Create requirement
            </Link>
          }
        />
      ) : (
        <PortalCard className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Waste</TH>
                <TH>Village</TH>
                <TH>Target</TH>
                <TH>Rate</TH>
                <TH>Deadline</TH>
                <TH>Committed</TH>
                <TH>Status</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {mine.map((r) => (
                <TR key={r.id}>
                  <TD className="font-semibold">{WASTE_LABELS[r.wasteType]}</TD>
                  <TD>{r.village}</TD>
                  <TD className="num">{kgToBestDisplay(r.targetKg)}</TD>
                  <TD className="num">
                    {formatMoney(r.ratePerUnit)} / {r.rateUnit}
                  </TD>
                  <TD className="num">{formatDate(r.deadline)}</TD>
                  <TD>
                    <div className="min-w-28">
                      <div className="num mb-1 text-[12px] font-semibold">
                        {kgToBestDisplay(r.committedKg)} / {kgToBestDisplay(r.targetKg)}
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-line dark:bg-portal-line">
                        <div
                          className="h-full rounded-full bg-forest"
                          style={{ width: `${Math.min(100, Math.round((r.committedKg / r.targetKg) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusTone[r.status])}>
                      {r.status}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <Link to={`/portal/pools/${r.poolId}`} className="text-[12px] font-semibold text-forest dark:text-growth">
                      View pool
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </PortalCard>
      )}
    </div>
  );
}
