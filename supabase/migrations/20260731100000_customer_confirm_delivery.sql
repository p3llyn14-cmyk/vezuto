-- The customer needs a way to confirm receipt (spec: "zákazník potvrdí
-- doručení"), which is the delivered -> completed transition — and
-- ratings_insert already requires status = 'completed' before a customer
-- can rate the driver. The original orders_before_update trigger (Fáze 3)
-- only let admins make that transition; this was a real gap, not a design
-- choice, discovered while wiring up Fáze 7 (chat/ratings). Fixed here via
-- create or replace rather than editing the original migration, since this
-- project has no deployed instance yet but the fix belongs conceptually to
-- Fáze 7, not Fáze 3.
create or replace function orders_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := current_profile_id();
  acting_as_admin boolean := is_admin();
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
      -- 'completed' only reachable from 'delivered' per order_status_transitions
      -- (customer confirming receipt); everything else is the original set.
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
