// GreenRoots Persistent SQLite Database Layer
// Built with Node.js 22+ / 24+ native node:sqlite DatabaseSync.

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../greenroots.db");

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high performance concurrent reads and writes
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize schema
export function createSchema() {
  db.exec(`
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  village TEXT NOT NULL,
  district TEXT,
  state TEXT,
  language TEXT DEFAULT 'en',
  lat REAL DEFAULT 15.3614,
  lng REAL DEFAULT 73.9312,
  reputation REAL DEFAULT 4.5,
  reputation_factors TEXT DEFAULT '[]',
  payout_readiness TEXT DEFAULT 'Ready',
  verified INTEGER DEFAULT 1,
  avatar_initials TEXT DEFAULT 'GR',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collection_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT,
  state TEXT,
  lat REAL DEFAULT 15.3614,
  lng REAL DEFAULT 73.9312,
  capacity_tonnes REAL DEFAULT 100,
  hours TEXT DEFAULT '6:00 AM – 8:00 PM',
  active INTEGER DEFAULT 1,
  dropoffs_today INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS industry_verifications (
  id TEXT PRIMARY KEY,
  industry_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  registered_address TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  documents TEXT DEFAULT '[]',
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  submitted_at TEXT DEFAULT (datetime('now')),
  decided_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  industry_id TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  target_kg REAL NOT NULL,
  rate_per_unit REAL NOT NULL,
  rate_unit TEXT DEFAULT 'tonne',
  deadline TEXT NOT NULL,
  lat REAL DEFAULT 15.3614,
  lng REAL DEFAULT 73.9312,
  village TEXT NOT NULL,
  status TEXT DEFAULT 'Open',
  pool_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pools (
  id TEXT PRIMARY KEY,
  requirement_id TEXT,
  industry_id TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  target_kg REAL NOT NULL,
  committed_kg REAL DEFAULT 0,
  rate_per_unit REAL NOT NULL,
  rate_unit TEXT DEFAULT 'tonne',
  deadline TEXT NOT NULL,
  lat REAL DEFAULT 15.3614,
  lng REAL DEFAULT 73.9312,
  village TEXT NOT NULL,
  radius_km REAL DEFAULT 35,
  stage TEXT DEFAULT 'Open for Commitments',
  contribution_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pool_contributions (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  committed_kg REAL NOT NULL,
  accepted_kg REAL,
  collection_point_id TEXT,
  dropoff_token TEXT,
  qr_payload TEXT,
  stage TEXT DEFAULT 'Committed',
  payment TEXT DEFAULT 'Pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  quantity_kg REAL NOT NULL,
  rate_per_unit REAL NOT NULL,
  rate_unit TEXT DEFAULT 'quintal',
  village TEXT NOT NULL,
  collection_point_id TEXT,
  lat REAL DEFAULT 15.3614,
  lng REAL DEFAULT 73.9312,
  status TEXT DEFAULT 'Active',
  crop_season TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  buyer_id TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  quantity_kg REAL NOT NULL,
  rate_per_unit REAL NOT NULL,
  rate_unit TEXT DEFAULT 'quintal',
  total_price_paise INTEGER NOT NULL,
  platform_fee_paise INTEGER NOT NULL,
  farmer_net_paise INTEGER NOT NULL,
  collection_point_id TEXT,
  dropoff_token TEXT,
  qr_payload TEXT,
  stage TEXT DEFAULT 'Ready for Pickup',
  payment_status TEXT DEFAULT 'Captured',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  amount_inr_paise INTEGER NOT NULL,
  charge_currency TEXT DEFAULT 'USD',
  charge_amount_minor INTEGER DEFAULT 0,
  fx_rate REAL DEFAULT 84.0,
  paypal_order_ref TEXT,
  capture_ref TEXT,
  status TEXT DEFAULT 'Initiated',
  payer_verified INTEGER DEFAULT 0,
  verified_at TEXT,
  idempotency_key TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS farmer_payables (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  verified_kg REAL NOT NULL,
  share_percent REAL NOT NULL,
  gross_paise INTEGER NOT NULL,
  fee_paise INTEGER NOT NULL,
  net_paise INTEGER NOT NULL,
  payout_status TEXT DEFAULT 'Pending',
  payout_batch_id TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  payable_id TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  pool_id TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  paypal_payout_batch_id TEXT,
  status TEXT DEFAULT 'Completed',
  simulated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS forecasts (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  season TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  historical_price_per_kg REAL DEFAULT 2.0,
  predicted_price_per_kg REAL DEFAULT 2.2,
  confidence REAL DEFAULT 0.85,
  limited_data INTEGER DEFAULT 0,
  harvest_peak_start TEXT,
  harvest_peak_end TEXT,
  sample_count INTEGER DEFAULT 1000,
  explanation TEXT,
  trend TEXT DEFAULT 'Stable'
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  read INTEGER DEFAULT 0,
  reference_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS moderation_flags (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_summary TEXT NOT NULL,
  reason TEXT NOT NULL,
  reporter TEXT NOT NULL,
  status TEXT DEFAULT 'Open',
  decision_reason TEXT,
  decided_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  reference TEXT,
  ai_prepared_summary TEXT,
  confirmed_by TEXT,
  outcome TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);
}

// Initial table creation
createSchema();

// Auto-migrate if legacy Haryana data is present
export function checkAndMigrateLegacy() {
  try {
    const legacyCheck = db.prepare("SELECT COUNT(*) as c FROM collection_points WHERE village IN ('Rewari', 'Bawal', 'Panipat', 'Karnal')").get();
    if (legacyCheck && legacyCheck.c > 0) {
      console.log("[Database] Legacy Rewari/Haryana data detected. Rebuilding clean Goa database...");
      reseedDatabase();
      return true;
    }
  } catch (err) {
    // Tables might not exist yet
  }
  return false;
}

export function reseedDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS audit_log;
    DROP TABLE IF EXISTS moderation_flags;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS forecasts;
    DROP TABLE IF EXISTS payouts;
    DROP TABLE IF EXISTS farmer_payables;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS listings;
    DROP TABLE IF EXISTS pool_contributions;
    DROP TABLE IF EXISTS pools;
    DROP TABLE IF EXISTS requirements;
    DROP TABLE IF EXISTS industry_verifications;
    DROP TABLE IF EXISTS collection_points;
    DROP TABLE IF EXISTS profiles;
  `);
  createSchema();
  seedDatabase();
}

