import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, FlaskConical, Search, ShieldAlert, Wallet } from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { payoutService } from "@/services/payoutService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { StatusChip } from "@/components/shared/StatusTriad";
import { SandboxStrip, SimulatedChip } from "@/components/shared/Marks";
import { ConfirmSheet } from "@/components/shared/ConfirmSheet";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { FarmerPayable } from "@/types";

export default function PayablesPage() {
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const qc = useQueryClient();
  const payables = useQuery({ queryKey: ["payouts"], queryFn: () => payoutService.list() });

  const [q, setQ] = useState("");
  const [payout, setPayout] = useState<FarmerPayable["payout"] | "all">("all");
  const [target, setTarget] = useState<FarmerPayable | null>(null);
  const [simulate, setSimulate] = useState(false);
  const [busy, setBusy] = useState(false);

  const all = payables.data ?? [];
  const summary = payoutService.summary(all);
  const poolLabels = useMemo(() => [...new Set(all.map((p) => p.poolLabel))], [all]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((p) => {
      if (payout !== "all" && p.payout !== payout) return false;
      if (!term) return true;
      return [p.farmerName, p.farmerMasked, p.poolLabel, p.id].some((v) => v.toLowerCase().includes(term));
    });
  }, [all, q, payout]);

  const approve = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await payoutService.approve(target.id, simulate);
      pushToast({
        title: simulate ? "Payout simulated" : "Payout approved",
        description: `${target.farmerName} · ${formatMoney(target.net)}`,
        variant: simulate ? "warning" : "success",
      });
      qc.invalidateQueries({ queryKey: ["payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-payables"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      qc.invalidateQueries({ queryKey: ["pool"] });
      setTarget(null);
      setSimulate(false);
    } catch (e) {
      pushToast({ title: "Could not approve payout", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PortalPageHeader
        title="Payables & payouts"
        description="Farmer-wise payables prepared after a verified pool payment. Every payout needs a human decision; simulated payouts are labelled."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Net payable" value={formatMoney(summary.totalNet)} sub={`${all.length} farmer records`} icon={<Banknote className="h-5 w-5 text-forest" />} />
        <StatCard label="Completed" value={summary.completedCount} sub="Approved or simulated" tone="success" />
        <StatCard label="Pending" value={summary.pendingCount} tone={summary.pendingCount ? "warning" : "default"} icon={<Wallet className="h-5 w-5 text-settle" />} />
        <StatCard label="Unusual" value={summary.unusualCount} sub="Net above ₹50,000" tone={summary.unusualCount ? "warning" : "default"} icon={<ShieldAlert className="h-5 w-5 text-settle" />} />
      </div>

      {summary.unusualCount > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-portal border border-settle/40 bg-[#FFFBEB] p-3 text-[12px] text-[#92400E] dark:bg-[#2A2110]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>{summary.unusualCount} payable(s)</strong> exceed the usual range. Check accepted quantity and rate
            before approving. A high amount is not proof of fraud.
          </p>
        </div>
      )}

      <SandboxStrip className="mt-3 rounded-lg border" />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search farmer, pool or payable ID"
            className="min-h-10 rounded-portal pl-9 text-[13px]"
            aria-label="Search payables"
          />
        </div>
        <Select
          value={payout}
          onChange={(e) => setPayout(e.target.value as FarmerPayable["payout"] | "all")}
          className="min-h-10 w-full rounded-portal py-0 text-[13px] sm:w-48"
          aria-label="Filter by payout status"
        >
          <option value="all">All payout states</option>
          {["Not Yet Due", "Pending", "Processing", "Completed", "Failed", "Simulated"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {payables.isLoading && <Skeleton className="mt-3 h-64 w-full" />}

      {!payables.isLoading && rows.length === 0 && (
        <div className="mt-3">
          <EmptyState icon={<Banknote className="h-7 w-7" />} title="No payables found" body="Payables appear after a pool payment is captured." />
        </div>
      )}

      {rows.length > 0 && (
        <PortalCard className="mt-3 overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Farmer</TH>
                <TH>Pool</TH>
                <TH>Accepted</TH>
                <TH>Gross</TH>
                <TH>Commission</TH>
                <TH>Net</TH>
                <TH>Payout</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((p) => {
                const unusual = p.net > 50000;
                const actionable = p.payout === "Pending" || p.payout === "Processing" || p.payout === "Failed";
                return (
                  <TR key={p.id} className={cn(unusual && "bg-[#FFFBEB]/60 dark:bg-[#2A2110]/40")}>
                    <TD>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold">{p.farmerName}</p>
                        {unusual && <ShieldAlert className="h-3.5 w-3.5 text-settle" aria-label="Unusual amount" />}
                      </div>
                      <p className="num text-[10px] text-muted dark:text-portal-muted">{p.farmerMasked}</p>
                    </TD>
                    <TD className="max-w-44 truncate text-[12px]">{p.poolLabel}</TD>
                    <TD className="num">{p.acceptedKg} kg</TD>
                    <TD className="num">{formatMoney(p.gross)}</TD>
                    <TD className="num">{formatMoney(p.commission)}</TD>
                    <TD className="num font-bold">{formatMoney(p.net)}</TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <StatusChip status={p.payout} size="sm" />
                        {p.simulated && <SimulatedChip />}
                      </div>
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        {actionable ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setTarget(p);
                                setSimulate(false);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTarget(p);
                                setSimulate(true);
                              }}
                              title="Mark as simulated payout"
                            >
                              <FlaskConical className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] text-muted dark:text-portal-muted">
                            {p.payout === "Not Yet Due" ? "Not due" : "No action"}
                          </span>
                        )}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </PortalCard>
      )}

      {target && (
        <ConfirmSheet
          open={!!target}
          onOpenChange={(v) => {
            if (!v) {
              setTarget(null);
              setSimulate(false);
            }
          }}
          variant="center"
          title={simulate ? "Simulate this payout?" : "Approve this payout?"}
          description={
            simulate
              ? "No real money moves. The farmer record is marked Simulated so nobody mistakes it for a real payment."
              : "The payout is marked Completed. GreenRoots records your decision in the audit log."
          }
          confirmLabel={simulate ? "Simulate payout" : "Approve payout"}
          loading={busy}
          onConfirm={approve}
          actor={{ name: profile.name, role: profile.role }}
          facts={[
            { label: "Farmer", value: target.farmerName },
            { label: "Pool", value: target.poolLabel },
            { label: "Accepted", value: `${target.acceptedKg} kg` },
            { label: "Gross", value: formatMoney(target.gross) },
            { label: "Commission (5%)", value: formatMoney(target.commission) },
            { label: "Net payout", value: formatMoney(target.net), emphasis: true },
            { label: "Mode", value: simulate ? "Simulated (no money moves)" : "Completed", emphasis: true },
          ]}
        />
      )}

      <p className="mt-3 text-[11px] text-muted dark:text-portal-muted">
        {poolLabels.length} pool{poolLabels.length === 1 ? "" : "s"} represented. Commission is calculated from the
        configured platform fee; farmer net is always shown separately.
      </p>
    </div>
  );
}
