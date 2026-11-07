import { cn } from "@/lib/utils";
import { formatMoney, formatNumber } from "@/lib/money";
import { conversionLine, formatQtyKg, formatQtyValue, formatUnit, UNIT_LABELS } from "@/lib/units";
import type { QtyUnit } from "@/types";

export function MoneyText({
  amount,
  decimals,
  sign,
  className,
}: {
  amount: number;
  decimals?: boolean;
  sign?: boolean;
  className?: string;
}) {
  return <span className={cn("num", className)}>{formatMoney(amount, { decimals, sign })}</span>;
}

export function QtyText({ kg, className }: { kg: number; className?: string }) {
  return <span className={cn("num", className)}>{formatQtyKg(kg)}</span>;
}

export function QtyValue({
  value,
  unit,
  className,
}: {
  value: number;
  unit: QtyUnit;
  className?: string;
}) {
  return <span className={cn("num", className)}>{formatQtyValue(value, unit)}</span>;
}

export function ConversionLine({
  value,
  unit,
  className,
}: {
  value: number;
  unit: QtyUnit;
  className?: string;
}) {
  return <span className={cn("num text-[13px] text-muted", className)}>{conversionLine(value, unit)}</span>;
}

export function RateText({
  rate,
  unit,
  className,
}: {
  rate: number;
  unit: QtyUnit;
  className?: string;
}) {
  return (
    <span className={cn("num", className)}>
      ₹{formatNumber(rate)} <span className="text-[0.85em] font-normal text-muted">/ {formatUnit(unit, false)}</span>
    </span>
  );
}

export function UnitLabel({ unit }: { unit: QtyUnit }) {
  return <span className="text-[13px] font-medium text-muted">{UNIT_LABELS[unit]}</span>;
}
