import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
  label,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label ?? "Progress"}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-line dark:bg-portal-line", className)}
    >
      <div
        className={cn("h-full rounded-full bg-[linear-gradient(90deg,#2E6F40_0%,#EAB308_100%)] transition-all duration-500", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line/70 dark:bg-portal-line/60", className)} />;
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line dark:bg-portal-line", className)} />;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
    </div>
  );
}
export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-line dark:border-portal-line", className)} {...props} />;
}
export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}
export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-line/70 transition-colors hover:bg-canvas/70 dark:border-portal-line/60 dark:hover:bg-portal-bg/60",
        className
      )}
      {...props}
    />
  );
}
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted dark:text-portal-muted",
        className
      )}
      {...props}
    />
  );
}
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-3 align-middle text-ink dark:text-portal-ink", className)} {...props} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-field border-[1.5px] border-dashed border-line bg-surface px-6 py-10 text-center dark:border-portal-line dark:bg-portal-surface",
        className
      )}
    >
      {icon && <div className="mb-3 text-muted dark:text-portal-muted">{icon}</div>}
      <p className="text-base font-semibold text-ink dark:text-portal-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted dark:text-portal-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
