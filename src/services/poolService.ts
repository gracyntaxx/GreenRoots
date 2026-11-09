import type { Pool, PoolContribution, Profile } from "@/types";
import { call } from "./http";
import {
  commitToPool,
  contributionsForPool,
  expandPool,
  extendDeadline,
  findPool,
  getState,
  MockError,
} from "@/mocks/store";
import { haversineKm } from "@/lib/geo";
import { daysUntil } from "@/lib/utils";

export interface PoolWithMeta extends Pool {
  distanceKm: number;
  percent: number;
  remainingKg: number;
  daysLeft: number;
}

function meta(pool: Pool, origin: Profile): PoolWithMeta {
  return {
    ...pool,
    distanceKm: haversineKm(origin.location, pool.location),
    percent: Math.min(100, Math.round((pool.committedKg / pool.targetKg) * 100)),
    remainingKg: Math.max(0, pool.targetKg - pool.committedKg),
    daysLeft: daysUntil(pool.deadline),
  };
}

export const poolService = {
  list(origin: Profile, opts?: { industryId?: string }): Promise<PoolWithMeta[]> {
    return call("pools/list", { method: "POST", body: JSON.stringify({ origin: origin.location, industryId: opts?.industryId }) }, () => {
      let pools = getState().pools;
      if (opts?.industryId) pools = pools.filter((p) => p.industryId === opts.industryId);
      return pools.map((p) => meta(p, origin));
    });
  },

  get(id: string, origin: Profile): Promise<PoolWithMeta> {
    return call(`pools/get?id=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ id, origin: origin.location }) }, () => {
      const p = findPool(id);
      if (!p) throw new MockError("Pool not found", "NOT_FOUND");
      return meta(p, origin);
    });
  },

  contributions(poolId: string): Promise<PoolContribution[]> {
    return call(`pools/contributions?poolId=${encodeURIComponent(poolId)}`, undefined, () => contributionsForPool(poolId));
  },

  myPools(farmerId: string, origin: Profile): Promise<PoolWithMeta[]> {
    return call("pools/mine", { method: "POST", body: JSON.stringify({ farmerId, origin: origin.location }) }, () => {
      const state = getState();
      const ids = new Set(state.contributions.filter((c) => c.farmerId === farmerId).map((c) => c.poolId));
      return state.pools.filter((p) => ids.has(p.id)).map((p) => meta(p, origin));
    });
  },

  commit(input: {
    poolId: string;
    farmer: Profile;
    quantityKg: number;
    collectionPointId: string;
  }): Promise<{ pool: PoolWithMeta; contribution: PoolContribution }> {
    return call("pools/commit", { method: "POST", body: JSON.stringify(input) }, () => {
      const pool = findPool(input.poolId);
      if (!pool) throw new MockError("Pool not found", "NOT_FOUND");
      const { pool: updated, contribution } = commitToPool({
        pool,
        farmer: input.farmer,
        quantityKg: input.quantityKg,
        collectionPointId: input.collectionPointId,
      });
      return { pool: meta(updated, input.farmer), contribution };
    }, { mutation: true });
  },

  expand(id: string, km: number): Promise<PoolWithMeta> {
    return call("pools/expand", { method: "POST", body: JSON.stringify({ id, km }) }, () => {
      const p = expandPool(id, km);
      const origin = getState().profiles[0];
      return meta(p, origin);
    }, { mutation: true });
  },

  extend(id: string, deadline: string): Promise<PoolWithMeta> {
    return call("pools/extend", { method: "POST", body: JSON.stringify({ id, deadline }) }, () => {
      const p = extendDeadline(id, deadline);
      const origin = getState().profiles[0];
      return meta(p, origin);
    }, { mutation: true });
  },

  suggestion(pool: PoolWithMeta): { text: string; recommendedKm: number } {
    const days = daysUntil(pool.deadline);
    if (pool.percent >= 100) {
      return { text: "This pool is full and ready for pickup.", recommendedKm: pool.radiusKm };
    }
    if (days <= 3 && pool.percent < 80) {
      return {
        text: `Pool is ${pool.percent}% filled with ${days} day${days === 1 ? "" : "s"} left. Recommend expanding the area to 60 km.`,
        recommendedKm: 60,
      };
    }
    return {
      text: `Pool is ${pool.percent}% filled with ${days} day${days === 1 ? "" : "s"} left. It is on track; no change needed.`,
      recommendedKm: pool.radiusKm,
    };
  },
};
