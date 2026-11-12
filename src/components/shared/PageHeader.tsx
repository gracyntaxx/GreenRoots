import * as React from "react";
import { cn } from "@/lib/utils";

export function PortalPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="font-heading text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-moss dark:text-portal-ink sm:text-[34px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted dark:text-portal-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  className,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-2.5 flex items-center justify-between gap-2", className)}>
      <h2 className="flex items-center gap-1.5 text-lg font-semibold leading-tight text-ink dark:text-portal-ink">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "info";
  icon?: React.ReactNode;
}) {
  const tones = {
    default: "border-line/90 bg-white/85 backdrop-blur-sm dark:border-portal-line dark:bg-portal-surface",
    success: "border-growth/25 bg-sage dark:border-growth/25 dark:bg-[#0F2A1B]",
    warning: "border-wheat/40 bg-wheat-soft dark:border-settle/30 dark:bg-[#2A2110]",
    info: "border-navy/15 bg-[#E8EEF9] dark:border-[#2A4C8F] dark:bg-[#101E36]",
  };
  return (
    <div className={cn("rounded-panel border p-4 shadow-card", tones[tone])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted dark:text-portal-muted">{label}</p>
        {icon}
      </div>
      <div className="num mt-2 text-2xl font-bold text-ink dark:text-portal-ink">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-muted dark:text-portal-muted">{sub}</div>}
    </div>
  );
}