// Run check
if (!checkAndMigrateLegacy()) {
  const countRes = db.prepare("SELECT COUNT(*) AS c FROM profiles").get();
  if (!countRes || countRes.c === 0) {
    seedDatabase();
  }
}

export function seedDatabase() {
  console.log("[Database] Initializing and seeding GreenRoots SQLite database...");

  // 1. Collection points
  const insertCp = db.prepare(`
    INSERT INTO collection_points (id, name, village, district, state, lat, lng, capacity_tonnes, hours, active, dropoffs_today)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const cps = [
    ["cp_rewari_central", "Margao APMC Central Hub", "Margao", "South Goa", "Goa", 15.2736, 73.9580, 180, "6:00 AM – 8:00 PM", 1, 18],
    ["cp_rewari_south", "Vasco Port Agro Depot", "Vasco", "South Goa", "Goa", 15.3982, 73.8113, 150, "6:00 AM – 7:30 PM", 1, 14],
    ["cp_panipat", "Panjim Central Market Yard", "Panjim", "North Goa", "Goa", 15.4909, 73.8278, 200, "5:30 AM – 9:00 PM", 1, 22],
    ["cp_karnal", "Mapusa Sub-Yard Co-op", "Mapusa", "North Goa", "Goa", 15.5937, 73.8142, 150, "6:00 AM – 7:00 PM", 1, 11],
    ["cp_ludhiana", "Verna Industrial Biomass Yard", "Verna", "South Goa", "Goa", 15.3614, 73.9312, 220, "6:00 AM – 8:00 PM", 1, 24],
    ["cp_sangrur", "Ponda Farm Residue Hub", "Ponda", "North Goa", "Goa", 15.4026, 74.0086, 130, "6:30 AM – 7:30 PM", 1, 8],
    ["cp_nashik", "Bicholim Agri Collection Center", "Bicholim", "North Goa", "Goa", 15.5912, 73.9515, 140, "6:00 AM – 8:00 PM", 1, 13],
    ["cp_kolhapur", "Kolhapur Sugar Belt Hub", "Kolhapur", "Kolhapur", "Maharashtra", 16.7, 74.243, 180, "5:00 AM – 9:00 PM", 1, 9],
    ["cp_curchorem", "Curchorem Biomass Depot", "Curchorem", "South Goa", "Goa", 15.2605, 74.1102, 110, "6:00 AM – 6:30 PM", 1, 5],
    ["cp_canacona", "Canacona Eco Collection Point", "Canacona", "South Goa", "Goa", 15.0167, 74.0500, 90, "7:00 AM – 6:00 PM", 1, 4],
    ["cp_porvorim", "Porvorim Greens Hub", "Porvorim", "North Goa", "Goa", 15.5350, 73.8288, 100, "6:30 AM – 7:30 PM", 1, 7],
    ["cp_cuncolim", "Cuncolim Industrial Yard", "Cuncolim", "South Goa", "Goa", 15.1764, 73.9961, 120, "6:00 AM – 7:00 PM", 1, 6],
    ["cp_valpoi", "Valpoi Forest & Farm Depot", "Valpoi", "North Goa", "Goa", 15.5311, 74.1337, 95, "7:00 AM – 6:00 PM", 1, 3],
    ["cp_pernem", "Pernem North Agro Yard", "Pernem", "North Goa", "Goa", 15.7174, 73.7972, 115, "6:00 AM – 7:00 PM", 1, 5],
    ["cp_quepem", "Quepem Bio-Residue Point", "Quepem", "South Goa", "Goa", 15.2167, 74.0667, 85, "6:30 AM – 6:30 PM", 1, 4],
    ["cp_sanguem", "Sanguem Agri Mandi", "Sanguem", "South Goa", "Goa", 15.2333, 74.1500, 90, "6:00 AM – 6:00 PM", 1, 3],
    ["cp_tivim", "Tivim Railhead Collection Hub", "Tivim", "North Goa", "Goa", 15.6167, 73.8333, 130, "5:30 AM – 8:30 PM", 1, 8],
    ["cp_belagavi", "Belagavi Border APMC Yard", "Belagavi", "Belagavi", "Karnataka", 15.8497, 74.4977, 200, "5:00 AM – 9:00 PM", 1, 19],
  ];
  for (const cp of cps) insertCp.run(...cp);

  // 2. Profiles
  const insertProf = db.prepare(`
    INSERT INTO profiles (id, name, role, phone, email, village, district, state, language, lat, lng, reputation, reputation_factors, payout_readiness, verified, avatar_initials)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const profs = [
    ["farmer_1", "Ramesh Yadav", "farmer", "9812345670", null, "Margao", "South Goa", "Goa", "hi", 15.2736, 73.9580, 4.6, '[{"key":"deliveries","label":"Completed deliveries","value":"38","weight":30},{"key":"ontime","label":"On-time rate","value":"96%","weight":25}]', "Ready", 1, "RY"],
    ["farmer_2", "Sunita Devi", "farmer", "9812345671", null, "Vasco", "South Goa", "Goa", "hi", 15.3982, 73.8113, 4.9, '[{"key":"deliveries","label":"Completed deliveries","value":"61","weight":30}]', "Ready", 1, "SD"],
    ["farmer_3", "Mahender Singh", "farmer", "9812345672", null, "Panjim", "North Goa", "Goa", "hi", 15.4909, 73.8278, 4.2, '[]', "Ready", 1, "MS"],
    ["farmer_4", "Gurpreet Kaur", "farmer", "9812345673", null, "Mapusa", "North Goa", "Goa", "pa", 15.5937, 73.8142, 4.8, '[]', "Ready", 1, "GK"],
    ["farmer_5", "Balwinder Singh", "farmer", "9812345674", null, "Verna", "South Goa", "Goa", "pa", 15.3614, 73.9312, 4.7, '[]', "Ready", 1, "BS"],
    ["farmer_6", "Anil Patil", "farmer", "9812345675", null, "Ponda", "North Goa", "Goa", "mr", 15.4026, 74.0086, 4.3, '[]', "Ready", 1, "AP"],
    ["farmer_7", "Kavita Shinde", "farmer", "9812345676", null, "Bicholim", "North Goa", "Goa", "mr", 15.5912, 73.9515, 4.5, '[]', "Not set up", 0, "KS"],
    ["farmer_8", "Suresh Jadhav", "farmer", "9812345677", null, "Canacona", "South Goa", "Goa", "mr", 15.0167, 74.0500, 4.0, '[]', "Ready", 1, "SJ"],
    ["farmer_9", "Rajesh Kumar", "farmer", "9812345678", null, "Mapusa", "North Goa", "Goa", "hi", 15.5937, 73.8142, 4.4, '[]', "Ready", 1, "RK"],
    ["farmer_10", "Fatima Begum", "farmer", "9812345679", null, "Panjim", "North Goa", "Goa", "hi", 15.4909, 73.8278, 4.6, '[]', "Ready", 1, "FB"],
    ["farmer_11", "Dinesh Rathi", "farmer", "9812345680", null, "Curchorem", "South Goa", "Goa", "hi", 15.2605, 74.1102, 3.9, '[]', "Not set up", 0, "DR"],
    ["farmer_12", "Prakash More", "farmer", "9812345681", null, "Porvorim", "North Goa", "Goa", "mr", 15.5350, 73.8288, 4.1, '[]', "Ready", 1, "PM"],
    ["buyer_1", "Amit Traders", "buyer", "9822334455", "buyer@amittraders.example", "Vasco", "South Goa", "Goa", "hi", 15.3982, 73.8113, 4.5, '[]', "Ready", 1, "AT"],
    ["industry_1", "Goa Bio-Energy Ltd", "industry", "9833445566", "procurement@goabiomass.example", "Verna", "South Goa", "Goa", "en", 15.3614, 73.9312, 4.7, '[]', "Ready", 1, "GB"],
    ["industry_2", "Goa Green Bio-Fuels", "industry", "9844556677", "buy@goagreenfuels.example", "Mapusa", "North Goa", "Goa", "en", 15.5937, 73.8142, 4.4, '[]', "Ready", 1, "GG"],
    ["industry_3", "Verna Agro Pellets", "industry", "9855667788", "supply@vernaagro.example", "Verna", "South Goa", "Goa", "en", 15.3614, 73.9312, 4.8, '[]', "Ready", 1, "VA"],
    ["industry_4", "Kolhapur Sugarcane Power", "industry", "9866778899", "biomass@kolhapurpower.example", "Kolhapur", "Kolhapur", "Maharashtra", "en", 16.7, 74.243, 4.2, '[]', "Ready", 1, "KP"],
    ["industry_5", "Margao Bio-Products", "industry", "9877889900", "info@margaobio.example", "Margao", "South Goa", "Goa", "en", 15.2736, 73.9580, 3.8, '[]', "Not set up", 0, "MB"],
    ["admin_1", "Priya Menon", "admin", "9899001122", "admin@greenroots.example", "Panjim", "North Goa", "Goa", "en", 15.4909, 73.8278, 5.0, '[]', "Ready", 1, "PM"],
  ];
  for (const p of profs) insertProf.run(...p);

  // 3. Verifications
  const insertVer = db.prepare(`
    INSERT INTO industry_verifications (id, industry_id, business_name, license_number, registered_address, contact_person, documents, status, reviewed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVer.run("ver_1", "industry_5", "Margao Bio-Products", "GA-MRG-2024-00871", "Plot 14, Industrial Estate, Margao, Goa 403601", "Naveen Sharma", '["GST registration.pdf"]', "Pending", null);
  insertVer.run("ver_2", "industry_4", "Kolhapur Sugarcane Power", "MH-KLP-2021-00442", "Gat 220, Shirol Road, Kolhapur, Maharashtra 416103", "Rohit Deshmukh", '["GST registration.pdf"]', "Verified", "Priya Menon");
  insertVer.run("ver_3", "industry_3", "Verna Agro Pellets", "GA-VRN-2020-00119", "Verna Industrial Estate, Verna, Goa 403722", "Harjeet Singh", '["GST registration.pdf"]', "Verified", "Priya Menon");
  insertVer.run("ver_4", "industry_2", "Goa Green Bio-Fuels", "GA-MAP-2022-00307", "Mapusa Industrial Yard, Mapusa, Goa 403507", "Meena Rani", '["GST registration.pdf"]', "Verified", "Priya Menon");

  // 4. Requirements & Pools
  const insertReq = db.prepare(`
    INSERT INTO requirements (id, industry_id, waste_type, target_kg, rate_per_unit, rate_unit, deadline, lat, lng, village, status, pool_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPool = db.prepare(`
    INSERT INTO pools (id, requirement_id, industry_id, waste_type, target_kg, committed_kg, rate_per_unit, rate_unit, deadline, lat, lng, village, radius_km, stage, contribution_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const reqs = [
    ["req_paddy_panipat", "industry_1", "paddy_straw", 100000, 2300, "tonne", "2026-11-20T18:00:00Z", 15.4909, 73.8278, "Panjim", "Open", "pool_paddy_panipat", "Dry straw, moisture below 18%."],
    ["req_mustard_rewari", "industry_5", "mustard_stubble", 50000, 1200, "quintal", "2026-11-22T18:00:00Z", 15.2736, 73.9580, "Margao", "Open", "pool_mustard_rewari", null],
    ["req_husk_karnal", "industry_2", "rice_husk", 20000, 950, "quintal", "2026-11-25T18:00:00Z", 15.5937, 73.8142, "Mapusa", "Open", "pool_husk_karnal", "Clean husk, no stones."],
    ["req_wheat_ludhiana", "industry_3", "wheat_straw", 80000, 1800, "tonne", "2026-10-30T18:00:00Z", 15.3614, 73.9312, "Verna", "Fulfilled", "pool_wheat_ludhiana", null],
    ["req_sugarcane_nashik", "industry_4", "sugarcane_trash", 120000, 1500, "tonne", "2026-11-18T18:00:00Z", 16.700, 74.243, "Kolhapur", "Open", "pool_sugarcane_nashik", null],
    ["req_cotton_sangrur", "industry_3", "cotton_stalk", 40000, 1200, "tonne", "2026-11-21T18:00:00Z", 15.3614, 73.9312, "Verna", "Open", "pool_cotton_sangrur", null],
  ];
  for (const r of reqs) insertReq.run(...r);

  const pools = [
    ["pool_paddy_panipat", "req_paddy_panipat", "industry_1", "paddy_straw", 100000, 62000, 2300, "tonne", "2026-11-20T18:00:00Z", 15.4909, 73.8278, "Panjim", 35, "Open for Commitments", 7],
    ["pool_mustard_rewari", "req_mustard_rewari", "industry_5", "mustard_stubble", 50000, 50000, 1200, "quintal", "2026-11-22T18:00:00Z", 15.2736, 73.9580, "Margao", 35, "Ready for Pickup", 5],
    ["pool_husk_karnal", "req_husk_karnal", "industry_2", "rice_husk", 20000, 8000, 950, "quintal", "2026-11-25T18:00:00Z", 15.5937, 73.8142, "Mapusa", 60, "Open for Commitments", 3],
    ["pool_wheat_ludhiana", "req_wheat_ludhiana", "industry_3", "wheat_straw", 80000, 80000, 1800, "tonne", "2026-10-30T18:00:00Z", 15.3614, 73.9312, "Verna", 35, "Closed", 4],
    ["pool_sugarcane_nashik", "req_sugarcane_nashik", "industry_4", "sugarcane_trash", 120000, 30000, 1500, "tonne", "2026-11-18T18:00:00Z", 16.700, 74.243, "Kolhapur", 35, "Open for Commitments", 2],
    ["pool_cotton_sangrur", "req_cotton_sangrur", "industry_3", "cotton_stalk", 40000, 40000, 1200, "tonne", "2026-11-21T18:00:00Z", 15.3614, 73.9312, "Verna", 35, "Ready for Pickup", 4],
  ];
  for (const p of pools) insertPool.run(...p);

  // 5. Pool Contributions
  const insertContrib = db.prepare(`
    INSERT INTO pool_contributions (id, pool_id, farmer_id, committed_kg, accepted_kg, collection_point_id, dropoff_token, qr_payload, stage, payment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const contribs = [
    ["pc_1", "pool_paddy_panipat", "farmer_3", 15000, null, "cp_panipat", "TK-7A12", '{"token":"TK-7A12"}', "Committed", "Pending"],
    ["pc_2", "pool_paddy_panipat", "farmer_10", 12000, null, "cp_panipat", "TK-7A13", '{"token":"TK-7A13"}', "Committed", "Pending"],
    ["pc_3", "pool_paddy_panipat", "farmer_9", 10000, null, "cp_panipat", "TK-7A14", '{"token":"TK-7A14"}', "Committed", "Pending"],
    ["pc_4", "pool_paddy_panipat", "farmer_2", 8000, null, "cp_rewari_south", "TK-7A15", '{"token":"TK-7A15"}', "Committed", "Pending"],
    ["pc_5", "pool_paddy_panipat", "farmer_1", 7000, null, "cp_rewari_central", "TK-7A16", '{"token":"TK-7A16"}', "Committed", "Pending"],
    ["pc_8", "pool_mustard_rewari", "farmer_2", 20000, null, "cp_rewari_south", "TK-8B21", '{"token":"TK-8B21"}', "Ready for Pickup", "Pending"],
    ["pc_9", "pool_mustard_rewari", "farmer_1", 12000, null, "cp_rewari_central", "TK-8B22", '{"token":"TK-8B22"}', "Ready for Pickup", "Pending"],
    ["pc_16", "pool_wheat_ludhiana", "farmer_5", 30000, 30000, "cp_sangrur", "TK-9C31", '{"token":"TK-9C31"}', "Completed", "Captured"],
    ["pc_17", "pool_wheat_ludhiana", "farmer_4", 25000, 25000, "cp_ludhiana", "TK-9C32", '{"token":"TK-9C32"}', "Completed", "Captured"],
    ["pc_18", "pool_wheat_ludhiana", "farmer_1", 15000, 15000, "cp_rewari_central", "TK-9C33", '{"token":"TK-9C33"}', "Completed", "Captured"],
    ["pc_19", "pool_wheat_ludhiana", "farmer_2", 10000, 10000, "cp_rewari_south", "TK-9C34", '{"token":"TK-9C34"}', "Completed", "Captured"],
  ];
  for (const c of contribs) insertContrib.run(...c);

  // 6. Listings
  const insertListing = db.prepare(`
    INSERT INTO listings (id, farmer_id, waste_type, quantity_kg, rate_per_unit, rate_unit, village, collection_point_id, lat, lng, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const listings = [
    ["listing_ricehusk_200", "farmer_1", "rice_husk", 200, 8, "kg", "Margao", "cp_rewari_central", 15.2736, 73.9580, "Active", "Dry husk stored under cover."],
    ["listing_mustard_1", "farmer_2", "mustard_stubble", 5000, 1200, "quintal", "Vasco", "cp_rewari_south", 15.3982, 73.8113, "Active", null],
    ["listing_paddy_1", "farmer_3", "paddy_straw", 12000, 2300, "tonne", "Panjim", "cp_panipat", 15.4909, 73.8278, "Active", null],
    ["listing_wheat_1", "farmer_4", "wheat_straw", 18000, 1800, "tonne", "Mapusa", "cp_karnal", 15.5937, 73.8142, "Reserved", null],
    ["listing_sugarcane_1", "farmer_5", "sugarcane_trash", 9000, 1500, "tonne", "Verna", "cp_ludhiana", 15.3614, 73.9312, "Active", null],
    ["listing_cashew_1", "farmer_8", "cashew_shell", 1200, 900, "quintal", "Canacona", "cp_canacona", 15.0167, 74.0500, "Active", null],
    ["listing_cotton_1", "farmer_6", "cotton_stalk", 15000, 1200, "tonne", "Ponda", "cp_sangrur", 15.4026, 74.0086, "Active", null],
    ["listing_groundnut_1", "farmer_12", "groundnut_shell", 2400, 800, "quintal", "Porvorim", "cp_porvorim", 15.5350, 73.8288, "Active", null],
    ["listing_bagasse_1", "farmer_7", "bagasse", 22000, 1100, "tonne", "Bicholim", "cp_nashik", 15.5912, 73.9515, "Sold", null],
    ["listing_paddy_2", "farmer_10", "paddy_straw", 7500, 2400, "tonne", "Panjim", "cp_panipat", 15.4909, 73.8278, "Active", null],
  ];
  for (const l of listings) insertListing.run(...l);

  // 7. Orders & Payments
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, listing_id, buyer_id, farmer_id, waste_type, quantity_kg, rate_per_unit, rate_unit, total_price_paise, platform_fee_paise, farmer_net_paise, collection_point_id, dropoff_token, qr_payload, stage, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run("order_ricehusk_500", "listing_paddy_2", "buyer_1", "farmer_10", "paddy_straw", 500, 2400, "tonne", 120000, 6000, 114000, "cp_panipat", "TK-ORD-1", '{"order":"order_ricehusk_500"}', "Pending", "Captured");
  insertOrder.run("order_mustard_1000", "listing_mustard_1", "buyer_1", "farmer_2", "mustard_stubble", 1000, 1200, "quintal", 1200000, 60000, 1140000, "cp_rewari_south", "TK-ORD-2", '{"order":"order_mustard_1000"}', "Completed", "Captured");

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, scope, reference_id, amount_inr_paise, charge_currency, charge_amount_minor, fx_rate, paypal_order_ref, capture_ref, status, payer_verified, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPayment.run("pay_order_ricehusk", "order", "order_ricehusk_500", 120000, "USD", 1428, 84.0, "PP-7K2A1M4QX", "CAP-9D31B7", "Captured", 1, new Date().toISOString());
  insertPayment.run("pay_pool_wheat", "pool", "pool_wheat_ludhiana", 14400000, "USD", 171428, 84.0, "PP-2W9E5L8QX", "CAP-3A77D2", "Captured", 1, new Date().toISOString());
  insertPayment.run("pay_pool_cotton", "pool", "pool_cotton_sangrur", 4800000, "USD", 57142, 84.0, "PP-8C1V6R3QX", null, "Approved", 0, null);

  // 8. Farmer Payables
  const insertPayable = db.prepare(`
    INSERT INTO farmer_payables (id, pool_id, farmer_id, farmer_name, verified_kg, share_percent, gross_paise, fee_paise, net_paise, payout_status, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPayable.run("payable_pc_16", "pool_wheat_ludhiana", "farmer_5", "Balwinder Singh", 30000, 37.5, 5400000, 270000, 5130000, "Completed", new Date().toISOString());
  insertPayable.run("payable_pc_17", "pool_wheat_ludhiana", "farmer_4", "Gurpreet Kaur", 25000, 31.25, 4500000, 225000, 4275000, "Completed", new Date().toISOString());
  insertPayable.run("payable_pc_18", "pool_wheat_ludhiana", "farmer_1", "Ramesh Yadav", 15000, 18.75, 2700000, 135000, 2565000, "Simulated", new Date().toISOString());
  insertPayable.run("payable_pc_19", "pool_wheat_ludhiana", "farmer_2", "Sunita Devi", 10000, 12.5, 1800000, 90000, 1710000, "Pending", null);

  // 9. Forecasts
  const insertFc = db.prepare(`
    INSERT INTO forecasts (id, region, season, waste_type, historical_price_per_kg, predicted_price_per_kg, confidence, limited_data, harvest_peak_start, harvest_peak_end, sample_count, explanation, trend)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFc.run("fc_haryana_paddy", "Goa (Vasco, Margao, Panjim)", "Kharif 2026", "paddy_straw", 2.10, 2.30, 0.88, 0, "2026-10-25", "2026-12-15", 1840, "Paddy straw supply peaks in November-December across Goa. High demand from regional bio-pellet plants keeps prices firm.", "Rising");
  insertFc.run("fc_punjab_wheat", "Karnataka (Belagavi, Dharwad)", "Rabi 2026", "wheat_straw", 1.75, 1.80, 0.92, 0, "2026-04-15", "2026-05-30", 2210, "Wheat straw availability peaks in May. Steady demand for cattle fodder and packaging materials.", "Stable");
  insertFc.run("fc_maharashtra_sugarcane", "Maharashtra (Kolhapur, Sawantwadi)", "Crushing 2026–27", "sugarcane_trash", 1.40, 1.50, 0.45, 1, "2026-11-15", "2027-02-28", 120, "There is not enough recorded history for this region to produce a definitive forecast.", "Stable");

  // 10. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, body, type, read, reference_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run("n1", "farmer_1", "New requirement 12 km away", "Paddy straw · 100 tonnes needed in Panjim by 10 Nov.", "pool", 0, "pool_paddy_panipat");
  insertNotif.run("n2", "farmer_1", "Pool is 62% filled", "Paddy straw pool in Panjim still needs 38 tonnes.", "pool", 0, "pool_paddy_panipat");
  insertNotif.run("n3", "farmer_9", "Pool area expanded to 60 km", "Rice husk pool in Mapusa now reaches more farmers.", "pool", 0, "pool_husk_karnal");
  insertNotif.run("n4", "farmer_2", "Drop-off confirmed", "1,000 kg mustard stubble accepted at Vasco Port Agro Depot.", "system", 1, "order_mustard_1000");
  insertNotif.run("n5", "buyer_1", "Payment captured", "Escrow captured ₹1,200 for order ORD-8841.", "payment", 1, "order_ricehusk_500");

  // 11. Moderation Flags
  const insertFlag = db.prepare(`
    INSERT INTO moderation_flags (id, target_type, target_id, target_summary, reason, reporter, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertFlag.run("flag_1", "listing", "listing_cashew_1", "Cashew shell listing · 1,200 quintals", "Declared quantity is 6× this farmer historical maximum.", "AI Anomaly Detector", "Open");
  insertFlag.run("flag_4", "listing", "listing_paddy_1", "Listing claims government certified", "No certificate found on file.", "Rule Engine", "Dismissed");

  // 12. Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_log (id, actor, actor_role, action, reference, ai_prepared_summary, confirmed_by, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run("aud_1", "Amit Traders", "buyer", "Payment capture", "PP-7K2A1M4QX", "Order summary for 500 kg paddy straw at ₹2,400/tonne", "Amit Traders", "Captured");
  insertAudit.run("aud_2", "Ramesh Yadav", "farmer", "Listing published", "listing_ricehusk_200", "Listing draft: 200 kg rice husk at ₹8/kg, Margao", "Ramesh Yadav", "Active");
  insertAudit.run("aud_4", "Priya Menon", "admin", "Industry verified", "ver_2", "Verification review for Kolhapur Agro Power", "Priya Menon", "Verified");

  console.log("[Database] Database initialized and seeded successfully.");
}

