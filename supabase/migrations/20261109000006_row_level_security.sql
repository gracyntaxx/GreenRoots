-- Migration 06: Row Level Security (RLS) on all tables

-- Enable RLS across every table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
CREATE POLICY profiles_select_public ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_update_owner ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_admin_all ON profiles
  FOR ALL TO authenticated
  USING (is_admin());

-- 2. PAYOUT ACCOUNTS (Strict isolation)
CREATE POLICY payout_accounts_owner ON payout_accounts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY payout_accounts_admin ON payout_accounts
  FOR SELECT TO authenticated
  USING (is_admin());

-- 3. INDUSTRY VERIFICATIONS
CREATE POLICY verifications_select_owner ON industry_verifications
  FOR SELECT TO authenticated
  USING (industry_id = auth.uid() OR is_admin());

CREATE POLICY verifications_insert_owner ON industry_verifications
  FOR INSERT TO authenticated
  WITH CHECK (industry_id = auth.uid() AND auth_role() = 'industry');

CREATE POLICY verifications_admin_all ON industry_verifications
  FOR ALL TO authenticated
  USING (is_admin());

-- 4. COLLECTION POINTS
CREATE POLICY collection_points_select_active ON collection_points
  FOR SELECT TO authenticated
  USING (active = true OR is_admin());

CREATE POLICY collection_points_admin_all ON collection_points
  FOR ALL TO authenticated
  USING (is_admin());

-- 5. LISTINGS
CREATE POLICY listings_select_active ON listings
  FOR SELECT TO authenticated
  USING (status = 'Active' OR farmer_id = auth.uid() OR is_admin());

CREATE POLICY listings_insert_farmer ON listings
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid() AND auth_role() = 'farmer');

CREATE POLICY listings_update_farmer ON listings
  FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid() OR is_admin())
  WITH CHECK (farmer_id = auth.uid() OR is_admin());

CREATE POLICY listings_delete_farmer ON listings
  FOR DELETE TO authenticated
  USING (farmer_id = auth.uid() OR is_admin());

-- 6. REQUIREMENTS
CREATE POLICY requirements_select ON requirements
  FOR SELECT TO authenticated
  USING (status IN ('Open', 'Fulfilled') OR industry_id = auth.uid() OR is_admin());

CREATE POLICY requirements_insert_industry ON requirements
  FOR INSERT TO authenticated
  WITH CHECK (industry_id = auth.uid() AND auth_role() = 'industry');

CREATE POLICY requirements_update_industry ON requirements
  FOR UPDATE TO authenticated
  USING (industry_id = auth.uid() OR is_admin())
  WITH CHECK (industry_id = auth.uid() OR is_admin());

-- 7. POOLS
CREATE POLICY pools_select ON pools
  FOR SELECT TO authenticated
  USING (status IN ('Open', 'Ready for Pickup', 'Settled') OR industry_id = auth.uid() OR is_admin());

CREATE POLICY pools_admin_all ON pools
  FOR ALL TO authenticated
  USING (is_admin());

-- 8. POOL CHANGE PROPOSALS
CREATE POLICY pool_proposals_select ON pool_change_proposals
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM pools p WHERE p.id = pool_id AND (p.industry_id = auth.uid() OR is_admin()))
  );

CREATE POLICY pool_proposals_update_industry ON pool_change_proposals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM pools p WHERE p.id = pool_id AND (p.industry_id = auth.uid() OR is_admin()))
  );

-- 9. POOL CONTRIBUTIONS
CREATE POLICY contributions_select ON pool_contributions
  FOR SELECT TO authenticated
  USING (
    farmer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM pools p WHERE p.id = pool_id AND p.industry_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY contributions_insert_farmer ON pool_contributions
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid() AND auth_role() = 'farmer');

CREATE POLICY contributions_update ON pool_contributions
  FOR UPDATE TO authenticated
  USING (
    farmer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM pools p WHERE p.id = pool_id AND p.industry_id = auth.uid())
    OR is_admin()
  );

-- 10. ORDERS
CREATE POLICY orders_select ON orders
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR is_admin());

CREATE POLICY orders_insert_buyer ON orders
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY orders_update ON orders
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR is_admin());

-- 11. PAYMENTS (Clients can never write payments directly)
CREATE POLICY payments_select ON payments
  FOR SELECT TO authenticated
  USING (
    payer_id = auth.uid()
    OR is_admin()
    OR (scope = 'order' AND EXISTS (SELECT 1 FROM orders o WHERE o.id = reference_id AND o.farmer_id = auth.uid()))
  );

-- 12. PAYMENT STATUS HISTORY & WEBHOOK EVENTS (Admin & Service role only)
CREATE POLICY payment_history_admin ON payment_status_history
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY webhook_events_admin ON payment_webhook_events
  FOR SELECT TO authenticated
  USING (is_admin());

-- 13. FARMER PAYABLES & PAYOUTS
CREATE POLICY payables_select ON farmer_payables
  FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR is_admin());

CREATE POLICY payouts_select ON payouts
  FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR is_admin());

-- 14. REPUTATION RECORDS
CREATE POLICY reputation_select ON reputation_records
  FOR SELECT TO authenticated
  USING (true);

-- 15. FORECASTS & CROP CALENDAR
CREATE POLICY forecasts_select ON forecasts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY crop_calendar_select ON crop_calendar
  FOR SELECT TO authenticated
  USING (true);

-- 16. NOTIFICATIONS & PUSH TOKENS
CREATE POLICY notifications_select_owner ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_owner ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY push_tokens_owner ON push_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 17. MODERATION FLAGS & AUDIT LOGS
CREATE POLICY moderation_flags_admin ON moderation_flags
  FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY ai_audit_admin ON ai_action_audit
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY audit_log_admin ON audit_log
  FOR SELECT TO authenticated
  USING (is_admin());

-- 18. PLATFORM SETTINGS
CREATE POLICY platform_settings_select ON platform_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY platform_settings_admin ON platform_settings
  FOR UPDATE TO authenticated
  USING (is_admin());

-- Storage Bucket setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'industry-docs',
  'industry-docs',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_industry_docs_owner ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'industry-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  )
  WITH CHECK (
    bucket_id = 'industry-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

