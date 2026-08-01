-- Row Level Security. General shape used everywhere:
--   SELECT — owner / order participant / admin
--   INSERT — the actor can only create rows attributed to themselves
--   UPDATE — narrow, usually admin-only or owner-only; field-level rules
--            that RLS can't express live in triggers (see orders migration)
--   DELETE — omitted almost everywhere on purpose; nothing in this schema
--            should be hard-deleted by a regular user
--
-- Service role (used by server actions for payments, payouts, admin
-- overrides, and audit logging) has BYPASSRLS and is not affected by any
-- policy below.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_select on profiles
  for select
  using (auth_user_id = auth.uid() or is_admin());

-- No client-side INSERT policy on purpose. profiles rows are created
-- exclusively by the handle_new_auth_user() trigger on auth.users (see the
-- auth_trigger migration), which reads the signup form's chosen role from
-- auth metadata but clamps it server-side to customer/driver — a client
-- can never insert a row directly, so it can never claim role = 'admin' or
-- write a profiles row for someone else's auth_user_id.

create policy profiles_update on profiles
  for update
  using (auth_user_id = auth.uid() or is_admin());

-- A user may update their own row via profiles_update above, but must never
-- be able to promote themselves or lift their own suspension. Admins are
-- exempt (checked via is_admin() again, independent of the RLS policy).
create function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Nelze změnit vlastní roli';
  end if;
  if new.account_status is distinct from old.account_status then
    raise exception 'Nelze změnit vlastní stav účtu';
  end if;
  return new;
end;
$$;

create trigger profiles_before_update_prevent_escalation
  before update on profiles
  for each row
  execute function prevent_profile_privilege_escalation();

create trigger profiles_set_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- driver_profiles
-- ---------------------------------------------------------------------------
alter table driver_profiles enable row level security;

create policy driver_profiles_select on driver_profiles
  for select
  using (
    profile_id = current_profile_id()
    or is_admin()
    -- A customer may see basic info of the driver assigned to their order,
    -- once matched.
    or exists (
      select 1 from orders
      where orders.assigned_driver_profile_id = driver_profiles.profile_id
        and orders.customer_profile_id = current_profile_id()
    )
  );

create policy driver_profiles_insert on driver_profiles
  for insert
  with check (profile_id = current_profile_id());

create policy driver_profiles_update on driver_profiles
  for update
  using (profile_id = current_profile_id() or is_admin());

create function prevent_driver_verification_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;
  if new.verification_status is distinct from old.verification_status then
    raise exception 'Ověření řidiče může změnit pouze administrátor';
  end if;
  return new;
end;
$$;

create trigger driver_profiles_before_update_prevent_self_approval
  before update on driver_profiles
  for each row
  execute function prevent_driver_verification_self_approval();

create trigger driver_profiles_set_updated_at
  before update on driver_profiles
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
alter table vehicles enable row level security;

create policy vehicles_select on vehicles
  for select
  using (
    is_admin()
    or exists (
      select 1 from driver_profiles
      where driver_profiles.id = vehicles.driver_profile_id
        and driver_profiles.profile_id = current_profile_id()
    )
    or exists (
      select 1 from driver_profiles
      join orders on orders.assigned_driver_profile_id = driver_profiles.profile_id
      where driver_profiles.id = vehicles.driver_profile_id
        and orders.customer_profile_id = current_profile_id()
    )
  );

create policy vehicles_insert on vehicles
  for insert
  with check (
    exists (
      select 1 from driver_profiles
      where driver_profiles.id = vehicles.driver_profile_id
        and driver_profiles.profile_id = current_profile_id()
    )
  );

create policy vehicles_update on vehicles
  for update
  using (
    is_admin()
    or exists (
      select 1 from driver_profiles
      where driver_profiles.id = vehicles.driver_profile_id
        and driver_profiles.profile_id = current_profile_id()
    )
  );

create trigger vehicles_set_updated_at
  before update on vehicles
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- driver_documents
-- ---------------------------------------------------------------------------
alter table driver_documents enable row level security;

create policy driver_documents_select on driver_documents
  for select
  using (
    is_admin()
    or exists (
      select 1 from driver_profiles
      where driver_profiles.id = driver_documents.driver_profile_id
        and driver_profiles.profile_id = current_profile_id()
    )
  );

create policy driver_documents_insert on driver_documents
  for insert
  with check (
    exists (
      select 1 from driver_profiles
      where driver_profiles.id = driver_documents.driver_profile_id
        and driver_profiles.profile_id = current_profile_id()
    )
  );

-- Only admins can review documents (verification_status, reviewed_by,
-- reviewed_at) — drivers only ever insert new ones, never edit existing rows.
create policy driver_documents_update on driver_documents
  for update
  using (is_admin());

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
alter table orders enable row level security;

