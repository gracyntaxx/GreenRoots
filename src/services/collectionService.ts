import type { CollectionPoint, LatLng, Profile } from "@/types";
import { call } from "./http";
import { getState, MockError } from "@/mocks/store";
import { haversineKm } from "@/lib/geo";

export interface CollectionPointWithDistance extends CollectionPoint {
  distanceKm: number;
}

export const collectionService = {
  list(origin: Profile): Promise<CollectionPointWithDistance[]> {
    return call("collection-points/list", { method: "POST", body: JSON.stringify({ origin: origin.location }) }, () =>
      getState()
        .collectionPoints.map((c) => ({ ...c, distanceKm: haversineKm(origin.location, c.location) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
    );
  },

  get(id: string): Promise<CollectionPoint> {
    return call(`collection-points/get?id=${encodeURIComponent(id)}`, undefined, () => {
      const c = getState().collectionPoints.find((x) => x.id === id);
      if (!c) throw new MockError("Collection point not found", "NOT_FOUND");
      return c;
    });
  },

  suggest(origin: Profile, destination?: LatLng): Promise<CollectionPointWithDistance> {
    return call("collection-points/suggest", { method: "POST", body: JSON.stringify({ origin: origin.location, destination }) }, () => {
      const target = destination ?? origin.location;
      const active = getState().collectionPoints.filter((c) => c.active);
      if (!active.length) throw new MockError("No active collection points nearby.", "NOT_FOUND");
      const ranked = active
        .map((c) => ({ ...c, distanceKm: haversineKm(target, c.location) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
      return ranked[0];
    });
  },

  save(point: Partial<CollectionPoint> & { id?: string }): Promise<CollectionPoint> {
    return call("collection-points/save", { method: "POST", body: JSON.stringify(point) }, () => {
      const state = getState();
      if (point.id) {
        const existing = state.collectionPoints.find((c) => c.id === point.id);
        if (!existing) throw new MockError("Collection point not found", "NOT_FOUND");
        Object.assign(existing, point);
        return existing;
      }
      const created: CollectionPoint = {
        id: `cp_${Date.now()}`,
        name: point.name ?? "New collection point",
        village: point.village ?? "",
        district: point.district ?? "",
        state: point.state ?? "",
        location: point.location ?? { lat: 28.61, lng: 77.2 },
        capacityTonnes: point.capacityTonnes ?? 50,
        hours: point.hours ?? "6:00 AM – 6:00 PM",
        active: point.active ?? true,
        dropOffsToday: 0,
      };
      state.collectionPoints.push(created);
      return created;
    }, { mutation: true });
  },
};
