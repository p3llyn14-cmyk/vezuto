-- BYPASSRLS only skips row-level security, not triggers — orders_before_update
-- still runs for service-role writes. Discovered while wiring the Stripe
-- webhook (modules/payments/actions.ts, app/api/webhooks/stripe/route.ts):
-- current_profile_id()/is_admin() read auth.uid(), which is null for a
-- service-role connection (no JWT claims), so the field-lock branch below
-- unconditionally rejected the webhook's payment_status update. Fixed via
-- create or replace rather than editing history, same reasoning as
-- customer_confirm_delivery.sql.
--
-- Detecting the service role itself needs current_setting('role', true),
-- not current_user/session_user: PostgREST (and this migration's own
-- SECURITY DEFINER) both mean the role switch happens via SET ROLE on a
-- shared login, and current_user inside a SECURITY DEFINER function is the
-- function OWNER, not the caller — verified directly against local
-- Postgres (see supabase/testing), current_user/session_user both read
-- back as the owner regardless of the caller's SET ROLE.
create or replace function orders_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := current_profile_id();
  acting_as_admin boolean := is_admin();
  acting_as_service_role boolean := (current_setting('role', true) = 'service_role');
  is_customer boolean := (old.customer_profile_id = actor_id);
  is_assigned_driver boolean := (
    old.assigned_driver_profile_id is not null
    and old.assigned_driver_profile_id = actor_id
  );
  is_claiming boolean := (
    old.status = 'awaiting_driver'
    and old.assigned_driver_profile_id is null
    and new.assigned_driver_profile_id = actor_id
  );
begin
  -- Narrower than the admin carve-out below: the service role (payment
  -- webhook, future payout automation) only ever needs to flip
  -- payment_status/payout_status, never price, status, or ownership fields.
  if acting_as_service_role then
    if new.status is distinct from old.status
      or new.customer_price_czk is distinct from old.customer_price_czk
      or new.driver_payout_czk is distinct from old.driver_payout_czk
      or new.platform_fee_czk is distinct from old.platform_fee_czk
      or new.pricing_breakdown is distinct from old.pricing_breakdown
      or new.customer_profile_id is distinct from old.customer_profile_id
      or new.assigned_driver_profile_id is distinct from old.assigned_driver_profile_id
    then
      raise exception 'Service role smí měnit pouze payment_status/payout_status';
    end if;
    return new;
  end if;

  if acting_as_admin then
    if new.status is distinct from old.status
      and not is_valid_order_transition(old.status, new.status)
      and new.status not in ('cancelled_by_admin', 'disputed', 'completed') then
      raise exception 'Neplatný přechod stavu objednávky: % -> %', old.status, new.status;
    end if;
    if new.status = 'completed' and old.status <> 'completed' then
      new.completed_at := now();
    end if;
    return new;
  end if;

  if new.customer_price_czk is distinct from old.customer_price_czk
    or new.driver_payout_czk is distinct from old.driver_payout_czk
    or new.platform_fee_czk is distinct from old.platform_fee_czk
    or new.pricing_breakdown is distinct from old.pricing_breakdown
    or new.payment_status is distinct from old.payment_status
    or new.payout_status is distinct from old.payout_status
    or new.customer_profile_id is distinct from old.customer_profile_id
  then
    raise exception 'Nepovolená změna cenových nebo platebních polí';
  end if;

  if new.assigned_driver_profile_id is distinct from old.assigned_driver_profile_id then
    if not is_claiming then
      raise exception 'Nelze změnit přiřazeného řidiče';
    end if;
    if new.status <> 'driver_assigned' then
      raise exception 'Přijetí zakázky musí nastavit stav na driver_assigned';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not is_valid_order_transition(old.status, new.status) then
      raise exception 'Neplatný přechod stavu objednávky: % -> %', old.status, new.status;
    end if;

    if is_claiming then
      null; -- already validated above
    elsif is_customer then
      if new.status not in (
        'submitted', 'awaiting_driver', 'cancelled_by_customer', 'completed'
      ) then
        raise exception 'Zákazník může objednávku pouze odeslat, zrušit nebo potvrdit doručení';
      end if;
    elsif is_assigned_driver then
      if new.status not in (
        'driver_on_the_way', 'arrived_at_pickup', 'item_picked_up',
        'in_transit', 'arrived_at_destination', 'delivered', 'cancelled_by_driver'
      ) then
        raise exception 'Řidič nemůže nastavit tento stav objednávky';
      end if;
    else
      raise exception 'Nejste účastníkem této objednávky';
    end if;
  elsif not is_customer and not is_assigned_driver and not is_claiming then
    raise exception 'Nejste účastníkem této objednávky';
  end if;

  if new.status = 'completed' and old.status <> 'completed' then
    new.completed_at := now();
  end if;

  return new;
end;
$$;
