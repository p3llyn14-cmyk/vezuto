-- Bundles order + pickup/destination location inserts into one atomic call
-- so the wizard's final submit can't leave an orphaned order behind if a
-- later insert fails. SECURITY INVOKER on purpose — it does not bypass
-- RLS, it just lets one round-trip do what would otherwise be three
-- separate client calls, each still individually subject to the same
-- policies (orders_insert, order_locations_insert, orders_update +
-- orders_before_update) as if the client had called them directly.
create function create_order(
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
    order_id, location_type, full_address, floor, has_elevator,
    parking_notes, contact_name, contact_phone, notes
  ) values (
    v_order_id, 'pickup',
    p_pickup ->> 'fullAddress', (p_pickup ->> 'floor')::smallint, (p_pickup ->> 'hasElevator')::boolean,
    nullif(p_pickup ->> 'parkingNotes', ''), p_pickup ->> 'contactName', p_pickup ->> 'contactPhone',
    nullif(p_pickup ->> 'notes', '')
  );

  insert into order_locations (
    order_id, location_type, full_address, floor, has_elevator,
    parking_notes, contact_name, contact_phone, notes
  ) values (
    v_order_id, 'destination',
    p_destination ->> 'fullAddress', (p_destination ->> 'floor')::smallint, (p_destination ->> 'hasElevator')::boolean,
    nullif(p_destination ->> 'parkingNotes', ''), p_destination ->> 'contactName', p_destination ->> 'contactPhone',
    nullif(p_destination ->> 'notes', '')
  );

  -- MVP has no payment gate before an order enters the driver pool (mock
  -- payment provider), so submission and "ready for a driver" happen
  -- together. Goes through the same orders_before_update trigger as any
  -- other transition — submitted -> awaiting_driver is on the whitelist.
  update orders set status = 'awaiting_driver' where id = v_order_id;

  return v_order_id;
end;
$$;

comment on function create_order is
  'Atomic order + pickup/destination creation for the customer wizard (Fáze 5). Runs as the caller (security invoker) — every insert still goes through normal RLS.';

grant execute on function create_order(
  text, item_category, text, text, integer, numeric, integer, integer, integer,
  vehicle_type, assistance_level, boolean, boolean, date, time, time, boolean,
  numeric, numeric, numeric, jsonb, jsonb, jsonb
) to authenticated;
