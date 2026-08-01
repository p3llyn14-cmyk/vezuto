import type { Database } from "@/types/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

/**
 * Split out of actions.ts (which is a "use server" file — every export
 * there must be an async server action, so a plain lookup table/function
 * can't live alongside them) specifically so it's unit-testable without a
 * database. This is the client-facing "what's the driver's next button"
 * happy path; the actual authorization for each transition is enforced by
 * the orders_before_update DB trigger regardless of what this returns —
 * see supabase/testing/rls_smoke_test.sql for that side.
 */
export const DRIVER_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  driver_assigned: "driver_on_the_way",
  driver_on_the_way: "arrived_at_pickup",
  arrived_at_pickup: "item_picked_up",
  item_picked_up: "in_transit",
  in_transit: "arrived_at_destination",
  arrived_at_destination: "delivered",
};

export function getNextDriverStatus(current: OrderStatus): OrderStatus | undefined {
  return DRIVER_NEXT_STATUS[current];
}

export const DRIVER_CANCELLABLE_STATUSES: OrderStatus[] = [
  "driver_assigned",
  "driver_on_the_way",
];

export function isCancellableByDriver(status: OrderStatus): boolean {
  return DRIVER_CANCELLABLE_STATUSES.includes(status);
}
