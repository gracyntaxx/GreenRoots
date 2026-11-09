import * as React from "react";
import { Table, THead, TBody, TR, TH, TD, Skeleton, EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export interface ResponsiveTableProps<T> {
  data: T[];
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  renderCard?: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  headers,
  renderRow,
  renderCard,
  keyExtractor = (_, i) => i,
  isLoading,
  emptyIcon,
  emptyTitle = "No records found",
  emptyBody = "There are no entries to display.",
  className,
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Card Stack (< 640px) */}
      {renderCard && (
        <div className="grid gap-3 sm:hidden p-3">
          {data.map((item, index) => (
            <div key={keyExtractor(item, index)} className="rounded-xl border border-line bg-surface p-3.5 shadow-sm dark:border-portal-line dark:bg-portal-surface">
              {renderCard(item, index)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop / Tablet Table View */}
      <div className={cn("w-full overflow-x-auto", renderCard ? "hidden sm:block" : "block")}>
        <Table>
          <THead>
            <TR>
              {headers.map((h, i) => (
                <TH key={i}>{h}</TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {data.map((item, index) => (
              <TR key={keyExtractor(item, index)}>{renderRow(item, index)}</TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

