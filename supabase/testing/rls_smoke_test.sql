-- RLS smoke test — run after migrations + local-auth-stub.sql + seed.sql.
-- See README.md in this directory. Prints "NOTICE: OK — ..." per passing
-- assertion; the script aborts with an error on the first failure.
--
-- Postgres RLS has two different failure shapes and the assertions below
-- pick the matching one:
--   - a row excluded by USING is just silently absent — an UPDATE/DELETE
--     against it affects 0 rows, no error (assert_no_rows_affected /
--     assert_one_row_affected)
--   - a row that fails WITH CHECK, or a trigger that RAISEs, is a hard
--     error (assert_forbidden)

\set ON_ERROR_STOP on

create function test_assert(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition then
    raise notice 'OK — %', message;
  else
    raise exception 'FAIL — %', message;
  end if;
end;
$$;

create function assert_forbidden(stmt text, message text)
returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception
    when others then
      raise notice 'OK — % (odmítnuto: %)', message, sqlerrm;
      return;
  end;
  raise exception 'FAIL — % (mělo být odmítnuto, ale prošlo)', message;
end;
$$;

create function assert_no_rows_affected(stmt text, message text)
returns void language plpgsql as $$
declare
  affected integer;
begin
  execute stmt;
  get diagnostics affected = row_count;
  if affected = 0 then
    raise notice 'OK — %', message;
  else
    raise exception 'FAIL — % (ovlivnilo % řádků, mělo 0)', message, affected;
  end if;
end;
$$;

create function assert_one_row_affected(stmt text, message text)
returns void language plpgsql as $$
declare
  affected integer;
begin
  execute stmt;
  get diagnostics affected = row_count;
  if affected = 1 then
    raise notice 'OK — %', message;
  else
    raise exception 'FAIL — % (ovlivnilo % řádků, mělo 1)', message, affected;
  end if;
end;
$$;

grant execute on function test_assert(boolean, text) to authenticated, anon;
grant execute on function assert_forbidden(text, text) to authenticated, anon;
grant execute on function assert_no_rows_affected(text, text) to authenticated, anon;
grant execute on function assert_one_row_affected(text, text) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 1. Anonymous — no JWT at all.
-- ---------------------------------------------------------------------------
set role anon;
set request.jwt.claims = '{}';
select test_assert((select count(*) from profiles) = 0, 'anon nevidí žádné profily');
select test_assert((select count(*) from orders) = 0, 'anon nevidí žádné objednávky');
reset role;

-- ---------------------------------------------------------------------------
-- 2. Customer isolation — Eva vs. Jakub.
-- ---------------------------------------------------------------------------
set role authenticated;
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001"}'; -- Eva
select test_assert((select count(*) from profiles) = 1, 'zákazník vidí jen svůj vlastní profil');
select test_assert((select count(*) from orders) = 4, 'zákazník Eva vidí přesně své 4 objednávky');
select test_assert(
  not exists (select 1 from orders where id = 'e0000000-0000-4000-8000-000000000005'),
  'zákazník Eva nevidí objednávku zákazníka Jakuba'
);
select test_assert(
  exists (select 1 from driver_profiles where id = 'c0000000-0000-4000-8000-000000000001'),
  'zákazník Eva vidí driver_profile svého přiřazeného řidiče Tomáše'
);

-- ---------------------------------------------------------------------------
-- 3. available_jobs() RPC — before order3 gets claimed below.
-- ---------------------------------------------------------------------------
select test_assert(
  (select count(*) from available_jobs()) = 0,
  'zákazník voláním available_jobs() nic nezíská (není řidič)'
);

set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003"}'; -- Petra (driver)
select test_assert(
  (select count(*) from available_jobs() where order_id = 'e0000000-0000-4000-8000-000000000003') = 1,
  'řidička Petra vidí nepřevzatou objednávku (Pračka) v poolu zakázek'
);
select test_assert(
  not exists (select 1 from driver_profiles where id = 'c0000000-0000-4000-8000-000000000001'),
  'řidička Petra nevidí driver_profile řidiče Tomáše (nepropojeni objednávkou)'
);

-- ---------------------------------------------------------------------------
-- 4. Claim race / double-accept protection — the acceptance-criteria case.
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000002"}'; -- Tomáš
select assert_one_row_affected(
  $stmt$update orders set assigned_driver_profile_id = 'b0000000-0000-4000-8000-000000000002', status = 'driver_assigned' where id = 'e0000000-0000-4000-8000-000000000003'$stmt$,
  'řidič Tomáš úspěšně převezme nepřidělenou objednávku'
);

set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003"}'; -- Petra, same order, too late
select assert_no_rows_affected(
  $stmt$update orders set assigned_driver_profile_id = 'b0000000-0000-4000-8000-000000000003', status = 'driver_assigned' where id = 'e0000000-0000-4000-8000-000000000003'$stmt$,
  'řidička Petra už stejnou objednávku převzít nemůže — Tomáš byl první'
);

-- ---------------------------------------------------------------------------
-- 4b. available_jobs() distance ranking (Fáze "AI matching" follow-up).
-- Raw inserts need superuser, not the authenticated role/RLS path, since
-- this is seeding test fixtures rather than exercising the customer flow.
-- ---------------------------------------------------------------------------
reset role;

insert into orders (
  id, customer_profile_id, status, item_title, item_category, item_count,
  requested_vehicle_type, assistance_level, is_flexible
) values
  ('e0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000001',
   'awaiting_driver', 'Blízká zakázka', 'sofa', 1, 'personal_car', 'driver_only', true),
  ('e0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000001',
   'awaiting_driver', 'Vzdálená zakázka', 'sofa', 1, 'personal_car', 'driver_only', true);

insert into order_locations (order_id, location_type, full_address, latitude, longitude, contact_name, contact_phone)
values
  ('e0000000-0000-4000-8000-000000000010', 'pickup', 'Blízko, Praha 9', 50.1080, 14.4750, 'Test', '+420600000099'),
  ('e0000000-0000-4000-8000-000000000010', 'destination', 'Cíl, Praha 9', 50.1000, 14.4600, 'Test', '+420600000099'),
  ('e0000000-0000-4000-8000-000000000011', 'pickup', 'Daleko, Praha 5', 50.0500, 14.3500, 'Test', '+420600000099'),
  ('e0000000-0000-4000-8000-000000000011', 'destination', 'Cíl2, Praha 5', 50.0400, 14.3400, 'Test', '+420600000099');

update driver_profiles
  set current_latitude = 50.1073, current_longitude = 14.4740
  where id = 'c0000000-0000-4000-8000-000000000002'; -- Petra

set role authenticated;
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003"}'; -- Petra

select test_assert(
  (select order_id from available_jobs() order by distance_km asc nulls last limit 1)
    = 'e0000000-0000-4000-8000-000000000010',
  'available_jobs() řadí bližší zakázku první'
);
select test_assert(
  (select distance_km from available_jobs() where order_id = 'e0000000-0000-4000-8000-000000000010')
    < (select distance_km from available_jobs() where order_id = 'e0000000-0000-4000-8000-000000000011'),
  'vzdálenost bližší zakázky je skutečně menší než vzdálenější'
);
select test_assert(
  (select distance_km from available_jobs() where order_id = 'e0000000-0000-4000-8000-000000000010') < 2,
  'distance_km pro zakázku pár set metrů od řidičky je realisticky malé (< 2 km)'
);

-- Cleanup — later assertions (admin sees exactly 5 seeded orders) depend on
-- these two synthetic fixtures being gone again.
reset role;
delete from orders where id in (
  'e0000000-0000-4000-8000-000000000010',
  'e0000000-0000-4000-8000-000000000011'
);
set role authenticated;

-- ---------------------------------------------------------------------------
-- 5. Field-level rules enforced by the orders_before_update trigger.
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000002"}'; -- Tomáš, now assigned to order 3
select assert_forbidden(
  $stmt$update orders set customer_price_czk = 1.00 where id = 'e0000000-0000-4000-8000-000000000003'$stmt$,
  'přidělený řidič nemůže změnit cenu objednávky'
);

set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001"}'; -- Eva
select assert_forbidden(
  $stmt$update orders set assigned_driver_profile_id = 'b0000000-0000-4000-8000-000000000002' where id = 'e0000000-0000-4000-8000-000000000004'$stmt$,
  'zákazník nemůže ručně přiřadit řidiče'
);

set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000002"}'; -- Tomáš, assigned to order 1
select assert_no_rows_affected(
  $stmt$update order_locations set full_address = 'Podvržená adresa 1' where order_id = 'e0000000-0000-4000-8000-000000000001'$stmt$,
  'řidič nemůže editovat adresy zákazníkovy objednávky'
);

-- ---------------------------------------------------------------------------
-- 6. Chat isolation.
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003"}'; -- Petra
select test_assert(
  (select count(*) from messages where order_id = 'e0000000-0000-4000-8000-000000000001') = 0,
  'řidička Petra nevidí chat objednávky, které se neúčastní'
);

-- ---------------------------------------------------------------------------
-- 7. order_status_history / payments — read-only from the client.
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001"}'; -- Eva
select assert_forbidden(
  $stmt$insert into order_status_history (order_id, new_status) values ('e0000000-0000-4000-8000-000000000001', 'completed')$stmt$,
  'zákazník nemůže ručně zapisovat do historie stavů'
);
select assert_no_rows_affected(
  $stmt$update payments set status = 'refunded' where order_id = 'e0000000-0000-4000-8000-000000000001'$stmt$,
  'zákazník nemůže měnit stav platby'
);

-- ---------------------------------------------------------------------------
-- 8. Ratings — one per reviewer per order, only after completion.
-- ---------------------------------------------------------------------------
select assert_forbidden(
  $stmt$insert into ratings (order_id, reviewer_profile_id, reviewed_profile_id, rating) values ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 4)$stmt$,
  'zákazník nemůže ohodnotit stejnou objednávku podruhé'
);
select assert_forbidden(
  $stmt$insert into ratings (order_id, reviewer_profile_id, reviewed_profile_id, rating) values ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 5)$stmt$,
  'zákazník nemůže hodnotit nedokončenou objednávku'
);

