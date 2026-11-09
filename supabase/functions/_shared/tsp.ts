import type { LatLng } from "./hex.ts";

export interface RouteStop {
  id: string;
  name: string;
  location: LatLng;
  quantityKg?: number;
}

export interface RouteResult {
  order: RouteStop[];
  totalKm: number;
}

export interface PartitionedRoute {
  vehicleIndex: number;
  stops: RouteStop[];
  totalKg: number;
  totalKm: number;
}

const R = 6371; // Earth radius in km

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Nearest-neighbour TSP tour.
 * Matches frontend src/lib/tsp.ts
 */
export function nearestNeighbourRoute(
  start: LatLng,
  stops: RouteStop[]
): RouteResult {
  const remaining = [...stops];
  const order: RouteStop[] = [];
  let current = start;
  let totalKm = 0;

  while (remaining.length > 0) {
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

/**
 * 2-opt local search heuristic to untangle route crossings.
 */
export function twoOptOptimization(
  start: LatLng,
  stops: RouteStop[]
): RouteResult {
  if (stops.length <= 2) {
    return nearestNeighbourRoute(start, stops);
  }

  const initial = nearestNeighbourRoute(start, stops);
  let tour = [...initial.order];
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  function calculateDistance(points: RouteStop[]): number {
    let dist = 0;
    let curr = start;
    for (const p of points) {
      dist += haversineKm(curr, p.location);
      curr = p.location;
    }
    return dist;
  }

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < tour.length - 1; i++) {
      for (let k = i + 1; k < tour.length; k++) {
        const newTour = [
          ...tour.slice(0, i),
          ...tour.slice(i, k + 1).reverse(),
          ...tour.slice(k + 1),
        ];

        if (calculateDistance(newTour) < calculateDistance(tour) - 1e-4) {
          tour = newTour;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return {
    order: tour,
    totalKm: calculateDistance(tour),
  };
}

/**
 * Partition collection stops into multiple vehicle runs by maximum vehicle capacity.
 * E.g., vehicleCapacityKg = 5000 (5 tonnes).
 */
export function partitionRouteByCapacity(
  start: LatLng,
  stops: RouteStop[],
  vehicleCapacityKg = 5000
): PartitionedRoute[] {
  // Sort or sequence stops by 2-opt first
  const { order } = twoOptOptimization(start, stops);

  const partitions: PartitionedRoute[] = [];
  let currentBatch: RouteStop[] = [];
  let currentKg = 0;
  let vehicleIdx = 1;

  for (const stop of order) {
    const qty = stop.quantityKg ?? 0;
    if (currentKg + qty > vehicleCapacityKg && currentBatch.length > 0) {
      const routeRes = twoOptOptimization(start, currentBatch);
      partitions.push({
        vehicleIndex: vehicleIdx++,
        stops: routeRes.order,
        totalKg: currentKg,
        totalKm: routeRes.totalKm,
      });
      currentBatch = [];
      currentKg = 0;
    }
    currentBatch.push(stop);
    currentKg += qty;
  }

  if (currentBatch.length > 0) {
    const routeRes = twoOptOptimization(start, currentBatch);
    partitions.push({
      vehicleIndex: vehicleIdx,
      stops: routeRes.order,
      totalKg: currentKg,
      totalKm: routeRes.totalKm,
    });
  }

  return partitions;
}

