export type Role = "farmer" | "buyer" | "industry" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  industry: "Industry",
  admin: "Admin",
};

export type WasteType =
  | "paddy_straw"
  | "wheat_straw"
  | "rice_husk"
  | "mustard_stubble"
  | "sugarcane_trash"
  | "cashew_shell"
  | "cotton_stalk"
  | "groundnut_shell"
  | "bagasse";

export const WASTE_LABELS: Record<WasteType, string> = {
  paddy_straw: "Paddy straw",
  wheat_straw: "Wheat straw",
  rice_husk: "Rice husk",
  mustard_stubble: "Mustard stubble",
  sugarcane_trash: "Sugarcane trash",
  cashew_shell: "Cashew shell",
  cotton_stalk: "Cotton stalk",
  groundnut_shell: "Groundnut shell",
  bagasse: "Bagasse",
};

export type QtyUnit = "kg" | "quintal" | "tonne";

export type FulfilmentStatus =
  | "Pending"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";

export type PaymentStatus =
  | "Initiated"
  | "Awaiting Approval"
  | "Approved"
  | "Captured"
  | "Failed"
  | "Cancelled"
  | "Refunded";

export type PayoutStatus =
  | "Not Yet Due"
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Simulated";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Profile {
  id: string;
  name: string;
  role: Role;
  phone?: string;
  email?: string;
  village: string;
  district: string;
  state: string;
  language: string;
  location: LatLng;
  reputation: number;
  reputationFactors: ReputationFactor[];
  payoutReadiness: "Ready" | "Not set up" | "Pending verification";
  verified: boolean;
  avatarInitials: string;
  joined: string;
}

export interface ReputationFactor {
  key: string;
  label: string;
  value: string;
  weight: number;
}

export interface IndustryVerification {
  id: string;
  industryId: string;
  businessName: string;
  licenseNumber: string;
  registeredAddress: string;
  contactPerson: string;
  documents: { name: string; type: string; uploadedAt: string }[];
  status: "Pending" | "Verified" | "Rejected";
  submittedAt: string;
  rejectionReason?: string;
}

export interface Listing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerVillage: string;
  farmerReputation: number;
  wasteType: WasteType;
  quantityKg: number;
  unit: QtyUnit;
  ratePerUnit: number;
  rateUnit: QtyUnit;
  location: LatLng;
  village: string;
  collectionPointId: string;
  status: "Active" | "Reserved" | "Sold" | "Paused";
  createdAt: string;
  updatedAt: string;
  source: "voice" | "text" | "manual";
  aiConfidence?: number;
  notes?: string;
}

export interface Requirement {
  id: string;
  industryId: string;
  industryName: string;
  industryVerified: boolean;
  wasteType: WasteType;
  targetKg: number;
  ratePerUnit: number;
  rateUnit: QtyUnit;
  deadline: string;
  location: LatLng;
  village: string;
  notes?: string;
  moisturePreference?: string;
  status: "Draft" | "Open" | "Fulfilled" | "Expired" | "Closed";
  createdAt: string;
  poolId: string;
}

export interface PoolContribution {
  id: string;
  poolId: string;
  farmerId: string;
  farmerName: string;
  farmerVillage: string;
  farmerReputation: number;
  committedKg: number;
  acceptedKg?: number;
  agreedRatePerKg: number;
  collectionPointId: string;
  fulfilment: FulfilmentStatus;
  payment: PaymentStatus;
  payout: PayoutStatus;
  createdAt: string;
}

