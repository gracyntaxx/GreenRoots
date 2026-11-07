import type { LatLng } from "@/types";
import { haversineKm } from "./geo";

export interface RouteStop {
  id: string;
  name: string;
  location: LatLng;
}

export interface RouteResult {
  order: RouteStop[];
  totalKm: number;
}

/** Simple nearest-neighbour route from a start point. Deterministic and local. */
export function nearestNeighbourRoute(start: LatLng, stops: RouteStop[]): RouteResult {
  const remaining = [...stops];
  const order: RouteStop[] = [];
  let current = start;
  let totalKm = 0;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(current, s.location);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    totalKm += bestDist;
    order.push(next);
    current = next.location;
  }
  return { order, totalKm };
}
