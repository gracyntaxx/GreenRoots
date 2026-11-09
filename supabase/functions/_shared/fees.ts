// Platform Fee and Largest-Remainder Commission Split Algorithm

export interface ContributionItem {
  id: string;
  farmerId: string;
  grossPaise: bigint;
}

export interface SplitResult {
  id: string;
  farmerId: string;
  grossPaise: bigint;
  commissionPaise: bigint;
  netPaise: bigint;
}

/**
 * Calculates per-farmer platform commission and net payable using the Largest-Remainder Method (Hare-Niemeyer).
 * Guarantees that:
 * 1. sum(commission_i) == commission_total exactly to the paisa.
 * 2. sum(net_i) + commission_total == gross_total exactly to the paisa.
 */
export function calculatePlatformFee(amountPaise: bigint | number, feeBps = 500): {
  grossPaise: bigint;
  feePaise: bigint;
  netPaise: bigint;
} {
  const gross = typeof amountPaise === "bigint" ? amountPaise : BigInt(Math.round(amountPaise));
  const fee = BigInt(Math.round(Number(gross) * feeBps / 10000));
  const net = gross - fee;
  return { grossPaise: gross, feePaise: fee, netPaise: net };
}

export function calculateLargestRemainderSplit(
  items: ContributionItem[],
  feeBps = 500 // 5.00%
): {
  splits: SplitResult[];
  grossTotal: bigint;
  commissionTotal: bigint;
  netTotal: bigint;
} {
  if (items.length === 0) {
    return { splits: [], grossTotal: 0n, commissionTotal: 0n, netTotal: 0n };
  }

  const grossTotal = items.reduce((s, it) => s + it.grossPaise, 0n);
  if (grossTotal === 0n) {
    const zeroSplits = items.map((it) => ({
      id: it.id,
      farmerId: it.farmerId,
      grossPaise: 0n,
      commissionPaise: 0n,
      netPaise: 0n,
    }));
    return { splits: zeroSplits, grossTotal: 0n, commissionTotal: 0n, netTotal: 0n };
  }

  // Total commission in integer paise
  const commissionTotal = BigInt(Math.round(Number(grossTotal) * feeBps / 10000));

  // Compute exact quota, floor integer part, and remainder for each item
  const quotas = items.map((it, idx) => {
    const rawQuota = Number(it.grossPaise) * Number(commissionTotal) / Number(grossTotal);
    const integerPart = BigInt(Math.floor(rawQuota));
    const remainder = rawQuota - Math.floor(rawQuota);
    return {
      idx,
      item: it,
      integerPart,
      remainder,
    };
  });

  const allocatedInteger = quotas.reduce((s, q) => s + q.integerPart, 0n);
  let remainingToDistribute = Number(commissionTotal - allocatedInteger);

  // Sort descending by largest remainder
  quotas.sort((a, b) => b.remainder - a.remainder);

  // Distribute 1 paisa to highest remainders until commissionTotal is reached
  for (let i = 0; i < quotas.length && remainingToDistribute > 0; i++) {
    quotas[i].integerPart += 1n;
    remainingToDistribute--;
  }

  // Restore original ordering
  quotas.sort((a, b) => a.idx - b.idx);

  const splits: SplitResult[] = quotas.map((q) => {
    const gross = q.item.grossPaise;
    const comm = q.integerPart;
    const net = gross - comm;
    return {
      id: q.item.id,
      farmerId: q.item.farmerId,
      grossPaise: gross,
      commissionPaise: comm,
      netPaise: net,
    };
  });

  const netTotal = splits.reduce((s, r) => s + r.netPaise, 0n);

  return {
    splits,
    grossTotal,
    commissionTotal,
    netTotal,
  };
}

export function splitPoolCommission(
  totalPaise: number,
  shares: { id: string; farmerId: string; farmerName: string; kg: number }[]
) {
  const totalKg = shares.reduce((s, sh) => s + sh.kg, 0) || 1;
  const items: ContributionItem[] = shares.map((sh) => ({
    id: sh.id,
    farmerId: sh.farmerId,
    grossPaise: BigInt(Math.round((sh.kg / totalKg) * totalPaise)),
  }));

  const res = calculateLargestRemainderSplit(items, 500);

  const splits = res.splits.map((sp, idx) => {
    const original = shares[idx];
    const sharePercent = (original.kg / totalKg) * 100;
    return {
      id: sp.id,
      farmerId: sp.farmerId,
      farmerName: original.farmerName,
      kg: original.kg,
      sharePercent,
      grossPaise: Number(sp.grossPaise),
      feePaise: Number(sp.commissionPaise),
      netPaise: Number(sp.netPaise),
    };
  });

  return {
    splits,
    totalNetPaise: Number(res.netTotal),
  };
}
