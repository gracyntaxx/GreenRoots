import type { Profile, Requirement, RequirementDraft } from "@/types";
import { call } from "./http";
import { createRequirement, getState, MockError } from "@/mocks/store";
import { haversineKm } from "@/lib/geo";
import { KG_PER_UNIT } from "@/lib/units";

export interface RequirementWithDistance extends Requirement {
  distanceKm: number;
  ratePerKg: number;
  committedKg: number;
  remainingKg: number;
}

export const requirementService = {
  list(origin: Profile): Promise<RequirementWithDistance[]> {
    return call("requirements/list", { method: "POST", body: JSON.stringify({ origin: origin.location }) }, () => {
      const { requirements, pools } = getState();
      return requirements.map((r) => {
        const pool = pools.find((p) => p.id === r.poolId);
        const committedKg = pool?.committedKg ?? 0;
        return {
          ...r,
          distanceKm: haversineKm(origin.location, r.location),
          ratePerKg: r.ratePerUnit / KG_PER_UNIT[r.rateUnit],
          committedKg,
          remainingKg: Math.max(0, r.targetKg - committedKg),
        };
      });
    });
  },

  get(id: string, origin: Profile): Promise<RequirementWithDistance> {
    return call(`requirements/get?id=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ id, origin: origin.location }) }, () => {
      const r = getState().requirements.find((x) => x.id === id);
      if (!r) throw new MockError("Requirement not found", "NOT_FOUND");
      const pool = getState().pools.find((p) => p.id === r.poolId);
      return {
        ...r,
        distanceKm: haversineKm(origin.location, r.location),
        ratePerKg: r.ratePerUnit / KG_PER_UNIT[r.rateUnit],
        committedKg: pool?.committedKg ?? 0,
        remainingKg: Math.max(0, r.targetKg - (pool?.committedKg ?? 0)),
      };
    });
  },

  create(industry: Profile, draft: RequirementDraft): Promise<{ requirement: Requirement; poolId: string }> {
    return call("requirements/create", { method: "POST", body: JSON.stringify({ ...draft, industry }) }, () => {
      if (!draft.wasteType || !draft.quantity || !draft.rate || !draft.deadline || !draft.location) {
        throw new MockError("Some required details are missing.", "VALIDATION");
      }
      const { requirement, pool } = createRequirement({
        industry,
        wasteType: draft.wasteType,
        targetKg: draft.quantity * KG_PER_UNIT[draft.unit ?? "tonne"],
        ratePerUnit: draft.rate,
        rateUnit: draft.rateUnit ?? draft.unit ?? "tonne",
        deadline: draft.deadline,
        village: draft.village ?? industry.village,
        location: draft.location,
        notes: draft.notes,
      });
      return { requirement, poolId: pool.id };
    }, { mutation: true });
  },

  /** Plain-fact eligibility and fit, ranked deterministically. AI explanation is separate. */
  matchesForIndustry(industry: Profile) {
    const { pools, profiles } = getState();
    const myPools = pools.filter((p) => p.industryId === industry.id);
    const farmers = profiles.filter((p) => p.role === "farmer");
    return myPools.flatMap((pool) =>
      farmers.map((farmer) => {
        const distanceKm = haversineKm(pool.location, farmer.location);
        const availableKg = 5000 + Math.round(farmer.reputation * 2000);
        const quantityFit = Math.min(100, Math.round((availableKg / pool.targetKg) * 100));
        const priceFit = Math.round(Math.min(100, farmer.reputation * 20));
        const trust = Math.round(farmer.reputation * 20);
        return {
          id: `${pool.id}-${farmer.id}`,
          poolId: pool.id,
          poolLabel: `${pool.wasteType.replace("_", " ")} · ${pool.village}`,
          farmer,
          distanceKm,
          availableKg,
          quantityFit,
          priceFit,
          trust,
          pastDeals: Math.max(0, Math.round(farmer.reputation * 2) - 2),
          score: Math.round(quantityFit * 0.35 + trust * 0.35 + Math.max(0, 100 - distanceKm) * 0.3),
        };
      })
    );
  },
};
