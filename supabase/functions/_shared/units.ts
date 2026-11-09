// Canonical Unit Conversion Module

export type QtyUnit = "kg" | "quintal" | "tonne";

export type WasteType =
  | "paddy_straw"
  | "rice_husk"
  | "mustard_stubble"
  | "wheat_straw"
  | "sugarcane_trash"
  | "cashew_shell"
  | "cotton_stalk"
  | "groundnut_shell"
  | "bagasse";

export const KG_PER_UNIT: Record<QtyUnit, number> = {
  kg: 1,
  quintal: 100,
  tonne: 1000,
};

export function isValidUnit(unit: string): unit is QtyUnit {
  return unit === "kg" || unit === "quintal" || unit === "tonne";
}

export function toKg(value: number, unit: QtyUnit): number {
  if (value <= 0 || !Number.isFinite(value)) {
    throw new Error("Quantity must be a positive number.");
  }
  return value * KG_PER_UNIT[unit];
}

export function fromKg(kg: number, unit: QtyUnit): number {
  if (kg < 0 || !Number.isFinite(kg)) {
    throw new Error("Quantity cannot be negative.");
  }
  return kg / KG_PER_UNIT[unit];
}

export function conversionLine(value: number, unit: QtyUnit): string {
  const kg = toKg(value, unit);
  const formattedVal = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);
  const formattedKg = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(kg);
  if (unit === "kg") return `${formattedKg} kg`;
  return `${formattedVal} ${unit}${value !== 1 ? "s" : ""} = ${formattedKg} kg`;
}

