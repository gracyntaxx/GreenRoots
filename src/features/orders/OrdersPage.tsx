import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ReceiptText } from "lucide-react";
import { useSession } from "@/store/session";
import { orderService } from "@/services/orderService";
import { StatusChip } from "@/components/shared/StatusTriad";
import { QtyText } from "@/components/shared/Numbers";
import { WasteImage } from "@/components/shared/WasteImage";
import { Card } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/misc";
import { PageContainer } from "@/components/shared/PageContainer";
import { WASTE_LABELS } from "@/types";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

const FILTERS = ["all", "pending", "completed", "paid"] as const;
type Filter = (typeof FILTERS)[number];

export default function OrdersPage() {
  const { t } = useTranslation();
  const profile = useSession((s) => s.profile)!;
  const [filter, setFilter] = useState<Filter>("all");

  const orders = useQuery({ queryKey: ["orders", profile.id], queryFn: () => orderService.list(profile) });

  const rows = useMemo(() => {
    const all = orders.data ?? [];
    if (filter === "pending") return all.filter((o) => o.fulfilment === "Pending");
    if (filter === "completed") return all.filter((o) => o.fulfilment === "Completed");
    if (filter === "paid") return all.filter((o) => o.payment === "Captured");
    return all;
  }, [orders.data, filter]);

  return (
    <PageContainer>
      <div className="border-b border-line pb-4 dark:border-portal-line">
        <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-portal-ink">{t("orders.title")}</h1>
        <p className="mt-1 text-sm text-muted dark:text-portal-muted">Review order fulfilment, verified payments and farmer payouts.</p>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "shrink-0 rounded-full border border-forest bg-meadow px-3.5 py-1.5 text-xs font-bold text-forest dark:border-growth/40 dark:bg-[#123524] dark:text-growth"
                : "shrink-0 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted hover:bg-canvas dark:border-portal-line dark:bg-portal-surface dark:text-portal-muted"
            }
          >
            {f === "all" ? t("orders.filterAll") : f === "pending" ? t("orders.filterPending") : f === "completed" ? t("orders.filterCompleted") : t("orders.filterPaid")}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-6">
        {orders.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}

        {!orders.isLoading && rows.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={<ReceiptText className="h-7 w-7" />}
              title={t("orders.noOrders")}
              body={t("orders.noOrdersBody")}
            />
          </div>
        )}

        {rows.map((o) => {
          const other = profile.role === "buyer" ? o.farmerName : o.buyerName;
          return (
            <Link key={o.id} to={`/app/orders/${o.id}`} className="block">
              <Card className="p-3.5 transition-shadow hover:shadow-md">
                <div className="flex items-start gap-3">
                  <WasteImage
                    wasteType={o.wasteType}
                    alt={WASTE_LABELS[o.wasteType]}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover border border-line dark:border-portal-line"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-ink dark:text-portal-ink">{WASTE_LABELS[o.wasteType]}</p>
                        <p className="truncate text-[12px] text-muted dark:text-portal-muted">
                          {profile.role === "buyer" ? t("common.farmer") : t("common.buyer")}: {other}
                        </p>
                        <p className="num mt-0.5 text-[11px] text-muted dark:text-portal-muted">
                          {t("orders.orderNumber", { id: o.id })} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted dark:text-portal-muted" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-y border-line py-2 dark:border-portal-line">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">{t("status.fulfilment")}</p>
                    <StatusChip status={o.fulfilment} size="sm" />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">{t("status.payment")}</p>
                    <StatusChip status={o.payment} size="sm" />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">{t("status.payout")}</p>
                    <StatusChip status={o.payout} size="sm" />
                  </div>
                </div>

                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t("common.quantity")}</p>
                    <QtyText kg={o.quantityKg} className="text-[13px] font-semibold text-ink" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t("common.total")}</p>
                    <p className="num text-[16px] font-bold text-forest">{formatMoney(o.totalAmount)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
