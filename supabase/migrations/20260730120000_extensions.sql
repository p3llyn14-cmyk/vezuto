-- Core extensions used across the schema.
-- gen_random_uuid() is built into Postgres 13+ core, but pgcrypto is enabled
-- anyway since Supabase projects have it on by default and future migrations
-- may want its hashing functions (e.g. for storage path tokens).
create extension if not exists pgcrypto;
