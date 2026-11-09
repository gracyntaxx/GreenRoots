-- Migration 04: Reputation, Forecasting, Notifications, Moderation, Audit and Platform Settings

CREATE TABLE IF NOT EXISTS reputation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score numeric(3, 2) NOT NULL CHECK (score >= 0 AND score <= 5),
  factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reputation_user ON reputation_records(user_id);

CREATE TABLE IF NOT EXISTS forecasts (
  id text PRIMARY KEY DEFAULT ('fc_' || replace(gen_random_uuid()::text, '-', '')),
  region text NOT NULL,
  state text NOT NULL,
  season text NOT NULL,
  waste_type waste_type NOT NULL,
  data_period text NOT NULL,
  sample_size integer NOT NULL DEFAULT 0,
  confidence forecast_confidence NOT NULL DEFAULT 'Medium',
  limited_data boolean NOT NULL DEFAULT false,
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation_source text NOT NULL DEFAULT 'SYSTEM',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecasts_region_season ON forecasts(region, season);
CREATE INDEX IF NOT EXISTS idx_forecasts_waste ON forecasts(waste_type);

CREATE TABLE IF NOT EXISTS crop_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  state text NOT NULL,
  waste_type waste_type NOT NULL,
  harvest_start_month integer NOT NULL CHECK (harvest_start_month BETWEEN 1 AND 12),
  harvest_end_month integer NOT NULL CHECK (harvest_end_month BETWEEN 1 AND 12),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY DEFAULT ('notif_' || replace(gen_random_uuid()::text, '-', '')),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_name text NOT NULL CHECK (group_name IN ('Requirement', 'Pool', 'Area', 'Order', 'Payment', 'Seasonal')),
  template_key text,
  params jsonb DEFAULT '{}'::jsonb,
  title text NOT NULL,
  body text NOT NULL,
  deep_link text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_at ON notifications(at DESC);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id text NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('IN_APP', 'PUSH')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'DELIVERED')),
  provider_ticket text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON notification_deliveries(status);

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

CREATE TABLE IF NOT EXISTS moderation_flags (
  id text PRIMARY KEY DEFAULT ('flag_' || replace(gen_random_uuid()::text, '-', '')),
  kind text NOT NULL,
  source text NOT NULL CHECK (source IN ('Rule', 'AI')),
  subject text NOT NULL,
  subject_type text NOT NULL CHECK (subject_type IN ('listing', 'user', 'transaction')),
  evidence text NOT NULL,
  status moderation_status NOT NULL DEFAULT 'Open',
  decided_by uuid REFERENCES profiles(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flags_status ON moderation_flags(status);

-- Tamper-resistant append-only tables
CREATE TABLE IF NOT EXISTS ai_action_audit (
  id text PRIMARY KEY DEFAULT ('aud_' || replace(gen_random_uuid()::text, '-', '')),
  user_id uuid REFERENCES profiles(id),
  intent text,
  input_summary text,
  proposal jsonb,
  confirmed boolean NOT NULL DEFAULT true,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  actor_role user_role NOT NULL,
  ai_prepared_summary text NOT NULL,
  confirmed_by text NOT NULL,
  action text NOT NULL,
  reference text NOT NULL,
  outcome text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_actor ON ai_action_audit(actor_role, at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_reference ON ai_action_audit(reference);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id),
  actor_role text NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  before jsonb,
  after jsonb,
  reference text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at DESC);

CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  fee_bps integer NOT NULL DEFAULT 500 CHECK (fee_bps >= 0 AND fee_bps <= 3000),
  expiry_minutes integer NOT NULL DEFAULT 30 CHECK (expiry_minutes >= 5),
  discrepancy_tolerance_bps integer NOT NULL DEFAULT 1000,
  ai_rate_limit_per_hour integer NOT NULL DEFAULT 30,
  matching_weights jsonb NOT NULL DEFAULT '{
    "proximity": 0.30,
    "quantity_fit": 0.20,
    "price_fit": 0.15,
    "trust": 0.15,
    "previous_deals": 0.10,
    "popularity": 0.10
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure a single platform_settings row exists
INSERT INTO platform_settings (id, fee_bps) VALUES (1, 500)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  user_id uuid,
  endpoint text NOT NULL,
  request_hash text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON idempotency_keys(key, user_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  UNIQUE(key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key, window_start);