-- ---------------------------------------------------------------------------
-- 8b. Customer confirms delivery (delivered -> completed), then can rate.
-- Drives order 2 (Petra's job) the rest of the way through the driver's
-- happy path first, since it seeded as 'in_transit'.
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003"}'; -- Petra
select assert_one_row_affected(
  $stmt$update orders set status = 'arrived_at_destination' where id = 'e0000000-0000-4000-8000-000000000002'$stmt$,
  'řidička Petra posune objednávku na "dorazila k doručení"'
);
select assert_one_row_affected(
  $stmt$update orders set status = 'delivered' where id = 'e0000000-0000-4000-8000-000000000002'$stmt$,
  'řidička Petra označí objednávku jako doručenou'
);

set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001"}'; -- Eva
select assert_forbidden(
  $stmt$update orders set status = 'completed' where id = 'e0000000-0000-4000-8000-000000000003'$stmt$,
  'zákazník nemůže potvrdit doručení objednávky, která není delivered'
);
select assert_one_row_affected(
  $stmt$update orders set status = 'completed' where id = 'e0000000-0000-4000-8000-000000000002'$stmt$,
  'zákazník Eva potvrdí doručení (delivered -> completed)'
);
select assert_one_row_affected(
  $stmt$insert into ratings (order_id, reviewer_profile_id, reviewed_profile_id, rating, comment) values ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 4, 'V pořádku.')$stmt$,
  'zákazník teď může ohodnotit dokončenou objednávku'
);

