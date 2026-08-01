-- Drivers must never see a stranger's exact address or contact details
-- before accepting a job (spec section: "přesná kontaktní data se zobrazí
-- až po přijetí zakázky"). orders_select / order_locations_select enforce
-- that via RLS for direct table access. This RPC is the one sanctioned way
-- for a driver to browse the *pool* of unclaimed jobs: it runs as
-- SECURITY DEFINER (so it can read across all awaiting_driver orders, not
-- just the caller's own) but only ever returns the deliberately narrow,
-- non-identifying column list below.

create function approximate_address(full_address text)
returns text
language sql
immutable
as $$
  -- Placeholder until the maps module does real geocoding-based
  -- approximation. Czech addresses put the house/orientation number right
  -- after the street name ("Korunní 810/104, Praha 10"), not at the end of
  -- the string — stripping a trailing number would miss it entirely and
  -- instead chew off the (harmless) Prague district number. So: split off
  -- everything before the first comma, strip a trailing number pattern
  -- from just that part, and reattach the rest (city/district) untouched.
  select case
    when position(',' in full_address) > 0 then
      regexp_replace(split_part(full_address, ',', 1), '\s+\d+[a-zA-Z]?(/\d+)?\s*$', '')
      || ',' || substring(full_address from position(',' in full_address) + 1)
    else
      regexp_replace(full_address, '\s+\d+[a-zA-Z]?(/\d+)?\s*$', '')
  end;
$$;

create function available_jobs()
returns table (
  order_id uuid,
  item_title text,
  item_category item_category,
  driver_payout_czk numeric,
  requested_vehicle_type vehicle_type,
  assistance_level assistance_level,
  disassembly_required boolean,
  assembly_required boolean,
  requested_date date,
  requested_time_from time,
  requested_time_to time,
  is_flexible boolean,
  pickup_area text,
  pickup_floor smallint,
  pickup_has_elevator boolean,
  destination_area text,
  destination_floor smallint,
  destination_has_elevator boolean,
  photo_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.item_title,
    o.item_category,
    o.driver_payout_czk,
    o.requested_vehicle_type,
    o.assistance_level,
    o.disassembly_required,
    o.assembly_required,
    o.requested_date,
    o.requested_time_from,
    o.requested_time_to,
    o.is_flexible,
    approximate_address(pickup.full_address),
    pickup.floor,
    pickup.has_elevator,
    approximate_address(destination.full_address),
    destination.floor,
    destination.has_elevator,
    (select count(*) from order_images oi where oi.order_id = o.id)
  from orders o
  join order_locations pickup
    on pickup.order_id = o.id and pickup.location_type = 'pickup'
  join order_locations destination
    on destination.order_id = o.id and destination.location_type = 'destination'
  where o.status = 'awaiting_driver'
    and o.assigned_driver_profile_id is null
    and is_driver();
$$;

comment on function available_jobs() is
  'Job pool for the driver app. Returns nothing for non-drivers (is_driver() guard). Distance/ETA are not computed yet — that lands with the maps module.';

grant execute on function available_jobs() to authenticated;
