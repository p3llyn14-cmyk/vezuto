-- LOCAL TESTING ONLY — see README.md in this directory.
-- Run BEFORE the numbered migrations: 20260730120200_profiles.sql
-- foreign-keys into auth.users, so it has to exist first.

create schema if not exists auth;

create table auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  recovery_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confirmation_token text,
  email_change text,
  email_change_token_new text,
  recovery_token text
);

-- Mirrors the real Supabase auth.uid(): reads the "sub" claim out of the
-- request.jwt.claims GUC. Tests set this per simulated user with:
--   set request.jwt.claims = '{"sub":"<uuid>"}';
create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
$$;

-- Roles mirroring Supabase's anon / authenticated / service_role, so
-- policies can be exercised exactly as they'd run in production via
-- SET ROLE (RLS applies based on current_user, independent of how the
-- session originally authenticated).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema auth to authenticated, anon;
grant select on all tables in schema auth to authenticated, anon;
