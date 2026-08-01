/**
 * Hand-written to mirror supabase/migrations exactly, in the shape
 * `supabase gen types typescript` would produce. Regenerate with the real
 * CLI once a Supabase project (local via Docker, or cloud) exists —
 * `supabase gen types typescript --db-url <url> --schema public` — and
 * this file becomes redundant. Docker isn't available in this environment,
 * so the CLI couldn't be used to generate it (see Fáze 3 notes in README).
 */

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "customer" | "driver" | "admin";
export type AccountStatus = "active" | "suspended" | "deleted";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type VehicleType = "personal_car" | "estate_car" | "small_van" | "large_van";
export type AssistanceLevel =
  "driver_only" | "driver_helps" | "driver_plus_one" | "driver_plus_two";
export type ItemCategory =
  | "sofa"
  | "bed"
  | "wardrobe"
  | "table"
  | "chair"
  | "appliance"
  | "electronics"
  | "sports_equipment"
  | "office_equipment"
  | "boxes"
  | "other";
export type OrderStatus =
  | "draft"
  | "submitted"
  | "awaiting_driver"
  | "driver_assigned"
  | "driver_on_the_way"
  | "arrived_at_pickup"
  | "item_picked_up"
  | "in_transit"
  | "arrived_at_destination"
  | "delivered"
  | "completed"
  | "cancelled_by_customer"
  | "cancelled_by_driver"
  | "cancelled_by_admin"
  | "disputed";
export type LocationType = "pickup" | "destination";
export type ImageType =
  | "item_reference"
  | "pickup_condition"
  | "damage"
  | "delivery_condition"
  | "proof_of_delivery";
