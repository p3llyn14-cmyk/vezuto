-- Enums used throughout the schema. Kept narrow and explicit on purpose —
-- adding a value later is a cheap migration, removing one is not.

create type user_role as enum ('customer', 'driver', 'admin');

create type account_status as enum ('active', 'suspended', 'deleted');

create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');

create type vehicle_type as enum (
  'personal_car',
  'estate_car',
  'small_van',
  'large_van'
);

-- How much the driver is expected to physically help, beyond just driving.
-- Modeled as an enum (not a boolean + count) because "driver_only" and
-- "driver_helps" are qualitatively different services, not just a count of 0.
create type assistance_level as enum (
  'driver_only',
  'driver_helps',
  'driver_plus_one',
  'driver_plus_two'
);

create type item_category as enum (
  'sofa',
  'bed',
  'wardrobe',
  'table',
  'chair',
  'appliance',
  'electronics',
  'sports_equipment',
  'office_equipment',
  'boxes',
  'other'
);

-- Exact set from the product spec. Treated as an ordered state machine —
-- see is_valid_order_transition() in helper_functions migration.
create type order_status as enum (
  'draft',
  'submitted',
  'awaiting_driver',
  'driver_assigned',
  'driver_on_the_way',
  'arrived_at_pickup',
  'item_picked_up',
  'in_transit',
  'arrived_at_destination',
  'delivered',
  'completed',
  'cancelled_by_customer',
  'cancelled_by_driver',
  'cancelled_by_admin',
  'disputed'
);

create type location_type as enum ('pickup', 'destination');

create type image_type as enum (
  'item_reference',
  'pickup_condition',
  'damage',
  'delivery_condition',
  'proof_of_delivery'
);

create type document_type as enum (
  'id_card',
  'drivers_license',
  'vehicle_registration',
  'business_license',
  'other'
);

create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create type payout_status as enum ('pending', 'paid', 'held', 'failed');
