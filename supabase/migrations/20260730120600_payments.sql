-- These tables exist now so the data model is ready for Stripe Connect, but
-- in the MVP only the mock payment provider (application code) writes to
-- them — via the service role, which bypasses RLS. No client-side writes
-- are permitted at all (see rls migration): regular users can only SELECT
-- their own rows.
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null default 'mock',
  provider_payment_id text,
  amount_czk numeric(10, 2) not null,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_id_idx on payments (order_id);

create trigger payments_set_updated_at
  before update on payments
  for each row
  execute function set_updated_at();

create table payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  driver_profile_id uuid not null references profiles (id),
  provider_payout_id text,
  amount_czk numeric(10, 2) not null,
  status payout_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_order_id_idx on payouts (order_id);
create index payouts_driver_profile_id_idx on payouts (driver_profile_id);

create trigger payouts_set_updated_at
  before update on payouts
  for each row
  execute function set_updated_at();

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index audit_logs_actor_profile_id_idx on audit_logs (actor_profile_id);

comment on table audit_logs is
  'Written by admin server actions (service role) whenever an admin manually overrides price, status, driver assignment, or a refund.';
