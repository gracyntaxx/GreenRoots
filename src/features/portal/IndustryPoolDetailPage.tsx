import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CalendarPlus,
  Expand,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { poolService } from "@/services/poolService";
import { paymentService } from "@/services/paymentService";
import { payoutService } from "@/services/payoutService";
import { PortalPageHeader, StatCard } from "@/components/shared/PageHeader";
import { PoolProgress } from "@/components/shared/PoolProgress";
import { StatusChip } from "@/components/shared/StatusTriad";
import { SandboxStrip, SimulatedChip, VerifiedMark, AiChip } from "@/components/shared/Marks";
import { PortalCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Skeleton, EmptyState, Table, THead, TBody, TR, TH, TD } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PayPalSandboxModal } from "@/features/checkout/PayPalSandboxModal";
import { useConnectivity } from "@/lib/connectivity";
import { KG_PER_UNIT, kgToBestDisplay } from "@/lib/units";
import { formatMoney } from "@/lib/money";
import { WASTE_LABELS, type Payment } from "@/types";
import { cn, formatDate, uid } from "@/lib/utils";

export default function IndustryPoolDetailPage() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const online = useConnectivity();

  const pool = useQuery({
    queryKey: ["pool", poolId, profile.id],
    queryFn: () => poolService.get(poolId!, profile),
    enabled: !!poolId,
  });
  const contributions = useQuery({
    queryKey: ["contributions", poolId],
    queryFn: () => poolService.contributions(poolId!),
    enabled: !!poolId,
  });
  const payments = useQuery({ queryKey: ["payments"], queryFn: () => paymentService.list() });
  const payables = useQuery({ queryKey: ["payouts", poolId], queryFn: () => payoutService.list(poolId) });

  const [expandOpen, setExpandOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [expandKm, setExpandKm] = useState(60);
  const [newDeadline, setNewDeadline] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [paypalOpen, setPaypalOpen] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  const suggestion = pool.data ? poolService.suggestion(pool.data) : null;
  useEffect(() => {
    if (suggestion) setExpandKm(Math.max(40, suggestion.recommendedKm));
  }, [suggestion?.recommendedKm]);

  if (pool.isLoading) return <Skeleton className="h-80 w-full" />;

  if (pool.isError || !pool.data) {
    return (
      <EmptyState
        title="Pool not found"
        body="It may have been removed."
        action={
          <Button variant="outline" size="portal" onClick={() => navigate("/portal/pools")}>
            Back to pools
          </Button>
        }
      />
    );
  }

  const p = pool.data;
  const isIndustry = profile.role === "industry";
  const ratePerKg = p.ratePerUnit / KG_PER_UNIT[p.rateUnit];
  const totalAmount = Math.round(p.committedKg * ratePerKg);
  const capturedPayment = (payments.data ?? []).find(
    (pay) => pay.scope === "pool" && pay.referenceId === p.id && pay.status === "Captured"
  );
  const existingPayment = (payments.data ?? []).find((pay) => pay.scope === "pool" && pay.referenceId === p.id);
  const canPay = isIndustry && (p.status === "Ready for Pickup" || p.status === "Settled") && !capturedPayment && online;
  const rows = contributions.data ?? [];
  const payableRows = payables.data ?? [];

  const expand = async () => {
    setBusy(true);
    try {
      await poolService.expand(p.id, expandKm);
      pushToast({ title: "Area expanded", description: `Farmers within ${expandKm} km can now see this pool.`, variant: "success" });
      setExpandOpen(false);
      qc.invalidateQueries({ queryKey: ["pool", p.id] });
      qc.invalidateQueries({ queryKey: ["pools"] });
    } catch (e) {
      pushToast({ title: "Could not expand", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const extend = async () => {
    setBusy(true);
    try {
      await poolService.extend(p.id, new Date(`${newDeadline}T18:00:00`).toISOString());
      pushToast({ title: "Deadline extended", variant: "success" });
      setExtendOpen(false);
      qc.invalidateQueries({ queryKey: ["pool", p.id] });
      qc.invalidateQueries({ queryKey: ["pools"] });
    } catch (e) {
      pushToast({ title: "Could not extend", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const startPoolPayment = async () => {
    setCreatingPayment(true);
    try {
      const pay = await paymentService.createPaypalOrder({
        scope: "pool",
        referenceId: p.id,
        amount: totalAmount,
        idempotencyKey: uid("poolpay"),
      });
      setPayment(pay);
      setPaypalOpen(true);
    } catch (e) {
      pushToast({ title: "Could not start payment", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setCreatingPayment(false);
    }
  };

  return (
    <div>
      <Link
        to="/portal/pools"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-forest dark:text-portal-muted dark:hover:text-growth"
      >
        <ArrowLeft className="h-4 w-4" /> Back to pools
      </Link>

      <PortalPageHeader
        title={WASTE_LABELS[p.wasteType]}
        description={`${p.village} · ${p.industryName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedMark label={p.industryVerified ? "Verified industry" : "Verification pending"} />
            {isIndustry ? (
              <>
                <Button variant="outline" size="portal" onClick={() => setExtendOpen(true)}>
                  <CalendarPlus className="h-4 w-4" /> Extend deadline
                </Button>
                <Button variant="secondary" size="portal" onClick={() => setExpandOpen(true)}>
                  <Expand className="h-4 w-4" /> Expand area
                </Button>
              </>
            ) : (
              <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-muted dark:bg-portal-bg dark:text-portal-muted">
                Admin read-only view
              </span>
            )}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Committed" value={kgToBestDisplay(p.committedKg)} sub={`of ${kgToBestDisplay(p.targetKg)} target`} tone="success" />
        <StatCard label="Farmers" value={p.contributionCount} sub="contributing to this pool" icon={<Users className="h-5 w-5 text-forest" />} />
        <StatCard label="Agreed rate" value={`₹${formatMoney(p.ratePerUnit)}`} sub={`per ${p.rateUnit} · ₹${ratePerKg.toFixed(2)}/kg`} />
        <StatCard
          label="Deadline"
          value={p.daysLeft > 0 ? `${p.daysLeft} days` : "Passed"}
          sub={formatDate(p.deadline)}
          tone={p.daysLeft <= 3 ? "warning" : "default"}
          icon={<CalendarClock className="h-5 w-5 text-settle" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <PortalCard className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold">Pool progress</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                p.status === "Open"
                  ? "bg-meadow text-forest dark:bg-[#123524] dark:text-growth"
                  : "bg-[#E0EAFF] text-navy dark:bg-[#101E36] dark:text-[#8FB4FF]"
              )}
            >
              {p.status}
            </span>
          </div>
          <PoolProgress committedKg={p.committedKg} targetKg={p.targetKg} status={p.status} />
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted dark:text-portal-muted">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {p.village}
            </span>
            <span>
              {p.expanded && p.expandedToKm ? `Expanded to ${p.expandedToKm} km` : `Reach ${p.radiusKm} km`}
            </span>
          </div>
        </PortalCard>

        <PortalCard className="p-4">
          <div className="flex items-center gap-1.5">
            <AiChip kind="explanation">AI suggestion</AiChip>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed">{suggestion?.text}</p>
          <p className="mt-1 text-[11px] text-muted dark:text-portal-muted">
            Suggestions never change anything on their own. You confirm each change.
          </p>
          {isIndustry && suggestion && suggestion.recommendedKm > p.radiusKm && p.percent < 100 && (
            <Button
              variant="ai"
              size="portal"
              className="mt-3 w-full"
              onClick={() => {
                setExpandKm(suggestion.recommendedKm);
                setExpandOpen(true);
              }}
            >
              <Expand className="h-4 w-4" /> Review expansion to {suggestion.recommendedKm} km
            </Button>
          )}
        </PortalCard>
      </div>

      <PortalCard className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-portal-line">
          <p className="text-[13px] font-bold">Farmer contributions</p>
          <span className="text-[11px] text-muted dark:text-portal-muted">{rows.length} records</span>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Farmer</TH>
              <TH>Village</TH>
              <TH>Committed</TH>
              <TH>Accepted</TH>
              <TH>Fulfilment</TH>
              <TH>Payment</TH>
              <TH>Payout</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD className="font-semibold">{c.farmerName}</TD>
                <TD>{c.farmerVillage}</TD>
                <TD className="num">{c.committedKg} kg</TD>
                <TD className="num">{c.acceptedKg != null ? `${c.acceptedKg} kg` : "—"}</TD>
                <TD><StatusChip status={c.fulfilment} size="sm" /></TD>
                <TD><StatusChip status={c.payment} size="sm" /></TD>
                <TD><StatusChip status={c.payout} size="sm" /></TD>
              </TR>
            ))}
            {rows.length === 0 && (
              <TR>
                <TD colSpan={7} className="py-6 text-center text-muted dark:text-portal-muted">
                  No contributions yet.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </PortalCard>

      <PortalCard className="mt-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-bold">
              <Wallet className="h-4 w-4 text-navy" /> Pool settlement
            </p>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted dark:text-portal-muted">
              You pay the pool total through PayPal Sandbox. GreenRoots then prepares farmer-wise payables. Admin
              approves each payout, and one payout may be simulated in this demo.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">Pool total</p>
            <p className="num text-2xl font-bold">{formatMoney(totalAmount)}</p>
            <p className="num text-[11px] text-muted dark:text-portal-muted">
              {p.committedKg} kg × ₹{ratePerKg.toFixed(2)}/kg
            </p>
          </div>
        </div>

        <SandboxStrip className="mt-3 rounded-lg border" />

        {capturedPayment ? (
          <div className="mt-3 rounded-portal border border-growth/30 bg-[#F0FDF4] p-3 dark:border-growth/25 dark:bg-[#0F2A1B]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold text-forest dark:text-growth">Pool payment captured</p>
                <p className="num text-[11px] text-muted dark:text-portal-muted">
                  {capturedPayment.paypalOrderRef} · capture {capturedPayment.paypalCaptureRef ?? "—"}
                </p>
              </div>
              <StatusChip status={capturedPayment.status} />
            </div>
            <p className="mt-2 text-[11px] text-muted dark:text-portal-muted">
              Farmer payables are prepared. Payout approval is done by GreenRoots admin.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isIndustry && (
              <Button variant="paypal" size="portal" disabled={!canPay || creatingPayment} onClick={startPoolPayment}>
                {creatingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Pay pool via PayPal Sandbox
              </Button>
            )}
            {!isIndustry && (
              <span className="text-[11px] text-muted dark:text-portal-muted">
                Admin view is read-only. Payout approvals happen in Payables &amp; payouts.
              </span>
            )}
            {existingPayment && !capturedPayment && (
              <span className="text-[11px] font-semibold text-settle">
                Existing payment status: {existingPayment.status}. A redirect is not proof of payment.
              </span>
            )}
            {p.status === "Open" && (
              <span className="text-[11px] text-muted dark:text-portal-muted">
                Payment unlocks once the pool is ready for pickup.
              </span>
            )}
            {!online && <span className="text-[11px] font-semibold text-settle">Reconnect to pay.</span>}
          </div>
        )}
      </PortalCard>

      {payableRows.length > 0 && (
        <PortalCard className="mt-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-portal-line">
            <p className="text-[13px] font-bold">Farmer-wise payables</p>
            <span className="num text-[11px] text-muted dark:text-portal-muted">
              Net total {formatMoney(payableRows.reduce((s, r) => s + r.net, 0))}
            </span>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Farmer</TH>
                <TH>Accepted</TH>
                <TH>Gross</TH>
                <TH>Commission</TH>
                <TH>Net</TH>
                <TH>Payout</TH>
              </TR>
            </THead>
            <TBody>
              {payableRows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-semibold">{r.farmerName}</TD>
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
        </PortalCard>
      )}

      <Dialog open={expandOpen} onOpenChange={setExpandOpen}>
        <DialogContent variant="center" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Expand className="h-5 w-5 text-forest" /> Expand the pool area
            </DialogTitle>
            <DialogDescription>
              More farmers become eligible. You confirm this change; it is recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="flex items-center justify-between">
              <Label className="mb-0">Reach radius</Label>
              <span className="num text-[13px] font-bold text-forest dark:text-growth">{expandKm} km</span>
            </div>
            <Slider min={40} max={80} step={5} value={[expandKm]} onValueChange={([v]) => setExpandKm(v)} aria-label="Expansion radius" />
            <p className="mt-2 rounded-lg bg-canvas p-2.5 text-[12px] text-muted dark:bg-portal-bg dark:text-portal-muted">
              Current reach: {p.radiusKm} km. Pool is {p.percent}% full with {Math.max(0, p.daysLeft)} days left.
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="portal" className="flex-1" onClick={() => setExpandOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="portal" className="flex-1" onClick={expand} disabled={busy || expandKm <= p.radiusKm}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm expansion
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent variant="center">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-settle" /> Extend the deadline
            </DialogTitle>
            <DialogDescription>
              Farmers get more time to commit. Existing commitments are unchanged.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="extend-date">New deadline</Label>
            <Input
              id="extend-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="portal" className="flex-1" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="portal" className="flex-1" onClick={extend} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Extend deadline
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PayPalSandboxModal
        open={paypalOpen}
        payment={payment}
        amount={totalAmount}
        description={`Pool settlement · ${WASTE_LABELS[p.wasteType]} · ${p.committedKg} kg`}
        onOpenChange={setPaypalOpen}
        onVerified={() => {
          pushToast({
            title: "Pool payment captured",
            description: "Farmer-wise payables are now prepared for admin approval.",
            variant: "success",
          });
          qc.invalidateQueries({ queryKey: ["payments"] });
          qc.invalidateQueries({ queryKey: ["payouts"] });
          qc.invalidateQueries({ queryKey: ["pool", p.id] });
          qc.invalidateQueries({ queryKey: ["pools"] });
        }}
        onAborted={(outcome) => {
          pushToast({
            title: outcome === "cancel" ? "Payment cancelled" : "Payment failed",
            description: "Nothing was charged. You can retry when ready.",
            variant: "warning",
          });
        }}
      />

      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted dark:text-portal-muted">
        <Sparkles className="h-3 w-3 text-ai" /> AI suggestions are based on recorded pool numbers and never act alone.
      </p>
    </div>
  );
}
