-- LOCAL TESTING ONLY — see README.md. Run AFTER all numbered migrations
-- (so every public table exists) and BEFORE seed.sql.

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated, anon;
grant usage, select on all sequences in schema public to authenticated, anon;
grant execute on all functions in schema public to authenticated, anon;

-- Real Supabase provisions service_role with full table privileges on top
-- of BYPASSRLS (RLS bypass alone doesn't grant DML — that's a separate
-- Postgres privilege check). Missing here until the payments smoke test
-- (section 11) below exercised a service-role write for the first time —
-- audit_logs writes went untested locally through every earlier phase too.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
