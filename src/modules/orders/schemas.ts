import { z } from "zod";

export const itemCategoryValues = [
  "sofa",
  "bed",
  "wardrobe",
  "table",
  "chair",
  "appliance",
  "electronics",
  "sports_equipment",
  "office_equipment",
  "boxes",
  "other",
] as const;

export const vehicleTypeValues = [
  "personal_car",
  "estate_car",
  "small_van",
  "large_van",
] as const;

export const assistanceLevelValues = [
  "driver_only",
  "driver_helps",
  "driver_plus_one",
  "driver_plus_two",
] as const;

const optionalNumber = (max: number) =>
  z
    .union([z.coerce.number().min(0).max(max), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v));

export const itemStepSchema = z.object({
  itemTitle: z.string().trim().min(2, "Popište, co se má převézt.").max(120),
  itemCategory: z.enum(itemCategoryValues, { error: "Vyberte kategorii." }),
  itemDescription: z.string().trim().max(1000).optional().or(z.literal("")),
  externalListingUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || z.url().safeParse(v).success, "Zadejte platnou adresu odkazu."),
  itemCount: z.coerce.number().int().min(1, "Alespoň 1 kus.").max(20),
  estimatedWeightKg: optionalNumber(2000),
  lengthCm: optionalNumber(1000),
  widthCm: optionalNumber(1000),
  heightCm: optionalNumber(1000),
});
export type ItemStepInput = z.infer<typeof itemStepSchema>;

const locationSchema = z.object({
  fullAddress: z.string().trim().min(5, "Zadejte celou adresu."),
  floor: z.coerce.number().int().min(0, "Přízemí je 0.").max(50).default(0),
  hasElevator: z.boolean().default(false),
  parkingNotes: z.string().trim().max(300).optional().or(z.literal("")),
  contactName: z.string().trim().min(1, "Zadejte kontaktní osobu."),
  contactPhone: z
    .string()
    .trim()
    .min(9, "Zadejte platné telefonní číslo.")
    .regex(/^\+?[0-9 ]+$/, "Jen číslice, mezery a úvodní +."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type LocationStepInput = z.infer<typeof locationSchema>;

export const pickupStepSchema = locationSchema;
export const destinationStepSchema = locationSchema;

export const scheduleStepSchema = z
  .object({
    timing: z.enum(["asap", "specific_date", "flexible"]),
    requestedDate: z.string().optional().or(z.literal("")),
    requestedTimeFrom: z.string().optional().or(z.literal("")),
    requestedTimeTo: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.timing !== "specific_date" || !!data.requestedDate, {
    error: "Zadejte datum.",
    path: ["requestedDate"],
  });
export type ScheduleStepInput = z.infer<typeof scheduleStepSchema>;

export const assistanceStepSchema = z.object({
  requestedVehicleType: z.enum(vehicleTypeValues, { error: "Vyberte typ vozidla." }),
  assistanceLevel: z.enum(assistanceLevelValues, { error: "Vyberte úroveň pomoci." }),
  disassemblyRequired: z.boolean().default(false),
  assemblyRequired: z.boolean().default(false),
});
export type AssistanceStepInput = z.infer<typeof assistanceStepSchema>;

export const orderWizardSchema = itemStepSchema
  .extend({
    pickup: pickupStepSchema,
    destination: destinationStepSchema,
    timing: z.enum(["asap", "specific_date", "flexible"]),
    requestedDate: z.string().optional().or(z.literal("")),
    requestedTimeFrom: z.string().optional().or(z.literal("")),
    requestedTimeTo: z.string().optional().or(z.literal("")),
  })
  .extend(assistanceStepSchema.shape)
  .refine((data) => data.timing !== "specific_date" || !!data.requestedDate, {
    error: "Zadejte datum.",
    path: ["requestedDate"],
  });

export type OrderWizardInput = z.infer<typeof orderWizardSchema>;
