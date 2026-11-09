-- Migration 02: Core Entities (Profiles, Verifications, Hubs, Listings, Pools)

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'farmer',
  phone text,
  email text,
  village text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  location geography(Point, 4326) NOT NULL,
  hex_q integer,
  hex_r integer,
  crops text[] DEFAULT '{}'::text[],
  reputation_score numeric(3, 2) NOT NULL DEFAULT 4.0 CHECK (reputation_score >= 0 AND reputation_score <= 5),
  reputation_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  payout_readiness text NOT NULL DEFAULT 'Not set up' CHECK (payout_readiness IN ('Ready', 'Not set up', 'Pending verification')),
  verified boolean NOT NULL DEFAULT false,
  avatar_initials text NOT NULL DEFAULT 'GR',
  joined date NOT NULL DEFAULT CURRENT_DATE,
  push_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING gist(location);
CREATE INDEX IF NOT EXISTS idx_profiles_hex ON profiles(hex_q, hex_r);

CREATE TABLE IF NOT EXISTS payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  paypal_payout_email text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS industry_verifications (
  id text PRIMARY KEY DEFAULT ('ver_' || replace(gen_random_uuid()::text, '-', '')),
  industry_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  license_number text NOT NULL UNIQUE,
  registered_address text NOT NULL,
  contact_person text NOT NULL,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  status verification_status NOT NULL DEFAULT 'Pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_industry ON industry_verifications(industry_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON industry_verifications(status);

CREATE TABLE IF NOT EXISTS collection_points (
  id text PRIMARY KEY DEFAULT ('cp_' || replace(gen_random_uuid()::text, '-', '')),
  name text NOT NULL,
  village text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  location geography(Point, 4326) NOT NULL,
  capacity_tonnes numeric(10, 2) NOT NULL DEFAULT 50 CHECK (capacity_tonnes > 0),
  hours text NOT NULL DEFAULT '6:00 AM – 8:00 PM',
  opening_hours jsonb DEFAULT '{"open": "06:00", "close": "20:00"}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  drop_offs_today integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_points_location ON collection_points USING gist(location);
CREATE INDEX IF NOT EXISTS idx_collection_points_active ON collection_points(active);

CREATE TABLE IF NOT EXISTS listings (
  id text PRIMARY KEY DEFAULT ('listing_' || replace(gen_random_uuid()::text, '-', '')),
  farmer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  waste_type waste_type NOT NULL,
  quantity_input numeric(14, 3) NOT NULL CHECK (quantity_input > 0),
  unit_input qty_unit NOT NULL,
  quantity_kg numeric(14, 3) NOT NULL CHECK (quantity_kg > 0),
  available_kg numeric(14, 3) NOT NULL CHECK (available_kg >= 0),
  rate_input numeric(12, 2) NOT NULL CHECK (rate_input > 0),
  rate_unit qty_unit NOT NULL,
  rate_per_kg_paise bigint NOT NULL CHECK (rate_per_kg_paise > 0),
  location geography(Point, 4326) NOT NULL,
  village text NOT NULL,
  collection_point_id text NOT NULL REFERENCES collection_points(id),
  status listing_status NOT NULL DEFAULT 'Active',
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('voice', 'text', 'manual')),
  ai_confidence numeric(3, 2),
  notes text,
  available_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_farmer ON listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_waste ON listings(waste_type);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING gist(location);
CREATE INDEX IF NOT EXISTS idx_listings_point ON listings(collection_point_id);

CREATE TABLE IF NOT EXISTS requirements (
  id text PRIMARY KEY DEFAULT ('req_' || replace(gen_random_uuid()::text, '-', '')),
  industry_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  waste_type waste_type NOT NULL,
  quantity_input numeric(14, 3) NOT NULL CHECK (quantity_input > 0),
  unit_input qty_unit NOT NULL,
  target_kg numeric(14, 3) NOT NULL CHECK (target_kg > 0),
  rate_input numeric(12, 2) NOT NULL CHECK (rate_input > 0),
  rate_unit qty_unit NOT NULL,
  rate_per_kg_paise bigint NOT NULL CHECK (rate_per_kg_paise > 0),
  deadline timestamptz NOT NULL,
  location geography(Point, 4326) NOT NULL,
  village text NOT NULL,
  notes text,
  moisture_preference text,
  auto_expand_opt_in boolean NOT NULL DEFAULT false,
  reach_ring integer NOT NULL DEFAULT 1 CHECK (reach_ring >= 1),
  status requirement_status NOT NULL DEFAULT 'Draft',
  pool_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requirements_industry ON requirements(industry_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_waste ON requirements(waste_type);
CREATE INDEX IF NOT EXISTS idx_requirements_deadline ON requirements(deadline);

CREATE TABLE IF NOT EXISTS pools (
  id text PRIMARY KEY DEFAULT ('pool_' || replace(gen_random_uuid()::text, '-', '')),
  requirement_id text NOT NULL REFERENCES requirements(id) ON DELETE CASCADE UNIQUE,
  industry_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  waste_type waste_type NOT NULL,
  target_kg numeric(14, 3) NOT NULL CHECK (target_kg > 0),
  committed_kg numeric(14, 3) NOT NULL DEFAULT 0 CHECK (committed_kg >= 0),
  accepted_kg numeric(14, 3) DEFAULT 0,
  rate_per_unit numeric(12, 2) NOT NULL CHECK (rate_per_unit > 0),
  rate_unit qty_unit NOT NULL,
  deadline timestamptz NOT NULL,
  location geography(Point, 4326) NOT NULL,
  village text NOT NULL,
  status pool_status NOT NULL DEFAULT 'Open',
  radius_km numeric(6, 2) NOT NULL DEFAULT 35.0 CHECK (radius_km > 0),
  expanded boolean NOT NULL DEFAULT false,
  expanded_to_km numeric(6, 2),
  contribution_count integer NOT NULL DEFAULT 0,
  ready_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pools_industry ON pools(industry_id);
CREATE INDEX IF NOT EXISTS idx_pools_status ON pools(status);
CREATE INDEX IF NOT EXISTS idx_pools_waste ON pools(waste_type);
CREATE INDEX IF NOT EXISTS idx_pools_location ON pools USING gist(location);

CREATE TABLE IF NOT EXISTS pool_change_proposals (
  id text PRIMARY KEY DEFAULT ('prop_' || replace(gen_random_uuid()::text, '-', '')),
  pool_id text NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('EXPAND_AREA', 'EXTEND_DEADLINE')),
  proposed_ring integer,
  proposed_radius_km numeric(6, 2),
  proposed_deadline timestamptz,
  source text NOT NULL DEFAULT 'SYSTEM' CHECK (source IN ('SYSTEM', 'AI')),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED', 'AUTO_APPLIED')),
  decided_by uuid REFERENCES profiles(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pool_proposals_pool ON pool_change_proposals(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_proposals_status ON pool_change_proposals(status);

CREATE TABLE IF NOT EXISTS pool_contributions (
  id text PRIMARY KEY DEFAULT ('pc_' || replace(gen_random_uuid()::text, '-', '')),
  pool_id text NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  committed_kg numeric(14, 3) NOT NULL CHECK (committed_kg > 0),
  accepted_kg numeric(14, 3) CHECK (accepted_kg >= 0),
  agreed_rate_per_kg numeric(12, 2) NOT NULL CHECK (agreed_rate_per_kg > 0),
  collection_point_id text NOT NULL REFERENCES collection_points(id),
  fulfilment fulfilment_status NOT NULL DEFAULT 'Pending',
  payment payment_status NOT NULL DEFAULT 'Initiated',
  payout payout_status NOT NULL DEFAULT 'Not Yet Due',
  idempotency_key text,
  dropoff_token text,
  moisture_pct numeric(5, 2),
  acceptance_source text,
  accepted_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributions_pool ON pool_contributions(pool_id);
CREATE INDEX IF NOT EXISTS idx_contributions_farmer ON pool_contributions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_contributions_point ON pool_contributions(collection_point_id);
CREATE INDEX IF NOT EXISTS idx_contributions_idempotency ON pool_contributions(idempotency_key);

