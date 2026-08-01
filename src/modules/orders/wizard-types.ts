import type { AssistanceLevel, ItemCategory, VehicleType } from "@/types/database.types";

export interface LocationDraft {
  fullAddress: string;
  floor: string;
  hasElevator: boolean;
  parkingNotes: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

export const emptyLocationDraft: LocationDraft = {
  fullAddress: "",
  floor: "0",
  hasElevator: false,
  parkingNotes: "",
  contactName: "",
  contactPhone: "",
  notes: "",
};

export interface OrderDraft {
  itemTitle: string;
  itemCategory: ItemCategory | "";
  itemDescription: string;
  externalListingUrl: string;
  itemCount: string;
  estimatedWeightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  pickup: LocationDraft;
  destination: LocationDraft;
  timing: "asap" | "specific_date" | "flexible";
  requestedDate: string;
  requestedTimeFrom: string;
  requestedTimeTo: string;
  requestedVehicleType: VehicleType | "";
  assistanceLevel: AssistanceLevel | "";
  disassemblyRequired: boolean;
  assemblyRequired: boolean;
}

export const emptyOrderDraft: OrderDraft = {
  itemTitle: "",
  itemCategory: "",
  itemDescription: "",
  externalListingUrl: "",
  itemCount: "1",
  estimatedWeightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  pickup: emptyLocationDraft,
  destination: emptyLocationDraft,
  timing: "asap",
  requestedDate: "",
  requestedTimeFrom: "",
  requestedTimeTo: "",
  requestedVehicleType: "",
  assistanceLevel: "",
  disassemblyRequired: false,
  assemblyRequired: false,
};

export const STEP_LABELS = [
  "Věc",
  "Vyzvednutí",
  "Doručení",
  "Termín",
  "Pomoc",
  "Rekapitulace",
] as const;
