import { useEffect, useMemo, useState, useRef } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  Layers,
  MapPin,
  Play,
  RotateCcw,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  computeAllFarmerPathsToHub,
  GOA_GRAPH_NODES,
  GOA_ROAD_EDGES,
  type GraphNode,
} from "@/lib/dijkstra";

// GPS Bounding Box for Goa Road Network
const BOUNDS = {
  minLat: 15.22,
  maxLat: 15.64,
  minLng: 73.76,
  maxLng: 74.06,
};

// Converts GPS (lat, lng) to SVG 2D Canvas coordinate space (width: 700, height: 500)
function projectCoords(lat: number, lng: number, width = 700, height = 520) {
  const padding = 55;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  // Lng maps to X (West to East)
  const x = padding + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * usableWidth;
  // Lat maps to Y (North to South, so invert Y)
  const y = height - padding - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * usableHeight;

  return { x: Math.round(x), y: Math.round(y) };
}

export function DijkstraPoolMap({
  className,
  onSelectFarmer,
  selectedFarmerId,
}: {
  className?: string;
  onSelectFarmer?: (farmerId: string) => void;
  selectedFarmerId?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [activeStep, setActiveStep] = useState<number>(3); // 0: Graph Init, 1: Explore, 2: Shortest Path, 3: Completed Delivery
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);
  const [showMathDetails, setShowMathDetails] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Compute all 4 Dijkstra shortest paths from the 4 farmers to the central hub
  const farmerRoutes = useMemo(() => computeAllFarmerPathsToHub(), []);
  const hubNode = GOA_GRAPH_NODES["verna_hub"];
  const totalBiomass = farmerRoutes.reduce((s, r) => s + r.committedKg, 0);
  const totalCombinedDistance = farmerRoutes.reduce((s, r) => s + r.totalDistanceKm, 0);

  // Smooth Animation Loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    let start: number | null = null;
    const duration = 6500; // 6.5s smooth loop

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const linearProgress = (elapsed % duration) / duration;

      setProgress(linearProgress);
      if (linearProgress < 0.25) setActiveStep(0);
      else if (linearProgress < 0.55) setActiveStep(1);
      else if (linearProgress < 0.85) setActiveStep(2);
      else setActiveStep(3);

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const handleRestart = () => {
    setProgress(0);
    setActiveStep(0);
    setIsPlaying(true);
  };

  // Projected nodes
  const projectedNodes = useMemo(() => {
    const map: Record<string, { x: number; y: number; node: GraphNode }> = {};
    Object.values(GOA_GRAPH_NODES).forEach((node) => {
      const { x, y } = projectCoords(node.lat, node.lng);
      map[node.id] = { x, y, node };
    });
    return map;
  }, []);

  // Compute intermediate moving truck positions along each farmer's Dijkstra path
  const movingTrucks = useMemo(() => {
    return farmerRoutes.map((route) => {
      const nodes = route.pathNodes;
      if (nodes.length < 2) return null;

      // Segment index based on progress
      const numSegments = nodes.length - 1;
      const scaledProgress = Math.min(1, Math.max(0, (progress - 0.25) / 0.7)); // moves between 25% and 95% progress
      const totalProg = scaledProgress * numSegments;
      const segIndex = Math.min(numSegments - 1, Math.floor(totalProg));
      const segFraction = totalProg - segIndex;

      const n1 = projectedNodes[nodes[segIndex].id];
      const n2 = projectedNodes[nodes[segIndex + 1].id];

      if (!n1 || !n2) return null;

      const currentX = n1.x + (n2.x - n1.x) * segFraction;
      const currentY = n1.y + (n2.y - n1.y) * segFraction;

      return {
        farmerId: route.farmerId,
        farmerName: route.farmerName,
        color: route.color,
        x: currentX,
        y: currentY,
      };
    });
  }, [farmerRoutes, progress, projectedNodes]);

  return (
    <Card className={cn("overflow-hidden border-forest/20 bg-white/95 backdrop-blur-md shadow-card dark:bg-portal-surface p-0", className)}>
      {/* Header bar with live Dijkstra algorithm status */}
      <div className="bg-gradient-to-r from-[#0E4D2F] via-[#153D2A] to-[#1E3B2B] px-4 py-3.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <Cpu className="h-4 w-4 text-[#78E0A0]" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78E0A0]">Dijkstra Shortest-Path Logistics</span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" /> 4 Farmers Pooled
                </span>
              </div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-white">
                Goa Central Hub Aggregation Network
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-xs font-bold text-white hover:bg-white/10 hover:text-white h-8 px-2.5"
            >
              <Play className={cn("h-3.5 w-3.5 mr-1", isPlaying && "text-[#78E0A0]")} />
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white h-8 px-2"
              title="Restart Dijkstra Routing Animation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full overflow-hidden bg-slate-900" style={{ minHeight: "440px" }}>
        {/* Subtle Map Grid / Cartographic Backdrop */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Soft Coastal Water Gradient for Goa */}
        <div className="pointer-events-none absolute -left-12 top-0 bottom-0 w-36 bg-gradient-to-r from-blue-950/60 to-transparent" />

        <svg
          viewBox="0 0 700 520"
          className="w-full h-full select-none"
          style={{ maxHeight: "500px" }}
        >
          <defs>
            {/* Glowing filter for shortest paths */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Pulse animation gradients */}
            <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D96B27" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* 1. Base Road Network (All Graph Edges) */}
          <g id="base-network" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" opacity="0.65">
            {GOA_ROAD_EDGES.map((edge, idx) => {
              const p1 = projectedNodes[edge.from];
              const p2 = projectedNodes[edge.to];
              if (!p1 || !p2) return null;
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                />
              );
            })}
          </g>

          {/* 2. Dijkstra Computed Shortest Paths for all 4 Farmers */}
          <g id="dijkstra-shortest-paths">
            {farmerRoutes.map((route, rIdx) => {
              const isSelected = selectedPathIndex === null || selectedPathIndex === rIdx;
              const pathOpacity = isSelected ? 1 : 0.2;
              const points = route.pathNodes
                .map((n) => {
                  const p = projectedNodes[n.id];
                  return `${p.x},${p.y}`;
                })
                .join(" ");

              return (
                <g key={`path-${route.farmerId}`} opacity={pathOpacity} className="transition-opacity duration-300">
                  {/* Outer Glow */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.35"
                    filter="url(#glow)"
                  />
                  {/* Inner Solid Path */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Moving Dash Pulse along the Shortest Path */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="8 14"
                    strokeDashoffset={-progress * 120}
                    opacity="0.85"
                  />
                </g>
              );
            })}
          </g>

          {/* 3. Road Junction / Waypoint Nodes */}
          <g id="junction-nodes">
            {Object.values(GOA_GRAPH_NODES)
              .filter((n) => n.role === "junction")
              .map((node) => {
                const { x, y } = projectedNodes[node.id];
                return (
                  <g key={node.id}>
                    <circle cx={x} cy={y} r="4.5" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
                    <text
                      x={x + 7}
                      y={y + 3}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="sans-serif"
                      fontWeight="500"
                    >
                      {node.village}
                    </text>
                  </g>
                );
              })}
          </g>

          {/* 4. The 4 Contributing Farmer Locations */}
          <g id="farmer-nodes">
            {farmerRoutes.map((route, idx) => {
              const p = projectedNodes[route.farmerId];
              const isSelected = selectedPathIndex === null || selectedPathIndex === idx;

              return (
                <g
                  key={route.farmerId}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => {
                    setSelectedPathIndex(selectedPathIndex === idx ? null : idx);
                    if (onSelectFarmer) onSelectFarmer(route.farmerId);
                  }}
                >
                  {/* Pulsing Target Ring */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="16"
                    fill={route.color}
                    opacity="0.2"
                    className="animate-ping"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill="#0F172A"
                    stroke={route.color}
                    strokeWidth="2.5"
                  />
                  {/* Number Badge */}
                  <text
                    x={p.x}
                    y={p.y + 3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {idx + 1}
                  </text>

                  {/* Farmer Info Label Card */}
                  <g transform={`translate(${p.x < 350 ? p.x + 16 : p.x - 110}, ${p.y - 12})`}>
                    <rect
                      width="100"
                      height="30"
                      rx="6"
                      fill="#0F172A"
                      stroke={route.color}
                      strokeWidth="1.2"
                      opacity="0.92"
                    />
                    <text x="7" y="12" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      {route.farmerName}
                    </text>
                    <text x="7" y="23" fill={route.color} fontSize="8" fontWeight="600" fontFamily="sans-serif">
                      {route.village} · {(route.committedKg / 1000).toFixed(0)}T ({route.totalDistanceKm}km)
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 5. Central Collection Hub in the Middle (Verna Depot) */}
          <g id="central-hub-node">
            {(() => {
              const hub = projectedNodes["verna_hub"];
              return (
                <g>
                  {/* Concentric Glow Waves */}
                  <circle cx={hub.x} cy={hub.y} r="26" fill="#D96B27" opacity="0.15" className="animate-pulse" />
                  <circle cx={hub.x} cy={hub.y} r="18" fill="#D96B27" opacity="0.3" />
                  <circle cx={hub.x} cy={hub.y} r="12" fill="url(#hubGradient)" stroke="#ffffff" strokeWidth="2.5" />

                  {/* Hub Marker Icon */}
                  <circle cx={hub.x} cy={hub.y} r="4" fill="#ffffff" />

                  {/* Collection Point Prominent Banner */}
                  <g transform={`translate(${hub.x - 70}, ${hub.y + 18})`}>
                    <rect
                      width="140"
                      height="34"
                      rx="8"
                      fill="#0F172A"
                      stroke="#D96B27"
                      strokeWidth="2"
                      filter="url(#glow)"
                    />
                    <text
                      x="70"
                      y="14"
                      textAnchor="middle"
                      fill="#FDE68A"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      ★ CENTRAL COLLECTION POINT
                    </text>
                    <text
                      x="70"
                      y="26"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="600"
                      fontFamily="sans-serif"
                    >
                      Verna Weighbridge Hub (Middle)
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>

          {/* 6. Moving Trucks / Cargo Delivery Along Dijkstra Shortest Paths */}
          <g id="moving-trucks">
            {movingTrucks.map((truck) => {
              if (!truck) return null;
              return (
                <g key={`truck-${truck.farmerId}`} transform={`translate(${truck.x - 8}, ${truck.y - 8})`}>
                  <rect
                    width="16"
                    height="16"
                    rx="4"
                    fill={truck.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="shadow-sm"
                  />
                  {/* Tiny Cargo Truck Silhouette */}
                  <path
                    d="M3 10V6h6v4M9 8h2l2 2v2H3v-2"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Algorithm Step Badge on Map */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <div className="rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#78E0A0] animate-pulse" />
            <span>
              {activeStep === 0 && "1. Building Graph & Setting Priority Queue"}
              {activeStep === 1 && "2. Relaxing Edges (min tentative dist)"}
              {activeStep === 2 && "3. Locking Shortest Dijkstra Paths"}
              {activeStep === 3 && "4. Residue In-Transit to Verna Depot"}
            </span>
          </div>
        </div>

        {/* Floating Quick Legend */}
        <div className="absolute bottom-3 right-3 rounded-lg border border-white/15 bg-black/70 px-3 py-2 backdrop-blur-md text-[10px] text-white/90 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D96B27]" />
              <strong className="text-white">Central Hub (Verna)</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
              <span>4 Farmers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              <span>Goa Junctions</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Contributing Farmers Breakdown Cards */}
      <div className="p-4 border-t border-line/80 dark:border-portal-line bg-canvas/40 dark:bg-portal-bg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted dark:text-portal-muted flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-forest" />
            <span>4 Contributing Farmers · Dijkstra Shortest Routes</span>
          </p>
          <span className="text-xs font-bold text-forest dark:text-growth">
            Total Target: 40,000 kg (100% Pooled)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {farmerRoutes.map((route, idx) => {
            const isSelected = selectedPathIndex === idx;
            return (
              <button
                key={route.farmerId}
                type="button"
                onClick={() => setSelectedPathIndex(isSelected ? null : idx)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                  isSelected
                    ? "border-forest bg-meadow text-forest shadow-sm dark:bg-[#123524] dark:text-growth"
                    : "border-line bg-surface hover:bg-canvas text-ink dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[10px] font-bold"
                    style={{ backgroundColor: route.color }}
                  >
                    {idx + 1}
                  </span>
                  <span className="num text-[11px] font-bold text-forest dark:text-growth">
                    {route.totalDistanceKm} km
                  </span>
                </div>
                <p className="font-bold text-xs truncate">{route.farmerName}</p>
                <p className="text-[11px] text-muted dark:text-portal-muted">{route.village}</p>
                <div className="mt-2 pt-1.5 border-t border-line/50 flex items-center justify-between text-[11px]">
                  <span className="text-muted">Pledged:</span>
                  <strong className="num font-bold text-ink dark:text-portal-ink">{route.committedKg.toLocaleString()} kg</strong>
                </div>
              </button>
            );
          })}
        </div>

        {/* Collapsible Dijkstra Technical Proof Toggle */}
        <div className="mt-3 pt-3 border-t border-line/60 flex items-center justify-between">
          <p className="text-xs text-muted dark:text-portal-muted">
            <strong className="text-ink dark:text-portal-ink">Dijkstra Guarantee:</strong> Routes minimize fuel burn and queuing at the central Verna weighbridge.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMathDetails(!showMathDetails)}
            className="text-xs font-bold text-forest dark:text-growth"
          >
            {showMathDetails ? "Hide Route Details" : "View Route Sequences & Distances →"}
          </Button>
        </div>

        {showMathDetails && (
          <div className="mt-3 rounded-xl border border-line bg-canvas p-3 text-xs space-y-2 dark:border-portal-line dark:bg-portal-surface">
            <p className="font-bold text-ink dark:text-portal-ink flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-settle" />
              <span>Dijkstra Shortest Path Computation Matrix:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {farmerRoutes.map((r, i) => (
                <div key={r.farmerId} className="p-2 rounded-lg bg-surface border border-line/60 dark:border-portal-line">
                  <p className="font-bold text-ink dark:text-portal-ink">
                    Farmer {i + 1}: {r.farmerName} ({r.village})
                  </p>
                  <p className="text-muted dark:text-portal-muted mt-0.5">
                    Path: {r.pathNodes.map((n) => n.village).join(" → ")}
                  </p>
                  <p className="text-forest dark:text-growth font-semibold mt-0.5">
                    Shortest Distance: {r.totalDistanceKm} km
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
