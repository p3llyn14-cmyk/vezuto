import { describe, expect, it } from "vitest";
import { getNextDriverStatus, isCancellableByDriver } from "./status-transitions";

describe("getNextDriverStatus", () => {
  it("walks the full driver happy path in order", () => {
    const path: [string, string][] = [
      ["driver_assigned", "driver_on_the_way"],
      ["driver_on_the_way", "arrived_at_pickup"],
      ["arrived_at_pickup", "item_picked_up"],
      ["item_picked_up", "in_transit"],
      ["in_transit", "arrived_at_destination"],
      ["arrived_at_destination", "delivered"],
    ];

    for (const [from, to] of path) {
      expect(getNextDriverStatus(from as never)).toBe(to);
    }
  });

  it("has no next status once delivered — completion is the customer's action", () => {
    expect(getNextDriverStatus("delivered")).toBeUndefined();
  });

  it("has no next status for states outside the driver's happy path", () => {
    expect(getNextDriverStatus("draft")).toBeUndefined();
    expect(getNextDriverStatus("submitted")).toBeUndefined();
    expect(getNextDriverStatus("awaiting_driver")).toBeUndefined();
    expect(getNextDriverStatus("completed")).toBeUndefined();
    expect(getNextDriverStatus("cancelled_by_driver")).toBeUndefined();
  });
});

describe("isCancellableByDriver", () => {
  it("allows cancelling only right after claiming, before pickup", () => {
    expect(isCancellableByDriver("driver_assigned")).toBe(true);
    expect(isCancellableByDriver("driver_on_the_way")).toBe(true);
  });

  it("disallows cancelling once the item has been picked up or later", () => {
    expect(isCancellableByDriver("arrived_at_pickup")).toBe(false);
    expect(isCancellableByDriver("item_picked_up")).toBe(false);
    expect(isCancellableByDriver("in_transit")).toBe(false);
    expect(isCancellableByDriver("delivered")).toBe(false);
    expect(isCancellableByDriver("completed")).toBe(false);
  });
});

// Note: this file only covers the client-side "what's the driver's next
// button" happy path. The actual authorization for every transition —
// including the double-accept race protection — is enforced by the
// orders_before_update Postgres trigger and orders_update RLS policy, and
// is tested against a real database in supabase/testing/rls_smoke_test.sql
// (see "Fáze 6" claim-race scenario). That coverage can't be meaningfully
// replicated here without a live Postgres connection, and duplicating it
// with mocks would test the mock, not the actual row-locking behavior.
