import type { LatLng } from "@/types";

export interface HexCell {
  id: string;
  ring: 1 | 2;
  center: LatLng;
  polygon: LatLng[];
}

const KM_PER_DEG_LAT = 111.32;

/**
 * Generate a two-ring flat-top hex grid around a centre point.
 * Geometry is generated locally so no H3 dependency is needed.
 * ring 1 = initial notification area, ring 2 = expansion area.
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
      cells.push({
        id: `hex-${q}-${r}`,
        ring: ring === 1 ? 1 : 2,
        center: cellCenter,
        polygon,
      });
    }
  }
  return cells;
}

/** Deterministic farmer count for a hex, seeded by its id. */
export function farmersInHex(id: string, ring: 1 | 2) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const base = ring === 1 ? 9 : 5;
  return base + (h % (ring === 1 ? 18 : 22));
}
