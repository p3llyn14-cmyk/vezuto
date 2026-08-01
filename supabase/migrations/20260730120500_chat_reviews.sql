create table messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  sender_profile_id uuid not null references profiles (id),
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_order_id_created_at_idx on messages (order_id, created_at);

comment on table messages is
  'Per-order chat between customer, assigned driver, and admin. Immutable — no edit/delete.';

create table ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  reviewer_profile_id uuid not null references profiles (id),
  reviewed_profile_id uuid not null references profiles (id),
  rating smallint not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint rating_range check (rating between 1 and 5),
  constraint one_rating_per_reviewer_per_order unique (order_id, reviewer_profile_id)
);

create index ratings_reviewed_profile_id_idx on ratings (reviewed_profile_id);

comment on table ratings is
  'MVP only requires customer -> driver ratings; reviewer/reviewed are generic profile_ids so driver -> customer can be added later without a migration.';

-- Keep driver_profiles.average_rating and completed_jobs_count in sync so
-- the "available jobs" list can show a rating without aggregating on every read.
create function refresh_driver_rating_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_driver_profile_id uuid;
begin
  select id into target_driver_profile_id
  from driver_profiles
  where profile_id = new.reviewed_profile_id;

  if target_driver_profile_id is not null then
    update driver_profiles
    set average_rating = (
      select round(avg(r.rating)::numeric, 2)
      from ratings r
      where r.reviewed_profile_id = new.reviewed_profile_id
    )
    where id = target_driver_profile_id;
  end if;

  return new;
end;
$$;

create trigger ratings_after_insert_refresh_driver_stats
  after insert on ratings
  for each row
  execute function refresh_driver_rating_stats();
