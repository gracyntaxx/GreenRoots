import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReputationFactor } from "@/types";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function Ring({ score, size = 40 }: { score: number; size?: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 5));
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#CBD5E1" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="#15803D"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0F172A" className="num">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

export function ReputationBadge({
  score,
  factors,
  className,
  showScore,
  size = "md",
}: {
  score: number;
  factors: ReputationFactor[];
  className?: string;
  showScore?: boolean;
  size?: "sm" | "md";
}) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface font-semibold text-ink hover:bg-canvas",
            size === "sm" ? "px-2 py-1 text-[12px]" : "px-2.5 py-1.5 text-sm",
            className
          )}
          aria-label={`${t("home.reputation")} ${score.toFixed(1)} out of 5`}
        >
          <Star className="h-3.5 w-3.5 fill-settle text-settle" aria-hidden="true" />
          <span className="num">{score.toFixed(1)}</span>
          {showScore && <span className="font-normal text-muted">/ 5</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center gap-3">
          <Ring score={score} />
          <div>
            <p className="text-sm font-bold text-ink">{t("me.reputation")}</p>
            <p className="text-[12px] text-muted">{t("me.calculatedFrom")}</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {factors.length === 0 && <p className="text-[13px] text-muted">No transaction history yet.</p>}
          {factors.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-muted">{f.label}</span>
              <span className="num font-semibold text-ink">{f.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-2 text-[11px] font-medium text-muted">
          Calculated from your transaction history. Not written by AI.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function ReputationInline({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted">
      <Star className="h-3 w-3 fill-settle text-settle" aria-hidden="true" />
      <span className="num">{score.toFixed(1)}</span>
    </span>
  );
}
