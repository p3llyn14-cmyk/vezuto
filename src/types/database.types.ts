export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_profile_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          actor_profile_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          actor_profile_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_documents: {
        Row: {
          created_at: string;
          document_type: Database["public"]["Enums"]["document_type"];
          driver_profile_id: string;
          expires_at: string | null;
          id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          storage_path: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        Insert: {
          created_at?: string;
          document_type: Database["public"]["Enums"]["document_type"];
          driver_profile_id: string;
          expires_at?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          storage_path: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          created_at?: string;
          document_type?: Database["public"]["Enums"]["document_type"];
          driver_profile_id?: string;
          expires_at?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          storage_path?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_profile_id_fkey";
            columns: ["driver_profile_id"];
            isOneToOne: false;
            referencedRelation: "driver_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_documents_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_profiles: {
        Row: {
          average_rating: number | null;
          business_name: string | null;
          company_id: string | null;
          completed_jobs_count: number;
          created_at: string;
          current_latitude: number | null;
          current_longitude: number | null;
          home_latitude: number | null;
          home_longitude: number | null;
          id: string;
          is_available: boolean;
          location_updated_at: string | null;
          profile_id: string;
          service_radius_km: number;
          tax_id: string | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
        };
        Insert: {
          average_rating?: number | null;
          business_name?: string | null;
          company_id?: string | null;
          completed_jobs_count?: number;
          created_at?: string;
          current_latitude?: number | null;
          current_longitude?: number | null;
          home_latitude?: number | null;
          home_longitude?: number | null;
          id?: string;
          is_available?: boolean;
          location_updated_at?: string | null;
          profile_id: string;
          service_radius_km?: number;
          tax_id?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Update: {
          average_rating?: number | null;
          business_name?: string | null;
          company_id?: string | null;
          completed_jobs_count?: number;
          created_at?: string;
          current_latitude?: number | null;
          current_longitude?: number | null;
          home_latitude?: number | null;
          home_longitude?: number | null;
          id?: string;
          is_available?: boolean;
          location_updated_at?: string | null;
          profile_id?: string;
          service_radius_km?: number;
          tax_id?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
        };
        Relationships: [
          {
            foreignKeyName: "driver_profiles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          message_type: string;
          order_id: string;
          sender_profile_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          message_type?: string;
          order_id: string;
          sender_profile_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          message_type?: string;
          order_id?: string;
          sender_profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey";
            columns: ["sender_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_images: {
        Row: {
          created_at: string;
          id: string;
          image_type: Database["public"]["Enums"]["image_type"];
          order_id: string;
          storage_path: string;
          uploaded_by_profile_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_type: Database["public"]["Enums"]["image_type"];
          order_id: string;
          storage_path: string;
          uploaded_by_profile_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_type?: Database["public"]["Enums"]["image_type"];
          order_id?: string;
          storage_path?: string;
          uploaded_by_profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_images_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_images_uploaded_by_profile_id_fkey";
            columns: ["uploaded_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_locations: {
        Row: {
          contact_name: string;
          contact_phone: string;
          created_at: string;
          floor: number | null;
          full_address: string;
          has_elevator: boolean | null;
          id: string;
          latitude: number | null;
          location_type: Database["public"]["Enums"]["location_type"];
          longitude: number | null;
          notes: string | null;
          order_id: string;
          parking_notes: string | null;
        };
        Insert: {
          contact_name: string;
          contact_phone: string;
          created_at?: string;
          floor?: number | null;
          full_address: string;
          has_elevator?: boolean | null;
          id?: string;
          latitude?: number | null;
          location_type: Database["public"]["Enums"]["location_type"];
          longitude?: number | null;
          notes?: string | null;
          order_id: string;
          parking_notes?: string | null;
        };
        Update: {
          contact_name?: string;
          contact_phone?: string;
          created_at?: string;
          floor?: number | null;
          full_address?: string;
          has_elevator?: boolean | null;
          id?: string;
          latitude?: number | null;
          location_type?: Database["public"]["Enums"]["location_type"];
          longitude?: number | null;
          notes?: string | null;
          order_id?: string;
          parking_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_locations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_by_profile_id: string | null;
          created_at: string;
          id: string;
          new_status: Database["public"]["Enums"]["order_status"];
          note: string | null;
          order_id: string;
          previous_status: Database["public"]["Enums"]["order_status"] | null;
        };
        Insert: {
          changed_by_profile_id?: string | null;
          created_at?: string;
          id?: string;
          new_status: Database["public"]["Enums"]["order_status"];
          note?: string | null;
          order_id: string;
          previous_status?: Database["public"]["Enums"]["order_status"] | null;
        };
        Update: {
          changed_by_profile_id?: string | null;
          created_at?: string;
          id?: string;
          new_status?: Database["public"]["Enums"]["order_status"];
          note?: string | null;
          order_id?: string;
          previous_status?: Database["public"]["Enums"]["order_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_profile_id_fkey";
            columns: ["changed_by_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_transitions: {
        Row: {
          from_status: Database["public"]["Enums"]["order_status"];
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          from_status: Database["public"]["Enums"]["order_status"];
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          from_status?: Database["public"]["Enums"]["order_status"];
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [];
      };
      orders: {
        Row: {
          assembly_required: boolean;
          assigned_driver_profile_id: string | null;
          assistance_level: Database["public"]["Enums"]["assistance_level"];
          cancellation_reason: string | null;
          completed_at: string | null;
          created_at: string;
          customer_price_czk: number | null;
          customer_profile_id: string;
          disassembly_required: boolean;
          dispute_reason: string | null;
          driver_payout_czk: number | null;
          estimated_weight_kg: number | null;
          external_listing_url: string | null;
          height_cm: number | null;
          id: string;
          is_flexible: boolean;
          item_category: Database["public"]["Enums"]["item_category"];
          item_count: number;
          item_description: string | null;
          item_title: string;
          length_cm: number | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          payout_status: Database["public"]["Enums"]["payout_status"];
          platform_fee_czk: number | null;
          pricing_breakdown: Json | null;
          public_code: string;
          requested_date: string | null;
          requested_time_from: string | null;
          requested_time_to: string | null;
          requested_vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
          width_cm: number | null;
        };
        Insert: {
          assembly_required?: boolean;
          assigned_driver_profile_id?: string | null;
          assistance_level?: Database["public"]["Enums"]["assistance_level"];
          cancellation_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_price_czk?: number | null;
          customer_profile_id: string;
          disassembly_required?: boolean;
          dispute_reason?: string | null;
          driver_payout_czk?: number | null;
          estimated_weight_kg?: number | null;
          external_listing_url?: string | null;
          height_cm?: number | null;
          id?: string;
          is_flexible?: boolean;
          item_category: Database["public"]["Enums"]["item_category"];
          item_count?: number;
          item_description?: string | null;
          item_title: string;
          length_cm?: number | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payout_status?: Database["public"]["Enums"]["payout_status"];
          platform_fee_czk?: number | null;
          pricing_breakdown?: Json | null;
          public_code?: string;
          requested_date?: string | null;
          requested_time_from?: string | null;
          requested_time_to?: string | null;
          requested_vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          width_cm?: number | null;
        };
        Update: {
          assembly_required?: boolean;
          assigned_driver_profile_id?: string | null;
          assistance_level?: Database["public"]["Enums"]["assistance_level"];
          cancellation_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_price_czk?: number | null;
          customer_profile_id?: string;
          disassembly_required?: boolean;
          dispute_reason?: string | null;
          driver_payout_czk?: number | null;
          estimated_weight_kg?: number | null;
          external_listing_url?: string | null;
          height_cm?: number | null;
          id?: string;
          is_flexible?: boolean;
          item_category?: Database["public"]["Enums"]["item_category"];
          item_count?: number;
          item_description?: string | null;
          item_title?: string;
          length_cm?: number | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payout_status?: Database["public"]["Enums"]["payout_status"];
          platform_fee_czk?: number | null;
          pricing_breakdown?: Json | null;
          public_code?: string;
          requested_date?: string | null;
          requested_time_from?: string | null;
          requested_time_to?: string | null;
          requested_vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_assigned_driver_profile_id_fkey";
            columns: ["assigned_driver_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_profile_id_fkey";
            columns: ["customer_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_czk: number;
          created_at: string;
          id: string;
          order_id: string;
          provider: string;
          provider_payment_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
        };
        Insert: {
          amount_czk: number;
          created_at?: string;
          id?: string;
          order_id: string;
          provider?: string;
          provider_payment_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Update: {
          amount_czk?: number;
          created_at?: string;
          id?: string;
          order_id?: string;
          provider?: string;
          provider_payment_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          amount_czk: number;
          created_at: string;
          driver_profile_id: string;
          id: string;
          order_id: string;
          provider_payout_id: string | null;
          status: Database["public"]["Enums"]["payout_status"];
          updated_at: string;
        };
        Insert: {
          amount_czk: number;
          created_at?: string;
          driver_profile_id: string;
          id?: string;
          order_id: string;
          provider_payout_id?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          updated_at?: string;
        };
        Update: {
          amount_czk?: number;
          created_at?: string;
          driver_profile_id?: string;
          id?: string;
          order_id?: string;
          provider_payout_id?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_driver_profile_id_fkey";
            columns: ["driver_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payouts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          auth_user_id: string;
          avatar_url: string | null;
          company_name: string | null;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          is_business: boolean;
          last_name: string;
          phone: string | null;
          preferred_language: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          auth_user_id: string;
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          is_business?: boolean;
          last_name: string;
          phone?: string | null;
          preferred_language?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          auth_user_id?: string;
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          is_business?: boolean;
          last_name?: string;
          phone?: string | null;
          preferred_language?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          order_id: string;
          rating: number;
          reviewed_profile_id: string;
          reviewer_profile_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          rating: number;
          reviewed_profile_id: string;
          reviewer_profile_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          rating?: number;
          reviewed_profile_id?: string;
          reviewer_profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_reviewed_profile_id_fkey";
            columns: ["reviewed_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_reviewer_profile_id_fkey";
            columns: ["reviewer_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          active: boolean;
          brand: string;
          cargo_height_cm: number | null;
          cargo_length_cm: number | null;
          cargo_width_cm: number | null;
          created_at: string;
          driver_profile_id: string;
          id: string;
          max_payload_kg: number | null;
          model: string;
          registration_number: string;
          updated_at: string;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"];
        };
        Insert: {
          active?: boolean;
          brand: string;
          cargo_height_cm?: number | null;
          cargo_length_cm?: number | null;
          cargo_width_cm?: number | null;
          created_at?: string;
          driver_profile_id: string;
          id?: string;
          max_payload_kg?: number | null;
          model: string;
          registration_number: string;
          updated_at?: string;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"];
        };
        Update: {
          active?: boolean;
          brand?: string;
          cargo_height_cm?: number | null;
          cargo_length_cm?: number | null;
          cargo_width_cm?: number | null;
          created_at?: string;
          driver_profile_id?: string;
          id?: string;
          max_payload_kg?: number | null;
          model?: string;
          registration_number?: string;
          updated_at?: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_profile_id_fkey";
            columns: ["driver_profile_id"];
            isOneToOne: false;
            referencedRelation: "driver_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approximate_address: { Args: { full_address: string }; Returns: string };
      available_jobs: {
        Args: never;
        Returns: {
          assembly_required: boolean;
          assistance_level: Database["public"]["Enums"]["assistance_level"];
          destination_area: string;
          destination_floor: number;
          destination_has_elevator: boolean;
          disassembly_required: boolean;
          distance_km: number | null;
          driver_payout_czk: number;
          is_flexible: boolean;
          item_category: Database["public"]["Enums"]["item_category"];
          item_title: string;
          order_id: string;
          photo_count: number;
          pickup_area: string;
          pickup_floor: number;
          pickup_has_elevator: boolean;
          requested_date: string;
          requested_time_from: string;
          requested_time_to: string;
          requested_vehicle_type: Database["public"]["Enums"]["vehicle_type"];
        }[];
      };
      create_order: {
        // The generator doesn't infer nullability for plain (non-DEFAULT)
        // scalar RPC parameters, but Postgres function params are nullable
        // unless constrained otherwise — these genuinely accept null (the
        // function body passes them through nullif()/nullable columns, and
        // the caller in modules/orders/actions.ts intentionally sends null
        // for optional fields). Same bug class as the Insert/Relationships
        // fixes on the hand-written version of this file.
        Args: {
          p_assembly_required: boolean;
          p_assistance_level: Database["public"]["Enums"]["assistance_level"];
          p_customer_price_czk: number;
          p_destination: Json;
          p_disassembly_required: boolean;
          p_driver_payout_czk: number;
          p_estimated_weight_kg: number | null;
          p_external_listing_url: string | null;
          p_height_cm: number | null;
          p_is_flexible: boolean;
          p_item_category: Database["public"]["Enums"]["item_category"];
          p_item_count: number;
          p_item_description: string | null;
          p_item_title: string;
          p_length_cm: number | null;
          p_pickup: Json;
          p_platform_fee_czk: number;
          p_pricing_breakdown: Json;
          p_requested_date: string | null;
          p_requested_time_from: string | null;
          p_requested_time_to: string | null;
          p_requested_vehicle_type: Database["public"]["Enums"]["vehicle_type"];
          p_width_cm: number | null;
        };
        Returns: string;
      };
      current_profile_id: { Args: never; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      is_driver: { Args: never; Returns: boolean };
      is_order_participant: {
        Args: { target_order_id: string };
        Returns: boolean;
      };
      is_valid_order_transition: {
        Args: {
          p_from: Database["public"]["Enums"]["order_status"];
          p_to: Database["public"]["Enums"]["order_status"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      account_status: "active" | "suspended" | "deleted";
      assistance_level:
        "driver_only" | "driver_helps" | "driver_plus_one" | "driver_plus_two";
      document_type:
        | "id_card"
        | "drivers_license"
        | "vehicle_registration"
        | "business_license"
        | "other";
      image_type:
        | "item_reference"
        | "pickup_condition"
        | "damage"
        | "delivery_condition"
        | "proof_of_delivery";
      item_category:
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
      location_type: "pickup" | "destination";
      order_status:
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
      payment_status: "pending" | "paid" | "failed" | "refunded";
      payout_status: "pending" | "paid" | "held" | "failed";
      user_role: "customer" | "driver" | "admin";
      vehicle_type: "personal_car" | "estate_car" | "small_van" | "large_van";
      verification_status: "unverified" | "pending" | "verified" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended", "deleted"],
      assistance_level: [
        "driver_only",
        "driver_helps",
        "driver_plus_one",
        "driver_plus_two",
      ],
      document_type: [
        "id_card",
        "drivers_license",
        "vehicle_registration",
        "business_license",
        "other",
      ],
      image_type: [
        "item_reference",
        "pickup_condition",
        "damage",
        "delivery_condition",
        "proof_of_delivery",
      ],
      item_category: [
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
      ],
      location_type: ["pickup", "destination"],
      order_status: [
        "draft",
        "submitted",
        "awaiting_driver",
        "driver_assigned",
        "driver_on_the_way",
        "arrived_at_pickup",
        "item_picked_up",
        "in_transit",
        "arrived_at_destination",
        "delivered",
        "completed",
        "cancelled_by_customer",
        "cancelled_by_driver",
        "cancelled_by_admin",
        "disputed",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payout_status: ["pending", "paid", "held", "failed"],
      user_role: ["customer", "driver", "admin"],
      vehicle_type: ["personal_car", "estate_car", "small_van", "large_van"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const;

// Convenience aliases used throughout the app (modules/pricing,
// modules/orders, ...) — re-exported from the generated Enums rather than
// duplicated as literal unions, so they can never drift from the real schema.
export type UserRole = Database["public"]["Enums"]["user_role"];
export type AccountStatus = Database["public"]["Enums"]["account_status"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type VehicleType = Database["public"]["Enums"]["vehicle_type"];
export type AssistanceLevel = Database["public"]["Enums"]["assistance_level"];
export type ItemCategory = Database["public"]["Enums"]["item_category"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type LocationType = Database["public"]["Enums"]["location_type"];
export type ImageType = Database["public"]["Enums"]["image_type"];
export type DocumentType = Database["public"]["Enums"]["document_type"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PayoutStatus = Database["public"]["Enums"]["payout_status"];
