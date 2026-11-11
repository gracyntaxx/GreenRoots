// Money and Currency Conversion Module (Paise & Sandbox FX)

// @ts-ignore
if (typeof BigInt !== "undefined" && !BigInt.prototype.toJSON) {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return Number(this);
  };
}

export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

export function paiseToRupees(paise: bigint | number): number {
  return Number(paise) / 100;
}

export function formatMoneyINR(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export interface FxSnapshot {
  amountPaise: bigint;
  chargeAmountMinor: number;
  chargeCurrency: string;
  fxRate: number;
}

/**
 * Snapshots the sandbox charge currency amount.
 * PayPal sandbox REST accounts default to USD when testing without an Indian merchant agreement.
 */
export function computeChargeSnapshot(rupeesAmount: number): FxSnapshot {
  const chargeCurrency = Deno.env.get("PAYPAL_CURRENCY") ?? "USD";
  const fxRate = parseFloat(Deno.env.get("FX_INR_PER_UNIT") ?? "84.0"); // e.g. 84 INR per USD
  
  const chargeAmountMinor = chargeCurrency === "INR"
    ? Math.round(rupeesAmount * 100) / 100
    : Math.round((rupeesAmount / fxRate) * 100) / 100;

  return {
    amountPaise: rupeesToPaise(rupeesAmount),
    chargeAmountMinor,
    chargeCurrency,
    fxRate,
  };
}

export function paiseToPaypalCharge(paise: bigint | number): FxSnapshot {
  const rupees = paiseToRupees(paise);
  return computeChargeSnapshot(rupees);
}

