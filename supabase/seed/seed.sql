-- GreenRoots Database Seed Script
-- Populates demo auth users, profiles, collection points, listings, requirements, pools, contributions, orders, payments, forecasts, and audits.

-- 0. Schema Helpers & Compatibility Aliases
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation numeric(3, 2) GENERATED ALWAYS AS (reputation_score) STORED;
ALTER TABLE collection_points ADD COLUMN IF NOT EXISTS dropoffs_today integer GENERATED ALWAYS AS (drop_offs_today) STORED;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id text;
ALTER TABLE notifications ALTER COLUMN group_name DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- Temporarily disable protection triggers for deterministic seeding
ALTER TABLE profiles DISABLE TRIGGER trg_protect_profile;
ALTER TABLE audit_log DISABLE TRIGGER trg_audit_log_append_only;

-- Clean existing data
TRUNCATE TABLE
  audit_log,
  ai_action_audit,
  moderation_flags,
  notification_deliveries,
  notifications,
  crop_calendar,
  forecasts,
  payouts,
  farmer_payables,
  payment_webhook_events,
  payment_status_history,
  payments,
  orders,
  pool_contributions,
  pool_change_proposals,
  pools,
  requirements,
  listings,
  industry_verifications,
  collection_points,
  payout_accounts,
  profiles
CASCADE;

-- 1. Collection Points
INSERT INTO collection_points (id, name, village, district, state, location, capacity_tonnes, hours, active, drop_offs_today) VALUES
('cp_rewari_central', 'Rewari Central Hub', 'Rewari', 'Rewari', 'Haryana', ST_SetSRID(ST_MakePoint(76.618, 28.199), 4326)::geography, 120, '6:00 AM – 8:00 PM', true, 14),
('cp_rewari_south', 'Rewari South Mandi', 'Bawal', 'Rewari', 'Haryana', ST_SetSRID(ST_MakePoint(76.589, 28.071), 4326)::geography, 80, '7:00 AM – 6:00 PM', true, 9),
('cp_panipat', 'Panipat Grain Market Yard', 'Panipat', 'Panipat', 'Haryana', ST_SetSRID(ST_MakePoint(76.971, 29.388), 4326)::geography, 200, '5:30 AM – 9:00 PM', true, 22),
('cp_karnal', 'Karnal Co-op Yard', 'Karnal', 'Karnal', 'Haryana', ST_SetSRID(ST_MakePoint(76.988, 29.691), 4326)::geography, 150, '6:00 AM – 7:00 PM', true, 11),
('cp_ludhiana', 'Ludhiana Village Hub', 'Jagraon', 'Ludhiana', 'Punjab', ST_SetSRID(ST_MakePoint(75.473, 30.787), 4326)::geography, 160, '6:00 AM – 8:00 PM', true, 17),
('cp_sangrur', 'Sangrur Mandi Point', 'Sangrur', 'Sangrur', 'Punjab', ST_SetSRID(ST_MakePoint(75.844, 30.240), 4326)::geography, 110, '6:30 AM – 7:30 PM', true, 8),
('cp_nashik', 'Nashik Agri Yard', 'Nashik', 'Nashik', 'Maharashtra', ST_SetSRID(ST_MakePoint(73.790, 19.999), 4326)::geography, 140, '6:00 AM – 8:00 PM', true, 13),
('cp_kolhapur', 'Kolhapur Sugar Belt Hub', 'Kolhapur', 'Kolhapur', 'Maharashtra', ST_SetSRID(ST_MakePoint(74.243, 16.700), 4326)::geography, 180, '5:00 AM – 9:00 PM', false, 0);

