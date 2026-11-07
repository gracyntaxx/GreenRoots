import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  Clock3,
  FlaskConical,
  Info,
  Loader2,
  MinusCircle,
  PackageCheck,
  RotateCcw,
  Truck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FulfilmentStatus, PaymentStatus, PayoutStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type AnyStatus = FulfilmentStatus | PaymentStatus | PayoutStatus;

const ICONS: Record<string, LucideIcon> = {
  Pending: Clock3,
  "Ready for Pickup": Truck,
  Completed: CheckCircle2,
  Cancelled: XCircle,
  Initiated: Circle,
  "Awaiting Approval": Clock3,
  Approved: BadgeCheck,
  Captured: CheckCircle2,
  Failed: XCircle,
  Refunded: RotateCcw,
  "Not Yet Due": MinusCircle,
  Processing: Loader2,
  Simulated: FlaskConical,
};

function tone(status: string) {
  switch (status) {
    case "Completed":
    case "Captured":
      return "border-growth/35 bg-meadow text-[#116b33]";
    case "Ready for Pickup":
    case "Approved":
      return "border-navy/20 bg-[#E0EAFF] text-navy";
    case "Pending":
    case "Awaiting Approval":
    case "Processing":
      return "border-settle/40 bg-[#FEF3C7] text-[#92400E]";
    case "Failed":
    case "Cancelled":
      return "border-error/30 bg-[#FEE2E2] text-[#991B1B]";
    case "Simulated":
      return "border-[#D9D2F7] bg-aitint text-[#4b3f97]";
    default:
      return "border-line bg-canvas text-muted";
  }
}

export function StatusChip({
  status,
  className,
  size = "md",
}: {
  status: AnyStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const { t } = useTranslation();
  const Icon = ICONS[status] ?? Circle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold leading-tight",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        tone(status),
        className
      )}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", status === "Processing" && "animate-spin")} aria-hidden="true" />
      <span>{t(`status.${status}`)}</span>
    </span>
  );
}

export function StatusTriad({
  fulfilment,
  payment,
  payout,
  className,
  compact,
}: {
  fulfilment: FulfilmentStatus;
  payment: PaymentStatus;
  payout: PayoutStatus;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const cells = [
    { label: t("status.fulfilment"), icon: PackageCheck, status: fulfilment },
    { label: t("status.payment"), icon: BadgeCheck, status: payment },
    { label: t("status.payout"), icon: Wallet, status: payout },
  ] as const;
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-3 dark:border-portal-line dark:bg-portal-bg/40", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">
          {compact ? t("common.status") : "Three separate states"}
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-navy hover:bg-canvas dark:text-[#8FB4FF] dark:hover:bg-portal-surface"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              {t("common.whatMeans")}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <p className="font-semibold text-ink dark:text-portal-ink">These are three separate states</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted dark:text-portal-muted">
              {t("status.explainer")}
            </p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-muted dark:text-portal-muted">
              <li><strong className="text-ink dark:text-portal-ink">Fulfilment:</strong> has the waste reached the collection point?</li>
              <li><strong className="text-ink dark:text-portal-ink">Payment:</strong> has PayPal verified the industry or buyer's money?</li>
              <li><strong className="text-ink dark:text-portal-ink">Payout:</strong> has the farmer actually been paid?</li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cells.map(({ label, icon: Icon, status }) => (
          <div key={label} className="min-w-0">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">
              <Icon className="h-3 w-3" aria-hidden="true" />
              {label}
            </p>
            <StatusChip status={status} size={compact ? "sm" : "md"} className="w-full justify-start" />
          </div>
        ))}
      </div>
    </div>
  );
}
