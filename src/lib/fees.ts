/**
 * Platform commission applied to a farmer's gross payable.
 * NOTE: The real commission formula is still to be finalised with the
 * business team. This single constant is the only place the rate is set.
 */
export const PLATFORM_FEE_PERCENT = 5;

export function commissionFor(gross: number) {
  return Math.round((gross * PLATFORM_FEE_PERCENT) / 100);
}

export function netAfterCommission(gross: number) {
  return Math.round(gross - commissionFor(gross));
}
