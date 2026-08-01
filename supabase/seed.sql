-- Development seed data. No real personal data — names, emails, phone
-- numbers and documents below are all fictional.
--
-- Uses fixed UUIDs (not gen_random_uuid()) purely so later statements in
-- this same script can reference earlier rows without a round-trip SELECT.
-- Safe to run repeatedly against a fresh dev database; not idempotent
-- against a database that already has this seed applied.

-- This seed inserts profiles explicitly with fixed ids (see comment above),
-- but on_auth_user_created would also fire on every auth.users insert
-- below and create its own (randomly-id'd) profiles/driver_profiles rows,
-- colliding with the explicit inserts further down. Disable it for the
-- duration of this script only.
alter table auth.users disable trigger on_auth_user_created;

-- ---------------------------------------------------------------------------
-- auth.users — one customer, two drivers, one admin.
-- Dev-only password for all four: "VezutoDev123!"
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'zakaznik.demo@vezuto.dev',
   crypt('VezutoDev123!', gen_salt('bf')), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'ridic.tomas.demo@vezuto.dev',
   crypt('VezutoDev123!', gen_salt('bf')), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', 'ridic.petra.demo@vezuto.dev',
   crypt('VezutoDev123!', gen_salt('bf')), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000004',
   'authenticated', 'authenticated', 'admin.demo@vezuto.dev',
   crypt('VezutoDev123!', gen_salt('bf')), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000005',
   'authenticated', 'authenticated', 'zakaznik2.demo@vezuto.dev',
   crypt('VezutoDev123!', gen_salt('bf')), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
insert into profiles (id, auth_user_id, role, first_name, last_name, email, phone) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'customer', 'Eva', 'Svobodová', 'zakaznik.demo@vezuto.dev', '+420600000001'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'driver', 'Tomáš', 'Novák', 'ridic.tomas.demo@vezuto.dev', '+420600000002'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003',
   'driver', 'Petra', 'Dvořáková', 'ridic.petra.demo@vezuto.dev', '+420600000003'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004',
   'admin', 'Admin', 'VezuTo', 'admin.demo@vezuto.dev', '+420600000004'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005',
   'customer', 'Jakub', 'Král', 'zakaznik2.demo@vezuto.dev', '+420600000005');

-- ---------------------------------------------------------------------------
-- driver_profiles + vehicles + one document each
-- ---------------------------------------------------------------------------
insert into driver_profiles (
  id, profile_id, verification_status, service_radius_km,
  home_latitude, home_longitude, completed_jobs_count, is_available
) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
   'verified', 15, 50.0755, 14.4378, 1, true),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003',
   'pending', 10, 50.0880, 14.4208, 0, true);

insert into vehicles (
  driver_profile_id, vehicle_type, brand, model, registration_number,
  cargo_length_cm, cargo_width_cm, cargo_height_cm, max_payload_kg
) values
  ('c0000000-0000-4000-8000-000000000001', 'estate_car', 'Škoda', 'Octavia Combi',
   '1AB2345', 180, 100, 90, 500),
  ('c0000000-0000-4000-8000-000000000002', 'small_van', 'Fiat', 'Doblo Cargo',
   '2CD6789', 220, 140, 130, 800);

insert into driver_documents (driver_profile_id, document_type, storage_path, verification_status, reviewed_by, reviewed_at) values
  ('c0000000-0000-4000-8000-000000000001', 'drivers_license', 'driver-documents/demo-tomas-license.pdf',
   'verified', 'b0000000-0000-4000-8000-000000000004', now()),
  ('c0000000-0000-4000-8000-000000000002', 'drivers_license', 'driver-documents/demo-petra-license.pdf',
   'pending', null, null);