-- ---------------------------------------------------------------------------
-- 9. Self privilege escalation blocked.
-- ---------------------------------------------------------------------------
select assert_forbidden(
  $stmt$update profiles set role = 'admin' where id = 'b0000000-0000-4000-8000-000000000001'$stmt$,
  'uživatel nemůže změnit vlastní roli na admin'
);
select assert_forbidden(
  $stmt$update profiles set account_status = 'suspended' where id = 'b0000000-0000-4000-8000-000000000001'$stmt$,
  'uživatel nemůže měnit vlastní account_status'
);

-- ---------------------------------------------------------------------------
-- 10. Admin sees everything.
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000004"}'; -- Admin
select test_assert((select count(*) from orders) = 5, 'admin vidí všech 5 objednávek');
select test_assert((select count(*) from profiles) = 5, 'admin vidí všech 5 profilů');
select test_assert((select count(*) from payments) = 2, 'admin vidí platby');
reset role;

-- ---------------------------------------------------------------------------
-- 11. Service role (payment webhook path): can flip payment_status, but the
-- field-lock in orders_before_update still blocks price/status/ownership —
-- request.jwt.claims is reset to '{}' first since it's a session-level GUC
-- that survived the prior `reset role`, and a real service-role connection
-- never carries a user JWT at all (auth.uid() must read as null here, not
-- leak the admin sub from section 10).
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{}';
set role service_role;
select assert_one_row_affected(
  $stmt$update orders set payment_status = 'paid' where id = 'e0000000-0000-4000-8000-000000000003'$stmt$,
  'service_role smí nastavit payment_status na paid'
);
select test_assert(
  (select payment_status from orders where id = 'e0000000-0000-4000-8000-000000000003') = 'paid',
  'payment_status byl skutečně uložen jako paid'
);
select assert_forbidden(
  $stmt$update orders set customer_price_czk = 1 where id = 'e0000000-0000-4000-8000-000000000003'$stmt$,
  'service_role nesmí měnit cenu objednávky'
);
select assert_forbidden(
  $stmt$update orders set status = 'cancelled_by_admin' where id = 'e0000000-0000-4000-8000-000000000003'$stmt$,
  'service_role nesmí měnit stav objednávky'
);
select assert_one_row_affected(
  $stmt$insert into payments (order_id, provider, provider_payment_id, amount_czk, status) values ('e0000000-0000-4000-8000-000000000003', 'stripe', 'pi_test_123', 790.00, 'paid')$stmt$,
  'service_role smí zapsat řádek do payments'
);
reset role;

