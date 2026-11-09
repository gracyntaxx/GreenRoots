import type { Listing, ListingDraft, Profile, QtyUnit, WasteType } from "@/types";
import { call } from "./http";
import {
  addListing,
  deleteListing,
  findProfile,
  getState,
  MockError,
  updateListing,
} from "@/mocks/store";
import { haversineKm } from "@/lib/geo";
import { KG_PER_UNIT } from "@/lib/units";

export interface ListingFilters {
  q?: string;
  wasteType?: WasteType | "all";
  maxDistanceKm?: number;
  minQtyKg?: number;
  maxQtyKg?: number;
  maxRatePerKg?: number;
  collectionPointId?: string;
  sort?: "nearest" | "price" | "trusted";
  farmerId?: string;
  status?: Listing["status"] | "all";
}

export interface ListingWithDistance extends Listing {
  distanceKm: number;
  ratePerKg: number;
}

function decorate(l: Listing, origin: Profile): ListingWithDistance {
  return {
    ...l,
    distanceKm: haversineKm(origin.location, l.location),
    ratePerKg: l.ratePerUnit / KG_PER_UNIT[l.rateUnit],
  };
}

export const listingService = {
  list(filters: ListingFilters, origin: Profile): Promise<ListingWithDistance[]> {
    return call("listings/list", { method: "POST", body: JSON.stringify(filters) }, () => {
      const all = getState().listings;
      let rows = all.map((l) => decorate(l, origin));
      if (filters.farmerId) rows = rows.filter((l) => l.farmerId === filters.farmerId);
      if (filters.status && filters.status !== "all") rows = rows.filter((l) => l.status === filters.status);
      if (filters.wasteType && filters.wasteType !== "all") rows = rows.filter((l) => l.wasteType === filters.wasteType);
      if (filters.q) {
        const q = filters.q.toLowerCase();
        rows = rows.filter(
          (l) =>
            l.wasteType.replace("_", " ").includes(q) ||
            l.farmerName.toLowerCase().includes(q) ||
            l.village.toLowerCase().includes(q)
        );
      }
      if (filters.maxDistanceKm) rows = rows.filter((l) => l.distanceKm <= filters.maxDistanceKm!);
      if (filters.minQtyKg) rows = rows.filter((l) => l.quantityKg >= filters.minQtyKg!);
      if (filters.maxQtyKg) rows = rows.filter((l) => l.quantityKg <= filters.maxQtyKg!);
      if (filters.maxRatePerKg) rows = rows.filter((l) => l.ratePerKg <= filters.maxRatePerKg!);
      if (filters.collectionPointId) rows = rows.filter((l) => l.collectionPointId === filters.collectionPointId);
      switch (filters.sort) {
        case "price":
          rows.sort((a, b) => a.ratePerKg - b.ratePerKg);
          break;
        case "trusted":
          rows.sort((a, b) => b.farmerReputation - a.farmerReputation);
          break;
        default:
          rows.sort((a, b) => a.distanceKm - b.distanceKm);
      }
      return rows;
    });
  },

  get(id: string, origin: Profile): Promise<ListingWithDistance> {
    return call(`listings/get?id=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ id, origin: origin.location }) }, () => {
      const l = getState().listings.find((x) => x.id === id);
      if (!l) throw new MockError("Listing not found", "NOT_FOUND");
      return decorate(l, origin);
    });
  },

  create(farmer: Profile, draft: ListingDraft, collectionPointId: string): Promise<Listing> {
    return call("listings/create", { method: "POST", body: JSON.stringify({ farmer, draft, collectionPointId }) }, () => {
      if (!draft.wasteType || !draft.quantity || !draft.rate) {
        throw new MockError("Some required details are missing.", "VALIDATION");
      }
      if (draft.quantity <= 0) throw new MockError("Quantity must be more than zero.", "VALIDATION");
      return addListing({ farmer, draft, collectionPointId });
    }, { mutation: true });
  },

  update(id: string, patch: Partial<Pick<Listing, "quantityKg" | "ratePerUnit" | "rateUnit" | "status" | "notes">>): Promise<Listing> {
    return call("listings/update", { method: "POST", body: JSON.stringify({ id, patch }) }, () => updateListing(id, patch), { mutation: true });
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return call("listings/delete", { method: "POST", body: JSON.stringify({ id }) }, () => deleteListing(id), { mutation: true });
  },

  /** Grounded AI picks: only real listing records, ranked with visible reasons. */
  recommend(origin: Profile): Promise<{ listing: ListingWithDistance; reason: string }[]> {
    return call("listings/recommend", { method: "POST", body: JSON.stringify({ origin: origin.location }) }, () => {
      const rows = getState().listings
        .filter((l) => l.status === "Active" && l.farmerId !== origin.id)
        .map((l) => decorate(l, origin));
      const ranked = rows
        .map((l) => {
          const distanceScore = Math.max(0, 40 - l.distanceKm);
          const trustScore = l.farmerReputation * 8;
          const priceScore = Math.max(0, 30 - l.ratePerKg);
          return { l, score: distanceScore + trustScore + priceScore };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      return ranked.map(({ l }, i) => ({
        listing: l,
        reason:
          i === 0
            ? `Nearest active listing (${l.distanceKm.toFixed(0)} km) with a trusted seller.`
            : i === 1
            ? `Good price at ₹${l.ratePerKg.toFixed(0)}/kg, ${l.distanceKm.toFixed(0)} km away.`
            : `Reliable seller rated ${l.farmerReputation.toFixed(1)} with similar past deals.`,
      }));
    });
  },

  ratePerKg(l: Listing) {
    return l.ratePerUnit / KG_PER_UNIT[l.rateUnit];
  },

  rateForUnit(ratePerKg: number, unit: QtyUnit) {
    return Math.round(ratePerKg * KG_PER_UNIT[unit]);
  },
};
