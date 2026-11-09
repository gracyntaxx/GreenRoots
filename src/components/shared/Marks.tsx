import * as React from "react";
import { BadgeCheck, FlaskConical, Info, ShieldAlert, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AiChip({
  kind = "suggested",
  className,
  children,
  iconOnly,
}: {
  kind?: "suggested" | "estimate" | "forecast" | "explanation";
  className?: string;
  children?: React.ReactNode;
  iconOnly?: boolean;
}) {
  const { t } = useTranslation();
  const label =
    children ??
    (kind === "estimate"
      ? t("common.aiEstimate")
      : kind === "forecast"
      ? t("common.aiEstimate")
      : t("common.aiSuggested"));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#D9D2F7] bg-aitint px-2.5 py-1 text-[12px] font-semibold text-[#4b3f97]",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {!iconOnly && <span>{label}</span>}
    </span>
  );
}

export function VerifiedMark({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-forest/25 bg-meadow px-2 py-0.5 text-[12px] font-semibold text-forest",
        className
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {label ?? t("common.verified")}
    </span>
  );
}

export function EstimateLabel({
  className,
  text,
  explanation,
}: {
  className?: string;
  text?: string;
  explanation?: string;
}) {
  const { t } = useTranslation();
  return (
    <span className={cn("inline-flex items-center gap-1 text-[12px] font-semibold text-muted", className)}>
      {text ?? t("common.estimated")}
      {explanation && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-canvas" aria-label={explanation}>
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{explanation}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

export function SandboxStrip(_props?: { className?: string; compact?: boolean }) {
  return null;
}

export function SimulatedChip(_props?: { className?: string }) {
  return null;
}
