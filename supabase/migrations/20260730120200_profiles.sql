-- profiles mirrors auth.users 1:1. Kept as a separate table (rather than
-- storing everything in auth.users metadata) so RLS can reference a plain
-- table with foreign keys, and so role/business fields aren't mixed into
-- Supabase's own auth internals.
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  preferred_language text not null default 'cs',
  account_status account_status not null default 'active',
  -- Lightweight business-account extension (section 3C of the spec) —
  -- no separate table for MVP, just flags a customer profile as a business.
  is_business boolean not null default false,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_name_requires_flag check (
    not (company_name is not null and is_business is false)
  )
);

create index profiles_auth_user_id_idx on profiles (auth_user_id);
create index profiles_role_idx on profiles (role);

comment on table profiles is 'One row per authenticated user, mirrors auth.users.';

create table driver_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  verification_status verification_status not null default 'unverified',
  business_name text,
  company_id text,
  tax_id text,
  service_radius_km numeric(6, 2) not null default 10,
  home_latitude double precision,
  home_longitude double precision,
  average_rating numeric(3, 2),
  completed_jobs_count integer not null default 0,
  is_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint average_rating_range check (
    average_rating is null or (average_rating >= 1 and average_rating <= 5)
  )
);

create index driver_profiles_verification_status_idx on driver_profiles (verification_status);
create index driver_profiles_is_available_idx on driver_profiles (is_available);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_profile_id uuid not null references driver_profiles (id) on delete cascade,
  vehicle_type vehicle_type not null,
  brand text not null,
  model text not null,
  registration_number text not null,
  cargo_length_cm integer,
  cargo_width_cm integer,
  cargo_height_cm integer,
  max_payload_kg integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicles_driver_profile_id_idx on vehicles (driver_profile_id);

create table driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_profile_id uuid not null references driver_profiles (id) on delete cascade,
  document_type document_type not null,
  storage_path text not null,
  verification_status verification_status not null default 'pending',
  expires_at date,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index driver_documents_driver_profile_id_idx on driver_documents (driver_profile_id);
create index driver_documents_verification_status_idx on driver_documents (verification_status);
