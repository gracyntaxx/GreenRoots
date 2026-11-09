-- Migration 03: Orders, Payments, Webhook Events, Payables, and Payouts

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY DEFAULT ('order_' || replace(gen_random_uuid()::text, '-', '')),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id text REFERENCES listings(id) ON DELETE SET NULL,
  pool_id text REFERENCES pools(id) ON DELETE SET NULL,
  farmer_id uuid REFERENCES profiles(id),
  waste_type waste_type NOT NULL,
  quantity_kg numeric(14, 3) NOT NULL CHECK (quantity_kg > 0),
  rate_per_unit numeric(12, 2) NOT NULL CHECK (rate_per_unit > 0),
  rate_unit qty_unit NOT NULL,
  total_amount_paise bigint NOT NULL CHECK (total_amount_paise > 0),
  collection_point_id text NOT NULL REFERENCES collection_points(id),
  fulfilment fulfilment_status NOT NULL DEFAULT 'Pending',
  payment payment_status NOT NULL DEFAULT 'Initiated',
  payout payout_status NOT NULL DEFAULT 'Not Yet Due',
  paypal_order_ref text,
  paypal_capture_ref text,
  expires_at timestamptz,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_order_target CHECK (num_nonnulls(listing_id, pool_id) = 1)
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_pool ON orders(pool_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment);
CREATE INDEX IF NOT EXISTS idx_orders_fulfilment ON orders(fulfilment);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY DEFAULT ('pay_' || replace(gen_random_uuid()::text, '-', '')),
  scope text NOT NULL CHECK (scope IN ('order', 'pool')),
  reference_id text NOT NULL,
  payer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  charge_amount_minor numeric(14, 2) NOT NULL,
  charge_currency text NOT NULL DEFAULT 'USD',
  fx_rate numeric(10, 4) NOT NULL DEFAULT 84.0000,
  paypal_order_ref text NOT NULL UNIQUE,
  paypal_capture_ref text,
  status payment_status NOT NULL DEFAULT 'Initiated',
  environment text NOT NULL DEFAULT 'sandbox',
  idempotency_key text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_scope_ref ON payments(scope, reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_ref ON payments(paypal_order_ref);

CREATE TABLE IF NOT EXISTS payment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  from_status payment_status,
  to_status payment_status NOT NULL,
  source text NOT NULL CHECK (source IN ('CAPTURE_API', 'WEBHOOK', 'RECONCILE')),
  paypal_event_id text,
  note text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_payment ON payment_status_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_at ON payment_status_history(at);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paypal_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  resource_id text,
  payload jsonb NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  processing_status text NOT NULL DEFAULT 'RECEIVED' CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
  error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON payment_webhook_events(processing_status);

CREATE TABLE IF NOT EXISTS farmer_payables (
  id text PRIMARY KEY DEFAULT ('payable_' || replace(gen_random_uuid()::text, '-', '')),
  pool_id text REFERENCES pools(id) ON DELETE SET NULL,
  order_id text REFERENCES orders(id) ON DELETE SET NULL,
  contribution_id text REFERENCES pool_contributions(id) ON DELETE SET NULL,
  farmer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_kg numeric(14, 3) NOT NULL CHECK (accepted_kg >= 0),
  agreed_rate_per_kg numeric(12, 2) NOT NULL CHECK (agreed_rate_per_kg > 0),
  gross_paise bigint NOT NULL CHECK (gross_paise >= 0),
  commission_paise bigint NOT NULL CHECK (commission_paise >= 0),
  net_paise bigint NOT NULL CHECK (net_paise >= 0),
  payout payout_status NOT NULL DEFAULT 'Not Yet Due',
  is_simulated boolean NOT NULL DEFAULT false,
  related_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payables_farmer ON farmer_payables(farmer_id);
CREATE INDEX IF NOT EXISTS idx_payables_pool ON farmer_payables(pool_id);
CREATE INDEX IF NOT EXISTS idx_payables_order ON farmer_payables(order_id);
CREATE INDEX IF NOT EXISTS idx_payables_status ON farmer_payables(payout);

CREATE TABLE IF NOT EXISTS payouts (
  id text PRIMARY KEY DEFAULT ('payout_' || replace(gen_random_uuid()::text, '-', '')),
  payable_id text NOT NULL REFERENCES farmer_payables(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  paypal_batch_id text,
  paypal_item_id text,
  sender_batch_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING',
  is_simulated boolean NOT NULL DEFAULT false,
  requested_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_payable ON payouts(payable_id);
CREATE INDEX IF NOT EXISTS idx_payouts_farmer ON payouts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_sender_batch ON payouts(sender_batch_id);