export type DocumentType =
  "id_card" | "drivers_license" | "vehicle_registration" | "business_license" | "other";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PayoutStatus = "pending" | "paid" | "held" | "failed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          role: UserRole;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          preferred_language: string;
          account_status: AccountStatus;
          is_business: boolean;
          company_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          role?: UserRole;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_language?: string;
          account_status?: AccountStatus;
          is_business?: boolean;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      driver_profiles: {
        Row: {
          id: string;
          profile_id: string;
          verification_status: VerificationStatus;
          business_name: string | null;
          company_id: string | null;
          tax_id: string | null;
          service_radius_km: number;
          home_latitude: number | null;
          home_longitude: number | null;
          average_rating: number | null;
          completed_jobs_count: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          verification_status?: VerificationStatus;
          business_name?: string | null;
          company_id?: string | null;
          tax_id?: string | null;
          service_radius_km?: number;
          home_latitude?: number | null;
          home_longitude?: number | null;
          average_rating?: number | null;
          completed_jobs_count?: number;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["driver_profiles"]["Insert"]>;
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          driver_profile_id: string;
          vehicle_type: VehicleType;
          brand: string;
          model: string;
          registration_number: string;
          cargo_length_cm: number | null;
          cargo_width_cm: number | null;
          cargo_height_cm: number | null;
          max_payload_kg: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_profile_id: string;
          vehicle_type: VehicleType;
          brand: string;
          model: string;
          registration_number: string;
          cargo_length_cm?: number | null;
          cargo_width_cm?: number | null;
          cargo_height_cm?: number | null;
          max_payload_kg?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [];
      };
      driver_documents: {
        Row: {
          id: string;
          driver_profile_id: string;
          document_type: DocumentType;
          storage_path: string;
          verification_status: VerificationStatus;
          expires_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_profile_id: string;
          document_type: DocumentType;
          storage_path: string;
          verification_status?: VerificationStatus;
          expires_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["driver_documents"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          public_code: string;
          customer_profile_id: string;
          assigned_driver_profile_id: string | null;
          status: OrderStatus;
          item_title: string;
          item_category: ItemCategory;
          item_description: string | null;
          external_listing_url: string | null;
          item_count: number;
          estimated_weight_kg: number | null;
          length_cm: number | null;
          width_cm: number | null;
          height_cm: number | null;
          requested_vehicle_type: VehicleType | null;
          assistance_level: AssistanceLevel;
          disassembly_required: boolean;
          assembly_required: boolean;
          requested_date: string | null;
          requested_time_from: string | null;
          requested_time_to: string | null;
          is_flexible: boolean;
          customer_price_czk: number | null;
          driver_payout_czk: number | null;
          platform_fee_czk: number | null;
          pricing_breakdown: Json | null;
          payment_status: PaymentStatus;
          payout_status: PayoutStatus;
          cancellation_reason: string | null;
          dispute_reason: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          public_code?: string;
          customer_profile_id: string;
          assigned_driver_profile_id?: string | null;
          status?: OrderStatus;
          item_title: string;
          item_category: ItemCategory;
          item_description?: string | null;
          external_listing_url?: string | null;
          item_count?: number;
          estimated_weight_kg?: number | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          requested_vehicle_type?: VehicleType | null;
          assistance_level?: AssistanceLevel;
          disassembly_required?: boolean;
          assembly_required?: boolean;
          requested_date?: string | null;
          requested_time_from?: string | null;
          requested_time_to?: string | null;
          is_flexible?: boolean;
          customer_price_czk?: number | null;
          driver_payout_czk?: number | null;
          platform_fee_czk?: number | null;
          pricing_breakdown?: Json | null;
          payment_status?: PaymentStatus;
          payout_status?: PayoutStatus;
          cancellation_reason?: string | null;
          dispute_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_locations: {
        Row: {
          id: string;
          order_id: string;
          location_type: LocationType;
          full_address: string;
          latitude: number | null;
          longitude: number | null;
          floor: number | null;
          has_elevator: boolean | null;
          parking_notes: string | null;
          contact_name: string;
          contact_phone: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          location_type: LocationType;
          full_address: string;
          latitude?: number | null;
          longitude?: number | null;
          floor?: number | null;
          has_elevator?: boolean | null;
          parking_notes?: string | null;
          contact_name: string;
          contact_phone: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_locations"]["Insert"]>;
        Relationships: [];
      };
      order_images: {
        Row: {
          id: string;
          order_id: string;
          uploaded_by_profile_id: string;
          image_type: ImageType;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          uploaded_by_profile_id: string;
          image_type: ImageType;
          storage_path: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_images"]["Insert"]>;
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          previous_status: OrderStatus | null;
          new_status: OrderStatus;
          changed_by_profile_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: never; // written only by the orders_log_status_change trigger
        Update: never;
        Relationships: [];
      };
      order_status_transitions: {
        Row: {
          from_status: OrderStatus;
          to_status: OrderStatus;
        };
        Insert: never; // static config, managed by migrations only
        Update: never;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          order_id: string;
          sender_profile_id: string;
          message_type: "text" | "system";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sender_profile_id: string;
          message_type?: "text" | "system";
          content: string;
          created_at?: string;
        };
        Update: never; // messages are immutable
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          order_id: string;
          reviewer_profile_id: string;
          reviewed_profile_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          reviewer_profile_id: string;
          reviewed_profile_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          provider_payment_id: string | null;
          amount_czk: number;
          status: PaymentStatus;
          created_at: string;
          updated_at: string;
        };
        // No client-reachable INSERT/UPDATE policy (see rls migration) —
        // writes only ever go through the service role. Still needs a real
        // shape, not `never`, or it also blocks that one legitimate
        // service-role writer (see modules/payments/actions.ts) — same bug
        // class as audit_logs.Insert originally was.
        Insert: {
          id?: string;
          order_id: string;
          provider?: string;
          provider_payment_id?: string | null;
          amount_czk: number;
          status?: PaymentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: string;
          provider_payment_id?: string | null;
          amount_czk?: number;
          status?: PaymentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          order_id: string;
          driver_profile_id: string;
          provider_payout_id: string | null;
          amount_czk: number;
          status: PayoutStatus;
          created_at: string;
          updated_at: string;
        };
        // Same reasoning as payments.Insert/Update above.
        Insert: {
          id?: string;
          order_id: string;
          driver_profile_id: string;
          provider_payout_id?: string | null;
          amount_czk: number;
          status?: PayoutStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          driver_profile_id?: string;
          provider_payout_id?: string | null;
          amount_czk?: number;
          status?: PayoutStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_profile_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        // Writable, but only ever via the service-role client
        // (src/lib/supabase/service.ts) — regular clients have no
        // client-reachable INSERT policy for this table at all (RLS
        // defaults to deny). `never` here would also block the one
        // legitimate writer, which is the actual bug this fixes.
        Insert: {
          id?: string;
          actor_profile_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      available_jobs: {
        Args: Record<PropertyKey, never>;
        Returns: {
          order_id: string;
          item_title: string;
          item_category: ItemCategory;
          driver_payout_czk: number | null;
          requested_vehicle_type: VehicleType | null;
          assistance_level: AssistanceLevel;
          disassembly_required: boolean;
          assembly_required: boolean;
          requested_date: string | null;
          requested_time_from: string | null;
          requested_time_to: string | null;
          is_flexible: boolean;
          pickup_area: string | null;
          pickup_floor: number | null;
          pickup_has_elevator: boolean | null;
          destination_area: string | null;
          destination_floor: number | null;
          destination_has_elevator: boolean | null;
          photo_count: number;
        }[];
      };
      create_order: {
        Args: {
          p_item_title: string;
          p_item_category: ItemCategory;
          p_item_description: string | null;
          p_external_listing_url: string | null;
          p_item_count: number;
          p_estimated_weight_kg: number | null;
          p_length_cm: number | null;
          p_width_cm: number | null;
          p_height_cm: number | null;
          p_requested_vehicle_type: VehicleType;
          p_assistance_level: AssistanceLevel;
          p_disassembly_required: boolean;
          p_assembly_required: boolean;
          p_requested_date: string | null;
          p_requested_time_from: string | null;
          p_requested_time_to: string | null;
          p_is_flexible: boolean;
          p_customer_price_czk: number;
          p_driver_payout_czk: number;
          p_platform_fee_czk: number;
          p_pricing_breakdown: Json;
          p_pickup: Json;
          p_destination: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      verification_status: VerificationStatus;
      vehicle_type: VehicleType;
      assistance_level: AssistanceLevel;
      item_category: ItemCategory;
      order_status: OrderStatus;
      location_type: LocationType;
      image_type: ImageType;
      document_type: DocumentType;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