-- ---------------------------------------------------------------------------
-- Orders in different states, per spec: completed, in progress, unclaimed,
-- and still a draft.
-- ---------------------------------------------------------------------------
insert into orders (
  id, customer_profile_id, assigned_driver_profile_id, status,
  item_title, item_category, item_description, item_count,
  estimated_weight_kg, length_cm, width_cm, height_cm,
  requested_vehicle_type, assistance_level,
  requested_date, requested_time_from, requested_time_to, is_flexible,
  customer_price_czk, driver_payout_czk, platform_fee_czk, pricing_breakdown,
  payment_status, payout_status, completed_at
) values
  (
    'e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000002', 'completed',
    'Rohová sedačka', 'sofa', 'Šedá rohová sedačka, koupeno na Facebook Marketplace.', 1,
    60, 250, 160, 80, 'estate_car', 'driver_plus_one',
    current_date - 5, '10:00', '12:00', false,
    890.00, 712.00, 178.00,
    '{"base_czk":299,"distance_km":8,"distance_fee_czk":144,"duration_min":25,"duration_fee_czk":75,"helper_surcharge_czk":350,"floor_surcharge_czk":0,"platform_fee_pct":20}'::jsonb,
    'paid', 'paid', now() - interval '4 days'
  ),
  (
    'e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000003', 'in_transit',
    'Skříň z Bazoše', 'wardrobe', 'Třídveřová skříň, potřeba demontáž.', 1,
    45, 200, 60, 220, 'small_van', 'driver_plus_one',
    current_date, '14:00', '16:00', false,
    690.00, 552.00, 138.00,
    '{"base_czk":299,"distance_km":6,"distance_fee_czk":108,"duration_min":20,"duration_fee_czk":60,"helper_surcharge_czk":350,"floor_surcharge_czk":80,"platform_fee_pct":20}'::jsonb,
    'paid', 'pending', null
  ),
  (
    'e0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001',
    null, 'awaiting_driver',
    'Pračka', 'appliance', 'Automatická pračka, potřeba jen odvoz.', 1,
    70, 60, 60, 85, 'personal_car', 'driver_helps',
    current_date + 2, '09:00', '11:00', true,
    790.00, 632.00, 158.00,
    '{"base_czk":299,"distance_km":9,"distance_fee_czk":162,"duration_min":22,"duration_fee_czk":66,"helper_surcharge_czk":0,"floor_surcharge_czk":80,"platform_fee_pct":20}'::jsonb,
    'pending', 'pending', null
  ),
  (
    'e0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001',
    null, 'draft',
    'Fitness stroj', 'sports_equipment', null, 1,
    null, null, null, null, null, 'driver_only',
    null, null, null, true,
    null, null, null, null,
    'pending', 'pending', null
  ),
  (
    'e0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000005',
    null, 'submitted',
    'Kancelářský stůl', 'office_equipment', 'Rohový stůl z domácí kanceláře.', 1,
    30, 140, 70, 75, 'personal_car', 'driver_only',
    current_date + 1, '17:00', '19:00', true,
    599.00, 479.00, 120.00,
    '{"base_czk":299,"distance_km":5,"distance_fee_czk":90,"duration_min":15,"duration_fee_czk":45,"helper_surcharge_czk":0,"floor_surcharge_czk":0,"platform_fee_pct":20}'::jsonb,
    'pending', 'pending', null
  );

insert into order_locations (order_id, location_type, full_address, latitude, longitude, floor, has_elevator, contact_name, contact_phone) values
  ('e0000000-0000-4000-8000-000000000001', 'pickup', 'Korunní 810/104, Praha 10', 50.0777, 14.4590, 3, true, 'Eva Svobodová', '+420600000001'),
  ('e0000000-0000-4000-8000-000000000001', 'destination', 'Milady Horákové 15, Praha 7', 50.0975, 14.4189, 1, false, 'Eva Svobodová', '+420600000001'),
  ('e0000000-0000-4000-8000-000000000002', 'pickup', 'Vinohradská 91, Praha 3', 50.0791, 14.4536, 2, false, 'Eva Svobodová', '+420600000001'),
  ('e0000000-0000-4000-8000-000000000002', 'destination', 'Bubenečská 12, Praha 6', 50.1017, 14.3969, 4, true, 'Eva Svobodová', '+420600000001'),
  ('e0000000-0000-4000-8000-000000000003', 'pickup', 'Sokolovská 220, Praha 9', 50.1073, 14.4740, 5, false, 'Eva Svobodová', '+420600000001'),
  ('e0000000-0000-4000-8000-000000000003', 'destination', 'Legerova 65, Praha 2', 50.0755, 14.4342, 2, true, 'Eva Svobodová', '+420600000001'),
  ('e0000000-0000-4000-8000-000000000005', 'pickup', 'Karlínské náměstí 12, Praha 8', 50.0940, 14.4490, 1, true, 'Jakub Král', '+420600000005'),
  ('e0000000-0000-4000-8000-000000000005', 'destination', 'Malá Strana 5, Praha 1', 50.0836, 14.4084, 0, false, 'Jakub Král', '+420600000005');

insert into order_images (order_id, uploaded_by_profile_id, image_type, storage_path) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'item_reference', 'order-images/demo-order-1-item.jpg'),
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'proof_of_delivery', 'order-images/demo-order-1-delivered.jpg'),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'item_reference', 'order-images/demo-order-2-item.jpg');

insert into order_status_history (order_id, previous_status, new_status, changed_by_profile_id) values
  ('e0000000-0000-4000-8000-000000000001', 'submitted', 'awaiting_driver', 'b0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000001', 'awaiting_driver', 'driver_assigned', 'b0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000001', 'delivered', 'completed', 'b0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000002', 'submitted', 'awaiting_driver', 'b0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000002', 'awaiting_driver', 'driver_assigned', 'b0000000-0000-4000-8000-000000000003');

insert into messages (order_id, sender_profile_id, message_type, content) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'system', 'Řidič Tomáš přijal zakázku.'),
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'text', 'Dobrý den, budu doma od 10:00, zvonek je dole.'),
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'text', 'Dobrý den, budu tam přesně na čas.'),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'system', 'Řidička Petra přijala zakázku.'),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003', 'text', 'Dobrý den, skříň už mám naloženou, jedu k vám.');

insert into payments (order_id, provider, amount_czk, status) values
  ('e0000000-0000-4000-8000-000000000001', 'mock', 890.00, 'paid'),
  ('e0000000-0000-4000-8000-000000000002', 'mock', 690.00, 'paid');

insert into payouts (order_id, driver_profile_id, amount_czk, status) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 712.00, 'paid');

insert into ratings (order_id, reviewer_profile_id, reviewed_profile_id, rating, comment) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
   5, 'Rychlé a opatrné, doporučuji.');

alter table auth.users enable trigger on_auth_user_created;
