export interface LatLng {
  lat: number;
  lng: number;
}

export interface HexCell {
  id: string;
  ring: 1 | 2;
  center: LatLng;
  polygon: LatLng[];
  farmerCount?: number;
}

export const KM_PER_DEG_LAT = 111.32;

/**
 * Convert lat/lng to axial hex coordinates (q, r).
 */
export function latLngToAxial(
  point: LatLng,
  origin: LatLng,
  hexRadiusKm: number
): { q: number; r: number } {
  const kmPerDegLng = KM_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180);
  const x = (point.lng - origin.lng) * kmPerDegLng;
  const y = (point.lat - origin.lat) * KM_PER_DEG_LAT;

  const dx = hexRadiusKm * 1.5;
  const dy = hexRadiusKm * Math.sqrt(3);

  const q = Math.round(x / dx);
  const r = Math.round((y / dy) - (q / 2));
  return { q, r };
}

/**
 * Generate a flat-top hex grid of rings around a center point.
 * Matches frontend src/lib/hex.ts
 */
export function generateHexGrid(
  center: LatLng,
  hexRadiusKm: number,
  rings = 2
): HexCell[] {
  const cells: HexCell[] = [];
  const kmPerDegLng = KM_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180);
  const dx = hexRadiusKm * 1.5;
  const dy = hexRadiusKm * Math.sqrt(3);

  const axialToXY = (q: number, r: number) => ({
    x: dx * q,
    y: dy * (r + q / 2),
  });

  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      const s = -q - r;
      if (Math.abs(s) > rings) continue;
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (ring === 0) continue;
      const { x, y } = axialToXY(q, r);
      const cellCenter: LatLng = {
        lat: center.lat + y / KM_PER_DEG_LAT,
        lng: center.lng + x / kmPerDegLng,
      };
      const polygon: LatLng[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i);
        const px = hexRadiusKm * Math.cos(angle);
        const py = hexRadiusKm * Math.sin(angle);
        polygon.push({
          lat: cellCenter.lat + py / KM_PER_DEG_LAT,
          lng: cellCenter.lng + px / kmPerDegLng,
        });
      }
      const cellRing = ring === 1 ? 1 : 2;
      const id = `hex-${q}-${r}`;
      cells.push({
        id,
        ring: cellRing,
        center: cellCenter,
        polygon,
        farmerCount: farmersInHex(id, cellRing),
      });
    }
  }
  return cells;
}

/**
 * Deterministic farmer count for a hex cell, seeded by its id.
 * Matches frontend src/lib/hex.ts exactly.
 */
export function farmersInHex(id: string, ring: 1 | 2): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const base = ring === 1 ? 9 : 5;
  return base + (h % (ring === 1 ? 18 : 22));
}

/**
 * Returns ring 1 (default notification radius) or ring 2 (expanded radius) cells.
 */
export function getHexRing(
  center: LatLng,
  hexRadiusKm: number,
  ringTarget: 1 | 2
): HexCell[] {
  return generateHexGrid(center, hexRadiusKm, 2).filter((c) => c.ring === ringTarget);
}

