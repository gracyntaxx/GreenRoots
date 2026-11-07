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
  const stageIndex = status === "Settled" ? 2 : status === "Ready for Pickup" ? 1 : 0;
  const stages = [t("pools.stageCommitted"), t("pools.stageReady"), t("pools.stageSettled")];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("pools.committed")}</p>
          <p className="num text-xl font-bold text-ink">{formatNumber(committedKg)} kg</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("pools.target")}</p>
          <p className="num text-sm font-semibold text-ink">{kgToBestDisplay(targetKg)}</p>
        </div>
      </div>
      <Progress
        value={percent}
        label={`${t("pools.poolProgress")}: ${percent}%`}
        barClassName={percent >= 100 ? "bg-growth" : undefined}
      />
      <div className="flex items-center justify-between text-[12px] font-medium">
        <span className="num font-bold text-forest">{percent}%</span>
        <span className="text-muted">
          {t("pools.remaining")}: <span className="num font-semibold text-ink">{kgToBestDisplay(remaining)}</span>
        </span>
      </div>
      <p className="sr-only">
        {t("pools.poolProgress")}: {formatNumber(committedKg)} kg committed out of {formatNumber(targetKg)} kg. {percent}% full.
      </p>
      {showStages && (
        <div className="flex items-center gap-1 pt-1">
          {stages.map((stage, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            return (
              <div key={stage} className="flex flex-1 items-center gap-1">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    done && "border-forest bg-forest text-white",
                    active && !done && "border-forest bg-meadow text-forest",
                    !done && !active && "border-line bg-surface text-muted"
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "truncate text-[10px] font-semibold leading-tight",
                    active || done ? "text-forest" : "text-muted"
                  )}
                >
                  {stage}
                </span>
                {i < stages.length - 1 && <div className={cn("h-0.5 flex-1", done ? "bg-forest" : "bg-line")} aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
