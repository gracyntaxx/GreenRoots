import type {
  AiActionAudit,
  AppNotification,
  CollectionPoint,
  FarmerPayable,
  Forecast,
  IndustryVerification,
  Listing,
  ModerationFlag,
  Order,
  Payment,
  Pool,
  PoolContribution,
  Profile,
  Requirement,
} from "@/types";
import { commissionFor, netAfterCommission } from "@/lib/fees";

const now = Date.now();
const iso = (days: number, hours = 0) =>
  new Date(now + days * 86_400_000 + hours * 3_600_000).toISOString();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

export const COLLECTION_POINTS: CollectionPoint[] = [
  { id: "cp_rewari_central", name: "Rewari Central Hub", village: "Rewari", district: "Rewari", state: "Haryana", location: { lat: 28.199, lng: 76.618 }, capacityTonnes: 120, hours: "6:00 AM – 8:00 PM", active: true, dropOffsToday: 14 },
  { id: "cp_rewari_south", name: "Rewari South Mandi", village: "Bawal", district: "Rewari", state: "Haryana", location: { lat: 28.071, lng: 76.589 }, capacityTonnes: 80, hours: "7:00 AM – 6:00 PM", active: true, dropOffsToday: 9 },
  { id: "cp_panipat", name: "Panipat Grain Market Yard", village: "Panipat", district: "Panipat", state: "Haryana", location: { lat: 29.388, lng: 76.971 }, capacityTonnes: 200, hours: "5:30 AM – 9:00 PM", active: true, dropOffsToday: 22 },
  { id: "cp_karnal", name: "Karnal Co-op Yard", village: "Karnal", district: "Karnal", state: "Haryana", location: { lat: 29.691, lng: 76.988 }, capacityTonnes: 150, hours: "6:00 AM – 7:00 PM", active: true, dropOffsToday: 11 },
  { id: "cp_ludhiana", name: "Ludhiana Village Hub", village: "Jagraon", district: "Ludhiana", state: "Punjab", location: { lat: 30.787, lng: 75.473 }, capacityTonnes: 160, hours: "6:00 AM – 8:00 PM", active: true, dropOffsToday: 17 },
  { id: "cp_sangrur", name: "Sangrur Mandi Point", village: "Sangrur", district: "Sangrur", state: "Punjab", location: { lat: 30.24, lng: 75.844 }, capacityTonnes: 110, hours: "6:30 AM – 7:30 PM", active: true, dropOffsToday: 8 },
  { id: "cp_nashik", name: "Nashik Agri Yard", village: "Nashik", district: "Nashik", state: "Maharashtra", location: { lat: 19.999, lng: 73.79 }, capacityTonnes: 140, hours: "6:00 AM – 8:00 PM", active: true, dropOffsToday: 13 },
  { id: "cp_kolhapur", name: "Kolhapur Sugar Belt Hub", village: "Kolhapur", district: "Kolhapur", state: "Maharashtra", location: { lat: 16.7, lng: 74.243 }, capacityTonnes: 180, hours: "5:00 AM – 9:00 PM", active: false, dropOffsToday: 0 },
];