-- 2. Auth Users & Profiles (Farmers, Buyers, Industries, Admin)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, phone, encrypted_password, email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer1@greenroots.test', '9812345670', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Ramesh Yadav","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer2@greenroots.test', '9812345671', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Sunita Devi","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer3@greenroots.test', '9812345672', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Mahender Singh","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer4@greenroots.test', '9812345673', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Gurpreet Kaur","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer5@greenroots.test', '9812345674', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Balwinder Singh","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer6@greenroots.test', '9812345675', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Anil Patil","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer7@greenroots.test', '9812345676', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Kavita Shinde","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer8@greenroots.test', '9812345677', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Suresh Jadhav","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer9@greenroots.test', '9812345678', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Rajesh Kumar","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer10@greenroots.test', '9812345679', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Fatima Begum","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer11@greenroots.test', '9812345680', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Dinesh Rathi","role":"farmer"}'::jsonb, now(), now()),
('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farmer12@greenroots.test', '9812345681', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Prakash More","role":"farmer"}'::jsonb, now(), now()),
('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'buyer@amittraders.example', '9822334455', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{"name":"Amit Traders","role":"buyer"}'::jsonb, now(), now()),
('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'procurement@panipatbiomass.example', '9833445566', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Panipat Biomass Energy Ltd","role":"industry"}'::jsonb, now(), now()),
('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'buy@haryanagreenfuels.example', '9844556677', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Haryana Green Fuels","role":"industry"}'::jsonb, now(), now()),
('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supply@ludhianaagro.example', '9855667788', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Ludhiana Agro Pellets","role":"industry"}'::jsonb, now(), now()),
('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'biomass@nashikpower.example', '9866778899', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Nashik Sugarcane Power","role":"industry"}'::jsonb, now(), now()),
('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'info@rewaribio.example', '9877889900', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Rewari Bio-Products","role":"industry"}'::jsonb, now(), now()),
('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'info@apexbiomass.example', '9888990011', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Apex Bioenergy Corp","role":"industry"}'::jsonb, now(), now()),
('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@greenroots.example', '9899001122', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Priya Menon","role":"admin"}'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Populate profiles entries with full details
INSERT INTO profiles (id, name, role, phone, email, village, district, state, language, location, reputation_score, reputation_factors, payout_readiness, verified, avatar_initials, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Ramesh Yadav', 'farmer', '9812345670', NULL, 'Rewari', 'Rewari', 'Haryana', 'hi', ST_SetSRID(ST_MakePoint(76.617, 28.197), 4326)::geography, 4.6, '[{"key":"deliveries","label":"Completed deliveries","value":"38","weight":30},{"key":"ontime","label":"On-time rate","value":"96%","weight":25}]'::jsonb, 'Ready', true, 'RY', '2023-11-02 00:00:00+00'),
('a0000000-0000-0000-0000-000000000002', 'Sunita Devi', 'farmer', '9812345671', NULL, 'Bawal', 'Rewari', 'Haryana', 'hi', ST_SetSRID(ST_MakePoint(76.585, 28.075), 4326)::geography, 4.9, '[{"key":"deliveries","label":"Completed deliveries","value":"61","weight":30}]'::jsonb, 'Ready', true, 'SD', '2023-06-18 00:00:00+00'),
('a0000000-0000-0000-0000-000000000003', 'Mahender Singh', 'farmer', '9812345672', NULL, 'Panipat', 'Panipat', 'Haryana', 'hi', ST_SetSRID(ST_MakePoint(76.960, 29.390), 4326)::geography, 4.2, '[]'::jsonb, 'Ready', true, 'MS', '2024-01-09 00:00:00+00'),
('a0000000-0000-0000-0000-000000000004', 'Gurpreet Kaur', 'farmer', '9812345673', NULL, 'Jagraon', 'Ludhiana', 'Punjab', 'pa', ST_SetSRID(ST_MakePoint(75.473, 30.787), 4326)::geography, 4.8, '[]'::jsonb, 'Ready', true, 'GK', '2023-04-22 00:00:00+00'),
('a0000000-0000-0000-0000-000000000005', 'Balwinder Singh', 'farmer', '9812345674', NULL, 'Sangrur', 'Sangrur', 'Punjab', 'pa', ST_SetSRID(ST_MakePoint(75.842, 30.245), 4326)::geography, 4.7, '[]'::jsonb, 'Ready', true, 'BS', '2023-09-14 00:00:00+00'),
('a0000000-0000-0000-0000-000000000006', 'Anil Patil', 'farmer', '9812345675', NULL, 'Nashik', 'Nashik', 'Maharashtra', 'mr', ST_SetSRID(ST_MakePoint(73.789, 19.997), 4326)::geography, 4.3, '[]'::jsonb, 'Ready', true, 'AP', '2024-02-01 00:00:00+00'),
('a0000000-0000-0000-0000-000000000007', 'Kavita Shinde', 'farmer', '9812345676', NULL, 'Kolhapur', 'Kolhapur', 'Maharashtra', 'mr', ST_SetSRID(ST_MakePoint(74.243, 16.705), 4326)::geography, 4.5, '[]'::jsonb, 'Not set up', false, 'KS', '2024-03-11 00:00:00+00'),
('a0000000-0000-0000-0000-000000000008', 'Suresh Jadhav', 'farmer', '9812345677', NULL, 'Ratnagiri', 'Ratnagiri', 'Maharashtra', 'mr', ST_SetSRID(ST_MakePoint(73.312, 16.990), 4326)::geography, 4.0, '[]'::jsonb, 'Ready', true, 'SJ', '2024-05-30 00:00:00+00'),
('a0000000-0000-0000-0000-000000000009', 'Rajesh Kumar', 'farmer', '9812345678', NULL, 'Karnal', 'Karnal', 'Haryana', 'hi', ST_SetSRID(ST_MakePoint(76.990, 29.686), 4326)::geography, 4.4, '[]'::jsonb, 'Ready', true, 'RK', '2023-12-19 00:00:00+00'),
('a0000000-0000-0000-0000-000000000010', 'Fatima Begum', 'farmer', '9812345679', NULL, 'Panipat', 'Panipat', 'Haryana', 'hi', ST_SetSRID(ST_MakePoint(76.950, 29.377), 4326)::geography, 4.6, '[]'::jsonb, 'Ready', true, 'FB', '2023-08-08 00:00:00+00'),
('a0000000-0000-0000-0000-000000000011', 'Dinesh Rathi', 'farmer', '9812345680', NULL, 'Rewari', 'Rewari', 'Haryana', 'hi', ST_SetSRID(ST_MakePoint(76.630, 28.210), 4326)::geography, 3.9, '[]'::jsonb, 'Not set up', false, 'DR', '2024-07-04 00:00:00+00'),
('a0000000-0000-0000-0000-000000000012', 'Prakash More', 'farmer', '9812345681', NULL, 'Nashik', 'Nashik', 'Maharashtra', 'mr', ST_SetSRID(ST_MakePoint(73.770, 20.010), 4326)::geography, 4.1, '[]'::jsonb, 'Ready', true, 'PM', '2024-04-16 00:00:00+00'),
('b0000000-0000-0000-0000-000000000001', 'Amit Traders', 'buyer', '9822334455', 'buyer@amittraders.example', 'Rewari', 'Rewari', 'Haryana', 'hi', ST_SetSRID(ST_MakePoint(76.610, 28.190), 4326)::geography, 4.5, '[]'::jsonb, 'Ready', true, 'AT', '2023-10-01 00:00:00+00'),
('c0000000-0000-0000-0000-000000000001', 'Panipat Biomass Energy Ltd', 'industry', '9833445566', 'procurement@panipatbiomass.example', 'Panipat', 'Panipat', 'Haryana', 'en', ST_SetSRID(ST_MakePoint(76.963, 29.390), 4326)::geography, 4.7, '[]'::jsonb, 'Ready', true, 'PB', '2023-03-12 00:00:00+00'),
('c0000000-0000-0000-0000-000000000002', 'Haryana Green Fuels', 'industry', '9844556677', 'buy@haryanagreenfuels.example', 'Karnal', 'Karnal', 'Haryana', 'en', ST_SetSRID(ST_MakePoint(76.990, 29.690), 4326)::geography, 4.4, '[]'::jsonb, 'Ready', true, 'HG', '2023-07-19 00:00:00+00'),
('c0000000-0000-0000-0000-000000000003', 'Ludhiana Agro Pellets', 'industry', '9855667788', 'supply@ludhianaagro.example', 'Ludhiana', 'Ludhiana', 'Punjab', 'en', ST_SetSRID(ST_MakePoint(75.857, 30.901), 4326)::geography, 4.8, '[]'::jsonb, 'Ready', true, 'LA', '2022-11-23 00:00:00+00'),
('c0000000-0000-0000-0000-000000000004', 'Nashik Sugarcane Power', 'industry', '9866778899', 'biomass@nashikpower.example', 'Nashik', 'Nashik', 'Maharashtra', 'en', ST_SetSRID(ST_MakePoint(73.789, 19.997), 4326)::geography, 4.2, '[]'::jsonb, 'Ready', true, 'NS', '2024-01-15 00:00:00+00'),
('c0000000-0000-0000-0000-000000000005', 'Rewari Bio-Products', 'industry', '9877889900', 'info@rewaribio.example', 'Rewari', 'Rewari', 'Haryana', 'en', ST_SetSRID(ST_MakePoint(76.620, 28.200), 4326)::geography, 3.8, '[]'::jsonb, 'Ready', true, 'RB', '2024-09-02 00:00:00+00'),
('c0000000-0000-0000-0000-000000000006', 'Apex Bioenergy Corp', 'industry', '9888990011', 'info@apexbiomass.example', 'Rewari', 'Rewari', 'Haryana', 'en', ST_SetSRID(ST_MakePoint(76.620, 28.200), 4326)::geography, 4.0, '[]'::jsonb, 'Not set up', false, 'AB', '2024-10-01 00:00:00+00'),
('d0000000-0000-0000-0000-000000000001', 'Priya Menon', 'admin', '9899001122', 'admin@greenroots.example', 'New Delhi', 'New Delhi', 'Delhi', 'en', ST_SetSRID(ST_MakePoint(77.209, 28.614), 4326)::geography, 5.0, '[]'::jsonb, 'Ready', true, 'PM', '2023-01-01 00:00:00+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  village = EXCLUDED.village,
  district = EXCLUDED.district,
  state = EXCLUDED.state,
  language = EXCLUDED.language,
  location = EXCLUDED.location,
  reputation_score = EXCLUDED.reputation_score,
  reputation_factors = EXCLUDED.reputation_factors,
  payout_readiness = EXCLUDED.payout_readiness,
  verified = EXCLUDED.verified,
  avatar_initials = EXCLUDED.avatar_initials;

-- Re-enable protection triggers
ALTER TABLE profiles ENABLE TRIGGER trg_protect_profile;
ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_append_only;

-- 3. Industry Verifications (all active requirements industries are Verified; Apex is Pending for Admin test)
INSERT INTO industry_verifications (id, industry_id, business_name, license_number, registered_address, contact_person, documents, status, reviewed_by, reviewed_at) VALUES
('ver_1', 'c0000000-0000-0000-0000-000000000005', 'Rewari Bio-Products', 'HR-REW-2024-00871', 'Plot 14, Industrial Area, Rewari, Haryana 123401', 'Naveen Sharma', '["GST registration.pdf","Factory licence.pdf"]'::jsonb, 'Verified', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days'),
('ver_2', 'c0000000-0000-0000-0000-000000000004', 'Nashik Sugarcane Power', 'MH-NSK-2021-00442', 'Gat 220, Sinnar Road, Nashik, Maharashtra 422112', 'Rohit Deshmukh', '["GST registration.pdf"]'::jsonb, 'Verified', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '28 days'),
('ver_3', 'c0000000-0000-0000-0000-000000000003', 'Ludhiana Agro Pellets', 'PB-LDH-2020-00119', 'Village Jagraon, Ludhiana, Punjab 142026', 'Harjeet Singh', '["GST registration.pdf"]'::jsonb, 'Verified', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '58 days'),
('ver_4', 'c0000000-0000-0000-0000-000000000002', 'Haryana Green Fuels', 'HR-KNL-2022-00307', 'Sector 12, Karnal, Haryana 132001', 'Meena Rani', '["GST registration.pdf"]'::jsonb, 'Verified', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '44 days'),
('ver_5', 'c0000000-0000-0000-0000-000000000001', 'Panipat Biomass Energy Ltd', 'HR-PAN-2023-00101', 'Plot 88, GT Road, Panipat, Haryana 132103', 'Sanjay Gupta', '["GST registration.pdf"]'::jsonb, 'Verified', 'd0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days'),
('ver_pending', 'c0000000-0000-0000-0000-000000000006', 'Apex Bioenergy Corp', 'HR-REW-2024-00999', 'Sector 3, Bawal Industrial Area, Haryana 123501', 'Anand Verma', '["GST registration.pdf","Consent to Operate.pdf"]'::jsonb, 'Pending', NULL, NULL);

-- 4. Requirements & Pools
INSERT INTO requirements (id, industry_id, waste_type, quantity_input, unit_input, target_kg, rate_input, rate_unit, rate_per_kg_paise, deadline, location, village, status, pool_id, notes, created_at) VALUES
('req_paddy_panipat', 'c0000000-0000-0000-0000-000000000001', 'paddy_straw', 100, 'tonne', 100000, 2300, 'tonne', 230, NOW() + INTERVAL '3 days', ST_SetSRID(ST_MakePoint(76.963, 29.390), 4326)::geography, 'Panipat', 'Open', 'pool_paddy_panipat', 'Dry straw, moisture below 18%.', NOW() - INTERVAL '4 days'),
('req_mustard_rewari', 'c0000000-0000-0000-0000-000000000005', 'mustard_stubble', 500, 'quintal', 50000, 1200, 'quintal', 1200, NOW() + INTERVAL '6 days', ST_SetSRID(ST_MakePoint(76.620, 28.200), 4326)::geography, 'Rewari', 'Open', 'pool_mustard_rewari', NULL, NOW() - INTERVAL '3 days'),
('req_husk_karnal', 'c0000000-0000-0000-0000-000000000002', 'rice_husk', 200, 'quintal', 20000, 950, 'quintal', 950, NOW() + INTERVAL '9 days', ST_SetSRID(ST_MakePoint(76.990, 29.690), 4326)::geography, 'Karnal', 'Open', 'pool_husk_karnal', 'Clean husk, no stones.', NOW() - INTERVAL '2 days'),
('req_wheat_ludhiana', 'c0000000-0000-0000-0000-000000000003', 'wheat_straw', 80, 'tonne', 80000, 1800, 'tonne', 180, NOW() - INTERVAL '4 days', ST_SetSRID(ST_MakePoint(75.857, 30.901), 4326)::geography, 'Ludhiana', 'Fulfilled', 'pool_wheat_ludhiana', NULL, NOW() - INTERVAL '20 days'),
('req_sugarcane_nashik', 'c0000000-0000-0000-0000-000000000004', 'sugarcane_trash', 120, 'tonne', 120000, 1500, 'tonne', 150, NOW() + INTERVAL '1 day', ST_SetSRID(ST_MakePoint(73.789, 19.997), 4326)::geography, 'Nashik', 'Open', 'pool_sugarcane_nashik', NULL, NOW() - INTERVAL '5 days'),
('req_cotton_sangrur', 'c0000000-0000-0000-0000-000000000003', 'cotton_stalk', 40, 'tonne', 40000, 1200, 'tonne', 120, NOW() + INTERVAL '5 days', ST_SetSRID(ST_MakePoint(75.842, 30.245), 4326)::geography, 'Sangrur', 'Open', 'pool_cotton_sangrur', NULL, NOW() - INTERVAL '2 days');

INSERT INTO pools (id, requirement_id, industry_id, waste_type, target_kg, committed_kg, accepted_kg, rate_per_unit, rate_unit, deadline, location, village, radius_km, status, contribution_count, created_at) VALUES
('pool_paddy_panipat', 'req_paddy_panipat', 'c0000000-0000-0000-0000-000000000001', 'paddy_straw', 100000, 62000, 0, 2300, 'tonne', NOW() + INTERVAL '3 days', ST_SetSRID(ST_MakePoint(76.963, 29.390), 4326)::geography, 'Panipat', 35, 'Open', 7, NOW() - INTERVAL '4 days'),
('pool_mustard_rewari', 'req_mustard_rewari', 'c0000000-0000-0000-0000-000000000005', 'mustard_stubble', 50000, 50000, 0, 1200, 'quintal', NOW() + INTERVAL '6 days', ST_SetSRID(ST_MakePoint(76.620, 28.200), 4326)::geography, 'Rewari', 35, 'Ready for Pickup', 5, NOW() - INTERVAL '3 days'),
('pool_husk_karnal', 'req_husk_karnal', 'c0000000-0000-0000-0000-000000000002', 'rice_husk', 20000, 8000, 0, 950, 'quintal', NOW() + INTERVAL '9 days', ST_SetSRID(ST_MakePoint(76.990, 29.690), 4326)::geography, 'Karnal', 60, 'Open', 3, NOW() - INTERVAL '2 days'),
('pool_wheat_ludhiana', 'req_wheat_ludhiana', 'c0000000-0000-0000-0000-000000000003', 'wheat_straw', 80000, 80000, 80000, 1800, 'tonne', NOW() - INTERVAL '4 days', ST_SetSRID(ST_MakePoint(75.857, 30.901), 4326)::geography, 'Ludhiana', 35, 'Completed', 4, NOW() - INTERVAL '20 days'),
('pool_sugarcane_nashik', 'req_sugarcane_nashik', 'c0000000-0000-0000-0000-000000000004', 'sugarcane_trash', 120000, 30000, 0, 1500, 'tonne', NOW() + INTERVAL '1 day', ST_SetSRID(ST_MakePoint(73.789, 19.997), 4326)::geography, 'Nashik', 35, 'Open', 2, NOW() - INTERVAL '5 days'),
('pool_cotton_sangrur', 'req_cotton_sangrur', 'c0000000-0000-0000-0000-000000000003', 'cotton_stalk', 40000, 40000, 0, 1200, 'tonne', NOW() + INTERVAL '5 days', ST_SetSRID(ST_MakePoint(75.842, 30.245), 4326)::geography, 'Sangrur', 35, 'Ready for Pickup', 4, NOW() - INTERVAL '2 days');

-- 5. Pool Contributions
INSERT INTO pool_contributions (id, pool_id, farmer_id, committed_kg, accepted_kg, agreed_rate_per_kg, collection_point_id, dropoff_token, fulfilment, payment, payout, created_at) VALUES
('pc_1', 'pool_paddy_panipat', 'a0000000-0000-0000-0000-000000000003', 15000, NULL, 2.30, 'cp_panipat', 'TK-7A12', 'Pending', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '3 days'),
('pc_2', 'pool_paddy_panipat', 'a0000000-0000-0000-0000-000000000010', 12000, NULL, 2.30, 'cp_panipat', 'TK-7A13', 'Pending', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '3 days'),
('pc_3', 'pool_paddy_panipat', 'a0000000-0000-0000-0000-000000000009', 10000, NULL, 2.30, 'cp_panipat', 'TK-7A14', 'Pending', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '2 days'),
('pc_4', 'pool_paddy_panipat', 'a0000000-0000-0000-0000-000000000002', 8000, NULL, 2.30, 'cp_rewari_south', 'TK-7A15', 'Pending', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '2 days'),
('pc_5', 'pool_paddy_panipat', 'a0000000-0000-0000-0000-000000000001', 7000, NULL, 2.30, 'cp_rewari_central', 'TK-7A16', 'Pending', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '1 day'),
('pc_6', 'pool_paddy_panipat', 'a0000000-0000-0000-0000-000000000011', 6000, NULL, 2.30, 'cp_rewari_central', 'TK-7A17', 'Pending', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '1 day'),
('pc_7', 'pool_paddy_panipat', 'a0000000-0000-0000-0000-000000000003', 4000, NULL, 2.30, 'cp_panipat', 'TK-7A18', 'Pending', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '10 hours'),

('pc_8', 'pool_mustard_rewari', 'a0000000-0000-0000-0000-000000000002', 20000, NULL, 12.00, 'cp_rewari_south', 'TK-8B21', 'Ready for Pickup', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '2 days'),
('pc_9', 'pool_mustard_rewari', 'a0000000-0000-0000-0000-000000000001', 12000, NULL, 12.00, 'cp_rewari_central', 'TK-8B22', 'Ready for Pickup', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '2 days'),
('pc_10', 'pool_mustard_rewari', 'a0000000-0000-0000-0000-000000000011', 8000, NULL, 12.00, 'cp_rewari_central', 'TK-8B23', 'Ready for Pickup', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '1 day'),
('pc_11', 'pool_mustard_rewari', 'a0000000-0000-0000-0000-000000000003', 6000, NULL, 12.00, 'cp_panipat', 'TK-8B24', 'Ready for Pickup', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '1 day'),
('pc_12', 'pool_mustard_rewari', 'a0000000-0000-0000-0000-000000000009', 4000, NULL, 12.00, 'cp_karnal', 'TK-8B25', 'Ready for Pickup', 'Initiated', 'Not Yet Due', NOW() - INTERVAL '12 hours'),

('pc_16', 'pool_wheat_ludhiana', 'a0000000-0000-0000-0000-000000000005', 30000, 30000, 1.80, 'cp_sangrur', 'TK-9C31', 'Completed', 'Captured', 'Completed', NOW() - INTERVAL '19 days'),
('pc_17', 'pool_wheat_ludhiana', 'a0000000-0000-0000-0000-000000000004', 25000, 25000, 1.80, 'cp_ludhiana', 'TK-9C32', 'Completed', 'Captured', 'Completed', NOW() - INTERVAL '19 days'),
('pc_18', 'pool_wheat_ludhiana', 'a0000000-0000-0000-0000-000000000001', 15000, 15000, 1.80, 'cp_rewari_central', 'TK-9C33', 'Completed', 'Captured', 'Simulated', NOW() - INTERVAL '18 days'),
('pc_19', 'pool_wheat_ludhiana', 'a0000000-0000-0000-0000-000000000002', 10000, 10000, 1.80, 'cp_rewari_south', 'TK-9C34', 'Completed', 'Captured', 'Pending', NOW() - INTERVAL '18 days');

-- 6. Farmer Payables (Wheat Pool)
INSERT INTO farmer_payables (id, pool_id, contribution_id, farmer_id, accepted_kg, agreed_rate_per_kg, gross_paise, commission_paise, net_paise, payout, is_simulated, created_at) VALUES
('payable_pc_16', 'pool_wheat_ludhiana', 'pc_16', 'a0000000-0000-0000-0000-000000000005', 30000, 1.80, 5400000, 270000, 5130000, 'Completed', false, NOW() - INTERVAL '17 days'),
('payable_pc_17', 'pool_wheat_ludhiana', 'pc_17', 'a0000000-0000-0000-0000-000000000004', 25000, 1.80, 4500000, 225000, 4275000, 'Completed', false, NOW() - INTERVAL '17 days'),
('payable_pc_18', 'pool_wheat_ludhiana', 'pc_18', 'a0000000-0000-0000-0000-000000000001', 15000, 1.80, 2700000, 135000, 2565000, 'Simulated', true, NOW() - INTERVAL '17 days'),
('payable_pc_19', 'pool_wheat_ludhiana', 'pc_19', 'a0000000-0000-0000-0000-000000000002', 10000, 1.80, 1800000, 90000, 1710000, 'Pending', false, NOW() - INTERVAL '17 days');

-- 7. Listings
INSERT INTO listings (id, farmer_id, waste_type, quantity_input, unit_input, quantity_kg, available_kg, rate_input, rate_unit, rate_per_kg_paise, village, collection_point_id, location, status, notes, created_at) VALUES
('listing_ricehusk_200', 'a0000000-0000-0000-0000-000000000001', 'rice_husk', 200, 'kg', 200, 200, 8, 'kg', 800, 'Rewari', 'cp_rewari_central', ST_SetSRID(ST_MakePoint(76.617, 28.197), 4326)::geography, 'Active', 'Dry husk stored under cover.', NOW() - INTERVAL '2 hours'),
('listing_mustard_1', 'a0000000-0000-0000-0000-000000000002', 'mustard_stubble', 50, 'quintal', 5000, 5000, 1200, 'quintal', 1200, 'Bawal', 'cp_rewari_south', ST_SetSRID(ST_MakePoint(76.585, 28.075), 4326)::geography, 'Active', NULL, NOW() - INTERVAL '5 hours'),
('listing_paddy_1', 'a0000000-0000-0000-0000-000000000003', 'paddy_straw', 12, 'tonne', 12000, 12000, 2300, 'tonne', 230, 'Panipat', 'cp_panipat', ST_SetSRID(ST_MakePoint(76.960, 29.390), 4326)::geography, 'Active', NULL, NOW() - INTERVAL '8 hours'),
('listing_wheat_1', 'a0000000-0000-0000-0000-000000000004', 'wheat_straw', 18, 'tonne', 18000, 0, 1800, 'tonne', 180, 'Jagraon', 'cp_ludhiana', ST_SetSRID(ST_MakePoint(75.473, 30.787), 4326)::geography, 'Reserved', NULL, NOW() - INTERVAL '12 hours'),
('listing_sugarcane_1', 'a0000000-0000-0000-0000-000000000005', 'sugarcane_trash', 9, 'tonne', 9000, 9000, 1500, 'tonne', 150, 'Sangrur', 'cp_sangrur', ST_SetSRID(ST_MakePoint(75.842, 30.245), 4326)::geography, 'Active', NULL, NOW() - INTERVAL '14 hours'),
('listing_cashew_1', 'a0000000-0000-0000-0000-000000000008', 'cashew_shell', 12, 'quintal', 1200, 1200, 900, 'quintal', 900, 'Ratnagiri', 'cp_kolhapur', ST_SetSRID(ST_MakePoint(73.312, 16.990), 4326)::geography, 'Active', NULL, NOW() - INTERVAL '15 hours'),
('listing_cotton_1', 'a0000000-0000-0000-0000-000000000006', 'cotton_stalk', 15, 'tonne', 15000, 15000, 1200, 'tonne', 120, 'Nashik', 'cp_nashik', ST_SetSRID(ST_MakePoint(73.789, 19.997), 4326)::geography, 'Active', NULL, NOW() - INTERVAL '16 hours'),
('listing_groundnut_1', 'a0000000-0000-0000-0000-000000000012', 'groundnut_shell', 24, 'quintal', 2400, 2400, 800, 'quintal', 800, 'Nashik', 'cp_nashik', ST_SetSRID(ST_MakePoint(73.770, 20.010), 4326)::geography, 'Active', NULL, NOW() - INTERVAL '18 hours'),
('listing_bagasse_1', 'a0000000-0000-0000-0000-000000000007', 'bagasse', 22, 'tonne', 22000, 0, 1100, 'tonne', 110, 'Kolhapur', 'cp_kolhapur', ST_SetSRID(ST_MakePoint(74.243, 16.705), 4326)::geography, 'Sold', NULL, NOW() - INTERVAL '24 hours'),
('listing_paddy_2', 'a0000000-0000-0000-0000-000000000010', 'paddy_straw', 7.5, 'tonne', 7500, 7500, 2400, 'tonne', 240, 'Panipat', 'cp_panipat', ST_SetSRID(ST_MakePoint(76.950, 29.377), 4326)::geography, 'Active', NULL, NOW() - INTERVAL '26 hours');

-- 8. Orders & Payments
INSERT INTO orders (id, listing_id, buyer_id, farmer_id, waste_type, quantity_kg, rate_per_unit, rate_unit, total_amount_paise, collection_point_id, fulfilment, payment, payout, paypal_order_ref, paypal_capture_ref, created_at) VALUES
('order_ricehusk_500', 'listing_paddy_2', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010', 'paddy_straw', 500, 2400, 'tonne', 120000, 'cp_panipat', 'Pending', 'Captured', 'Not Yet Due', 'PP-7K2A1M4QX', 'CAP-9D31B7', NOW() - INTERVAL '10 hours'),
('order_mustard_1000', 'listing_mustard_1', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'mustard_stubble', 1000, 1200, 'quintal', 1200000, 'cp_rewari_south', 'Completed', 'Captured', 'Completed', 'PP-8M3N2K9ZZ', 'CAP-4F82A1', NOW() - INTERVAL '3 days');

INSERT INTO payments (id, scope, reference_id, payer_id, amount_paise, charge_amount_minor, charge_currency, fx_rate, paypal_order_ref, paypal_capture_ref, status, environment, created_at) VALUES
('pay_order_ricehusk', 'order', 'order_ricehusk_500', 'b0000000-0000-0000-0000-000000000001', 120000, 14.28, 'USD', 84.0000, 'PP-7K2A1M4QX', 'CAP-9D31B7', 'Captured', 'sandbox', NOW() - INTERVAL '10 hours'),
('pay_pool_wheat', 'pool', 'pool_wheat_ludhiana', 'c0000000-0000-0000-0000-000000000003', 14400000, 1714.28, 'USD', 84.0000, 'PP-2W9E5L8QX', 'CAP-3A77D2', 'Captured', 'sandbox', NOW() - INTERVAL '18 days'),
('pay_pool_cotton', 'pool', 'pool_cotton_sangrur', 'c0000000-0000-0000-0000-000000000003', 4800000, 571.42, 'USD', 84.0000, 'PP-8C1V6R3QX', NULL, 'Approved', 'sandbox', NOW() - INTERVAL '5 hours');

-- 9. Forecasts & Crop Calendar
INSERT INTO forecasts (id, region, state, season, waste_type, data_period, sample_size, confidence, limited_data, points, explanation, actions) VALUES
('fc_haryana_paddy', 'Haryana (Rewari, Panipat, Karnal)', 'Haryana', 'Kharif 2026', 'paddy_straw', '2026 Q3–Q4', 1840, 'High', false, '[{"month":"Oct","price":2.10},{"month":"Nov","price":2.25},{"month":"Dec","price":2.30}]'::jsonb, 'Paddy straw supply peaks in November-December. High demand from regional bio-pellet plants keeps prices firm.', '[]'::jsonb),
('fc_punjab_wheat', 'Punjab (Ludhiana, Sangrur)', 'Punjab', 'Rabi 2026', 'wheat_straw', '2026 Q1–Q2', 2210, 'High', false, '[{"month":"Apr","price":1.75},{"month":"May","price":1.80}]'::jsonb, 'Wheat straw availability peaks in May. Steady demand for cattle fodder and packaging materials.', '[]'::jsonb),
('fc_maharashtra_sugarcane', 'Maharashtra (Nashik, Kolhapur)', 'Maharashtra', 'Crushing 2026–27', 'sugarcane_trash', '2026 Q4', 120, 'Low', true, '[{"month":"Nov","price":1.40},{"month":"Dec","price":1.50}]'::jsonb, 'There is not enough recorded history for this region to produce a definitive forecast.', '[]'::jsonb);

INSERT INTO crop_calendar (region, state, waste_type, harvest_start_month, harvest_end_month) VALUES
('Northern Plains', 'Haryana', 'paddy_straw', 10, 11),
('Northern Plains', 'Punjab', 'wheat_straw', 4, 5),
('Western Plains', 'Haryana', 'mustard_stubble', 2, 3),
('Sugar Belt', 'Maharashtra', 'sugarcane_trash', 11, 3);

-- 10. Notifications
INSERT INTO notifications (id, user_id, title, body, type, read, reference_id, created_at) VALUES
('n1', 'a0000000-0000-0000-0000-000000000001', 'New requirement 12 km away', 'Paddy straw · 100 tonnes needed in Panipat by 10 Nov.', 'pool', false, 'pool_paddy_panipat', NOW() - INTERVAL '8 minutes'),
('n2', 'a0000000-0000-0000-0000-000000000001', 'Pool is 62% filled', 'Paddy straw pool in Panipat still needs 38 tonnes.', 'pool', false, 'pool_paddy_panipat', NOW() - INTERVAL '35 minutes'),
('n3', 'a0000000-0000-0000-0000-000000000009', 'Pool area expanded to 60 km', 'Rice husk pool in Karnal now reaches more farmers.', 'pool', false, 'pool_husk_karnal', NOW() - INTERVAL '90 minutes'),
('n4', 'a0000000-0000-0000-0000-000000000002', 'Drop-off confirmed', '1,000 kg mustard stubble accepted at Bawal.', 'system', true, 'order_mustard_1000', NOW() - INTERVAL '200 minutes'),
('n5', 'b0000000-0000-0000-0000-000000000001', 'Payment captured', 'PayPal Sandbox captured ₹1,200 for order ORD-8841.', 'payment', true, 'order_ricehusk_500', NOW() - INTERVAL '610 minutes'),
('n6', NULL, 'Paddy straw demand rising', 'Demand is expected to rise in 3 weeks around Rewari.', 'seasonal', true, NULL, NOW() - INTERVAL '700 minutes'),
('n7', 'a0000000-0000-0000-0000-000000000005', 'Pool ready for pickup', 'Cotton stalk pool in Sangrur reached its target.', 'pool', true, 'pool_cotton_sangrur', NOW() - INTERVAL '900 minutes');

-- 11. Moderation Flags
INSERT INTO moderation_flags (id, kind, source, subject, subject_type, evidence, status, created_at) VALUES
('flag_1', 'ANOMALY', 'AI', 'Cashew shell listing · 1,200 quintals', 'listing', 'Declared quantity is 6x this farmer historical maximum.', 'Open', NOW() - INTERVAL '45 minutes'),
('flag_2', 'POLICY', 'Rule', 'Two listings with identical text from different accounts', 'listing', 'Listing text matches character-for-character within 4 minutes.', 'Open', NOW() - INTERVAL '180 minutes'),
('flag_3', 'ANOMALY', 'AI', 'Five orders to the same buyer within 24 hours', 'transaction', 'Buyer account is 6 days old. Orders total 48,000.', 'Open', NOW() - INTERVAL '400 minutes'),
('flag_4', 'POLICY', 'Rule', 'Listing claims government certified', 'listing', 'The phrase government certified is not permitted unless on file.', 'Dismissed', NOW() - INTERVAL '700 minutes');

-- 12. Audit Log
INSERT INTO audit_log (actor_id, actor_role, action, target, reference, at) VALUES
('b0000000-0000-0000-0000-000000000001', 'buyer', 'PayPal capture', 'order_ricehusk_500', 'PP-7K2A1M4QX / CAP-9D31B7', NOW() - INTERVAL '610 minutes'),
('a0000000-0000-0000-0000-000000000001', 'farmer', 'Listing published', 'listing_ricehusk_200', '200 kg rice husk at Rewari', NOW() - INTERVAL '700 minutes'),
('c0000000-0000-0000-0000-000000000001', 'industry', 'Requirement published', 'req_paddy_panipat', '100 tonnes paddy straw, Panipat', NOW() - INTERVAL '900 minutes'),
('d0000000-0000-0000-0000-000000000001', 'admin', 'Industry verified', 'ver_2', 'Verification review for Nashik Sugarcane Power', NOW() - INTERVAL '2000 minutes'),
('c0000000-0000-0000-0000-000000000003', 'industry', 'PayPal capture', 'pool_wheat_ludhiana', 'Pool settlement for 80,000 kg wheat straw', NOW() - INTERVAL '4980 minutes'),
('d0000000-0000-0000-0000-000000000001', 'admin', 'Payout approval', 'payout_batch_wheat_1', 'Payout batch for 4 farmers', NOW() - INTERVAL '5000 minutes');
