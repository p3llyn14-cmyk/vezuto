-- Shared helper functions used by RLS policies and triggers.
-- Kept as SQL/plpgsql functions (not duplicated inline in every policy) so
-- the authorization logic has a single source of truth.

create function current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where auth_user_id = auth.uid();
$$;

comment on function current_profile_id() is
  'profiles.id for the currently authenticated user, or null if not signed in / no profile row yet.';

create function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

create function is_driver()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where auth_user_id = auth.uid() and role = 'driver'
  );
$$;

-- is_order_participant() lives in the orders migration, right after the
-- orders table is created — unlike plpgsql, a `language sql` function body
-- is parsed (and its table references validated) at CREATE FUNCTION time,
-- so it can't forward-reference a table that doesn't exist yet.

-- Generic updated_at maintenance, attached per-table below.
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The order status state machine. Table-driven rather than a giant CASE, so
-- the allowed graph is readable in one place and easy to unit test.
create table order_status_transitions (
  from_status order_status not null,
  to_status order_status not null,
  primary key (from_status, to_status)
);

insert into order_status_transitions (from_status, to_status) values
  ('draft', 'submitted'),
  ('submitted', 'awaiting_driver'),
  ('submitted', 'cancelled_by_customer'),
  ('awaiting_driver', 'driver_assigned'),
  ('awaiting_driver', 'cancelled_by_customer'),
  ('driver_assigned', 'driver_on_the_way'),
  ('driver_assigned', 'cancelled_by_customer'),
  ('driver_assigned', 'cancelled_by_driver'),
  ('driver_on_the_way', 'arrived_at_pickup'),
  ('driver_on_the_way', 'cancelled_by_driver'),
  ('arrived_at_pickup', 'item_picked_up'),
  ('arrived_at_pickup', 'disputed'),
  ('item_picked_up', 'in_transit'),
  ('in_transit', 'arrived_at_destination'),
  ('arrived_at_destination', 'delivered'),
  ('arrived_at_destination', 'disputed'),
  ('delivered', 'completed'),
  ('delivered', 'disputed');

-- Admins can additionally force-cancel or resolve a dispute from (almost)
-- any non-terminal state; enforced in the trigger via is_admin(), not here,
-- so this table stays a clean description of the "normal" customer/driver path.

comment on table order_status_transitions is
  'Whitelist of allowed order_status transitions for non-admin actors.';

create function is_valid_order_transition(p_from order_status, p_to order_status)
returns boolean
language sql
stable
as $$
  select p_from = p_to or exists (
    select 1 from order_status_transitions
    where from_status = p_from and to_status = p_to
  );
$$;
