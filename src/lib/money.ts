const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number, opts?: { decimals?: boolean; sign?: boolean }) {
  const base = opts?.decimals ? inr2.format(Math.abs(amount)) : inr.format(Math.abs(amount));
  if (opts?.sign) return `${amount < 0 ? "−" : "+"}${base}`;
  return amount < 0 ? `−${base}` : base;
}

export function formatNumber(n: number, decimals = 0) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

export function formatPercent(n: number, decimals = 0) {
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n)}%`;
}