-- ---------------------------------------------------------------------------
-- 12. Signup trigger: role is whitelisted, "admin" claimed at signup must
-- not stick, and a driver signup gets an empty driver_profiles row for free.
-- ---------------------------------------------------------------------------
insert into auth.users (instance_id, id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000006',
   'utocnik.demo@vezuto.dev', '{"role":"admin","first_name":"Útočník","last_name":"Testovací"}'),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000007',
   'novy.ridic.demo@vezuto.dev', '{"role":"driver","first_name":"Nový","last_name":"Řidič"}');

select test_assert(
  (select role from profiles where auth_user_id = 'a0000000-0000-4000-8000-000000000006') = 'customer',
  'signup s role=admin v metadatech skončí jako customer, ne admin'
);
select test_assert(
  (select role from profiles where auth_user_id = 'a0000000-0000-4000-8000-000000000007') = 'driver',
  'signup s role=driver vytvoří profil s rolí driver'
);
select test_assert(
  exists (
    select 1 from driver_profiles dp
    join profiles p on p.id = dp.profile_id
    where p.auth_user_id = 'a0000000-0000-4000-8000-000000000007'
  ),
  'signup řidiče automaticky založí prázdný driver_profiles řádek'
);

drop function test_assert(boolean, text);
drop function assert_forbidden(text, text);
drop function assert_no_rows_affected(text, text);
drop function assert_one_row_affected(text, text);

\echo 'Všechny RLS testy prošly.'
