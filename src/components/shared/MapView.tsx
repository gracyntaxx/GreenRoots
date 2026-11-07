import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Polyline, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/types";
import { cn } from "@/lib/utils";
import { farmersInHex, type HexCell } from "@/lib/hex";
import type { RouteStop } from "@/lib/tsp";

export interface MapMarker {
  id: string;
  location: LatLng;
  label: string;
  detail?: string;
  kind?: "farmer" | "industry" | "collection" | "pool";
}

const KIND_COLORS: Record<string, string> = {
  farmer: "#15803D",
  industry: "#003087",
  collection: "#F59E0B",
  pool: "#0070BA",
};

function Recenter({ center, zoom }: { center: LatLng; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom ?? map.getZoom());
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function ClickHandler({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapView({
  center,
  zoom = 10,
  markers = [],
  hexCells,
  route,
  height = 320,
  className,
  onMapClick,
  showLegend,
}: {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  hexCells?: HexCell[];
  route?: RouteStop[];
  height?: number;
  className?: string;
  onMapClick?: (p: LatLng) => void;
  showLegend?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-field border-[1.5px] border-line", className)} style={{ height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={false} attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} zoom={zoom} />
        {onMapClick && <ClickHandler onClick={onMapClick} />}
        {hexCells?.map((cell) => (
          <Polygon
            key={cell.id}
            positions={cell.polygon.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: cell.ring === 1 ? "#15803D" : "#003087",
              weight: cell.ring === 1 ? 1.5 : 1.2,
              fillColor: cell.ring === 1 ? "#22C55E" : "#0070BA",
              fillOpacity: cell.ring === 1 ? 0.18 : 0.07,
              dashArray: cell.ring === 2 ? "5 5" : undefined,
            }}
          >
            <Popup>
              <strong>{cell.ring === 1 ? "Initial area" : "Expansion area"}</strong>
              <br />
              {farmersInHex(cell.id, cell.ring)} farmers in this hex
            </Popup>
          </Polygon>
        ))}
        {route && route.length > 0 && (
          <Polyline
            positions={route.map((s) => [s.location.lat, s.location.lng])}
            pathOptions={{ color: "#0070BA", weight: 4, dashArray: "7 5" }}
          />
        )}
        {route?.map((stop, i) => (
          <CircleMarker
            key={`route-${stop.id}`}
            center={[stop.location.lat, stop.location.lng]}
            radius={11}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#0070BA", fillOpacity: 1 }}
          >
            <Popup>
              <strong>Stop {i + 1}</strong>
              <br />
              {stop.name}
            </Popup>
          </CircleMarker>
        ))}
        {markers.map((m) => (
          <CircleMarker
            key={m.id}
            center={[m.location.lat, m.location.lng]}
            radius={8}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: KIND_COLORS[m.kind ?? "farmer"],
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <strong>{m.label}</strong>
              {m.detail && (
                <>
                  <br />
                  {m.detail}
                </>
              )}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {showLegend && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[10px] font-semibold text-ink shadow">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-forest" /> Farmer</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-navy" /> Industry</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-settle" /> Collection</span>
          </div>
        </div>
      )}
    </div>
  );
}
