export interface GraphNode {
  id: string;
  name: string;
  role: "farmer" | "hub" | "junction";
  village: string;
  lat: number;
  lng: number;
  committedKg?: number;
  farmerName?: string;
  color?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  distanceKm: number;
  roadName: string;
}

export interface DijkstraStep {
  currentNode: string;
  neighbor: string;
  tentativeDistance: number;
  previousBest: number;
  updated: boolean;
}

export interface DijkstraResult {
  path: string[];
  totalDistanceKm: number;
  visitedOrder: string[];
  steps: DijkstraStep[];
  nodeDistances: Record<string, number>;
}

// 1. Centralized Goa Road Network Graph
export const GOA_GRAPH_NODES: Record<string, GraphNode> = {
  // Central Collection Hub in the middle
  verna_hub: {
    id: "verna_hub",
    name: "Verna Central Weighbridge Depot",
    role: "hub",
    village: "Verna (Central Hub)",
    lat: 15.3614,
    lng: 73.9312,
    color: "#D96B27", // terracotta / brand primary
  },

  // The 4 Contributing Farmers
  farmer_vasco: {
    id: "farmer_vasco",
    name: "Sunita Devi Farm",
    farmerName: "Sunita Devi",
    role: "farmer",
    village: "Vasco da Gama",
    lat: 15.3982,
    lng: 73.8113,
    committedKg: 10000,
    color: "#10B981", // Emerald
  },
  farmer_margao: {
    id: "farmer_margao",
    name: "Ramesh Yadav Farm",
    farmerName: "Ramesh Yadav",
    role: "farmer",
    village: "Margao",
    lat: 15.2736,
    lng: 73.9580,
    committedKg: 12000,
    color: "#F59E0B", // Amber
  },
  farmer_panjim: {
    id: "farmer_panjim",
    name: "Fatima Begum Farm",
    farmerName: "Fatima Begum",
    role: "farmer",
    village: "Panjim",
    lat: 15.4909,
    lng: 73.8278,
    committedKg: 8000,
    color: "#3B82F6", // Blue
  },
  farmer_mapusa: {
    id: "farmer_mapusa",
    name: "Rajesh Kumar Farm",
    farmerName: "Rajesh Kumar",
    role: "farmer",
    village: "Mapusa",
    lat: 15.5937,
    lng: 73.8142,
    committedKg: 10000,
    color: "#8B5CF6", // Purple
  },

  // Intermediate Road Junctions / Waypoints
  cortalim: {
    id: "cortalim",
    name: "Cortalim Junction",
    role: "junction",
    village: "Cortalim",
    lat: 15.3900,
    lng: 73.9050,
  },
  agassaim: {
    id: "agassaim",
    name: "Agassaim Zuari Bridge",
    role: "junction",
    village: "Agassaim",
    lat: 15.4180,
    lng: 73.9100,
  },
  bambolim: {
    id: "bambolim",
    name: "Bambolim Cross",
    role: "junction",
    village: "Bambolim",
    lat: 15.4550,
    lng: 73.8600,
  },
  nuvem: {
    id: "nuvem",
    name: "Nuvem Highway Bypass",
    role: "junction",
    village: "Nuvem",
    lat: 15.3150,
    lng: 73.9350,
  },
  porvorim: {
    id: "porvorim",
    name: "Porvorim Crossing",
    role: "junction",
    village: "Porvorim",
    lat: 15.5350,
    lng: 73.8288,
  },
  ponda: {
    id: "ponda",
    name: "Ponda Junction",
    role: "junction",
    village: "Ponda",
    lat: 15.4026,
    lng: 74.0086,
  },
  borim: {
    id: "borim",
    name: "Borim Zuari Crossing",
    role: "junction",
    village: "Borim",
    lat: 15.3400,
    lng: 74.0100,
  },
};

