import type { QtyUnit } from "@/types";
import { formatNumber } from "./money";

export const KG_PER_UNIT: Record<QtyUnit, number> = {
  kg: 1,
  quintal: 100,
  tonne: 1000,
};

export const UNIT_LABELS: Record<QtyUnit, string> = {
  kg: "kg",
  quintal: "quintal",
  tonne: "tonne (MT)",
};

export function toKg(value: number, unit: QtyUnit) {
  return value * KG_PER_UNIT[unit];
}

export function fromKg(kg: number, unit: QtyUnit) {
  return kg / KG_PER_UNIT[unit];
}

export function formatUnit(unit: QtyUnit, plural = true) {
  if (unit === "kg") return "kg";
  if (unit === "quintal") return plural ? "quintals" : "quintal";
  return plural ? "tonnes" : "tonne";
}

export function formatQtyValue(value: number, unit: QtyUnit) {
  const decimals = unit === "kg" ? 0 : Number.isInteger(value) ? 0 : 1;
  return `${formatNumber(value, decimals)} ${formatUnit(unit, value !== 1)}`;
}

/** Always show the kg equivalent alongside the user's chosen unit. */
export function conversionLine(value: number, unit: QtyUnit) {
  const kg = toKg(value, unit);
  if (unit === "kg") return `${formatNumber(kg)} kg`;
  return `${formatQtyValue(value, unit)} = ${formatNumber(kg)} kg`;
}

export function kgToBestDisplay(kg: number) {
  if (kg >= 1000) return `${formatNumber(kg / 1000, kg % 1000 === 0 ? 0 : 1)} tonnes`;
  if (kg >= 100) return `${formatNumber(kg / 100, kg % 100 === 0 ? 0 : 1)} quintals`;
  return `${formatNumber(kg)} kg`;
}

export function formatQtyKg(kg: number) {
  return kgToBestDisplay(kg);
}