export const PROFILES: Profile[] = [
  {
    id: "farmer_1", name: "Ramesh Yadav", role: "farmer", phone: "9812345670", village: "Rewari", district: "Rewari", state: "Haryana", language: "hi", location: { lat: 28.197, lng: 76.617 }, reputation: 4.6,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "38", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "96%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "94%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "9", weight: 15 },
      { key: "disputes", label: "Disputes", value: "1", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "RY", joined: "2023-11-02",
  },
  {
    id: "farmer_2", name: "Sunita Devi", role: "farmer", phone: "9812345671", village: "Bawal", district: "Rewari", state: "Haryana", language: "hi", location: { lat: 28.075, lng: 76.585 }, reputation: 4.9,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "61", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "99%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "97%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "14", weight: 15 },
      { key: "disputes", label: "Disputes", value: "0", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "SD", joined: "2023-06-18",
  },
  {
    id: "farmer_3", name: "Mahender Singh", role: "farmer", phone: "9812345672", village: "Panipat", district: "Panipat", state: "Haryana", language: "hi", location: { lat: 29.39, lng: 76.96 }, reputation: 4.2,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "22", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "88%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "90%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "5", weight: 15 },
      { key: "disputes", label: "Disputes", value: "2", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "MS", joined: "2024-01-09",
  },
  {
    id: "farmer_4", name: "Gurpreet Kaur", role: "farmer", phone: "9812345673", village: "Jagraon", district: "Ludhiana", state: "Punjab", language: "pa", location: { lat: 30.787, lng: 75.473 }, reputation: 4.8,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "54", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "98%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "96%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "11", weight: 15 },
      { key: "disputes", label: "Disputes", value: "0", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "GK", joined: "2023-04-22",
  },
  {
    id: "farmer_5", name: "Balwinder Singh", role: "farmer", phone: "9812345674", village: "Sangrur", district: "Sangrur", state: "Punjab", language: "pa", location: { lat: 30.245, lng: 75.842 }, reputation: 4.7,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "47", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "97%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "95%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "8", weight: 15 },
      { key: "disputes", label: "Disputes", value: "1", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "BS", joined: "2023-09-14",
  },
  {
    id: "farmer_6", name: "Anil Patil", role: "farmer", phone: "9812345675", village: "Nashik", district: "Nashik", state: "Maharashtra", language: "mr", location: { lat: 19.997, lng: 73.789 }, reputation: 4.3,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "31", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "91%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "92%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "6", weight: 15 },
      { key: "disputes", label: "Disputes", value: "2", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "AP", joined: "2024-02-01",
  },
  {
    id: "farmer_7", name: "Kavita Shinde", role: "farmer", phone: "9812345676", village: "Kolhapur", district: "Kolhapur", state: "Maharashtra", language: "mr", location: { lat: 16.705, lng: 74.243 }, reputation: 4.5,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "26", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "94%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "93%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "7", weight: 15 },
      { key: "disputes", label: "Disputes", value: "0", weight: 10 },
    ],
    payoutReadiness: "Not set up", verified: false, avatarInitials: "KS", joined: "2024-03-11",
  },
  {
    id: "farmer_8", name: "Suresh Jadhav", role: "farmer", phone: "9812345677", village: "Ratnagiri", district: "Ratnagiri", state: "Maharashtra", language: "mr", location: { lat: 16.99, lng: 73.312 }, reputation: 4.0,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "12", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "84%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "88%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "3", weight: 15 },
      { key: "disputes", label: "Disputes", value: "1", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "SJ", joined: "2024-05-30",
  },
  {
    id: "farmer_9", name: "Rajesh Kumar", role: "farmer", phone: "9812345678", village: "Karnal", district: "Karnal", state: "Haryana", language: "hi", location: { lat: 29.686, lng: 76.99 }, reputation: 4.4,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "29", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "93%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "91%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "6", weight: 15 },
      { key: "disputes", label: "Disputes", value: "1", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "RK", joined: "2023-12-19",
  },
  {
    id: "farmer_10", name: "Fatima Begum", role: "farmer", phone: "9812345679", village: "Panipat", district: "Panipat", state: "Haryana", language: "hi", location: { lat: 29.377, lng: 76.95 }, reputation: 4.6,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "35", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "95%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "95%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "8", weight: 15 },
      { key: "disputes", label: "Disputes", value: "0", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "FB", joined: "2023-08-08",
  },
  {
    id: "farmer_11", name: "Dinesh Rathi", role: "farmer", phone: "9812345680", village: "Rewari", district: "Rewari", state: "Haryana", language: "hi", location: { lat: 28.21, lng: 76.63 }, reputation: 3.9,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "9", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "80%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "86%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "2", weight: 15 },
      { key: "disputes", label: "Disputes", value: "2", weight: 10 },
    ],
    payoutReadiness: "Not set up", verified: false, avatarInitials: "DR", joined: "2024-07-04",
  },
  {
    id: "farmer_12", name: "Prakash More", role: "farmer", phone: "9812345681", village: "Nashik", district: "Nashik", state: "Maharashtra", language: "mr", location: { lat: 20.01, lng: 73.77 }, reputation: 4.1,
    reputationFactors: [
      { key: "deliveries", label: "Completed deliveries", value: "18", weight: 30 },
      { key: "ontime", label: "On-time rate", value: "89%", weight: 25 },
      { key: "accuracy", label: "Declared quantity accuracy", value: "90%", weight: 20 },
      { key: "repeat", label: "Repeat buyers", value: "4", weight: 15 },
      { key: "disputes", label: "Disputes", value: "1", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "PM", joined: "2024-04-16",
  },
  {
    id: "buyer_1", name: "Amit Traders", role: "buyer", phone: "9822334455", village: "Rewari", district: "Rewari", state: "Haryana", language: "hi", location: { lat: 28.19, lng: 76.61 }, reputation: 4.5,
    reputationFactors: [
      { key: "deliveries", label: "Completed purchases", value: "24", weight: 30 },
      { key: "ontime", label: "On-time payment rate", value: "100%", weight: 25 },
      { key: "accuracy", label: "Order accuracy", value: "96%", weight: 20 },
      { key: "repeat", label: "Repeat farmers", value: "10", weight: 15 },
      { key: "disputes", label: "Disputes", value: "0", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "AT", joined: "2023-10-01",
  },
  {
    id: "industry_1", name: "Panipat Biomass Energy Ltd", role: "industry", email: "procurement@panipatbiomass.example", village: "Panipat", district: "Panipat", state: "Haryana", language: "en", location: { lat: 29.39, lng: 76.963 }, reputation: 4.7,
    reputationFactors: [
      { key: "deliveries", label: "Completed procurements", value: "42", weight: 30 },
      { key: "ontime", label: "On-time payment rate", value: "98%", weight: 25 },
      { key: "accuracy", label: "Requirement accuracy", value: "94%", weight: 20 },
      { key: "repeat", label: "Repeat farmers", value: "31", weight: 15 },
      { key: "disputes", label: "Disputes", value: "1", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "PB", joined: "2023-03-12",
  },
  {
    id: "industry_2", name: "Haryana Green Fuels", role: "industry", email: "buy@haryanagreenfuels.example", village: "Karnal", district: "Karnal", state: "Haryana", language: "en", location: { lat: 29.69, lng: 76.99 }, reputation: 4.4,
    reputationFactors: [
      { key: "deliveries", label: "Completed procurements", value: "27", weight: 30 },
      { key: "ontime", label: "On-time payment rate", value: "96%", weight: 25 },
      { key: "accuracy", label: "Requirement accuracy", value: "91%", weight: 20 },
      { key: "repeat", label: "Repeat farmers", value: "19", weight: 15 },
      { key: "disputes", label: "Disputes", value: "2", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "HG", joined: "2023-07-19",
  },
  {
    id: "industry_3", name: "Ludhiana Agro Pellets", role: "industry", email: "supply@ludhianaagro.example", village: "Ludhiana", district: "Ludhiana", state: "Punjab", language: "en", location: { lat: 30.901, lng: 75.857 }, reputation: 4.8,
    reputationFactors: [
      { key: "deliveries", label: "Completed procurements", value: "58", weight: 30 },
      { key: "ontime", label: "On-time payment rate", value: "99%", weight: 25 },
      { key: "accuracy", label: "Requirement accuracy", value: "97%", weight: 20 },
      { key: "repeat", label: "Repeat farmers", value: "44", weight: 15 },
      { key: "disputes", label: "Disputes", value: "0", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "LA", joined: "2022-11-23",
  },
  {
    id: "industry_4", name: "Nashik Sugarcane Power", role: "industry", email: "biomass@nashikpower.example", village: "Nashik", district: "Nashik", state: "Maharashtra", language: "en", location: { lat: 19.997, lng: 73.789 }, reputation: 4.2,
    reputationFactors: [
      { key: "deliveries", label: "Completed procurements", value: "21", weight: 30 },
      { key: "ontime", label: "On-time payment rate", value: "92%", weight: 25 },
      { key: "accuracy", label: "Requirement accuracy", value: "90%", weight: 20 },
      { key: "repeat", label: "Repeat farmers", value: "13", weight: 15 },
      { key: "disputes", label: "Disputes", value: "2", weight: 10 },
    ],
    payoutReadiness: "Ready", verified: true, avatarInitials: "NS", joined: "2024-01-15",
  },
  {
    id: "industry_5", name: "Rewari Bio-Products", role: "industry", email: "info@rewaribio.example", village: "Rewari", district: "Rewari", state: "Haryana", language: "en", location: { lat: 28.2, lng: 76.62 }, reputation: 3.8,
    reputationFactors: [
      { key: "deliveries", label: "Completed procurements", value: "2", weight: 30 },
      { key: "ontime", label: "On-time payment rate", value: "—", weight: 25 },
      { key: "accuracy", label: "Requirement accuracy", value: "—", weight: 20 },
      { key: "repeat", label: "Repeat farmers", value: "0", weight: 15 },
      { key: "disputes", label: "Disputes", value: "0", weight: 10 },
    ],
    payoutReadiness: "Not set up", verified: false, avatarInitials: "RB", joined: "2024-09-02",
  },
  {
    id: "admin_1", name: "Priya Menon", role: "admin", email: "admin@greenroots.example", village: "New Delhi", district: "New Delhi", state: "Delhi", language: "en", location: { lat: 28.6139, lng: 77.209 }, reputation: 5,
    reputationFactors: [],
    payoutReadiness: "Ready", verified: true, avatarInitials: "PM", joined: "2023-01-01",
  },
];

export const LISTINGS: Listing[] = [
  { id: "listing_ricehusk_200", farmerId: "farmer_1", farmerName: "Ramesh Yadav", farmerVillage: "Rewari", farmerReputation: 4.6, wasteType: "rice_husk", quantityKg: 200, unit: "kg", ratePerUnit: 8, rateUnit: "kg", location: { lat: 28.197, lng: 76.617 }, village: "Rewari", collectionPointId: "cp_rewari_central", status: "Active", createdAt: ago(120), updatedAt: ago(14), source: "voice", aiConfidence: 0.92, notes: "Dry husk stored under cover." },
  { id: "listing_mustard_1", farmerId: "farmer_2", farmerName: "Sunita Devi", farmerVillage: "Bawal", farmerReputation: 4.9, wasteType: "mustard_stubble", quantityKg: 5000, unit: "quintal", ratePerUnit: 1200, rateUnit: "quintal", location: { lat: 28.075, lng: 76.585 }, village: "Bawal", collectionPointId: "cp_rewari_south", status: "Active", createdAt: ago(300), updatedAt: ago(40), source: "voice", aiConfidence: 0.88 },
  { id: "listing_paddy_1", farmerId: "farmer_3", farmerName: "Mahender Singh", farmerVillage: "Panipat", farmerReputation: 4.2, wasteType: "paddy_straw", quantityKg: 12000, unit: "tonne", ratePerUnit: 2300, rateUnit: "tonne", location: { lat: 29.39, lng: 76.96 }, village: "Panipat", collectionPointId: "cp_panipat", status: "Active", createdAt: ago(500), updatedAt: ago(90), source: "manual" },
  { id: "listing_wheat_1", farmerId: "farmer_4", farmerName: "Gurpreet Kaur", farmerVillage: "Jagraon", farmerReputation: 4.8, wasteType: "wheat_straw", quantityKg: 18000, unit: "tonne", ratePerUnit: 1800, rateUnit: "tonne", location: { lat: 30.787, lng: 75.473 }, village: "Jagraon", collectionPointId: "cp_ludhiana", status: "Reserved", createdAt: ago(700), updatedAt: ago(200), source: "text" },
  { id: "listing_sugarcane_1", farmerId: "farmer_5", farmerName: "Balwinder Singh", farmerVillage: "Sangrur", farmerReputation: 4.7, wasteType: "sugarcane_trash", quantityKg: 9000, unit: "tonne", ratePerUnit: 1500, rateUnit: "tonne", location: { lat: 30.245, lng: 75.842 }, village: "Sangrur", collectionPointId: "cp_sangrur", status: "Active", createdAt: ago(800), updatedAt: ago(60), source: "manual" },
  { id: "listing_cashew_1", farmerId: "farmer_8", farmerName: "Suresh Jadhav", farmerVillage: "Ratnagiri", farmerReputation: 4.0, wasteType: "cashew_shell", quantityKg: 1200, unit: "quintal", ratePerUnit: 900, rateUnit: "quintal", location: { lat: 16.99, lng: 73.312 }, village: "Ratnagiri", collectionPointId: "cp_kolhapur", status: "Active", createdAt: ago(900), updatedAt: ago(150), source: "voice", aiConfidence: 0.79 },
  { id: "listing_cotton_1", farmerId: "farmer_6", farmerName: "Anil Patil", farmerVillage: "Nashik", farmerReputation: 4.3, wasteType: "cotton_stalk", quantityKg: 15000, unit: "tonne", ratePerUnit: 1200, rateUnit: "tonne", location: { lat: 19.997, lng: 73.789 }, village: "Nashik", collectionPointId: "cp_nashik", status: "Active", createdAt: ago(1000), updatedAt: ago(180), source: "manual" },
  { id: "listing_groundnut_1", farmerId: "farmer_12", farmerName: "Prakash More", farmerVillage: "Nashik", farmerReputation: 4.1, wasteType: "groundnut_shell", quantityKg: 2400, unit: "quintal", ratePerUnit: 800, rateUnit: "quintal", location: { lat: 20.01, lng: 73.77 }, village: "Nashik", collectionPointId: "cp_nashik", status: "Active", createdAt: ago(1100), updatedAt: ago(220), source: "text" },
  { id: "listing_bagasse_1", farmerId: "farmer_7", farmerName: "Kavita Shinde", farmerVillage: "Kolhapur", farmerReputation: 4.5, wasteType: "bagasse", quantityKg: 22000, unit: "tonne", ratePerUnit: 1100, rateUnit: "tonne", location: { lat: 16.705, lng: 74.243 }, village: "Kolhapur", collectionPointId: "cp_kolhapur", status: "Sold", createdAt: ago(1400), updatedAt: ago(400), source: "manual" },
  { id: "listing_paddy_2", farmerId: "farmer_10", farmerName: "Fatima Begum", farmerVillage: "Panipat", farmerReputation: 4.6, wasteType: "paddy_straw", quantityKg: 7500, unit: "tonne", ratePerUnit: 2400, rateUnit: "tonne", location: { lat: 29.377, lng: 76.95 }, village: "Panipat", collectionPointId: "cp_panipat", status: "Active", createdAt: ago(1600), updatedAt: ago(30), source: "voice", aiConfidence: 0.91 },
];

export const REQUIREMENTS: Requirement[] = [
  { id: "req_paddy_panipat", industryId: "industry_1", industryName: "Panipat Biomass Energy Ltd", industryVerified: true, wasteType: "paddy_straw", targetKg: 100000, ratePerUnit: 2300, rateUnit: "tonne", deadline: iso(3), location: { lat: 29.39, lng: 76.963 }, village: "Panipat", notes: "Dry straw, moisture below 18%.", moisturePreference: "≤18%", status: "Open", createdAt: ago(4000), poolId: "pool_paddy_panipat" },
  { id: "req_mustard_rewari", industryId: "industry_5", industryName: "Rewari Bio-Products", industryVerified: false, wasteType: "mustard_stubble", targetKg: 50000, ratePerUnit: 1200, rateUnit: "quintal", deadline: iso(6), location: { lat: 28.2, lng: 76.62 }, village: "Rewari", status: "Open", createdAt: ago(3000), poolId: "pool_mustard_rewari" },
  { id: "req_husk_karnal", industryId: "industry_2", industryName: "Haryana Green Fuels", industryVerified: true, wasteType: "rice_husk", targetKg: 20000, ratePerUnit: 950, rateUnit: "quintal", deadline: iso(9), location: { lat: 29.69, lng: 76.99 }, village: "Karnal", notes: "Clean husk, no stones.", status: "Open", createdAt: ago(2600), poolId: "pool_husk_karnal" },
  { id: "req_wheat_ludhiana", industryId: "industry_3", industryName: "Ludhiana Agro Pellets", industryVerified: true, wasteType: "wheat_straw", targetKg: 80000, ratePerUnit: 1800, rateUnit: "tonne", deadline: iso(-4), location: { lat: 30.901, lng: 75.857 }, village: "Ludhiana", status: "Fulfilled", createdAt: ago(20000), poolId: "pool_wheat_ludhiana" },
  { id: "req_sugarcane_nashik", industryId: "industry_4", industryName: "Nashik Sugarcane Power", industryVerified: true, wasteType: "sugarcane_trash", targetKg: 120000, ratePerUnit: 1500, rateUnit: "tonne", deadline: iso(1), location: { lat: 19.997, lng: 73.789 }, village: "Nashik", status: "Open", createdAt: ago(5000), poolId: "pool_sugarcane_nashik" },
  { id: "req_cotton_sangrur", industryId: "industry_3", industryName: "Ludhiana Agro Pellets", industryVerified: true, wasteType: "cotton_stalk", targetKg: 40000, ratePerUnit: 1200, rateUnit: "tonne", deadline: iso(5), location: { lat: 30.245, lng: 75.842 }, village: "Sangrur", status: "Open", createdAt: ago(2200), poolId: "pool_cotton_sangrur" },
];

export const POOLS: Pool[] = [
  { id: "pool_paddy_panipat", requirementId: "req_paddy_panipat", industryId: "industry_1", industryName: "Panipat Biomass Energy Ltd", industryVerified: true, wasteType: "paddy_straw", targetKg: 100000, committedKg: 62000, ratePerUnit: 2300, rateUnit: "tonne", deadline: iso(3), location: { lat: 29.39, lng: 76.963 }, village: "Panipat", status: "Open", radiusKm: 35, expanded: false, contributionCount: 7, createdAt: ago(4000) },
  { id: "pool_mustard_rewari", requirementId: "req_mustard_rewari", industryId: "industry_5", industryName: "Rewari Bio-Products", industryVerified: false, wasteType: "mustard_stubble", targetKg: 50000, committedKg: 50000, ratePerUnit: 1200, rateUnit: "quintal", deadline: iso(6), location: { lat: 28.2, lng: 76.62 }, village: "Rewari", status: "Ready for Pickup", radiusKm: 35, expanded: false, contributionCount: 5, createdAt: ago(3000) },
  { id: "pool_husk_karnal", requirementId: "req_husk_karnal", industryId: "industry_2", industryName: "Haryana Green Fuels", industryVerified: true, wasteType: "rice_husk", targetKg: 20000, committedKg: 8000, ratePerUnit: 950, rateUnit: "quintal", deadline: iso(9), location: { lat: 29.69, lng: 76.99 }, village: "Karnal", status: "Open", radiusKm: 35, expanded: true, expandedToKm: 60, contributionCount: 3, createdAt: ago(2600) },
  { id: "pool_wheat_ludhiana", requirementId: "req_wheat_ludhiana", industryId: "industry_3", industryName: "Ludhiana Agro Pellets", industryVerified: true, wasteType: "wheat_straw", targetKg: 80000, committedKg: 80000, ratePerUnit: 1800, rateUnit: "tonne", deadline: iso(-4), location: { lat: 30.901, lng: 75.857 }, village: "Ludhiana", status: "Settled", radiusKm: 35, expanded: false, contributionCount: 4, createdAt: ago(20000) },
  { id: "pool_sugarcane_nashik", requirementId: "req_sugarcane_nashik", industryId: "industry_4", industryName: "Nashik Sugarcane Power", industryVerified: true, wasteType: "sugarcane_trash", targetKg: 120000, committedKg: 30000, ratePerUnit: 1500, rateUnit: "tonne", deadline: iso(1), location: { lat: 19.997, lng: 73.789 }, village: "Nashik", status: "Open", radiusKm: 35, expanded: false, contributionCount: 2, createdAt: ago(5000) },
  { id: "pool_cotton_sangrur", requirementId: "req_cotton_sangrur", industryId: "industry_3", industryName: "Ludhiana Agro Pellets", industryVerified: true, wasteType: "cotton_stalk", targetKg: 40000, committedKg: 40000, ratePerUnit: 1200, rateUnit: "tonne", deadline: iso(5), location: { lat: 30.245, lng: 75.842 }, village: "Sangrur", status: "Ready for Pickup", radiusKm: 35, expanded: false, contributionCount: 4, createdAt: ago(2200) },
];

const contrib = (
  id: string, poolId: string, farmerId: string, farmerName: string, farmerVillage: string,
  farmerReputation: number, committedKg: number, ratePerKg: number, collectionPointId: string,
  fulfilment: PoolContribution["fulfilment"], payment: PoolContribution["payment"], payout: PoolContribution["payout"],
  acceptedKg?: number
): PoolContribution => ({
  id, poolId, farmerId, farmerName, farmerVillage, farmerReputation, committedKg,
  acceptedKg, agreedRatePerKg: ratePerKg, collectionPointId, fulfilment, payment, payout, createdAt: ago(2000),
});

export const CONTRIBUTIONS: PoolContribution[] = [
  contrib("pc_1", "pool_paddy_panipat", "farmer_3", "Mahender Singh", "Panipat", 4.2, 15000, 2.3, "cp_panipat", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_2", "pool_paddy_panipat", "farmer_10", "Fatima Begum", "Panipat", 4.6, 12000, 2.3, "cp_panipat", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_3", "pool_paddy_panipat", "farmer_9", "Rajesh Kumar", "Karnal", 4.4, 10000, 2.3, "cp_panipat", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_4", "pool_paddy_panipat", "farmer_2", "Sunita Devi", "Bawal", 4.9, 8000, 2.3, "cp_rewari_south", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_5", "pool_paddy_panipat", "farmer_1", "Ramesh Yadav", "Rewari", 4.6, 7000, 2.3, "cp_rewari_central", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_6", "pool_paddy_panipat", "farmer_11", "Dinesh Rathi", "Rewari", 3.9, 6000, 2.3, "cp_rewari_central", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_7", "pool_paddy_panipat", "farmer_3", "Mahender Singh", "Panipat", 4.2, 4000, 2.3, "cp_panipat", "Pending", "Initiated", "Not Yet Due"),

  contrib("pc_8", "pool_mustard_rewari", "farmer_2", "Sunita Devi", "Bawal", 4.9, 20000, 12, "cp_rewari_south", "Ready for Pickup", "Awaiting Approval", "Not Yet Due"),
  contrib("pc_9", "pool_mustard_rewari", "farmer_1", "Ramesh Yadav", "Rewari", 4.6, 12000, 12, "cp_rewari_central", "Ready for Pickup", "Awaiting Approval", "Not Yet Due"),
  contrib("pc_10", "pool_mustard_rewari", "farmer_11", "Dinesh Rathi", "Rewari", 3.9, 8000, 12, "cp_rewari_central", "Ready for Pickup", "Awaiting Approval", "Not Yet Due"),
  contrib("pc_11", "pool_mustard_rewari", "farmer_3", "Mahender Singh", "Panipat", 4.2, 6000, 12, "cp_panipat", "Ready for Pickup", "Awaiting Approval", "Not Yet Due"),
  contrib("pc_12", "pool_mustard_rewari", "farmer_9", "Rajesh Kumar", "Karnal", 4.4, 4000, 12, "cp_karnal", "Ready for Pickup", "Awaiting Approval", "Not Yet Due"),

  contrib("pc_13", "pool_husk_karnal", "farmer_9", "Rajesh Kumar", "Karnal", 4.4, 4000, 9.5, "cp_karnal", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_14", "pool_husk_karnal", "farmer_1", "Ramesh Yadav", "Rewari", 4.6, 2500, 9.5, "cp_rewari_central", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_15", "pool_husk_karnal", "farmer_10", "Fatima Begum", "Panipat", 4.6, 1500, 9.5, "cp_panipat", "Pending", "Initiated", "Not Yet Due"),

  contrib("pc_16", "pool_wheat_ludhiana", "farmer_5", "Balwinder Singh", "Sangrur", 4.7, 30000, 1.8, "cp_sangrur", "Completed", "Captured", "Completed", 30000),
  contrib("pc_17", "pool_wheat_ludhiana", "farmer_4", "Gurpreet Kaur", "Jagraon", 4.8, 25000, 1.8, "cp_ludhiana", "Completed", "Captured", "Completed", 25000),
  contrib("pc_18", "pool_wheat_ludhiana", "farmer_1", "Ramesh Yadav", "Rewari", 4.6, 15000, 1.8, "cp_rewari_central", "Completed", "Captured", "Simulated", 15000),
  contrib("pc_19", "pool_wheat_ludhiana", "farmer_2", "Sunita Devi", "Bawal", 4.9, 10000, 1.8, "cp_rewari_south", "Completed", "Captured", "Pending", 10000),

  contrib("pc_20", "pool_sugarcane_nashik", "farmer_6", "Anil Patil", "Nashik", 4.3, 18000, 1.5, "cp_nashik", "Pending", "Initiated", "Not Yet Due"),
  contrib("pc_21", "pool_sugarcane_nashik", "farmer_12", "Prakash More", "Nashik", 4.1, 12000, 1.5, "cp_nashik", "Pending", "Initiated", "Not Yet Due"),

  contrib("pc_22", "pool_cotton_sangrur", "farmer_5", "Balwinder Singh", "Sangrur", 4.7, 16000, 1.2, "cp_sangrur", "Ready for Pickup", "Approved", "Not Yet Due"),
  contrib("pc_23", "pool_cotton_sangrur", "farmer_4", "Gurpreet Kaur", "Jagraon", 4.8, 12000, 1.2, "cp_ludhiana", "Ready for Pickup", "Approved", "Not Yet Due"),
  contrib("pc_24", "pool_cotton_sangrur", "farmer_9", "Rajesh Kumar", "Karnal", 4.4, 8000, 1.2, "cp_karnal", "Ready for Pickup", "Approved", "Not Yet Due"),
  contrib("pc_25", "pool_cotton_sangrur", "farmer_10", "Fatima Begum", "Panipat", 4.6, 4000, 1.2, "cp_panipat", "Ready for Pickup", "Approved", "Not Yet Due"),
];

export const PAYABLES: FarmerPayable[] = CONTRIBUTIONS.filter(
  (c) => c.poolId === "pool_wheat_ludhiana"
).map((c) => {
  const gross = Math.round((c.acceptedKg ?? 0) * c.agreedRatePerKg);
  const commission = commissionFor(gross);
  return {
    id: `payable_${c.id}`,
    poolId: c.poolId,
    poolLabel: "Wheat straw pool · Ludhiana",
    farmerId: c.farmerId,
    farmerName: c.farmerName,
    farmerMasked: `${c.farmerName.slice(0, 1)}•••• ${c.farmerId.slice(-2)}`,
    acceptedKg: c.acceptedKg ?? 0,
    agreedRatePerKg: c.agreedRatePerKg,
    gross,
    commission,
    net: netAfterCommission(gross),
    payout: c.payout,
    simulated: c.payout === "Simulated",
  };
});

export const ORDERS: Order[] = [
  {
    id: "order_ricehusk_500", listingId: "listing_paddy_2", buyerId: "buyer_1", buyerName: "Amit Traders",
    farmerId: "farmer_10", farmerName: "Fatima Begum", wasteType: "paddy_straw", quantityKg: 500,
    ratePerUnit: 2400, rateUnit: "tonne", totalAmount: 1200, collectionPointId: "cp_panipat",
    fulfilment: "Pending", payment: "Captured", payout: "Not Yet Due", paypalOrderRef: "PP-7K2A1M4QX",
    paypalCaptureRef: "CAP-9D31B7", createdAt: ago(600),
    timeline: [
      { id: "t1", at: ago(620), label: "Order placed", detail: "Buyer approved checkout", state: "done" },
      { id: "t2", at: ago(610), label: "Payment captured", detail: "Verified directly with PayPal Sandbox", state: "done" },
      { id: "t3", at: ago(600), label: "Awaiting drop-off", detail: "Farmer has not delivered yet", state: "current" },
      { id: "t4", at: "", label: "Payout to farmer", detail: "Due after verified delivery", state: "upcoming" },
    ],
  },
  {
    id: "order_mustard_1000", listingId: "listing_mustard_1", buyerId: "buyer_1", buyerName: "Amit Traders",
    farmerId: "farmer_2", farmerName: "Sunita Devi", wasteType: "mustard_stubble", quantityKg: 1000,
    ratePerUnit: 1200, rateUnit: "quintal", totalAmount: 12000, collectionPointId: "cp_rewari_south",
    fulfilment: "Completed", payment: "Captured", payout: "Pending", paypalOrderRef: "PP-4R8T2N1QX",
    paypalCaptureRef: "CAP-7H22C9", createdAt: ago(4000),
    timeline: [
      { id: "t1", at: ago(4100), label: "Order placed", state: "done" },
      { id: "t2", at: ago(4090), label: "Payment captured", state: "done" },
      { id: "t3", at: ago(3900), label: "Drop-off verified", detail: "1,000 kg accepted at Bawal", state: "done" },
      { id: "t4", at: ago(3800), label: "Payout pending", detail: "Admin review in progress", state: "current" },
    ],
  },
  {
    id: "order_cashew_200", listingId: "listing_cashew_1", buyerId: "buyer_1", buyerName: "Amit Traders",
    farmerId: "farmer_8", farmerName: "Suresh Jadhav", wasteType: "cashew_shell", quantityKg: 200,
    ratePerUnit: 900, rateUnit: "quintal", totalAmount: 1800, collectionPointId: "cp_kolhapur",
    fulfilment: "Pending", payment: "Awaiting Approval", payout: "Not Yet Due", createdAt: ago(120),
    timeline: [
      { id: "t1", at: ago(120), label: "Order created", detail: "Waiting for PayPal approval", state: "current" },
    ],
  },
];

export const PAYMENTS: Payment[] = [
  { id: "pay_order_ricehusk", scope: "order", referenceId: "order_ricehusk_500", amount: 1200, status: "Captured", paypalOrderRef: "PP-7K2A1M4QX", paypalCaptureRef: "CAP-9D31B7", createdAt: ago(620), updatedAt: ago(610), history: [
    { at: ago(620), status: "Initiated", note: "PayPal order created in sandbox" },
    { at: ago(615), status: "Awaiting Approval", note: "Buyer opened sandbox checkout" },
    { at: ago(611), status: "Approved", note: "Buyer approved in sandbox" },
    { at: ago(610), status: "Captured", note: "Verified with PayPal directly" },
  ]},
  { id: "pay_pool_wheat", scope: "pool", referenceId: "pool_wheat_ludhiana", amount: 144000, status: "Captured", paypalOrderRef: "PP-2W9E5L8QX", paypalCaptureRef: "CAP-3A77D2", createdAt: ago(5000), updatedAt: ago(4980), history: [
    { at: ago(5000), status: "Initiated", note: "Pool payment summary approved" },
    { at: ago(4990), status: "Approved", note: "Industry approved sandbox payment" },
    { at: ago(4980), status: "Captured", note: "PayPal capture verified" },
  ]},
  { id: "pay_pool_cotton", scope: "pool", referenceId: "pool_cotton_sangrur", amount: 48000, status: "Approved", paypalOrderRef: "PP-8C1V6R3QX", createdAt: ago(300), updatedAt: ago(200), history: [
    { at: ago(300), status: "Initiated", note: "Payment summary prepared" },
    { at: ago(200), status: "Approved", note: "Approved in sandbox, capture pending verification" },
  ]},
];

export const FORECASTS: Forecast[] = [
  { id: "fc_haryana_paddy", region: "Haryana (Rewari, Panipat, Karnal)", state: "Haryana", season: "Kharif 2026", wasteType: "paddy_straw", dataPeriod: "Oct 2023 – Oct 2026", sampleSize: 1840, confidence: "High", limitedData: false,
    points: [
      { period: "Nov", availabilityTonnes: 42000, demandTonnes: 36000 },
      { period: "Dec", availabilityTonnes: 51000, demandTonnes: 41000 },
      { period: "Jan", availabilityTonnes: 46000, demandTonnes: 39000 },
      { period: "Feb", availabilityTonnes: 32000, demandTonnes: 35000 },
      { period: "Mar", availabilityTonnes: 18000, demandTonnes: 27000 },
      { period: "Apr", availabilityTonnes: 9000, demandTonnes: 15000 },
    ],
    explanation: "Paddy straw supply is expected to peak in December. Demand from biomass plants is steady and may exceed local supply from February.",
    actions: ["Book transport for the December peak", "Notify farmers within 60 km in mid-November", "Prepare storage for wet-weather delays"] },
  { id: "fc_punjab_wheat", region: "Punjab (Ludhiana, Sangrur)", state: "Punjab", season: "Rabi 2026", wasteType: "wheat_straw", dataPeriod: "Apr 2023 – Oct 2026", sampleSize: 2210, confidence: "High", limitedData: false,
    points: [
      { period: "Apr", availabilityTonnes: 64000, demandTonnes: 48000 },
      { period: "May", availabilityTonnes: 72000, demandTonnes: 52000 },
      { period: "Jun", availabilityTonnes: 58000, demandTonnes: 46000 },
      { period: "Jul", availabilityTonnes: 39000, demandTonnes: 42000 },
      { period: "Aug", availabilityTonnes: 24000, demandTonnes: 33000 },
    ],
    explanation: "Wheat straw availability peaks in May. Demand is likely to be met locally, with surplus available for nearby states.",
    actions: ["Schedule extra collection vehicles in May", "Offer early-commitment rates to repeat farmers"] },
  { id: "fc_maharashtra_sugarcane", region: "Maharashtra (Nashik, Kolhapur)", state: "Maharashtra", season: "Crushing 2026–27", wasteType: "sugarcane_trash", dataPeriod: "Insufficient history", sampleSize: 120, confidence: "Insufficient", limitedData: true,
    points: [
      { period: "Nov", availabilityTonnes: null, demandTonnes: null },
      { period: "Dec", availabilityTonnes: null, demandTonnes: null },
      { period: "Jan", availabilityTonnes: null, demandTonnes: null },
    ],
    explanation: "There is not enough recorded history for this region and season to produce a reliable forecast. No number is shown rather than inventing one.",
    actions: ["Record more collection data this season", "Ask local collection points for manual estimates"] },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", group: "Requirement", title: "New requirement 12 km away", body: "Paddy straw · 100 tonnes needed in Panipat by 10 Nov.", at: ago(8), read: false, link: "/pools/pool_paddy_panipat" },
  { id: "n2", group: "Pool", title: "Pool is 62% filled", body: "Paddy straw pool in Panipat still needs 38 tonnes.", at: ago(35), read: false, link: "/pools/pool_paddy_panipat" },
  { id: "n3", group: "Area", title: "Pool area expanded to 60 km", body: "Rice husk pool in Karnal now reaches more farmers.", at: ago(90), read: false, link: "/pools/pool_husk_karnal" },
  { id: "n4", group: "Order", title: "Drop-off confirmed", body: "1,000 kg mustard stubble accepted at Bawal.", at: ago(200), read: true, link: "/orders/order_mustard_1000" },
  { id: "n5", group: "Payment", title: "Payment captured", body: "PayPal Sandbox captured ₹1,200 for order ORD-8841.", at: ago(610), read: true, link: "/orders/order_ricehusk_500" },
  { id: "n6", group: "Seasonal", title: "Paddy straw demand rising", body: "Demand is expected to rise in 3 weeks around Rewari.", at: ago(700), read: true, link: "/forecast" },
  { id: "n7", group: "Pool", title: "Pool ready for pickup", body: "Cotton stalk pool in Sangrur reached its target.", at: ago(900), read: true, link: "/pools/pool_cotton_sangrur" },
];

export const VERIFICATIONS: IndustryVerification[] = [
  { id: "ver_1", industryId: "industry_5", businessName: "Rewari Bio-Products", licenseNumber: "HR-REW-2024-00871", registeredAddress: "Plot 14, Industrial Area, Rewari, Haryana 123401", contactPerson: "Naveen Sharma", documents: [
    { name: "GST registration.pdf", type: "PDF", uploadedAt: ago(2000) },
    { name: "Factory licence.pdf", type: "PDF", uploadedAt: ago(2000) },
    { name: "PAN card.pdf", type: "PDF", uploadedAt: ago(1990) },
  ], status: "Pending", submittedAt: ago(2000) },
  { id: "ver_2", industryId: "industry_4", businessName: "Nashik Sugarcane Power", licenseNumber: "MH-NSK-2021-00442", registeredAddress: "Gat 220, Sinnar Road, Nashik, Maharashtra 422112", contactPerson: "Rohit Deshmukh", documents: [
    { name: "GST registration.pdf", type: "PDF", uploadedAt: ago(9000) },
    { name: "Pollution clearance.pdf", type: "PDF", uploadedAt: ago(9000) },
  ], status: "Verified", submittedAt: ago(9000) },
  { id: "ver_3", industryId: "industry_3", businessName: "Ludhiana Agro Pellets", licenseNumber: "PB-LDH-2020-00119", registeredAddress: "Village Jagraon, Ludhiana, Punjab 142026", contactPerson: "Harjeet Singh", documents: [
    { name: "GST registration.pdf", type: "PDF", uploadedAt: ago(15000) },
  ], status: "Verified", submittedAt: ago(15000) },
  { id: "ver_4", industryId: "industry_2", businessName: "Haryana Green Fuels", licenseNumber: "HR-KNL-2022-00307", registeredAddress: "Sector 12, Karnal, Haryana 132001", contactPerson: "Meena Rani", documents: [
    { name: "GST registration.pdf", type: "PDF", uploadedAt: ago(12000) },
  ], status: "Verified", submittedAt: ago(12000) },
];

export const FLAGS: ModerationFlag[] = [
  { id: "flag_1", kind: "Suspicious listing", source: "AI", subject: "Cashew shell listing · 1,200 quintals", subjectType: "listing", evidence: "Declared quantity is 6× this farmer's historical maximum. Price is 40% below the regional median.", createdAt: ago(45), status: "Open" },
  { id: "flag_2", kind: "Duplicate activity", source: "Rule", subject: "Two listings with identical text from different accounts", subjectType: "listing", evidence: "Listing text matches character-for-character. Both created within 4 minutes from the same village.", createdAt: ago(180), status: "Open" },
  { id: "flag_3", kind: "Unusual transaction pattern", source: "AI", subject: "Five orders to the same buyer within 24 hours", subjectType: "transaction", evidence: "Buyer account is 6 days old. Orders total ₹48,000 and all use the same collection point.", createdAt: ago(400), status: "Open" },
  { id: "flag_4", kind: "Misleading information", source: "Rule", subject: "Listing claims 'government certified'", subjectType: "listing", evidence: "The phrase 'government certified' is not permitted unless a certificate is on file. No certificate found.", createdAt: ago(700), status: "Dismissed" },
];

export const AUDIT_LOG: AiActionAudit[] = [
  { id: "aud_1", at: ago(610), actor: "Amit Traders", actorRole: "buyer", aiPreparedSummary: "Order summary for 500 kg paddy straw at ₹2,400/tonne", confirmedBy: "Amit Traders", action: "PayPal capture", reference: "PP-7K2A1M4QX / CAP-9D31B7", outcome: "Captured" },
  { id: "aud_2", at: ago(700), actor: "Ramesh Yadav", actorRole: "farmer", aiPreparedSummary: "Listing draft: 200 kg rice husk at ₹8/kg, Rewari", confirmedBy: "Ramesh Yadav", action: "Listing published", reference: "listing_ricehusk_200", outcome: "Active" },
  { id: "aud_3", at: ago(900), actor: "Panipat Biomass Energy Ltd", actorRole: "industry", aiPreparedSummary: "Requirement: 100 tonnes paddy straw, ₹2,300/tonne, Panipat", confirmedBy: "Procurement manager", action: "Requirement published", reference: "req_paddy_panipat", outcome: "Open" },
  { id: "aud_4", at: ago(2000), actor: "Priya Menon", actorRole: "admin", aiPreparedSummary: "Verification review for Nashik Sugarcane Power", confirmedBy: "Priya Menon", action: "Industry verified", reference: "ver_2", outcome: "Verified" },
  { id: "aud_5", at: ago(4980), actor: "Ludhiana Agro Pellets", actorRole: "industry", aiPreparedSummary: "Pool settlement for 80,000 kg wheat straw, 4 farmers", confirmedBy: "Harjeet Singh", action: "PayPal capture", reference: "PP-2W9E5L8QX / CAP-3A77D2", outcome: "Captured" },
  { id: "aud_6", at: ago(5000), actor: "Priya Menon", actorRole: "admin", aiPreparedSummary: "Payout batch for 4 farmers, ₹1,36,800 net", confirmedBy: "Priya Menon", action: "Payout approval", reference: "payout_batch_wheat_1", outcome: "Partially completed · 1 simulated" },
];

export const DEMO_ACCOUNTS = [
  { role: "farmer" as const, label: "Farmer", name: "Ramesh Yadav", id: "farmer_1", detail: "Rewari, Haryana · 4.6 ★", icon: "sprout" },
  { role: "buyer" as const, label: "Buyer", name: "Amit Traders", id: "buyer_1", detail: "Rewari, Haryana · 4.5 ★", icon: "shopping" },
  { role: "industry" as const, label: "Industry", name: "Panipat Biomass Energy Ltd", id: "industry_1", detail: "Verified · Panipat", icon: "factory" },
  { role: "admin" as const, label: "Admin", name: "Priya Menon", id: "admin_1", detail: "GreenRoots operations", icon: "shield" },
];

export const SEASONAL_ALERT = {
  title: "Paddy straw demand expected to rise in 3 weeks around Rewari",
  body: "Harvest begins soon. Biomass plants in Panipat and Karnal are likely to need more supply. Prepare your stubble now.",
  checklist: [
    "Keep bales dry and covered",
    "Confirm your nearest collection point is open",
    "Check your payout readiness in Me → Payouts",
    "List your expected quantity before harvest",
  ],
};
