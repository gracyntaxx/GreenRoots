import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/misc";
import { formatNumber } from "@/lib/money";
import { kgToBestDisplay } from "@/lib/units";

export function PoolProgress({
  committedKg,
  targetKg,
  status,
  className,
  showStages = true,
}: {
  committedKg: number;
  targetKg: number;
  status?: string;
  className?: string;
  showStages?: boolean;
}) {
  const { t } = useTranslation();
  const percent = targetKg > 0 ? Math.min(100, Math.round((committedKg / targetKg) * 100)) : 0;
  const remaining = Math.max(0, targetKg - committedKg);
  
  // 4-stage sequence: Open -> Pooled -> Ready for Pickup -> PayPal Settled
  let stageIndex = 0;
  if (status === "Settled") {
    stageIndex = 3;
  } else if (status === "Ready for Pickup") {
    stageIndex = 2;
  } else if (percent >= 75 || status === "Pooled") {
    stageIndex = 1;
  }

  const stages = [
    t("pools.stageOpen") || "1. Open",
    t("pools.stagePooled") || "2. Pooled",
    t("pools.stageReady") || "3. Ready for Pickup",
    t("pools.stageSettled") || "4. PayPal Settled",
  ];

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("pools.committed")}</p>
          <p className="num text-lg font-bold text-moss dark:text-portal-ink">{formatNumber(committedKg)} kg</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{t("pools.target")}</p>
          <p className="num text-sm font-semibold text-moss/80 dark:text-portal-ink">{kgToBestDisplay(targetKg)}</p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-sage/60 dark:bg-portal-surface">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percent >= 100
              ? "bg-[linear-gradient(90deg,#2E7D32,#7FB069)]"
              : percent >= 75
              ? "bg-[linear-gradient(90deg,#D96B27,#EAB308)]"
              : "bg-terracotta"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="num font-bold text-moss dark:text-growth">{percent}% filled</span>
        <span className="text-muted">
          {t("pools.remaining")}: <span className="num font-semibold text-moss dark:text-portal-ink">{kgToBestDisplay(remaining)}</span>
        </span>
      </div>

      <p className="sr-only">
        {t("pools.poolProgress")}: {formatNumber(committedKg)} kg committed out of {formatNumber(targetKg)} kg. {percent}% full.
      </p>

      {showStages && (
        <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-line/60 dark:border-portal-line/60">
          {stages.map((stage, i) => {
            const done = i < stageIndex || (i === stageIndex && stageIndex === 3);
            const active = i === stageIndex && stageIndex < 3;
            return (
              <div
                key={stage}
                className={cn(
                  "flex items-center justify-center rounded-lg px-1.5 py-1 text-center text-[9px] font-bold uppercase transition-all tracking-tight",
                  done
                    ? "bg-sage text-moss dark:bg-forest/40 dark:text-growth"
                    : active
                    ? "bg-wheat-soft text-terracotta-dark border border-wheat/60 font-extrabold"
                    : "bg-canvas/60 text-muted/60 dark:bg-portal-surface dark:text-portal-muted/60"
                )}
              >
                <span className="truncate">{stage}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
