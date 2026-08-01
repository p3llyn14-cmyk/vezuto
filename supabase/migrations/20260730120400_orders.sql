create sequence orders_public_code_seq;

create table orders (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique
    default ('VZT-' || lpad(nextval('orders_public_code_seq')::text, 6, '0')),
  customer_profile_id uuid not null references profiles (id),
  assigned_driver_profile_id uuid references profiles (id),
  status order_status not null default 'draft',

  item_title text not null,
  item_category item_category not null,
  item_description text,
  external_listing_url text,
  item_count integer not null default 1,
  estimated_weight_kg numeric(6, 1),
  length_cm integer,
  width_cm integer,
  height_cm integer,

  requested_vehicle_type vehicle_type,
  assistance_level assistance_level not null default 'driver_only',
  disassembly_required boolean not null default false,
  assembly_required boolean not null default false,

  requested_date date,
  requested_time_from time,
  requested_time_to time,
  is_flexible boolean not null default false,

  customer_price_czk numeric(10, 2),
  driver_payout_czk numeric(10, 2),
  platform_fee_czk numeric(10, 2),
  -- Snapshot of how customer_price_czk was computed at submission time, for
  -- support/dispute resolution when the live pricing config later changes.
  pricing_breakdown jsonb,
  payment_status payment_status not null default 'pending',
  payout_status payout_status not null default 'pending',

  cancellation_reason text,
  dispute_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint item_count_positive check (item_count > 0)
);

create index orders_status_idx on orders (status);
create index orders_customer_profile_id_idx on orders (customer_profile_id);
create index orders_assigned_driver_profile_id_idx on orders (assigned_driver_profile_id);
create index orders_requested_date_idx on orders (requested_date);

create table order_locations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  location_type location_type not null,
  full_address text not null,
  latitude double precision,
  longitude double precision,
  floor smallint,
  has_elevator boolean,
  parking_notes text,
  contact_name text not null,
  contact_phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (order_id, location_type)
);

create index order_locations_order_id_idx on order_locations (order_id);

comment on table order_locations is
  'Exactly one pickup + one destination row per order (enforced by the unique constraint).';

create table order_images (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  uploaded_by_profile_id uuid not null references profiles (id),
  image_type image_type not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index order_images_order_id_idx on order_images (order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  previous_status order_status,
  new_status order_status not null,
  changed_by_profile_id uuid references profiles (id),
  note text,
  created_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on order_status_history (order_id);

-- Needs the orders table to exist first — see note in helper_functions
-- migration. Used throughout later RLS policies (order_locations,
-- order_images, messages, ...).
create function is_order_participant(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from orders
    where id = target_order_id
      and (
        customer_profile_id = current_profile_id()
        or assigned_driver_profile_id = current_profile_id()
      )
  ) or is_admin();
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- The single place that enforces "who can change what" on an order:
--  - non-admins can never touch price/payment/payout fields or reassign
--    the customer,
--  - a status change must be a whitelisted transition (order_status_transitions),
--  - claiming an unassigned order is only valid awaiting_driver -> driver_assigned,
--  - customers and drivers are each restricted to their own subset of statuses.
-- Row reachability (which rows you can even attempt to UPDATE) is a separate
-- concern, handled by RLS in a later migration — this trigger is the
-- field-level and state-machine layer.
create function orders_before_update()
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
      if new.status not in ('submitted', 'awaiting_driver', 'cancelled_by_customer') then
        raise exception 'Zákazník může objednávku pouze odeslat nebo zrušit';
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

create trigger orders_before_update_enforce_rules
  before update on orders
  for each row
  execute function orders_before_update();

create trigger orders_set_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

create function orders_log_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into order_status_history (order_id, previous_status, new_status, changed_by_profile_id)
    values (new.id, old.status, new.status, current_profile_id());
  end if;
  return new;
end;
$$;

create trigger orders_after_update_log_status
  after update on orders
  for each row
  execute function orders_log_status_change();
