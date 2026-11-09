-- Migration 01: Extensions and Types
-- GreenRoots Agricultural Marketplace

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Note: pg_cron is enabled in Supabase cloud / self-hosted environments.
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Domain types matching exact frontend contracts
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'industry', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE waste_type AS ENUM (
    'paddy_straw',
    'wheat_straw',
    'rice_husk',
    'mustard_stubble',
    'sugarcane_trash',
    'cashew_shell',
    'cotton_stalk',
    'groundnut_shell',
    'bagasse'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE qty_unit AS ENUM ('kg', 'quintal', 'tonne');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fulfilment_status AS ENUM (
    'Pending',
    'Ready for Pickup',
    'Completed',
    'Cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'Initiated',
    'Awaiting Approval',
    'Approved',
    'Captured',
    'Failed',
    'Cancelled',
    'Refunded'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM (
    'Not Yet Due',
    'Pending',
    'Processing',
    'Completed',
    'Failed',
    'Simulated'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM (
    'Active',
    'Reserved',
    'Sold',
    'Paused',
    'Removed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE requirement_status AS ENUM (
    'Draft',
    'Open',
    'Fulfilled',
    'Expired',
    'Closed',
    'Removed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pool_status AS ENUM (
    'Open',
    'Ready for Pickup',
    'Settled',
    'Expired',
    'Completed',
    'Cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM (
    'Pending',
    'Verified',
    'Rejected'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE moderation_status AS ENUM (
    'Open',
    'Dismissed',
    'Warned',
    'Removed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE forecast_confidence AS ENUM (
    'High',
    'Medium',
    'Low',
    'Insufficient'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

