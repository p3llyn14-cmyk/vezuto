-- Written per Supabase's documented storage + RLS pattern. NOT verified
-- against local Postgres — the local test setup (supabase/testing) only
-- stubs the `auth` schema, not `storage`, since GoTrue/Storage themselves
-- aren't running locally either. Re-check this migration once a real
-- Supabase project (cloud or Docker) exists.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-images',
  'order-images',
  false,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Object path convention: "{order_id}/{uuid}-{original filename}" — the
-- first path segment is the order id, which is what these policies check
-- against via storage.foldername(). Same authorization shape as the
-- order_images table itself (see rls migration): any participant can read,
-- only a participant can upload, nobody updates/deletes (immutable
-- evidence trail, same as order_images rows).
create policy order_images_storage_select on storage.objects
  for select
  using (
    bucket_id = 'order-images'
    and is_order_participant((storage.foldername(name))[1]::uuid)
  );

create policy order_images_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'order-images'
    and is_order_participant((storage.foldername(name))[1]::uuid)
  );
