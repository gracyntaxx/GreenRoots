import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Banknote, FlaskConical, ShieldCheck, Wallet } from "lucide-react";
import { useSession } from "@/store/session";
import { poolService } from "@/services/poolService";
import { paymentService } from "@/services/paymentService";
import { payoutService } from "@/services/payoutService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { StatusChip } from "@/components/shared/StatusTriad";
import { SandboxStrip, SimulatedChip } from "@/components/shared/Marks";
import { PortalCard } from "@/components/ui/card";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { WASTE_LABELS } from "@/types";

export default function PaymentsPage() {
  const profile = useSession((s) => s.profile)!;
  const [tab, setTab] = useState<"payments" | "payouts">("payments");

  const pools = useQuery({
    queryKey: ["pools", profile.id],
    queryFn: () => poolService.list(profile, { industryId: profile.id }),
  });
  const payments = useQuery({ queryKey: ["payments"], queryFn: () => paymentService.list() });
  const payables = useQuery({ queryKey: ["payouts"], queryFn: () => payoutService.list() });

  const myPools = pools.data ?? [];
  const poolIds = useMemo(() => new Set(myPools.map((p) => p.id)), [myPools]);
  const poolName = useMemo(() => new Map(myPools.map((p) => [p.id, `${WASTE_LABELS[p.wasteType]} · ${p.village}`])), [myPools]);

  const myPayments = (payments.data ?? []).filter((p) => p.scope === "pool" && poolIds.has(p.referenceId));
  const myPayables = (payables.data ?? []).filter((p) => poolIds.has(p.poolId));

  const captured = myPayments.filter((p) => p.status === "Captured");
  const awaiting = myPayments.filter((p) => p.status === "Approved" || p.status === "Initiated" || p.status === "Awaiting Approval");
  const pendingNet = myPayables.filter((p) => p.payout === "Pending" || p.payout === "Processing").reduce((s, p) => s + p.net, 0);
  const paidNet = myPayables.filter((p) => p.payout === "Completed" || p.payout === "Simulated").reduce((s, p) => s + p.net, 0);

  return (
    <div>
      <PortalPageHeader
        title="Payments & payouts"
        description="Every pool settlement uses PayPal Sandbox. A redirect is never treated as proof; the capture reference comes from PayPal."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Captured"
          value={formatMoney(captured.reduce((s, p) => s + p.amount, 0))}
          sub={`${captured.length} verified payments`}
          tone="success"
          icon={<ShieldCheck className="h-5 w-5 text-growth" />}
        />
        <StatCard
          label="Awaiting verification"
          value={awaiting.length}
          sub="Not counted as paid"
          tone={awaiting.length ? "warning" : "default"}
          icon={<FlaskConical className="h-5 w-5 text-settle" />}
        />
        <StatCard
          label="Farmer payouts pending"
          value={formatMoney(pendingNet)}
          sub={`${myPayables.filter((p) => p.payout === "Pending" || p.payout === "Processing").length} payables`}
          icon={<Banknote className="h-5 w-5 text-settle" />}
        />
        <StatCard
          label="Farmer payouts settled"
          value={formatMoney(paidNet)}
          sub="Completed or simulated"
          icon={<Wallet className="h-5 w-5 text-navy" />}
        />
      </div>

      <div className="mt-4 flex w-fit rounded-portal border border-line bg-surface p-0.5 dark:border-portal-line dark:bg-portal-surface">
        {(["payments", "payouts"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-9 rounded-lg px-4 text-[12px] font-semibold capitalize",
              tab === t ? "bg-meadow text-forest dark:bg-portal-line dark:text-growth" : "text-muted dark:text-portal-muted"
            )}
          >
            {t === "payments" ? "Pool payments" : "Farmer payouts"}
          </button>
        ))}
      </div>

      <SandboxStrip className="mt-3 rounded-lg border" />

      {tab === "payments" && (
        <PortalCard className="mt-3 overflow-hidden">
          {payments.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : myPayments.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-7 w-7" />}
              title="No pool payments yet"
              body="Once a pool is ready for pickup, pay it from the pool detail page."
              action={
                <Link
                  to="/portal/pools"
                  className="inline-flex h-10 items-center rounded-portal bg-forest px-4 text-sm font-semibold text-white"
                >
                  Open pools
                </Link>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Pool</TH>
                  <TH>Amount</TH>
                  <TH>Payment</TH>
                  <TH>PayPal order</TH>
                  <TH>Capture</TH>
                  <TH>Updated</TH>
                  <TH className="text-right">Open</TH>
                </TR>
              </THead>
              <TBody>
                {myPayments.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-semibold">{poolName.get(p.referenceId) ?? p.referenceId}</TD>
                    <TD className="num font-bold">{formatMoney(p.amount)}</TD>
                    <TD>
                      <div className="flex flex-col items-start gap-1">
                        <StatusChip status={p.status} size="sm" />
                        {(p.status === "Approved" || p.status === "Initiated") && (
                          <span className="text-[10px] font-semibold text-settle">Awaiting PayPal verification</span>
                        )}
                      </div>
                    </TD>
                    <TD className="num text-[12px]">{p.paypalOrderRef}</TD>
                    <TD className="num text-[12px]">{p.paypalCaptureRef ?? "—"}</TD>
                    <TD className="num text-[11px]">{formatDateTime(p.updatedAt)}</TD>
                    <TD className="text-right">
                      <Link to={`/portal/pools/${p.referenceId}`} className="text-[12px] font-semibold text-forest dark:text-growth">
                        View
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </PortalCard>
      )}

      {tab === "payouts" && (
        <PortalCard className="mt-3 overflow-hidden">
          {payables.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : myPayables.length === 0 ? (
            <EmptyState
              icon={<Banknote className="h-7 w-7" />}
              title="No payables yet"
              body="Farmer-wise payables are prepared after a pool payment is captured."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Pool</TH>
                  <TH>Farmer</TH>
                  <TH>Accepted</TH>
                  <TH>Gross</TH>
                  <TH>Commission</TH>
                  <TH>Net</TH>
                  <TH>Payout</TH>
                </TR>
              </THead>
              <TBody>
                {myPayables.map((r) => (
                  <TR key={r.id}>
                    <TD className="text-[12px]">{r.poolLabel}</TD>
                    <TD>
                      <p className="font-semibold">{r.farmerName}</p>
                      <p className="num text-[10px] text-muted dark:text-portal-muted">{r.farmerMasked}</p>
                    </TD>
                    <TD className="num">{r.acceptedKg} kg</TD>
                    <TD className="num">{formatMoney(r.gross)}</TD>
                    <TD className="num">{formatMoney(r.commission)}</TD>
                    <TD className="num font-bold">{formatMoney(r.net)}</TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <StatusChip status={r.payout} size="sm" />
                        {r.simulated && <SimulatedChip />}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </PortalCard>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted dark:text-portal-muted">
        GreenRoots never stores card or bank details. Only the PayPal order and capture references are kept. Admin
        approves each farmer payout; a simulated payout is always labelled.
      </p>
    </div>
  );
}
