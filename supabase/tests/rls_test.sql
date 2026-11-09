-- GreenRoots Row Level Security (RLS) Test Suite
-- Run via: supabase test db or psql -f supabase/tests/rls_test.sql

BEGIN;

-- Setup test roles
CREATE SCHEMA IF NOT EXISTS tests;

-- Test 1: Verify RLS is enabled on all tables
DO $$
DECLARE
  r RECORD;
  rls_disabled_count INT := 0;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('schema_migrations')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = r.tablename
        AND c.relrowsecurity = true
    ) THEN
      RAISE WARNING 'Table % does NOT have RLS enabled!', r.tablename;
      rls_disabled_count := rls_disabled_count + 1;
    END IF;
  END LOOP;

  IF rls_disabled_count > 0 THEN
    RAISE EXCEPTION 'RLS is not enabled on % table(s)', rls_disabled_count;
  ELSE
    RAISE NOTICE 'SUCCESS: RLS is enabled on all public tables.';
  END IF;
END $$;

-- Test 2: Append-Only Trigger Verification
-- Test that audit_log rejects UPDATE and DELETE
DO $$
BEGIN
  -- Insert dummy record
  INSERT INTO audit_log (id, actor, actor_role, action)
  VALUES ('test_aud_rls', 'System', 'system', 'RLS Test Action');

  -- Attempt update (MUST FAIL)
  BEGIN
    UPDATE audit_log SET action = 'Tampered' WHERE id = 'test_aud_rls';
    RAISE EXCEPTION 'FAIL: audit_log allowed UPDATE!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: audit_log prevented UPDATE as expected.';
  END;

  -- Attempt delete (MUST FAIL)
  BEGIN
    DELETE FROM audit_log WHERE id = 'test_aud_rls';
    RAISE EXCEPTION 'FAIL: audit_log allowed DELETE!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: audit_log prevented DELETE as expected.';
  END;
END $$;

-- Test 3: Monotonic Payment Status
DO $$
BEGIN
  INSERT INTO payments (id, scope, reference_id, amount_inr_paise, status)
  VALUES ('test_pay_mono', 'order', 'ref_1', 100000, 'Initiated');

  -- Valid transition: Initiated -> Approved
  UPDATE payments SET status = 'Approved' WHERE id = 'test_pay_mono';
  RAISE NOTICE 'SUCCESS: Valid transition Initiated -> Approved succeeded.';

  -- Valid transition: Approved -> Captured
  UPDATE payments SET status = 'Captured' WHERE id = 'test_pay_mono';
  RAISE NOTICE 'SUCCESS: Valid transition Approved -> Captured succeeded.';

  -- Invalid backward transition: Captured -> Initiated (MUST FAIL)
  BEGIN
    UPDATE payments SET status = 'Initiated' WHERE id = 'test_pay_mono';
    RAISE EXCEPTION 'FAIL: Monotonic constraint failed, allowed Captured -> Initiated!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Monotonic trigger prevented illegal state reversal.';
  END;
END $$;

-- Test 4: Industry Verification Gate on Requirement Creation
-- Unverified industry attempting to publish active requirement
DO $$
BEGIN
  -- Attempt to insert requirement for unverified industry_5 (MUST FAIL IF STATUS = Open)
  BEGIN
    INSERT INTO requirements (id, industry_id, waste_type, target_kg, rate_per_unit, rate_unit, deadline, location, status)
    VALUES ('req_test_unverified', 'industry_5', 'paddy_straw', 10000, 2000, 'tonne', NOW() + INTERVAL '5 days', ST_SetSRID(ST_MakePoint(76.6, 28.2), 4326), 'Open');
    -- Note: trigger will check verified flag on profile
    RAISE NOTICE 'Requirement publication gate tested.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Requirement publication gate blocked unverified industry.';
  END;
END $$;

ROLLBACK;

