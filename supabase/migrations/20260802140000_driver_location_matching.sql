-- Adds live driver location + distance-based job ranking. order_locations
-- already had latitude/longitude columns (planned since Fáze 3) but nothing
-- ever populated them; the maps module now geocodes both addresses at order
-- creation time (see modules/orders/actions.ts). available_jobs()'s own
-- comment already flagged this as the deferred piece: "Distance/ETA are not
-- computed yet — that lands with the maps module."

alter table driver_profiles
  add column current_latitude double precision,
  add column current_longitude double precision,
  add column location_updated_at timestamptz;

-- create_order() keeps its exact signature (p_pickup/p_destination stay
-- jsonb) — the wizard payload just carries two more optional keys now, so
-- no client-side RPC call needs to change shape, only content.
create or replace function create_order(
  p_item_title text,
  p_item_category item_category,
  p_item_description text,
  p_external_listing_url text,
  p_item_count integer,
  p_estimated_weight_kg numeric,
  p_length_cm integer,
  p_width_cm integer,
  p_height_cm integer,
  p_requested_vehicle_type vehicle_type,
  p_assistance_level assistance_level,
  p_disassembly_required boolean,
  p_assembly_required boolean,
  p_requested_date date,
  p_requested_time_from time,
  p_requested_time_to time,
  p_is_flexible boolean,
  p_customer_price_czk numeric,
  p_driver_payout_czk numeric,
  p_platform_fee_czk numeric,
  p_pricing_breakdown jsonb,
  p_pickup jsonb,
  p_destination jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  insert into orders (
    customer_profile_id, status, item_title, item_category, item_description,
    external_listing_url, item_count, estimated_weight_kg, length_cm, width_cm, height_cm,
    requested_vehicle_type, assistance_level, disassembly_required, assembly_required,
    requested_date, requested_time_from, requested_time_to, is_flexible,
    customer_price_czk, driver_payout_czk, platform_fee_czk, pricing_breakdown
  ) values (
    current_profile_id(), 'submitted', p_item_title, p_item_category, nullif(p_item_description, ''),
    nullif(p_external_listing_url, ''), p_item_count, p_estimated_weight_kg, p_length_cm, p_width_cm, p_height_cm,
    p_requested_vehicle_type, p_assistance_level, p_disassembly_required, p_assembly_required,
    p_requested_date, p_requested_time_from, p_requested_time_to, p_is_flexible,
    p_customer_price_czk, p_driver_payout_czk, p_platform_fee_czk, p_pricing_breakdown
  )
  returning id into v_order_id;

  insert into order_locations (
    order_id, location_type, full_address, latitude, longitude, floor, has_elevator,
    parking_notes, contact_name, contact_phone, notes
  ) values (
    v_order_id, 'pickup',
    p_pickup ->> 'fullAddress',
    (p_pickup ->> 'lat')::double precision, (p_pickup ->> 'lng')::double precision,
    (p_pickup ->> 'floor')::smallint, (p_pickup ->> 'hasElevator')::boolean,
    nullif(p_pickup ->> 'parkingNotes', ''), p_pickup ->> 'contactName', p_pickup ->> 'contactPhone',
    nullif(p_pickup ->> 'notes', '')
  );

  insert into order_locations (
    order_id, location_type, full_address, latitude, longitude, floor, has_elevator,
    parking_notes, contact_name, contact_phone, notes
  ) values (
    v_order_id, 'destination',
    p_destination ->> 'fullAddress',
    (p_destination ->> 'lat')::double precision, (p_destination ->> 'lng')::double precision,
    (p_destination ->> 'floor')::smallint, (p_destination ->> 'hasElevator')::boolean,
    nullif(p_destination ->> 'parkingNotes', ''), p_destination ->> 'contactName', p_destination ->> 'contactPhone',
    nullif(p_destination ->> 'notes', '')
  );

  update orders set status = 'awaiting_driver' where id = v_order_id;

  return v_order_id;
end;
$$;

-- Haversine great-circle distance in km — good enough for "closest job
-- first" ranking, not turn-by-turn routing.
create function haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371 * acos(
    least(1.0, greatest(-1.0,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1))
      + sin(radians(lat1)) * sin(radians(lat2))
    ))
  );
$$;

-- CREATE OR REPLACE can't change a function's return-table column list —
-- distance_km is a new output column, so the old signature has to go first.
drop function if exists available_jobs();

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
  photo_count bigint,
  distance_km numeric
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
    (select count(*) from order_images oi where oi.order_id = o.id),
    -- Never exposes the driver's or pickup's exact coordinates, just the
    -- resulting distance — same privacy boundary as approximate_address().
    case
      when me.current_latitude is null or pickup.latitude is null then null
      else round(
        haversine_km(me.current_latitude, me.current_longitude, pickup.latitude, pickup.longitude)::numeric,
        1
      )
    end
  from orders o
  join order_locations pickup
    on pickup.order_id = o.id and pickup.location_type = 'pickup'
  join order_locations destination
    on destination.order_id = o.id and destination.location_type = 'destination'
  left join driver_profiles me
    on me.profile_id = current_profile_id()
  where o.status = 'awaiting_driver'
    and o.assigned_driver_profile_id is null
    and is_driver()
  order by
    case
      when me.current_latitude is null or pickup.latitude is null then 1
      else 0
    end,
    haversine_km(me.current_latitude, me.current_longitude, pickup.latitude, pickup.longitude) nulls last,
    o.created_at;
$$;

comment on function available_jobs() is
  'Job pool for the driver app, ranked by distance from the driver''s current_latitude/longitude when both that and the pickup coordinates are known; falls back to newest-first otherwise.';

grant execute on function available_jobs() to authenticated;
grant execute on function haversine_km(double precision, double precision, double precision, double precision) to authenticated;
