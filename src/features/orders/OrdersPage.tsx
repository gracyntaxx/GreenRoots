import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  LayoutGrid,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useSession } from "@/store/session";
import { orderService } from "@/services/orderService";
import { StatusChip } from "@/components/shared/StatusTriad";
import { QtyText } from "@/components/shared/Numbers";
import { WasteImage } from "@/components/shared/WasteImage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PageContainer } from "@/components/shared/PageContainer";
import { WASTE_LABELS } from "@/types";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { commissionFor, netAfterCommission } from "@/lib/fees";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "pending", "completed", "paid"] as const;
type Filter = (typeof FILTERS)[number];

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile)!;
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const orders = useQuery({ queryKey: ["orders", profile.id], queryFn: () => orderService.list(profile) });

  const rows = useMemo(() => {
    const all = orders.data ?? [];
    if (filter === "pending") return all.filter((o) => o.fulfilment === "Pending");
    if (filter === "completed") return all.filter((o) => o.fulfilment === "Completed");
    if (filter === "paid") return all.filter((o) => o.payment === "Captured");
    return all;
  }, [orders.data, filter]);

  // Aggregate Ledger Financials
  const grossTotal = (orders.data ?? []).reduce((sum, o) => sum + o.totalAmount, 0);
  const platformFeeTotal = (orders.data ?? []).reduce((sum, o) => sum + commissionFor(o.totalAmount), 0);
  const netPayableTotal = (orders.data ?? []).reduce((sum, o) => sum + netAfterCommission(o.totalAmount), 0);
  const capturedCount = (orders.data ?? []).filter((o) => o.payment === "Captured").length;

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line/80 pb-5 dark:border-portal-line sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow mb-2">Fintech Settlement Ledger</span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-moss dark:text-portal-ink">{t("orders.title")}</h1>
          <p className="mt-1 text-sm text-muted dark:text-portal-muted">
            Transparent PayPal Sandbox escrow settlement with explicit 5% platform fee and pro-rata farmer disbursements.
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1 dark:border-portal-line dark:bg-portal-surface">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "table" ? "bg-forest text-white shadow-xs" : "text-muted hover:text-moss"
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Ledger Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "grid" ? "bg-forest text-white shadow-xs" : "text-muted hover:text-moss"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
        </div>
      </div>

      {/* Aggregate Financial Ledger KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-panel border border-line/80 bg-white/90 p-3.5 backdrop-blur-md shadow-card dark:bg-portal-surface">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Total Gross Orders</span>
          <span className="num mt-1 block text-xl font-bold text-moss dark:text-portal-ink">{formatMoney(grossTotal)}</span>
          <span className="mt-0.5 block text-[11px] text-muted">{(orders.data ?? []).length} orders booked</span>
        </div>

        <div className="rounded-panel border border-line/80 bg-white/90 p-3.5 backdrop-blur-md shadow-card dark:bg-portal-surface">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Platform Fee (5%)</span>
          <span className="num mt-1 block text-xl font-bold text-terracotta">{formatMoney(platformFeeTotal)}</span>
          <span className="mt-0.5 block text-[11px] text-muted">Escrow & verification</span>
        </div>

        <div className="rounded-panel border border-line/80 bg-white/90 p-3.5 backdrop-blur-md shadow-card dark:bg-portal-surface">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Farmer Net Payable</span>
          <span className="num mt-1 block text-xl font-bold text-moss dark:text-growth">{formatMoney(netPayableTotal)}</span>
          <span className="mt-0.5 block text-[11px] text-muted">Pro-rata payout pool</span>
        </div>

        <div className="rounded-panel border border-line/80 bg-white/90 p-3.5 backdrop-blur-md shadow-card dark:bg-portal-surface">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">PayPal Captures</span>
          <span className="num mt-1 block text-xl font-bold text-forest dark:text-growth">{capturedCount} Captured</span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-growth">
            <ShieldCheck className="h-3 w-3" /> Webhook Verified
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "shrink-0 rounded-full border border-forest bg-forest px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                : "shrink-0 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-muted hover:border-moss hover:text-moss dark:border-portal-line dark:bg-portal-surface dark:text-portal-muted"
            }
          >
            {f === "all" ? t("orders.filterAll") : f === "pending" ? t("orders.filterPending") : f === "completed" ? t("orders.filterCompleted") : t("orders.filterPaid")}
          </button>
        ))}
      </div>

      {/* Loading & Empty States */}
      {orders.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!orders.isLoading && rows.length === 0 && (
        <EmptyState
          icon={<ReceiptText className="h-8 w-8 text-moss" />}
          title={t("orders.noOrders")}
          body={t("orders.noOrdersBody")}
        />
      )}

      {/* TABLE VIEW: Full Financial Ledger */}
      {!orders.isLoading && rows.length > 0 && viewMode === "table" && (
        <div className="overflow-hidden rounded-panel border border-line/80 bg-white/95 backdrop-blur-md shadow-card dark:bg-portal-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line/80 bg-sage/50 text-[11px] font-bold uppercase tracking-wider text-moss dark:bg-portal-bg dark:text-portal-ink">
                  <th className="py-3.5 px-4">Order / Residue</th>
                  <th className="py-3.5 px-4">PayPal Ref</th>
                  <th className="py-3.5 px-4 text-right">Gross Amount</th>
                  <th className="py-3.5 px-4 text-right">Platform Fee (5%)</th>
                  <th className="py-3.5 px-4 text-right">Net Payable</th>
                  <th className="py-3.5 px-4">Payment State</th>
                  <th className="py-3.5 px-4">Fulfillment & Payout</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 dark:divide-portal-line">
                {rows.map((o) => {
                  const fee = commissionFor(o.totalAmount);
                  const net = netAfterCommission(o.totalAmount);
                  const other = profile.role === "buyer" ? o.farmerName : o.buyerName;
                  const payRef = `PAYID-${o.id.slice(0, 8).toUpperCase()}SB`;

                  return (
                    <tr
                      key={o.id}
                      className="transition-colors hover:bg-canvas/80 dark:hover:bg-portal-bg/60 cursor-pointer"
                      onClick={() => navigate(`/app/orders/${o.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <WasteImage
                            wasteType={o.wasteType}
                            alt={WASTE_LABELS[o.wasteType]}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover border border-line"
                          />
                          <div>
                            <span className="font-heading font-bold text-moss dark:text-portal-ink text-sm block">
                              #{o.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[11px] text-muted">
                              {WASTE_LABELS[o.wasteType]} ({o.quantityKg} kg) · {other}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-semibold text-moss bg-sage/60 rounded px-1.5 py-0.5 border border-line">
                          {payRef}
                        </span>
                        <span className="block text-[10px] text-muted mt-0.5">{formatDate(o.createdAt)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-moss dark:text-portal-ink">
                        {formatMoney(o.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-terracotta">
                        {formatMoney(fee)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-moss dark:text-growth">
                        {formatMoney(net)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusChip status={o.payment} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusChip status={o.fulfilment} size="sm" />
                          <span className="text-[10px] text-muted">Payout: {o.payout}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/app/orders/${o.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 rounded-lg bg-sage px-2.5 py-1 text-[11px] font-bold text-moss hover:bg-terracotta hover:text-white transition-colors"
                        >
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARD VIEW: Responsive Grid */}
      {!orders.isLoading && rows.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-6">
          {rows.map((o) => {
            const other = profile.role === "buyer" ? o.farmerName : o.buyerName;
            const fee = commissionFor(o.totalAmount);
            const net = netAfterCommission(o.totalAmount);

            return (
              <Link key={o.id} to={`/app/orders/${o.id}`} className="group block">
                <Card className="rounded-panel border border-line/80 bg-white/95 p-4 backdrop-blur-md shadow-card transition-all hover:-translate-y-1 hover:border-forest/40 hover:shadow-pop dark:bg-portal-surface">
                  <div className="flex items-start gap-3">
                    <WasteImage
                      wasteType={o.wasteType}
                      alt={WASTE_LABELS[o.wasteType]}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover border border-line"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="font-heading text-base font-bold text-moss dark:text-portal-ink">{WASTE_LABELS[o.wasteType]}</p>
                          <p className="truncate text-xs text-muted dark:text-portal-muted">
                            {profile.role === "buyer" ? t("common.farmer") : t("common.buyer")}: {other}
                          </p>
                          <p className="num mt-0.5 text-[11px] text-muted">
                            Order #{o.id.slice(0, 8).toUpperCase()} · {formatDate(o.createdAt)}
                          </p>
                        </div>
                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-terracotta" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl border border-line/60 bg-canvas/70 p-2 text-center dark:bg-portal-bg">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{t("status.fulfilment")}</p>
                      <StatusChip status={o.fulfilment} size="sm" className="mt-1" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{t("status.payment")}</p>
                      <StatusChip status={o.payment} size="sm" className="mt-1" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">{t("status.payout")}</p>
                      <StatusChip status={o.payout} size="sm" className="mt-1" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-line/70 pt-2.5 dark:border-portal-line">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Net Payable (95%)</span>
                      <span className="num text-base font-bold text-moss dark:text-growth">{formatMoney(net)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Gross (5% fee: {formatMoney(fee)})</span>
                      <span className="num text-sm font-semibold text-muted">{formatMoney(o.totalAmount)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
