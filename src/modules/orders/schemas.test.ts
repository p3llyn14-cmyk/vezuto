import { describe, expect, it } from "vitest";
import {
  assistanceStepSchema,
  itemStepSchema,
  orderWizardSchema,
  pickupStepSchema,
  scheduleStepSchema,
} from "./schemas";

const validLocation = {
  fullAddress: "Korunní 810/104, Praha 10",
  floor: "3",
  hasElevator: false,
  parkingNotes: "",
  contactName: "Eva Svobodová",
  contactPhone: "+420600000001",
  notes: "",
};

const validItem = {
  itemTitle: "Rohová sedačka",
  itemCategory: "sofa",
  itemDescription: "",
  externalListingUrl: "",
  itemCount: "1",
  estimatedWeightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
};

const validAssistance = {
  requestedVehicleType: "estate_car",
  assistanceLevel: "driver_plus_one",
  disassemblyRequired: false,
  assemblyRequired: false,
};

describe("itemStepSchema", () => {
  it("accepts a valid item", () => {
    expect(itemStepSchema.safeParse(validItem).success).toBe(true);
  });

  it("rejects a title that's too short", () => {
    const result = itemStepSchema.safeParse({ ...validItem, itemTitle: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const result = itemStepSchema.safeParse({ ...validItem, itemCategory: "spaceship" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid external listing URL but allows an empty one", () => {
    expect(
      itemStepSchema.safeParse({ ...validItem, externalListingUrl: "not a url" }).success,
    ).toBe(false);
    expect(
      itemStepSchema.safeParse({ ...validItem, externalListingUrl: "" }).success,
    ).toBe(true);
  });

  it("rejects zero or negative item count", () => {
    expect(itemStepSchema.safeParse({ ...validItem, itemCount: "0" }).success).toBe(
      false,
    );
  });
});

describe("pickupStepSchema (shared location schema)", () => {
  it("accepts a valid location", () => {
    expect(pickupStepSchema.safeParse(validLocation).success).toBe(true);
  });

  it("rejects a too-short address", () => {
    expect(
      pickupStepSchema.safeParse({ ...validLocation, fullAddress: "X" }).success,
    ).toBe(false);
  });

  it("rejects an empty contact name", () => {
    expect(
      pickupStepSchema.safeParse({ ...validLocation, contactName: "" }).success,
    ).toBe(false);
  });

  it("rejects a malformed phone number", () => {
    expect(
      pickupStepSchema.safeParse({ ...validLocation, contactPhone: "call me maybe" })
        .success,
    ).toBe(false);
  });

  it("defaults floor to 0 when omitted", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to omit it
    const { floor, ...rest } = validLocation;
    const result = pickupStepSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.floor).toBe(0);
  });
});

describe("scheduleStepSchema", () => {
  it("accepts 'asap' without a date", () => {
    expect(scheduleStepSchema.safeParse({ timing: "asap" }).success).toBe(true);
  });

  it("requires a date when timing is 'specific_date'", () => {
    expect(scheduleStepSchema.safeParse({ timing: "specific_date" }).success).toBe(false);
    expect(
      scheduleStepSchema.safeParse({
        timing: "specific_date",
        requestedDate: "2026-08-15",
      }).success,
    ).toBe(true);
  });

  it("accepts 'flexible' without a date", () => {
    expect(scheduleStepSchema.safeParse({ timing: "flexible" }).success).toBe(true);
  });
});

describe("assistanceStepSchema", () => {
  it("accepts a valid combination", () => {
    expect(assistanceStepSchema.safeParse(validAssistance).success).toBe(true);
  });

  it("rejects an unknown vehicle type", () => {
    expect(
      assistanceStepSchema.safeParse({
        ...validAssistance,
        requestedVehicleType: "helicopter",
      }).success,
    ).toBe(false);
  });
});

describe("orderWizardSchema (full submission)", () => {
  const fullDraft = {
    ...validItem,
    pickup: validLocation,
    destination: { ...validLocation, contactName: "Eva Svobodová" },
    timing: "asap",
    requestedDate: "",
    requestedTimeFrom: "",
    requestedTimeTo: "",
    ...validAssistance,
  };

  it("accepts a fully valid draft", () => {
    const result = orderWizardSchema.safeParse(fullDraft);
    expect(result.success).toBe(true);
  });

  it("rejects a draft missing the destination entirely", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to omit it
    const { destination, ...withoutDestination } = fullDraft;
    expect(orderWizardSchema.safeParse(withoutDestination).success).toBe(false);
  });

  it("rejects a draft with an invalid nested pickup address", () => {
    const invalid = { ...fullDraft, pickup: { ...validLocation, fullAddress: "x" } };
    expect(orderWizardSchema.safeParse(invalid).success).toBe(false);
  });
});
