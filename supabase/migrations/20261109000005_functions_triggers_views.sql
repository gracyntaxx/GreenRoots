-- Migration 05: Database Functions, Triggers, Views, and Realtime Publications

-- 1. Helper Security Functions (STABLE, SECURITY DEFINER, fixed search_path)
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'farmer'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_verified_industry(p_industry_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM industry_verifications
    WHERE industry_id = p_industry_id AND status = 'Verified'
  );
$$;

-- 2. Auth Trigger: handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_meta jsonb;
  v_name text;
  v_village text;
  v_district text;
  v_state text;
  v_lat double precision;
  v_lng double precision;
  v_initials text;
BEGIN
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  
  -- Clamp role to non-admin roles only
  CASE LOWER(COALESCE(v_meta->>'role', 'farmer'))
    WHEN 'buyer' THEN v_role := 'buyer'::user_role;
    WHEN 'industry' THEN v_role := 'industry'::user_role;
    ELSE v_role := 'farmer'::user_role;
  END CASE;

  v_name := COALESCE(v_meta->>'name', v_meta->>'full_name', split_part(COALESCE(NEW.email, NEW.phone, 'User'), '@', 1));
  v_village := COALESCE(v_meta->>'village', 'Rewari');
  v_district := COALESCE(v_meta->>'district', v_village);
  v_state := COALESCE(v_meta->>'state', 'Haryana');
  v_lat := COALESCE((v_meta->'location'->>'lat')::double precision, 28.197);
  v_lng := COALESCE((v_meta->'location'->>'lng')::double precision, 76.617);
  
  v_initials := UPPER(SUBSTRING(v_name FROM 1 FOR 2));
  IF LENGTH(v_initials) = 0 THEN v_initials := 'GR'; END IF;

  INSERT INTO profiles (
    id,
    name,
    role,
    phone,
    email,
    village,
    district,
    state,
    language,
    location,
    avatar_initials,
    verified,
    payout_readiness,
    joined
  ) VALUES (
    NEW.id,
    v_name,
    v_role,
    NEW.phone,
    NEW.email,
    v_village,
    v_district,
    v_state,
    COALESCE(v_meta->>'language', 'en'),
    ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography,
    v_initials,
    (v_role != 'industry'), -- farmers/buyers default to verified in demo, industry requires verification
    'Not set up',
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Profile Column Protection Trigger
CREATE OR REPLACE FUNCTION protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role and admin can update anything
  IF auth.role() = 'service_role' OR is_admin() THEN
    RETURN NEW;
  END IF;

  -- Regular users cannot update sensitive fields
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Users cannot change their own role.';
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    RAISE EXCEPTION 'Users cannot alter their verification status directly.';
  END IF;

  IF NEW.reputation_score IS DISTINCT FROM OLD.reputation_score THEN
    RAISE EXCEPTION 'Reputation is managed exclusively by the system.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile ON profiles;
CREATE TRIGGER trg_protect_profile
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_columns();

-- 4. Tamper-Resistance: Append-Only Trigger
CREATE OR REPLACE FUNCTION prevent_modification_or_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'This table is strictly append-only and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_append_only ON audit_log;
CREATE TRIGGER trg_audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_modification_or_deletion();

DROP TRIGGER IF EXISTS trg_ai_action_audit_append_only ON ai_action_audit;
CREATE TRIGGER trg_ai_action_audit_append_only
  BEFORE UPDATE OR DELETE ON ai_action_audit
  FOR EACH ROW EXECUTE FUNCTION prevent_modification_or_deletion();

DROP TRIGGER IF EXISTS trg_payment_status_history_append_only ON payment_status_history;
CREATE TRIGGER trg_payment_status_history_append_only
  BEFORE UPDATE OR DELETE ON payment_status_history
  FOR EACH ROW EXECUTE FUNCTION prevent_modification_or_deletion();

-- 5. Industry Verification Gate on Requirements
CREATE OR REPLACE FUNCTION enforce_industry_verification_on_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('Open', 'Fulfilled') THEN
    IF NOT is_verified_industry(NEW.industry_id) THEN
      RAISE EXCEPTION 'Industry account % is not verified. Requirements cannot be opened.', NEW.industry_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requirement_verification_gate ON requirements;
CREATE TRIGGER trg_requirement_verification_gate
  BEFORE INSERT OR UPDATE ON requirements
  FOR EACH ROW EXECUTE FUNCTION enforce_industry_verification_on_requirement();

-- 6. Pool Stage Auto-Transition Trigger
CREATE OR REPLACE FUNCTION sync_pool_commitment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_committed numeric(14, 3);
  v_pool pools%ROWTYPE;
BEGIN
  SELECT * INTO v_pool FROM pools WHERE id = COALESCE(NEW.pool_id, OLD.pool_id);
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Recompute committed_kg from active contributions
  SELECT COALESCE(SUM(committed_kg), 0)
  INTO v_total_committed
  FROM pool_contributions
  WHERE pool_id = v_pool.id
    AND fulfilment != 'Cancelled';

  UPDATE pools
  SET
    committed_kg = v_total_committed,
    contribution_count = (SELECT COUNT(*) FROM pool_contributions WHERE pool_id = v_pool.id AND fulfilment != 'Cancelled'),
    status = CASE
      WHEN v_total_committed >= target_kg AND status = 'Open' THEN 'Ready for Pickup'::pool_status
      ELSE status
    END,
    ready_at = CASE
      WHEN v_total_committed >= target_kg AND ready_at IS NULL THEN now()
      ELSE ready_at
    END,
    updated_at = now()
  WHERE id = v_pool.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_pool_commitments ON pool_contributions;
CREATE TRIGGER trg_sync_pool_commitments
  AFTER INSERT OR UPDATE OR DELETE ON pool_contributions
  FOR EACH ROW EXECUTE FUNCTION sync_pool_commitment();

-- 7. Monotonic Payment Status Rule
CREATE OR REPLACE FUNCTION payment_rank(s payment_status)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE s
    WHEN 'Initiated' THEN 1
    WHEN 'Awaiting Approval' THEN 2
    WHEN 'Approved' THEN 3
    WHEN 'Captured' THEN 4
    WHEN 'Refunded' THEN 5
    WHEN 'Failed' THEN 99
    WHEN 'Cancelled' THEN 99
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION enforce_monotonic_payment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Terminal states Failed/Cancelled can't regress if already captured
  IF OLD.status = 'Captured' AND NEW.status IN ('Initiated', 'Awaiting Approval', 'Approved') THEN
    RAISE EXCEPTION 'Payment status cannot regress from Captured to %', NEW.status;
  END IF;

  -- Cannot regress from higher rank to lower rank
  IF payment_rank(NEW.status) < payment_rank(OLD.status) AND OLD.status NOT IN ('Failed', 'Cancelled') THEN
    RAISE EXCEPTION 'Invalid payment status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_monotonic_payment ON payments;
CREATE TRIGGER trg_monotonic_payment
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION enforce_monotonic_payment_status();

-- 8. Hex Math (Axial Hex Grid projection without external library)
-- 1 deg lat ≈ 111 km. At 5 km cell radius:
CREATE OR REPLACE FUNCTION lat_lng_to_hex(
  lat double precision,
  lng double precision,
  cell_km double precision DEFAULT 5.0
)
RETURNS TABLE(hex_q integer, hex_r integer)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  x double precision;
  y double precision;
  size double precision;
  q_frac double precision;
  r_frac double precision;
  s_frac double precision;
  q_round integer;
  r_round integer;
  s_round integer;
  q_diff double precision;
  r_diff double precision;
  s_diff double precision;
BEGIN
  -- Equirectangular approximation around India (avg lat ~ 24 deg)
  x := lng * 111.320 * cos(radians(24.0));
  y := lat * 110.574;
  size := cell_km;

  q_frac := (sqrt(3.0) / 3.0 * x - 1.0 / 3.0 * y) / size;
  r_frac := (2.0 / 3.0 * y) / size;
  s_frac := -q_frac - r_frac;

  q_round := round(q_frac);
  r_round := round(r_frac);
  s_round := round(s_frac);

  q_diff := abs(q_round - q_frac);
  r_diff := abs(r_round - r_frac);
  s_diff := abs(s_round - s_frac);

  IF q_diff > r_diff AND q_diff > s_diff THEN
    q_round := -r_round - s_round;
  ELSIF r_diff > s_diff THEN
    r_round := -q_round - s_round;
  END IF;

  hex_q := q_round;
  hex_r := r_round;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION hex_ring(center_q integer, center_r integer, radius integer)
RETURNS TABLE(q integer, r integer)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  directions integer[][] := ARRAY[
    ARRAY[1, 0], ARRAY[1, -1], ARRAY[0, -1],
    ARRAY[-1, 0], ARRAY[-1, 1], ARRAY[0, 1]
  ];
  curr_q integer;
  curr_r integer;
  i integer;
  j integer;
BEGIN
  IF radius = 0 THEN
    q := center_q;
    r := center_r;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Start at center + directions[5] * radius
  curr_q := center_q + directions[5][1] * radius;
  curr_r := center_r + directions[5][2] * radius;

  FOR i IN 1..6 LOOP
    FOR j IN 1..radius LOOP
      q := curr_q;
      r := curr_r;
      RETURN NEXT;
      curr_q := curr_q + directions[i][1];
      curr_r := curr_r + directions[i][2];
    END LOOP;
  END LOOP;
END;
$$;

-- 9. Views with security_invoker = true
CREATE OR REPLACE VIEW v_order_status
WITH (security_invoker = true)
AS
SELECT
  o.id AS order_id,
  o.buyer_id,
  o.farmer_id,
  o.listing_id,
  o.pool_id,
  o.fulfilment AS fulfilment_status,
  o.payment AS payment_status,
  o.payout AS payout_status,
  p.paypal_order_ref,
  p.paypal_capture_ref,
  p.environment,
  o.total_amount_paise,
  o.quantity_kg,
  o.created_at,
  o.updated_at
FROM orders o
LEFT JOIN payments p ON p.scope = 'order' AND p.reference_id = o.id;

CREATE OR REPLACE VIEW v_contribution_status
WITH (security_invoker = true)
AS
SELECT
  c.id AS contribution_id,
  c.pool_id,
  c.farmer_id,
  c.committed_kg,
  c.accepted_kg,
  c.fulfilment AS fulfilment_status,
  c.payment AS payment_status,
  c.payout AS payout_status,
  c.collection_point_id,
  p.status AS pool_status,
  p.deadline,
  c.created_at
FROM pool_contributions c
JOIN pools p ON p.id = c.pool_id;

CREATE OR REPLACE VIEW v_pool_progress
WITH (security_invoker = true)
AS
SELECT
  p.id AS pool_id,
  p.requirement_id,
  p.industry_id,
  p.waste_type,
  p.target_kg,
  p.committed_kg,
  GREATEST(0, p.target_kg - p.committed_kg) AS remaining_kg,
  CASE
    WHEN p.target_kg > 0 THEN LEAST(100, ROUND((p.committed_kg / p.target_kg) * 100))
    ELSE 0
  END AS percent_full,
  p.contribution_count,
  p.status,
  p.radius_km,
  p.expanded,
  p.deadline,
  EXTRACT(DAY FROM (p.deadline - now())) AS days_left,
  p.created_at
FROM pools p;

CREATE OR REPLACE VIEW v_reputation_breakdown
WITH (security_invoker = true)
AS
SELECT
  pr.id AS user_id,
  pr.name,
  pr.role,
  pr.reputation_score,
  pr.reputation_factors,
  pr.payout_readiness,
  pr.verified
FROM profiles pr;

-- 10. Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE pools;
ALTER PUBLICATION supabase_realtime ADD TABLE pool_contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE farmer_payables;
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE pool_change_proposals;

