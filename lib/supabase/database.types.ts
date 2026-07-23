export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academies: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          email: string | null
          id: string
          legal_name: string | null
          name: string
          phone: string | null
          public_code: string
          status: string
          timezone: string
          updated_at: string
          whatsapp: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          name: string
          phone?: string | null
          public_code?: string
          status?: string
          timezone?: string
          updated_at?: string
          whatsapp?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          phone?: string | null
          public_code?: string
          status?: string
          timezone?: string
          updated_at?: string
          whatsapp?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_branding: {
        Row: {
          academy_id: string
          accent_color: string
          logo_object_key: string | null
          primary_color: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          accent_color?: string
          logo_object_key?: string | null
          primary_color?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          accent_color?: string
          logo_object_key?: string | null
          primary_color?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_branding_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: true
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_branding_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_memberships: {
        Row: {
          academy_id: string
          active: boolean
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          active?: boolean
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          active?: boolean
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_settings: {
        Row: {
          academy_id: string
          attendance_after_minutes: number
          attendance_before_minutes: number
          debt_policy: string
          default_capacity: number
          default_commission_bps: number
          receipt_text: string | null
          report_footer: string | null
          require_transfer_proof: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          attendance_after_minutes?: number
          attendance_before_minutes?: number
          debt_policy?: string
          default_capacity?: number
          default_commission_bps?: number
          receipt_text?: string | null
          report_footer?: string | null
          require_transfer_proof?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          attendance_after_minutes?: number
          attendance_before_minutes?: number
          debt_policy?: string
          default_capacity?: number
          default_commission_bps?: number
          receipt_text?: string | null
          report_footer?: string | null
          require_transfer_proof?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_settings_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: true
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          academy_id: string | null
          assigned_to: string | null
          branch_id: string | null
          created_at: string
          detail: string
          entity_id: string | null
          entity_type: string | null
          id: string
          resolution: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          academy_id?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string
          detail: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
          type: string
          workspace_id: string
        }
        Update: {
          academy_id?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string
          detail?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          academy_id: string | null
          branch_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          previous_value: Json | null
          priority: string
          proposed_value: Json | null
          reason: string
          requester_id: string
          resolution: string | null
          resolution_comment: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          type: string
          workspace_id: string
        }
        Insert: {
          academy_id?: string | null
          branch_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          previous_value?: Json | null
          priority?: string
          proposed_value?: Json | null
          reason: string
          requester_id: string
          resolution?: string | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type: string
          workspace_id: string
        }
        Update: {
          academy_id?: string | null
          branch_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          previous_value?: Json | null
          priority?: string
          proposed_value?: Json | null
          reason?: string
          requester_id?: string
          resolution?: string | null
          resolution_comment?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          class_session_id: string
          closed_at: string | null
          created_at: string
          edited_by: string | null
          enrollment_id: string
          first_edited_at: string
          id: string
          notes: string | null
          status: string
          student_id: string
          suggested_by_checkin_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          class_session_id: string
          closed_at?: string | null
          created_at?: string
          edited_by?: string | null
          enrollment_id: string
          first_edited_at?: string
          id?: string
          notes?: string | null
          status: string
          student_id: string
          suggested_by_checkin_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          class_session_id?: string
          closed_at?: string | null
          created_at?: string
          edited_by?: string | null
          enrollment_id?: string
          first_edited_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          suggested_by_checkin_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          academy_id: string | null
          action: string
          actor_id: string | null
          actor_role: string | null
          branch_id: string | null
          correlation_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          ip_hash: string | null
          metadata: Json
          next_value: Json | null
          origin: string
          previous_value: Json | null
          reason: string | null
          request_id: string | null
          user_agent_family: string | null
          workspace_id: string | null
        }
        Insert: {
          academy_id?: string | null
          action: string
          actor_id?: string | null
          actor_role?: string | null
          branch_id?: string | null
          correlation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          ip_hash?: string | null
          metadata?: Json
          next_value?: Json | null
          origin?: string
          previous_value?: Json | null
          reason?: string | null
          request_id?: string | null
          user_agent_family?: string | null
          workspace_id?: string | null
        }
        Update: {
          academy_id?: string | null
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          branch_id?: string | null
          correlation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip_hash?: string | null
          metadata?: Json
          next_value?: Json | null
          origin?: string
          previous_value?: Json | null
          reason?: string | null
          request_id?: string | null
          user_agent_family?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_memberships: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_memberships_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          academy_id: string
          address: string | null
          city: string | null
          code: string
          created_at: string
          id: string
          name: string
          province: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          province?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          province?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount_cents: number
          cash_session_id: string
          created_at: string
          id: string
          note: string | null
          payment_id: string | null
          type: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          cash_session_id: string
          created_at?: string
          id?: string
          note?: string | null
          payment_id?: string | null
          type: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          cash_session_id?: string
          created_at?: string
          id?: string
          note?: string | null
          payment_id?: string | null
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          academy_id: string
          branch_id: string
          closed_at: string | null
          counted_cents: number | null
          difference_cents: number | null
          expected_cents: number | null
          id: string
          note: string | null
          opened_at: string
          opened_by: string
          opening_cents: number
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          branch_id: string
          closed_at?: string | null
          counted_cents?: number | null
          difference_cents?: number | null
          expected_cents?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opened_by: string
          opening_cents?: number
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          branch_id?: string
          closed_at?: string | null
          counted_cents?: number | null
          difference_cents?: number | null
          expected_cents?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opened_by?: string
          opening_cents?: number
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      charges: {
        Row: {
          academy_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cohort_id: string | null
          commissionable: boolean
          created_at: string
          description: string
          discount_cents: number
          due_date: string
          enrollment_id: string | null
          final_cents: number | null
          id: string
          installment_number: number | null
          original_cents: number
          service_period: unknown
          status: string
          student_id: string
          surcharge_cents: number
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cohort_id?: string | null
          commissionable?: boolean
          created_at?: string
          description: string
          discount_cents?: number
          due_date: string
          enrollment_id?: string | null
          final_cents?: number | null
          id?: string
          installment_number?: number | null
          original_cents: number
          service_period?: unknown
          status?: string
          student_id: string
          surcharge_cents?: number
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cohort_id?: string | null
          commissionable?: boolean
          created_at?: string
          description?: string
          discount_cents?: number
          due_date?: string
          enrollment_id?: string | null
          final_cents?: number | null
          id?: string
          installment_number?: number | null
          original_cents?: number
          service_period?: unknown
          status?: string
          student_id?: string
          surcharge_cents?: number
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          academy_id: string
          branch_id: string | null
          class_session_id: string | null
          created_at: string
          created_by: string | null
          device_hash: string | null
          id: string
          override_by: string | null
          override_reason: string | null
          qr_credential_id: string | null
          reason: string
          reason_code: string
          request_id: string | null
          result: string
          student_id: string | null
          workspace_id: string
        }
        Insert: {
          academy_id: string
          branch_id?: string | null
          class_session_id?: string | null
          created_at?: string
          created_by?: string | null
          device_hash?: string | null
          id?: string
          override_by?: string | null
          override_reason?: string | null
          qr_credential_id?: string | null
          reason: string
          reason_code: string
          request_id?: string | null
          result: string
          student_id?: string | null
          workspace_id: string
        }
        Update: {
          academy_id?: string
          branch_id?: string | null
          class_session_id?: string | null
          created_at?: string
          created_by?: string | null
          device_hash?: string | null
          id?: string
          override_by?: string | null
          override_reason?: string | null
          qr_credential_id?: string | null
          reason?: string
          reason_code?: string
          request_id?: string | null
          result?: string
          student_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_qr_credential_id_fkey"
            columns: ["qr_credential_id"]
            isOneToOne: false
            referencedRelation: "qr_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          academy_id: string
          attendance_closed_at: string | null
          attendance_open: boolean
          branch_id: string
          cohort_id: string
          created_at: string
          ends_at: string
          id: string
          original_session_id: string | null
          planned_instructor_id: string | null
          reason: string | null
          session_date: string
          starts_at: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          attendance_closed_at?: string | null
          attendance_open?: boolean
          branch_id: string
          cohort_id: string
          created_at?: string
          ends_at: string
          id?: string
          original_session_id?: string | null
          planned_instructor_id?: string | null
          reason?: string | null
          session_date: string
          starts_at: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          attendance_closed_at?: string | null
          attendance_open?: boolean
          branch_id?: string
          cohort_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          original_session_id?: string | null
          planned_instructor_id?: string | null
          reason?: string | null
          session_date?: string
          starts_at?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_original_session_id_fkey"
            columns: ["original_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_planned_instructor_id_fkey"
            columns: ["planned_instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_instructors: {
        Row: {
          cohort_id: string
          id: string
          instructor_user_id: string
          role: string
          valid_from: string
          valid_to: string | null
          workspace_id: string
        }
        Insert: {
          cohort_id: string
          id?: string
          instructor_user_id: string
          role?: string
          valid_from: string
          valid_to?: string | null
          workspace_id: string
        }
        Update: {
          cohort_id?: string
          id?: string
          instructor_user_id?: string
          role?: string
          valid_from?: string
          valid_to?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_instructors_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_instructors_instructor_user_id_fkey"
            columns: ["instructor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_instructors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_schedule_days: {
        Row: {
          academy_id: string
          branch_id: string
          cohort_id: string
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          updated_at: string
          weekday: number
          workspace_id: string
        }
        Insert: {
          academy_id: string
          branch_id: string
          cohort_id: string
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          updated_at?: string
          weekday: number
          workspace_id: string
        }
        Update: {
          academy_id?: string
          branch_id?: string
          cohort_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          updated_at?: string
          weekday?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_schedule_days_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_schedule_days_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_schedule_days_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_schedule_days_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          academy_id: string
          archived_at: string | null
          branch_id: string
          capacity: number
          code: string
          commission_bps: number | null
          course_id: string
          created_at: string
          created_by: string | null
          debt_policy: string
          due_day: number | null
          ends_at: string | null
          estimated_end_date: string
          id: string
          idempotency_key: string | null
          installment_cents: number
          installment_count: number
          instructor_user_id: string | null
          name: string
          notes: string | null
          request_hash: string | null
          start_date: string
          starts_at: string | null
          status: string
          updated_at: string
          weekday: number | null
          workspace_id: string
        }
        Insert: {
          academy_id: string
          archived_at?: string | null
          branch_id: string
          capacity?: number
          code: string
          commission_bps?: number | null
          course_id: string
          created_at?: string
          created_by?: string | null
          debt_policy?: string
          due_day?: number | null
          ends_at?: string | null
          estimated_end_date: string
          id?: string
          idempotency_key?: string | null
          installment_cents: number
          installment_count?: number
          instructor_user_id?: string | null
          name: string
          notes?: string | null
          request_hash?: string | null
          start_date: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          weekday?: number | null
          workspace_id: string
        }
        Update: {
          academy_id?: string
          archived_at?: string | null
          branch_id?: string
          capacity?: number
          code?: string
          commission_bps?: number | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          debt_policy?: string
          due_day?: number | null
          ends_at?: string | null
          estimated_end_date?: string
          id?: string
          idempotency_key?: string | null
          installment_cents?: number
          installment_count?: number
          instructor_user_id?: string | null
          name?: string
          notes?: string | null
          request_hash?: string | null
          start_date?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          weekday?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_instructor_user_id_fkey"
            columns: ["instructor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rule_versions: {
        Row: {
          commission_bps: number
          created_at: string
          created_by: string
          id: string
          reason: string
          rule_id: string
          valid_from: string
          valid_to: string | null
          workspace_id: string
        }
        Insert: {
          commission_bps: number
          created_at?: string
          created_by: string
          id?: string
          reason: string
          rule_id: string
          valid_from: string
          valid_to?: string | null
          workspace_id: string
        }
        Update: {
          commission_bps?: number
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          rule_id?: string
          valid_from?: string
          valid_to?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rule_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rule_versions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rule_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          academy_id: string
          active: boolean
          cohort_id: string | null
          created_at: string
          id: string
          instructor_user_id: string | null
          workspace_id: string
        }
        Insert: {
          academy_id: string
          active?: boolean
          cohort_id?: string | null
          created_at?: string
          id?: string
          instructor_user_id?: string | null
          workspace_id: string
        }
        Update: {
          academy_id?: string
          active?: boolean
          cohort_id?: string | null
          created_at?: string
          id?: string
          instructor_user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_instructor_user_id_fkey"
            columns: ["instructor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academy_id: string
          active: boolean
          archived_at: string | null
          class_duration_minutes: number | null
          code: string
          created_at: string
          currency: string
          default_installments: number
          description: string | null
          estimated_duration_weeks: number | null
          id: string
          name: string
          suggested_capacity: number | null
          suggested_commission_bps: number | null
          suggested_frequency: string | null
          suggested_price_cents: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          active?: boolean
          archived_at?: string | null
          class_duration_minutes?: number | null
          code: string
          created_at?: string
          currency?: string
          default_installments?: number
          description?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          name: string
          suggested_capacity?: number | null
          suggested_commission_bps?: number | null
          suggested_frequency?: string | null
          suggested_price_cents?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          active?: boolean
          archived_at?: string | null
          class_duration_minutes?: number | null
          code?: string
          created_at?: string
          currency?: string
          default_installments?: number
          description?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          name?: string
          suggested_capacity?: number | null
          suggested_commission_bps?: number | null
          suggested_frequency?: string | null
          suggested_price_cents?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academy_id: string
          agreed_price_cents: number
          branch_id: string
          code: string
          cohort_id: string
          created_at: string
          created_by: string | null
          discount_affects_commission: boolean
          discount_approved_by: string | null
          discount_reason: string | null
          discount_type: string | null
          discount_value: number | null
          drop_reason: string | null
          dropped_out_at: string | null
          effective_start: string
          enrolled_at: string
          future_charge_policy: string | null
          id: string
          installment_count: number
          notes: string | null
          status: string
          student_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          agreed_price_cents: number
          branch_id: string
          code: string
          cohort_id: string
          created_at?: string
          created_by?: string | null
          discount_affects_commission?: boolean
          discount_approved_by?: string | null
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number | null
          drop_reason?: string | null
          dropped_out_at?: string | null
          effective_start?: string
          enrolled_at?: string
          future_charge_policy?: string | null
          id?: string
          installment_count: number
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          agreed_price_cents?: number
          branch_id?: string
          code?: string
          cohort_id?: string
          created_at?: string
          created_by?: string | null
          discount_affects_commission?: boolean
          discount_approved_by?: string | null
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number | null
          drop_reason?: string | null
          dropped_out_at?: string | null
          effective_start?: string
          enrolled_at?: string
          future_charge_policy?: string | null
          id?: string
          installment_count?: number
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_discount_approved_by_fkey"
            columns: ["discount_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          academy_id: string | null
          config: Json
          enabled: boolean
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          workspace_id: string | null
        }
        Insert: {
          academy_id?: string | null
          config?: Json
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          academy_id?: string | null
          config?: Json
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          academy_id: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string
          error_rows: number
          file_name: string
          id: string
          object_key: string | null
          reverted_at: string | null
          status: string
          total_rows: number
          type: string
          valid_rows: number
          workspace_id: string
        }
        Insert: {
          academy_id?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          error_rows?: number
          file_name: string
          id?: string
          object_key?: string | null
          reverted_at?: string | null
          status?: string
          total_rows?: number
          type: string
          valid_rows?: number
          workspace_id: string
        }
        Update: {
          academy_id?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          error_rows?: number
          file_name?: string
          id?: string
          object_key?: string | null
          reverted_at?: string | null
          status?: string
          total_rows?: number
          type?: string
          valid_rows?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          created_entity_id: string | null
          created_entity_type: string | null
          errors: Json
          id: number
          import_batch_id: string
          normalized_data: Json | null
          raw_data: Json
          row_number: number
          status: string
          workspace_id: string
        }
        Insert: {
          created_entity_id?: string | null
          created_entity_type?: string | null
          errors?: Json
          id?: never
          import_batch_id: string
          normalized_data?: Json | null
          raw_data: Json
          row_number: number
          status: string
          workspace_id: string
        }
        Update: {
          created_entity_id?: string | null
          created_entity_type?: string | null
          errors?: Json
          id?: never
          import_batch_id?: string
          normalized_data?: Json | null
          raw_data?: Json
          row_number?: number
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          academy_id: string | null
          branch_id: string | null
          created_at: string
          description: string
          evidence_object_key: string | null
          id: string
          involved: Json
          reported_by: string
          resolution: string | null
          responsible_id: string | null
          status: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id?: string | null
          branch_id?: string | null
          created_at?: string
          description: string
          evidence_object_key?: string | null
          id?: string
          involved?: Json
          reported_by: string
          resolution?: string | null
          responsible_id?: string | null
          status?: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string | null
          branch_id?: string | null
          created_at?: string
          description?: string
          evidence_object_key?: string | null
          id?: string
          involved?: Json
          reported_by?: string
          resolution?: string | null
          responsible_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_payouts: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          idempotency_key: string
          method: string
          paid_at: string
          proof_object_key: string | null
          reference: string | null
          registered_by: string
          settlement_id: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          idempotency_key: string
          method: string
          paid_at: string
          proof_object_key?: string | null
          reference?: string | null
          registered_by: string
          settlement_id: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          method?: string
          paid_at?: string
          proof_object_key?: string | null
          reference?: string | null
          registered_by?: string
          settlement_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payouts_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payouts_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "instructor_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payouts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_profiles: {
        Row: {
          academy_id: string
          active: boolean
          created_at: string
          default_commission_bps: number | null
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          active?: boolean
          created_at?: string
          default_commission_bps?: number | null
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          active?: boolean
          created_at?: string
          default_commission_bps?: number | null
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_profiles_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_settlements: {
        Row: {
          academy_cents: number
          academy_id: string
          base_cents: number
          closed_at: string | null
          closed_by: string | null
          cohort_id: string
          commission_bps: number
          created_at: string
          id: string
          instructor_cents: number
          instructor_user_id: string
          settlement_period_id: string
          snapshot: Json | null
          snapshot_hash: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          academy_cents?: number
          academy_id: string
          base_cents?: number
          closed_at?: string | null
          closed_by?: string | null
          cohort_id: string
          commission_bps: number
          created_at?: string
          id?: string
          instructor_cents?: number
          instructor_user_id: string
          settlement_period_id: string
          snapshot?: Json | null
          snapshot_hash?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          academy_cents?: number
          academy_id?: string
          base_cents?: number
          closed_at?: string | null
          closed_by?: string | null
          cohort_id?: string
          commission_bps?: number
          created_at?: string
          id?: string
          instructor_cents?: number
          instructor_user_id?: string
          settlement_period_id?: string
          snapshot?: Json | null
          snapshot_hash?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_settlements_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_settlements_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_settlements_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_settlements_instructor_user_id_fkey"
            columns: ["instructor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_settlements_settlement_period_id_fkey"
            columns: ["settlement_period_id"]
            isOneToOne: false
            referencedRelation: "settlement_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_settlements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          error_code: string | null
          finished_at: string | null
          id: string
          job: string
          result: Json | null
          started_at: string
          status: string
          workspace_id: string | null
        }
        Insert: {
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job: string
          result?: Json | null
          started_at?: string
          status: string
          workspace_id?: string | null
        }
        Update: {
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job?: string
          result?: Json | null
          started_at?: string
          status?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_attempts: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_code: string | null
          id: string
          outbox_id: string
          provider: string
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          outbox_id: string
          provider: string
          status: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          outbox_id?: string
          provider?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_attempts_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "notification_outbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_attempts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          delivered_at: string | null
          id: string
          idempotency_key: string
          last_error_code: string | null
          next_attempt_at: string
          payload: Json
          recipient: string
          status: string
          template_id: string | null
          workspace_id: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          idempotency_key: string
          last_error_code?: string | null
          next_attempt_at?: string
          payload?: Json
          recipient: string
          status?: string
          template_id?: string | null
          workspace_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          idempotency_key?: string
          last_error_code?: string | null
          next_attempt_at?: string
          payload?: Json
          recipient?: string
          status?: string
          template_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          academy_id: string | null
          active: boolean
          body_template: string
          channel: string
          event: string
          id: string
          subject_template: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          academy_id?: string | null
          active?: boolean
          body_template: string
          channel: string
          event: string
          id?: string
          subject_template?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          academy_id?: string | null
          active?: boolean
          body_template?: string
          channel?: string
          event?: string
          id?: string
          subject_template?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          recipient_id: string
          severity: string
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          recipient_id: string
          severity?: string
          title: string
          type: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          recipient_id?: string
          severity?: string
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount_cents: number
          charge_id: string
          commissionable: boolean
          created_at: string
          id: string
          payment_id: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          charge_id: string
          commissionable?: boolean
          created_at?: string
          id?: string
          payment_id: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          charge_id?: string
          commissionable?: boolean
          created_at?: string
          id?: string
          payment_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          academy_id: string
          content_hash: string | null
          file_object_key: string | null
          id: string
          issued_at: string
          payment_id: string
          receipt_number: number
          verification_code: string
          voided_at: string | null
          workspace_id: string
        }
        Insert: {
          academy_id: string
          content_hash?: string | null
          file_object_key?: string | null
          id?: string
          issued_at?: string
          payment_id: string
          receipt_number: number
          verification_code: string
          voided_at?: string | null
          workspace_id: string
        }
        Update: {
          academy_id?: string
          content_hash?: string | null
          file_object_key?: string | null
          id?: string
          issued_at?: string
          payment_id?: string
          receipt_number?: number
          verification_code?: string
          voided_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reversals: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          payment_id: string
          reason: string
          reversed_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          payment_id: string
          reason: string
          reversed_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          payment_id?: string
          reason?: string
          reversed_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reversals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reversals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          academy_id: string
          amount_cents: number
          branch_id: string
          cash_session_id: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          effective_at: string
          id: string
          idempotency_key: string
          method: string
          notes: string | null
          proof_object_key: string | null
          received_by: string
          receiving_account: string | null
          reference: string | null
          registered_at: string
          reversed_at: string | null
          status: string
          student_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          amount_cents: number
          branch_id: string
          cash_session_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          effective_at: string
          id?: string
          idempotency_key: string
          method: string
          notes?: string | null
          proof_object_key?: string | null
          received_by: string
          receiving_account?: string | null
          reference?: string | null
          registered_at?: string
          reversed_at?: string | null
          status: string
          student_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          amount_cents?: number
          branch_id?: string
          cash_session_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          effective_at?: string
          id?: string
          idempotency_key?: string
          method?: string
          notes?: string | null
          proof_object_key?: string | null
          received_by?: string
          receiving_account?: string | null
          reference?: string | null
          registered_at?: string
          reversed_at?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          active: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          last_access_at: string | null
          must_change_password: boolean
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          last_access_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          last_access_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      qr_credentials: {
        Row: {
          academy_id: string
          id: string
          issued_at: string
          revocation_reason: string | null
          revoked_at: string | null
          status: string
          student_id: string
          token_hash: string
          version: number
          workspace_id: string
        }
        Insert: {
          academy_id: string
          id?: string
          issued_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          student_id: string
          token_hash: string
          version?: number
          workspace_id: string
        }
        Update: {
          academy_id?: string
          id?: string
          issued_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          student_id?: string
          token_hash?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_credentials_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_credentials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_credentials_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      report_files: {
        Row: {
          content_hash: string
          created_at: string
          expires_at: string | null
          format: string
          id: string
          object_key: string
          report_run_id: string
          row_count: number | null
          workspace_id: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          expires_at?: string | null
          format: string
          id?: string
          object_key: string
          report_run_id: string
          row_count?: number | null
          workspace_id: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          expires_at?: string | null
          format?: string
          id?: string
          object_key?: string
          report_run_id?: string
          row_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_files_report_run_id_fkey"
            columns: ["report_run_id"]
            isOneToOne: false
            referencedRelation: "report_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      report_runs: {
        Row: {
          academy_id: string | null
          created_at: string
          filters: Json
          generated_at: string | null
          generated_by: string | null
          id: string
          period_end: string | null
          period_start: string | null
          replaced_run_id: string | null
          status: string
          type: string
          version: number
          workspace_id: string
        }
        Insert: {
          academy_id?: string | null
          created_at?: string
          filters?: Json
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          replaced_run_id?: string | null
          status?: string
          type: string
          version?: number
          workspace_id: string
        }
        Update: {
          academy_id?: string | null
          created_at?: string
          filters?: Json
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          replaced_run_id?: string | null
          status?: string
          type?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_runs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_runs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_runs_replaced_run_id_fkey"
            columns: ["replaced_run_id"]
            isOneToOne: false
            referencedRelation: "report_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_adjustments: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string
          id: string
          reason: string
          settlement_id: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by: string
          id?: string
          reason: string
          settlement_id: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          settlement_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_adjustments_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "instructor_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_adjustments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_items: {
        Row: {
          base_cents: number
          exclusion_reason: string | null
          id: string
          included: boolean
          instructor_cents: number
          payment_allocation_id: string
          settlement_id: string
          snapshot: Json
          workspace_id: string
        }
        Insert: {
          base_cents: number
          exclusion_reason?: string | null
          id?: string
          included: boolean
          instructor_cents: number
          payment_allocation_id: string
          settlement_id: string
          snapshot?: Json
          workspace_id: string
        }
        Update: {
          base_cents?: number
          exclusion_reason?: string | null
          id?: string
          included?: boolean
          instructor_cents?: number
          payment_allocation_id?: string
          settlement_id?: string
          snapshot?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_payment_allocation_id_fkey"
            columns: ["payment_allocation_id"]
            isOneToOne: false
            referencedRelation: "payment_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "instructor_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_periods: {
        Row: {
          academy_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          status: string
          workspace_id: string
        }
        Insert: {
          academy_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          workspace_id: string
        }
        Update: {
          academy_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_periods_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_periods_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_periods_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          authorization_note: string | null
          created_at: string
          dni_normalized: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean
          last_name: string
          phone: string
          relationship: string
          student_id: string
          updated_at: string
          whatsapp: string | null
          workspace_id: string
        }
        Insert: {
          authorization_note?: string | null
          created_at?: string
          dni_normalized?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean
          last_name: string
          phone: string
          relationship: string
          student_id: string
          updated_at?: string
          whatsapp?: string | null
          workspace_id: string
        }
        Update: {
          authorization_note?: string | null
          created_at?: string
          dni_normalized?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string
          relationship?: string
          student_id?: string
          updated_at?: string
          whatsapp?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academy_id: string
          address: string | null
          archive_reason: string | null
          archived_at: string | null
          birth_date: string
          city: string | null
          communication_consent: boolean
          created_at: string
          created_by: string | null
          dni_normalized: string
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          id: string
          internal_notes: string | null
          last_name: string
          phone: string
          photo_object_key: string | null
          province: string | null
          public_code: string
          status: string
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
          workspace_id: string
        }
        Insert: {
          academy_id: string
          address?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          birth_date: string
          city?: string | null
          communication_consent?: boolean
          created_at?: string
          created_by?: string | null
          dni_normalized: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          id?: string
          internal_notes?: string | null
          last_name: string
          phone: string
          photo_object_key?: string | null
          province?: string | null
          public_code: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
          workspace_id: string
        }
        Update: {
          academy_id?: string
          address?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          birth_date?: string
          city?: string | null
          communication_consent?: boolean
          created_at?: string
          created_by?: string | null
          dni_normalized?: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          id?: string
          internal_notes?: string | null
          last_name?: string
          phone?: string
          photo_object_key?: string | null
          province?: string | null
          public_code?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      support_sessions: {
        Row: {
          admin_user_id: string
          ended_at: string | null
          expires_at: string
          id: string
          read_only: boolean
          reason: string
          started_at: string
          workspace_id: string
        }
        Insert: {
          admin_user_id: string
          ended_at?: string | null
          expires_at: string
          id?: string
          read_only?: boolean
          reason: string
          started_at?: string
          workspace_id: string
        }
        Update: {
          admin_user_id?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          read_only?: boolean
          reason?: string
          started_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          academy_ids: string[]
          branch_ids: string[]
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          token_hash: string
          workspace_id: string
        }
        Insert: {
          academy_ids?: string[]
          branch_ids?: string[]
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          token_hash: string
          workspace_id: string
        }
        Update: {
          academy_ids?: string[]
          branch_ids?: string[]
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_attempts: {
        Row: {
          created_at: string
          id: string
          outbox_id: string
          provider_response_code: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          outbox_id: string
          provider_response_code?: string | null
          status: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          outbox_id?: string
          provider_response_code?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_attempts_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_outbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_attempts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_consents: {
        Row: {
          granted: boolean
          id: string
          phone: string
          recorded_at: string
          source: string
          student_id: string | null
          workspace_id: string
        }
        Insert: {
          granted: boolean
          id?: string
          phone: string
          recorded_at?: string
          source: string
          student_id?: string | null
          workspace_id: string
        }
        Update: {
          granted?: boolean
          id?: string
          phone?: string
          recorded_at?: string
          source?: string
          student_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_consents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_outbox: {
        Row: {
          consent_id: string
          created_at: string
          id: string
          payload: Json
          status: string
          template_id: string
          workspace_id: string
        }
        Insert: {
          consent_id: string
          created_at?: string
          id?: string
          payload: Json
          status?: string
          template_id: string
          workspace_id: string
        }
        Update: {
          consent_id?: string
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          template_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbox_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          created_at: string
          id: string
          is_primary_owner: boolean
          role: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary_owner?: boolean
          role: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary_owner?: boolean
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_service_status: {
        Row: {
          changed_at: string
          changed_by: string | null
          reason: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          reason?: string | null
          status: string
          workspace_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          reason?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_service_status_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_service_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          billing_note: string | null
          created_at: string
          created_by: string | null
          id: string
          legal_name: string | null
          limits: Json
          name: string
          next_review_at: string | null
          plan: string
          public_code: string
          settings: Json
          started_at: string
          status: string
          suspension_reason: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          billing_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          limits?: Json
          name: string
          next_review_at?: string | null
          plan?: string
          public_code?: string
          settings?: Json
          started_at?: string
          status?: string
          suspension_reason?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          billing_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          limits?: Json
          name?: string
          next_review_at?: string | null
          plan?: string
          public_code?: string
          settings?: Json
          started_at?: string
          status?: string
          suspension_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_commission_estimate: {
        Args: {
          p_cohort_id: string
          p_period_end: string
          p_period_start: string
          p_workspace_id: string
        }
        Returns: Json
      }
      can_manage_attendance: { Args: { p_cohort_id: string }; Returns: boolean }
      can_manage_payments: { Args: { p_academy_id: string }; Returns: boolean }
      can_manage_settlements: {
        Args: { p_academy_id: string }
        Returns: boolean
      }
      can_manage_students: { Args: { p_academy_id: string }; Returns: boolean }
      can_mutate_workspace: {
        Args: { p_table: string; p_workspace_id: string }
        Returns: boolean
      }
      can_read_workspace: {
        Args: { p_table: string; p_workspace_id: string }
        Returns: boolean
      }
      charges_summary: {
        Args: {
          p_academy_id: string
          p_status?: string
          p_student_ids?: string[]
          p_workspace_id: string
        }
        Returns: Json
      }
      charges_vencimientos_summary: {
        Args: { p_academy_id: string; p_workspace_id: string }
        Returns: Json
      }
      close_attendance: {
        Args: { p_class_session_id: string }
        Returns: undefined
      }
      close_cash_session: {
        Args: {
          p_cash_session_id: string
          p_counted_cents: number
          p_note: string
        }
        Returns: Json
      }
      close_instructor_settlement: {
        Args: { p_reason: string; p_settlement_id: string }
        Returns: Json
      }
      confirm_payment: {
        Args: { p_idempotency_key: string; p_payment_id: string }
        Returns: Json
      }
      create_cohort_with_classes: {
        Args: {
          p_academy_id: string
          p_branch_id: string
          p_capacity: number
          p_commission_bps: number
          p_course_id: string
          p_debt_policy: string
          p_due_day: number
          p_estimated_end_date: string
          p_idempotency_key: string
          p_installment_cents: number
          p_installment_count: number
          p_instructor_user_id: string
          p_name: string
          p_schedule_days: Json
          p_start_date: string
          p_workspace_id: string
        }
        Returns: Json
      }
      create_enrollment_with_charges: {
        Args: {
          p_agreed_price_cents: number
          p_cohort_id: string
          p_effective_start: string
          p_idempotency_key: string
          p_installment_count: number
          p_student_id: string
          p_workspace_id: string
        }
        Returns: Json
      }
      current_workspace_role: {
        Args: { p_workspace_id: string }
        Returns: string
      }
      drop_enrollment: {
        Args: {
          p_effective_date: string
          p_enrollment_id: string
          p_reason: string
        }
        Returns: Json
      }
      has_academy_access: { Args: { p_academy_id: string }; Returns: boolean }
      has_branch_access: { Args: { p_branch_id: string }; Returns: boolean }
      has_workspace_access: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      is_platform_superadmin: { Args: never; Returns: boolean }
      is_workspace_owner: { Args: { p_workspace_id: string }; Returns: boolean }
      next_cohort_code: {
        Args: { p_academy_id: string; p_workspace_id: string }
        Returns: string
      }
      open_cash_session: {
        Args: {
          p_academy_id: string
          p_branch_id: string
          p_opening_cents: number
          p_workspace_id: string
        }
        Returns: string
      }
      perform_checkin: {
        Args: {
          p_academy_id: string
          p_branch_id: string
          p_device_hash: string
          p_request_id: string
          p_token_hash: string
          p_workspace_id: string
        }
        Returns: Json
      }
      refresh_charge_status: {
        Args: { p_charge_id: string }
        Returns: undefined
      }
      register_instructor_payout: {
        Args: {
          p_amount_cents: number
          p_idempotency_key: string
          p_method: string
          p_paid_at: string
          p_reference: string
          p_settlement_id: string
        }
        Returns: Json
      }
      register_payment: {
        Args: {
          p_academy_id: string
          p_allocation_cents: number
          p_amount_cents: number
          p_branch_id: string
          p_cash_session_id: string
          p_charge_id: string
          p_effective_at: string
          p_idempotency_key: string
          p_method: string
          p_reference: string
          p_student_id: string
          p_workspace_id: string
        }
        Returns: Json
      }
      resolve_approval_request: {
        Args: { p_approve: boolean; p_comment: string; p_request_id: string }
        Returns: Json
      }
      reverse_payment: {
        Args: {
          p_idempotency_key: string
          p_payment_id: string
          p_reason: string
        }
        Returns: Json
      }
      save_attendance: {
        Args: {
          p_class_session_id: string
          p_enrollment_id: string
          p_notes: string
          p_status: string
        }
        Returns: string
      }
      write_audit: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_next?: Json
          p_origin?: string
          p_previous?: Json
          p_reason?: string
          p_workspace_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

