-- Creates the profiles row (and, for drivers, an empty driver_profiles row
-- to fill in during onboarding) automatically whenever a new row appears
-- in auth.users — i.e. right when supabase.auth.signUp() is called, before
-- e-mail confirmation. This is the ONLY place profiles get created; there
-- is deliberately no client-reachable INSERT policy on profiles.
--
-- Security-critical bit: role comes from the signup form via
-- auth.users.raw_user_meta_data, which is fully client-controlled data. It
-- is explicitly whitelisted to 'driver' vs. everything-else-becomes-
-- 'customer' — a client passing {"role":"admin"} at signup must not be
-- able to create an admin account this way.
create function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role user_role;
  new_profile_id uuid;
begin
  chosen_role := case
    when new.raw_user_meta_data ->> 'role' = 'driver' then 'driver'::user_role
    else 'customer'::user_role
  end;

  insert into profiles (auth_user_id, role, first_name, last_name, email, phone)
  values (
    new.id,
    chosen_role,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  returning id into new_profile_id;

  if chosen_role = 'driver' then
    insert into driver_profiles (profile_id) values (new_profile_id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_auth_user();

comment on function handle_new_auth_user() is
  'Auto-provisions profiles (+ driver_profiles when role=driver) on signup. role is whitelisted here, never trusted verbatim from client metadata.';