export interface Pool {
  id: string;
  requirementId: string;
  industryId: string;
  industryName: string;
  industryVerified: boolean;
  wasteType: WasteType;
  targetKg: number;
  committedKg: number;
  ratePerUnit: number;
  rateUnit: QtyUnit;
  deadline: string;
  location: LatLng;
  village: string;
  status: "Open" | "Ready for Pickup" | "Settled" | "Expired";
  radiusKm: number;
  expanded: boolean;
  expandedToKm?: number;
  contributionCount: number;
  createdAt: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  village: string;
  district: string;
  state: string;
  location: LatLng;
  capacityTonnes: number;
  hours: string;
  active: boolean;
  dropOffsToday: number;
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  wasteType: WasteType;
  quantityKg: number;
  ratePerUnit: number;
  rateUnit: QtyUnit;
  totalAmount: number;
  collectionPointId: string;
  fulfilment: FulfilmentStatus;
  payment: PaymentStatus;
  payout: PayoutStatus;
  paypalOrderRef?: string;
  paypalCaptureRef?: string;
  createdAt: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  at: string;
  label: string;
  detail?: string;
  state: "done" | "current" | "upcoming" | "error";
}

export interface Payment {
  id: string;
  scope: "order" | "pool";
  referenceId: string;
  amount: number;
  status: PaymentStatus;
  paypalOrderRef: string;
  paypalCaptureRef?: string;
  createdAt: string;
  updatedAt: string;
  history: { at: string; status: PaymentStatus; note: string }[];
}

export interface FarmerPayable {
  id: string;
  poolId: string;
  poolLabel: string;
  farmerId: string;
  farmerName: string;
  farmerMasked: string;
  acceptedKg: number;
  agreedRatePerKg: number;
  gross: number;
  commission: number;
  net: number;
  payout: PayoutStatus;
  simulated?: boolean;
  relatedPaymentId?: string;
}

export interface ForecastPoint {
  period: string;
  availabilityTonnes: number | null;
  demandTonnes: number | null;
}

export interface Forecast {
  id: string;
  region: string;
  state: string;
  season: string;
  wasteType: WasteType;
  dataPeriod: string;
  sampleSize: number;
  confidence: "High" | "Medium" | "Low" | "Insufficient";
  limitedData: boolean;
  points: ForecastPoint[];
  explanation: string;
  actions: string[];
}

export interface AppNotification {
  id: string;
  group:
    | "Requirement"
    | "Pool"
    | "Area"
    | "Order"
    | "Payment"
    | "Seasonal";
  title: string;
  body: string;
  at: string;
  read: boolean;
  link: string;
}

export interface AiActionAudit {
  id: string;
  at: string;
  actor: string;
  actorRole: Role;
  aiPreparedSummary: string;
  confirmedBy: string;
  action: string;
  reference: string;
  outcome: string;
}

export interface ModerationFlag {
  id: string;
  kind:
    | "Suspicious listing"
    | "Duplicate activity"
    | "Unusual transaction pattern"
    | "Misleading information";
  source: "Rule" | "AI";
  subject: string;
  subjectType: "listing" | "user" | "transaction";
  evidence: string;
  createdAt: string;
  status: "Open" | "Dismissed" | "Warned" | "Removed";
}

export interface ListingDraft {
  wasteType?: WasteType;
  quantity?: number;
  unit?: QtyUnit;
  rate?: number;
  rateUnit?: QtyUnit;
  collectionPointId?: string;
  availableFrom?: string;
  village?: string;
  notes?: string;
  confidence: Record<string, number>;
  rawText: string;
}

export interface RequirementDraft {
  wasteType?: WasteType;
  quantity?: number;
  unit?: QtyUnit;
  rate?: number;
  rateUnit?: QtyUnit;
  village?: string;
  location?: LatLng;
  deadline?: string;
  notes?: string;
  confidence: Record<string, number>;
  rawText: string;
}

export type Language = "en" | "hi" | "mr" | "pa" | "te" | "ta";

export const LANGUAGES: {
  code: Language;
  label: string;
  native: string;
  bcp47: string;
  partial?: boolean;
}[] = [
  { code: "en", label: "English", native: "English", bcp47: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", bcp47: "hi-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", bcp47: "mr-IN" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", bcp47: "pa-IN", partial: true },
  { code: "te", label: "Telugu", native: "తెలుగు", bcp47: "te-IN", partial: true },
  { code: "ta", label: "Tamil", native: "தமிழ்", bcp47: "ta-IN", partial: true },
];