-- Note: UPDATE/DELETE in Postgres RLS require the row to also pass the
-- SELECT policy, not just the command's own USING clause — a row a role
-- can't SELECT can never be a candidate for UPDATE either, regardless of
-- what the UPDATE policy allows. That's why this includes the same
-- "unclaimed job, any driver" clause as orders_update below: without it,
-- a driver's claim UPDATE would silently match 0 rows. This does not leak
-- the customer's exact address/contact — those live in order_locations,
-- gated by its own, stricter policy.
create policy orders_select on orders
  for select
  using (
    customer_profile_id = current_profile_id()
    or assigned_driver_profile_id = current_profile_id()
    or (status = 'awaiting_driver' and assigned_driver_profile_id is null and is_driver())
    or is_admin()
  );

create policy orders_insert on orders
  for insert
  with check (customer_profile_id = current_profile_id());

-- Row reachability only. Field-level rules (price is frozen, status must
-- follow the state machine, only the assigned/claiming driver can touch
-- assigned_driver_profile_id, ...) are enforced by orders_before_update().
--
-- The claim clause is exactly the atomic "first come, first served" guard:
-- concurrent UPDATEs from two drivers against the same row serialize on the
-- row lock, and the second one re-evaluates this USING clause after the
-- first commits — by then assigned_driver_profile_id is no longer null, so
-- it matches zero rows instead of racing.
create policy orders_update on orders
  for update
  using (
    customer_profile_id = current_profile_id()
    or assigned_driver_profile_id = current_profile_id()
    or (status = 'awaiting_driver' and assigned_driver_profile_id is null and is_driver())
    or is_admin()
  )
  with check (
    customer_profile_id = current_profile_id()
    or assigned_driver_profile_id = current_profile_id()
    or is_admin()
  );

-- ---------------------------------------------------------------------------
-- order_locations
-- ---------------------------------------------------------------------------
alter table order_locations enable row level security;

create policy order_locations_select on order_locations
  for select
  using (is_order_participant(order_id));

-- Pickup/destination details are authored by the customer only (or admin) —
-- a driver should never be able to rewrite the addresses on a job they hold.
create policy order_locations_insert on order_locations
  for insert
  with check (
    is_admin()
    or exists (
      select 1 from orders
      where orders.id = order_locations.order_id
        and orders.customer_profile_id = current_profile_id()
    )
  );

create policy order_locations_update on order_locations
  for update
  using (
    is_admin()
    or exists (
      select 1 from orders
      where orders.id = order_locations.order_id
        and orders.customer_profile_id = current_profile_id()
    )
  );

-- ---------------------------------------------------------------------------
-- order_images
-- ---------------------------------------------------------------------------
alter table order_images enable row level security;

create policy order_images_select on order_images
  for select
  using (is_order_participant(order_id));

create policy order_images_insert on order_images
  for insert
  with check (
    is_order_participant(order_id) and uploaded_by_profile_id = current_profile_id()
  );

-- No update policy: photo evidence is immutable once uploaded.
create policy order_images_delete on order_images
  for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- order_status_history — read-only from the client; only the
-- orders_log_status_change() trigger (owned by the migration role, which
-- owns the table) writes to it.
-- ---------------------------------------------------------------------------
alter table order_status_history enable row level security;

create policy order_status_history_select on order_status_history
  for select
  using (is_order_participant(order_id));

-- ---------------------------------------------------------------------------
-- order_status_transitions — static whitelist, safe to expose to any
-- signed-in user (e.g. so the UI can grey out impossible actions).
-- ---------------------------------------------------------------------------
alter table order_status_transitions enable row level security;

create policy order_status_transitions_select on order_status_transitions
  for select
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
alter table messages enable row level security;

create policy messages_select on messages
  for select
  using (is_order_participant(order_id));

create policy messages_insert on messages
  for insert
  with check (
    is_order_participant(order_id) and sender_profile_id = current_profile_id()
  );

-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------
alter table ratings enable row level security;

create policy ratings_select on ratings
  for select
  using (
    is_order_participant(order_id)
    or reviewed_profile_id = current_profile_id()
    or is_admin()
  );

-- MVP only supports the customer rating the driver, and only once the
-- order is completed.
create policy ratings_insert on ratings
  for insert
  with check (
    reviewer_profile_id = current_profile_id()
    and exists (
      select 1 from orders
      where orders.id = ratings.order_id
        and orders.status = 'completed'
        and orders.customer_profile_id = current_profile_id()
        and orders.assigned_driver_profile_id = ratings.reviewed_profile_id
    )
  );

-- ---------------------------------------------------------------------------
-- payments / payouts — SELECT only for regular users. All writes go through
-- the service role from server actions (mock provider today, Stripe
-- Connect later), which bypasses RLS entirely.
-- ---------------------------------------------------------------------------
alter table payments enable row level security;

create policy payments_select on payments
  for select
  using (
    is_admin()
    or exists (
      select 1 from orders
      where orders.id = payments.order_id
        and orders.customer_profile_id = current_profile_id()
    )
  );

alter table payouts enable row level security;

create policy payouts_select on payouts
  for select
  using (is_admin() or driver_profile_id = current_profile_id());

-- ---------------------------------------------------------------------------
-- audit_logs — admin only, written exclusively by server actions via the
-- service role.
-- ---------------------------------------------------------------------------
alter table audit_logs enable row level security;

create policy audit_logs_select on audit_logs
  for select
  using (is_admin());
