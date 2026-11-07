import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { poolService } from "@/services/poolService";
import { collectionService } from "@/services/collectionService";
import { aiAssistantService } from "@/services/aiAssistantService";
import { PoolProgress } from "@/components/shared/PoolProgress";
import { StatusChip } from "@/components/shared/StatusTriad";
import { VerifiedMark, AiChip, EstimateLabel } from "@/components/shared/Marks";
import { RateText } from "@/components/shared/Numbers";
import { MapView, type MapMarker } from "@/components/shared/MapView";
import { ConfirmSheet } from "@/components/shared/ConfirmSheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConnectivity } from "@/lib/connectivity";
import { commissionFor, netAfterCommission, PLATFORM_FEE_PERCENT } from "@/lib/fees";
import { KG_PER_UNIT } from "@/lib/units";
import { formatMoney } from "@/lib/money";
import { WASTE_LABELS } from "@/types";

export default function PoolDetailPage() {
  const { t } = useTranslation();
  const { poolId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile)!;
  const pushToast = useUi((s) => s.pushToast);
  const online = useConnectivity();
  const isFarmer = profile.role === "farmer";

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
  const points = useQuery({
    queryKey: ["collection-points", profile.id],
    queryFn: () => collectionService.list(profile),
  });

  const [qty, setQty] = useState(0);
  const [pointId, setPointId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explain, setExplain] = useState<{ summary: string; assumptions: string[]; confidence: number } | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  useEffect(() => {
    if (pool.data && qty === 0) setQty(Math.min(1000, pool.data.remainingKg || pool.data.targetKg));
  }, [pool.data, qty]);

  const myContribution = (contributions.data ?? []).find((c) => c.farmerId === profile.id);
  const ratePerKg = pool.data ? pool.data.ratePerUnit / KG_PER_UNIT[pool.data.rateUnit] : 0;
  const gross = Math.round(qty * ratePerKg);
  const fee = commissionFor(gross);
  const net = netAfterCommission(gross);
  const deadlinePassed = (pool.data?.daysLeft ?? 0) < 0;
  const full = (pool.data?.remainingKg ?? 0) <= 0;
  const open = pool.data?.status === "Open";
  const canCommit =
    isFarmer &&
    open &&
    !full &&
    !deadlinePassed &&
    !myContribution &&
    qty > 0 &&
    qty <= (pool.data?.remainingKg ?? 0) &&
    !!pointId &&
    online;

  const markers = useMemo(() => {
    if (!pool.data) return [];
    const m: MapMarker[] = [
      {
        id: pool.data.id,
        location: pool.data.location,
        label: `${WASTE_LABELS[pool.data.wasteType]} pool`,
        detail: pool.data.village,
        kind: "pool",
      },
    ];
    (points.data ?? []).slice(0, 4).forEach((p) =>
      m.push({ id: p.id, location: p.location, label: p.name, detail: p.village, kind: "collection" })
    );
    return m;
  }, [pool.data, points.data]);

  if (pool.isLoading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (pool.isError || !pool.data) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          title="Pool not found"
          body="It may have expired or been closed."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/app/pools")}>
              {t("common.back")}
            </Button>
          }
        />
      </div>
    );
  }

  const p = pool.data;

  const doExplain = async () => {
    setExplainOpen(true);
    if (explain) return;
    setExplainLoading(true);
    try {
      const res = await aiAssistantService.explainPool(p);
      setExplain(res);
    } finally {
      setExplainLoading(false);
    }
  };

  const commit = async () => {
    if (!canCommit) return;
    setCommitting(true);
    try {
      await poolService.commit({ poolId: p.id, farmer: profile, quantityKg: qty, collectionPointId: pointId });
      setConfirmOpen(false);
      pushToast({
        title: "Commitment recorded",
        description: `${qty} kg added to the ${WASTE_LABELS[p.wasteType]} pool.`,
        variant: "success",
      });
      qc.invalidateQueries({ queryKey: ["pool", p.id] });
      qc.invalidateQueries({ queryKey: ["pools"] });
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      qc.invalidateQueries({ queryKey: ["contributions", p.id] });
    } catch (e) {
      pushToast({
        title: "Could not commit",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-xl font-bold text-ink">{WASTE_LABELS[p.wasteType]}</h1>
              {p.industryVerified && <VerifiedMark />}
            </div>
            <p className="mt-0.5 text-[12px] text-muted">{p.industryName}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
              <MapPin className="h-3 w-3" /> {p.village} · {p.distanceKm.toFixed(0)} km
            </p>
          </div>
          <div className="shrink-0 text-right">
            <RateText rate={p.ratePerUnit} unit={p.rateUnit} className="text-[14px] font-bold text-forest" />
            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-medium text-muted">
              <CalendarClock className="h-3 w-3" />
              {p.daysLeft > 0 ? `${p.daysLeft} days left` : t("home.overdue")}
            </p>
          </div>
        </div>

        <PoolProgress committedKg={p.committedKg} targetKg={p.targetKg} status={p.status} className="mt-3" />

        {p.expanded && p.expandedToKm && (
          <p className="mt-2 rounded-lg bg-meadow/60 px-2.5 py-1.5 text-[12px] font-medium text-forest">
            {t("pools.areaExpanded", { km: p.expandedToKm })}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <Button variant="ai" size="sm" className="flex-1" onClick={doExplain}>
            <Sparkles className="h-4 w-4" /> {t("pools.explainPool")}
          </Button>
        </div>
      </Card>

      <Card className="mt-3 overflow-hidden p-0">
        <MapView center={p.location} zoom={9} height={200} markers={markers} showLegend className="rounded-none border-0" />
      </Card>

      {isFarmer && myContribution ? (
        <Card className="mt-3 border-forest/30 bg-meadow/40 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-forest" aria-hidden="true" />
            <div>
              <p className="text-[15px] font-bold text-forest">{t("pools.yourCommitment")}</p>
              <p className="num text-[12px] text-forest/80">{t("pools.committedByYou", { qty: `${myContribution.committedKg} kg` })}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase text-muted">{t("status.fulfilment")}</p>
              <StatusChip status={myContribution.fulfilment} size="sm" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase text-muted">{t("status.payment")}</p>
              <StatusChip status={myContribution.payment} size="sm" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase text-muted">{t("status.payout")}</p>
              <StatusChip status={myContribution.payout} size="sm" />
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">{t("pools.feeNote")}</p>
        </Card>
      ) : isFarmer ? (
        <Card className="mt-3 p-4">
          <p className="text-[15px] font-bold text-ink">{t("pools.joinPool")}</p>
          <p className="mt-0.5 text-[12px] text-muted">{t("pools.eligibility", { qty: `${p.remainingKg} kg` })}</p>

          {full ? (
            <div className="mt-3 rounded-xl border border-settle/40 bg-[#FFFBEB] p-3 text-[12px] text-[#92400E]">
              <p className="font-semibold">{t("pools.poolFull")}</p>
              <p>{t("pools.poolFullBody")}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-settle/40 bg-white text-[#92400E]"
                onClick={() => pushToast({ title: t("pools.joinWaitlist"), description: "We will notify you if space opens.", variant: "info" })}
              >
                {t("pools.joinWaitlist")}
              </Button>
            </div>
          ) : deadlinePassed || !open ? (
            <div className="mt-3 rounded-xl border border-line bg-canvas p-3 text-[12px] text-muted">
              {deadlinePassed ? t("pools.deadlinePassed") : "This pool is not accepting commitments."}
            </div>
          ) : (
            <>
              <div className="mt-3">
                <Label htmlFor="commit-qty">{t("pools.quantityToCommit")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="commit-qty"
                    type="number"
                    min={1}
                    max={p.remainingKg}
                    value={qty || ""}
                    onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
                    className="num min-h-12 text-lg font-semibold"
                  />
                  <span className="text-sm font-semibold text-muted">kg</span>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {[0.25, 0.5, 1].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setQty(Math.max(1, Math.round(p.remainingKg * f)))}
                      className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted"
                    >
                      {f === 1 ? "All" : `${f * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <Label htmlFor="commit-point">{t("pools.collectionPoint")}</Label>
                <Select id="commit-point" value={pointId} onChange={(e) => setPointId(e.target.value)}>
                  <option value="">{t("voice.selectPoint")}</option>
                  {(points.data ?? [])
                    .filter((pt) => pt.active)
                    .map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} · {pt.village} ({pt.distanceKm.toFixed(0)} km)
                      </option>
                    ))}
                </Select>
              </div>

              <div className="mt-3 rounded-xl border border-line bg-canvas p-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1 text-[12px] font-semibold text-muted">
                    <Wallet className="h-3.5 w-3.5" /> {t("pools.estimatedEarnings")}
                  </p>
                  <EstimateLabel />
                </div>
                <div className="mt-2 space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted">{t("pools.gross")}</span>
                    <span className="num font-semibold text-ink">{formatMoney(gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{t("pools.platformFee", { percent: PLATFORM_FEE_PERCENT })}</span>
                    <span className="num font-semibold text-ink">−{formatMoney(fee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1.5">
                    <span className="font-semibold text-ink">{t("pools.estimatedNet")}</span>
                    <span className="num text-lg font-bold text-forest">{formatMoney(net)}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{t("pools.feeNote")}</p>
              </div>

              <Button
                variant="primary"
                size="field"
                className="mt-3 w-full"
                disabled={!canCommit}
                onClick={() => setConfirmOpen(true)}
              >
                {t("pools.reviewCommit")}
              </Button>
              {!online && <p className="mt-1.5 text-center text-[11px] font-semibold text-settle">Reconnect to commit.</p>}
            </>
          )}
        </Card>
      ) : (
        <Card className="mt-3 p-4 text-center text-[13px] text-muted">
          Only farmers can commit quantity to a pool. You can still follow the pool progress.
        </Card>
      )}

      <section className="mt-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-bold text-ink">
          <Users className="h-4 w-4" /> Farmers in this pool
        </h2>
        <div className="space-y-1.5">
          {(contributions.data ?? []).length === 0 && (
            <p className="rounded-lg border border-line bg-surface p-3 text-[12px] text-muted">
              No contributions recorded yet.
            </p>
          )}
          {(contributions.data ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{c.farmerName}</p>
                <p className="text-[11px] text-muted">{c.farmerVillage}</p>
              </div>
              <div className="text-right">
                <p className="num text-[13px] font-bold text-ink">{c.committedKg} kg</p>
                <div className="mt-0.5 flex justify-end gap-1">
                  <StatusChip status={c.payment} size="sm" />
                  <StatusChip status={c.payout} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("pools.confirmCommitment")}
        description={t("pools.confirmBody", { qty: `${qty} kg` })}
        confirmLabel={t("pools.reviewCommit")}
        loading={committing}
        onConfirm={commit}
        facts={[
          { label: t("common.quantity"), value: `${qty} kg` },
          { label: t("pools.rate"), value: <RateText rate={p.ratePerUnit} unit={p.rateUnit} /> },
          { label: t("pools.gross"), value: `₹${formatMoney(gross)}` },
          { label: t("pools.platformFee", { percent: PLATFORM_FEE_PERCENT }), value: `−₹${formatMoney(fee)}` },
          { label: t("pools.estimatedNet"), value: `₹${formatMoney(net)}`, emphasis: true },
          {
            label: t("pools.collectionPoint"),
            value: (points.data ?? []).find((pt) => pt.id === pointId)?.name ?? "—",
          },
        ]}
      >
        <p className="mt-2 rounded-lg bg-ai/5 p-2 text-[11px] leading-relaxed text-muted">
          <AiChip kind="estimate" className="mr-1 align-middle" />
          Earnings are an estimate based on the agreed rate. Final amount uses the verified accepted quantity.
        </p>
      </ConfirmSheet>

      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent variant="sheet">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ai" /> {t("pools.explainTitle")}
            </DialogTitle>
            <DialogDescription>AI explanation based on the pool&apos;s recorded numbers.</DialogDescription>
          </DialogHeader>
          {explainLoading || !explain ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-7 w-7 animate-spin text-ai" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <AiChip>{t("common.aiEstimate")}</AiChip>
                <span className="num text-[11px] font-bold text-ai">Confidence {Math.round(explain.confidence * 100)}%</span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">{explain.summary}</p>
              <div className="mt-3 rounded-xl border border-line bg-canvas p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Assumptions</p>
                <ul className="mt-1.5 space-y-1 text-[12px] text-muted">
                  {explain.assumptions.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-2 text-[11px] text-muted">This is an estimate, not a promise. Nothing is changed automatically.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
