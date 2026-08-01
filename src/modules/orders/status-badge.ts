import type { OrderStatus } from "@/types/database.types";

const ACTIVE_STATUSES: OrderStatus[] = [
  "driver_assigned",
  "driver_on_the_way",
  "arrived_at_pickup",
  "item_picked_up",
  "in_transit",
  "arrived_at_destination",
];

const DONE_STATUSES: OrderStatus[] = ["delivered", "completed"];

const STOPPED_STATUSES: OrderStatus[] = [
  "cancelled_by_customer",
  "cancelled_by_driver",
  "cancelled_by_admin",
  "disputed",
];

/** Maps a status to the Badge variant that visually communicates its urgency. */
export function getOrderStatusBadgeVariant(
  status: OrderStatus,
): "default" | "secondary" | "outline" | "destructive" {
  if (ACTIVE_STATUSES.includes(status)) return "default";
  if (DONE_STATUSES.includes(status)) return "secondary";
  if (STOPPED_STATUSES.includes(status)) return "destructive";
  return "outline";
}