// 2. Road Network Segments with Realistic Weights (Kilometers)
export const GOA_ROAD_EDGES: GraphEdge[] = [
  // From Vasco (Farmer 1)
  { from: "farmer_vasco", to: "cortalim", distanceKm: 10.5, roadName: "NH 366 (Airport Highway)" },
  { from: "farmer_vasco", to: "nuvem", distanceKm: 17.5, roadName: "MDR 43 (Old Coast Road)" },

  // From Margao (Farmer 2)
  { from: "farmer_margao", to: "nuvem", distanceKm: 5.2, roadName: "NH 66 (Margao North Link)" },
  { from: "farmer_margao", to: "cortalim", distanceKm: 14.0, roadName: "NH 66 Bypass" },
  { from: "farmer_margao", to: "borim", distanceKm: 11.2, roadName: "SH 7 (Margao-Ponda Link)" },

  // From Panjim (Farmer 3)
  { from: "farmer_panjim", to: "bambolim", distanceKm: 5.1, roadName: "NH 66 (GMC Highway)" },
  { from: "bambolim", to: "agassaim", distanceKm: 5.2, roadName: "NH 66 (Zuari Southbound)" },
  { from: "agassaim", to: "cortalim", distanceKm: 3.8, roadName: "New Zuari Bridge" },

  // From Mapusa (Farmer 4)
  { from: "farmer_mapusa", to: "porvorim", distanceKm: 7.2, roadName: "NH 66 (North Corridor)" },
  { from: "porvorim", to: "farmer_panjim", distanceKm: 4.8, roadName: "Mandovi Bridge Link" },

  // Towards Central Collection Hub (Verna)
  { from: "cortalim", to: "verna_hub", distanceKm: 4.3, roadName: "NH 66 (Verna Slope)" },
  { from: "nuvem", to: "verna_hub", distanceKm: 4.2, roadName: "NH 66 (Verna Industrial Link)" },
  { from: "borim", to: "verna_hub", distanceKm: 8.5, roadName: "Verna-Raia Link" },

  // Cross-network bypasses
  { from: "ponda", to: "borim", distanceKm: 7.0, roadName: "Ponda-Borim Expressway" },
  { from: "ponda", to: "cortalim", distanceKm: 12.0, roadName: "SH 7 East-West Axis" },
];

/**
 * Standard Dijkstra Shortest Path Algorithm
 * Evaluates the road graph using priority extraction and edge relaxation
 */
export function runDijkstra(
  startNodeId: string,
  targetNodeId: string,
  nodes: Record<string, GraphNode> = GOA_GRAPH_NODES,
  edges: GraphEdge[] = GOA_ROAD_EDGES
): DijkstraResult {
  // Build adjacency list (bi-directional road network)
  const adjacency = new Map<string, Array<{ to: string; weight: number }>>();
  Object.keys(nodes).forEach((n) => adjacency.set(n, []));

  edges.forEach((e) => {
    adjacency.get(e.from)?.push({ to: e.to, weight: e.distanceKm });
    adjacency.get(e.to)?.push({ to: e.from, weight: e.distanceKm });
  });

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visitedOrder: string[] = [];
  const steps: DijkstraStep[] = [];
  const unvisited = new Set<string>();

  Object.keys(nodes).forEach((nodeId) => {
    distances[nodeId] = nodeId === startNodeId ? 0 : Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  });

  while (unvisited.size > 0) {
    // Find unvisited node with minimal tentative distance
    let current: string | null = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (!current || minDistance === Infinity) break;
    unvisited.delete(current);
    visitedOrder.push(current);

    if (current === targetNodeId) break;

    const neighbors = adjacency.get(current) || [];
    for (const { to: neighbor, weight } of neighbors) {
      if (!unvisited.has(neighbor)) continue;

      const alt = distances[current] + weight;
      const prevBest = distances[neighbor];
      const updated = alt < prevBest;

      steps.push({
        currentNode: current,
        neighbor,
        tentativeDistance: Number(alt.toFixed(1)),
        previousBest: prevBest === Infinity ? 999 : Number(prevBest.toFixed(1)),
        updated,
      });

      if (updated) {
        distances[neighbor] = Number(alt.toFixed(1));
        previous[neighbor] = current;
      }
    }
  }

  // Reconstruct shortest path from start to target
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  // If start is not connected to target
  const isConnected = path[0] === startNodeId;
  return {
    path: isConnected ? path : [],
    totalDistanceKm: isConnected ? distances[targetNodeId] : 0,
    visitedOrder,
    steps,
    nodeDistances: distances,
  };
}

/**
 * Computes optimal Dijkstra shortest paths for all 4 contributing farmers
 * to the central collection hub.
 */
export function computeAllFarmerPathsToHub() {
  const farmerIds = ["farmer_vasco", "farmer_margao", "farmer_panjim", "farmer_mapusa"];
  const hubId = "verna_hub";

  return farmerIds.map((fId) => {
    const res = runDijkstra(fId, hubId);
    const farmer = GOA_GRAPH_NODES[fId];
    return {
      farmerId: fId,
      farmerName: farmer.farmerName ?? farmer.name,
      village: farmer.village,
      committedKg: farmer.committedKg ?? 0,
      color: farmer.color ?? "#10B981",
      path: res.path,
      pathNodes: res.path.map((id) => GOA_GRAPH_NODES[id]),
      totalDistanceKm: res.totalDistanceKm,
      steps: res.steps,
    };
  });
}
