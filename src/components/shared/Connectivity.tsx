import { CloudOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, timeAgo } from "@/lib/utils";
import { useConnectivity } from "@/lib/connectivity";

export function OfflineBanner({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  const { t } = useTranslation();
  const online = useConnectivity();
  if (online) return null;
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 border-b border-settle/50 bg-[#FEF3C7] px-3 py-2 text-[12px] font-semibold text-[#92400E]",
        className
      )}
    >
      <CloudOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">
        {t("common.offline")}. Showing saved data. Commit, order and pay are disabled until you reconnect.
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-settle/50 bg-white/60 px-2 font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function StaleDataTag({
  updatedAt,
  className,
  showOnline,
}: {
  updatedAt?: number | string;
  className?: string;
  showOnline?: boolean;
}) {
  const { t } = useTranslation();
  const online = useConnectivity();
  const when =
    typeof updatedAt === "string"
      ? timeAgo(updatedAt)
      : updatedAt
      ? timeAgo(new Date(updatedAt).toISOString())
      : null;
  if (!when && online && !showOnline) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        online ? "text-muted" : "text-[#92400E]",
        className
      )}
    >
      {when ? `${t("common.lastUpdated")} ${when}` : t("common.loading")}
      {!online ? ` · ${t("common.offline")}` : ""}
    </span>
  );
}
