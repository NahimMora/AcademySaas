begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text,
  status text not null default 'active' check (status in ('active','disabled','invited')),
  must_change_password boolean not null default false,
  last_access_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references public.profiles(id), active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(), public_code text not null unique default encode(gen_random_bytes(10),'hex'),
  name text not null, legal_name text, status text not null default 'trial' check (status in ('trial','active','past_due','suspended','cancelled','archived')),
  plan text not null default 'initial', billing_note text, suspension_reason text,
  started_at date not null default current_date, next_review_at date, limits jsonb not null default '{}', settings jsonb not null default '{}',
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);

create table public.workspace_service_status (
  workspace_id uuid primary key references public.workspaces(id), status text not null check (status in ('trial','active','past_due','suspended','cancelled','archived')),
  reason text, changed_by uuid references public.profiles(id), changed_at timestamptz not null default now()
);

create table public.workspace_memberships (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), user_id uuid not null references public.profiles(id),
  role text not null check (role in ('owner','receptionist','instructor')), status text not null default 'active' check (status in ('invited','active','disabled')),
  is_primary_owner boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,user_id)
);
create unique index one_primary_owner_per_workspace on public.workspace_memberships(workspace_id) where is_primary_owner and status='active';

create table public.academies (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), public_code text not null default encode(gen_random_bytes(8),'hex'),
  name text not null, legal_name text, email text, phone text, whatsapp text, timezone text not null default 'America/Argentina/Buenos_Aires', currency char(3) not null default 'ARS',
  status text not null default 'active' check (status in ('active','inactive','archived')), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  unique(workspace_id,id), unique(workspace_id,public_code)
);
create table public.academy_settings (
  academy_id uuid primary key references public.academies(id), workspace_id uuid not null references public.workspaces(id), default_capacity integer not null default 8 check(default_capacity>0),
  default_commission_bps integer not null default 4000 check(default_commission_bps between 0 and 10000), debt_policy text not null default 'allow_with_warning' check(debt_policy in ('inform_only','allow_with_warning','block_if_overdue','block_if_no_confirmed_payment','manual_review')),
  attendance_before_minutes integer not null default 30 check(attendance_before_minutes between 0 and 240), attendance_after_minutes integer not null default 360 check(attendance_after_minutes between 0 and 1440),
  receipt_text text, report_footer text, require_transfer_proof boolean not null default false, updated_at timestamptz not null default now()
);
create table public.academy_branding (
  academy_id uuid primary key references public.academies(id), workspace_id uuid not null references public.workspaces(id), logo_object_key text, primary_color text not null default '#0c694e', accent_color text not null default '#e7a437', updated_at timestamptz not null default now()
);
create table public.academy_memberships (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), user_id uuid not null references public.profiles(id), active boolean not null default true, created_at timestamptz not null default now(), unique(academy_id,user_id)
);
create table public.branches (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), code text not null, name text not null,
  address text, city text, province text, status text not null default 'active' check(status in ('active','inactive','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(academy_id,id), unique(academy_id,code)
);
create table public.branch_memberships (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), branch_id uuid not null references public.branches(id), user_id uuid not null references public.profiles(id), active boolean not null default true, created_at timestamptz not null default now(), unique(branch_id,user_id)
);
create table public.user_invitations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), email text not null, role text not null check(role in ('owner','receptionist','instructor')), token_hash text not null unique,
  academy_ids uuid[] not null default '{}', branch_ids uuid[] not null default '{}', status text not null default 'pending' check(status in ('pending','accepted','expired','cancelled')), expires_at timestamptz not null, invited_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.support_sessions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), admin_user_id uuid not null references public.profiles(id), reason text not null,
  read_only boolean not null default true, started_at timestamptz not null default now(), expires_at timestamptz not null, ended_at timestamptz, check(expires_at>started_at)
);

create table public.students (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), public_code text not null,
  first_name text not null, last_name text not null, dni_normalized text not null check(dni_normalized ~ '^[0-9]{7,9}$'), birth_date date not null, phone text not null, whatsapp text, email text,
  address text, city text, province text, emergency_contact text, emergency_phone text, photo_object_key text, internal_notes text, communication_consent boolean not null default false,
  status text not null default 'active' check(status in ('active','inactive','blocked','archived')), archived_at timestamptz, archive_reason text,
  created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), unique(workspace_id,dni_normalized), unique(workspace_id,public_code)
);
create table public.student_guardians (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), student_id uuid not null references public.students(id), first_name text not null, last_name text not null,
  dni_normalized text, relationship text not null, phone text not null, whatsapp text, email text, is_primary boolean not null default false, authorization_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.instructor_profiles (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), user_id uuid not null references public.profiles(id),
  default_commission_bps integer check(default_commission_bps between 0 and 10000), active boolean not null default true, created_at timestamptz not null default now(), unique(academy_id,user_id)
);
create table public.courses (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), code text not null, name text not null, description text,
  estimated_duration_weeks integer check(estimated_duration_weeks>0), default_installments integer not null default 1 check(default_installments>0), suggested_frequency text, class_duration_minutes integer check(class_duration_minutes>0), suggested_capacity integer check(suggested_capacity>0),
  suggested_price_cents bigint not null default 0 check(suggested_price_cents>=0), currency char(3) not null default 'ARS', suggested_commission_bps integer check(suggested_commission_bps between 0 and 10000), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz, unique(academy_id,code)
);
create table public.cohorts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), branch_id uuid not null references public.branches(id), course_id uuid not null references public.courses(id), instructor_user_id uuid references public.profiles(id),
  code text not null, name text not null, weekday smallint check(weekday between 0 and 6), starts_at time not null, ends_at time not null, start_date date not null, estimated_end_date date not null, capacity integer not null default 8 check(capacity>0),
  installment_count integer not null default 1 check(installment_count>0), installment_cents bigint not null check(installment_cents>=0), due_day smallint check(due_day between 1 and 28), commission_bps integer check(commission_bps between 0 and 10000), debt_policy text not null default 'allow_with_warning' check(debt_policy in ('inform_only','allow_with_warning','block_if_overdue','block_if_no_confirmed_payment','manual_review')),
  status text not null default 'draft' check(status in ('draft','scheduled','active','paused','finished','cancelled','archived')), notes text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  check(ends_at>starts_at), check(estimated_end_date>=start_date), unique(academy_id,code)
);
create table public.cohort_instructors (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), cohort_id uuid not null references public.cohorts(id), instructor_user_id uuid not null references public.profiles(id), role text not null default 'primary', valid_from date not null, valid_to date, unique(cohort_id,instructor_user_id,valid_from)
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), branch_id uuid not null references public.branches(id), student_id uuid not null references public.students(id), cohort_id uuid not null references public.cohorts(id), code text not null,
  enrolled_at timestamptz not null default now(), effective_start date not null default current_date, status text not null default 'pending_payment' check(status in ('pre_enrolled','pending_payment','confirmed','attending','suspended','overdue','dropped_out','completed','cancelled','expelled')),
  agreed_price_cents bigint not null check(agreed_price_cents>=0), installment_count integer not null check(installment_count>0), discount_type text check(discount_type in ('fixed','percent')), discount_value integer check(discount_value>=0), discount_reason text, discount_approved_by uuid references public.profiles(id), discount_affects_commission boolean not null default true,
  notes text, dropped_out_at date, drop_reason text, future_charge_policy text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(cohort_id,student_id,code)
);
create unique index one_active_enrollment_per_cohort on public.enrollments(cohort_id,student_id) where status in ('pre_enrolled','pending_payment','confirmed','attending','suspended','overdue');
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), branch_id uuid not null references public.branches(id), cohort_id uuid not null references public.cohorts(id),
  session_date date not null, starts_at time not null, ends_at time not null, planned_instructor_id uuid references public.profiles(id), status text not null default 'scheduled' check(status in ('scheduled','open','completed','cancelled','rescheduled','extra')), reason text, original_session_id uuid references public.class_sessions(id), attendance_open boolean not null default false, attendance_closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at), unique(cohort_id,session_date,starts_at)
);
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), class_session_id uuid not null references public.class_sessions(id), enrollment_id uuid not null references public.enrollments(id), student_id uuid not null references public.students(id),
  status text not null check(status in ('present','absent','late','justified','left_early','not_applicable')), suggested_by_checkin_id uuid, first_edited_at timestamptz not null default now(), edited_by uuid references public.profiles(id), closed_at timestamptz, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(class_session_id,enrollment_id)
);
create table public.qr_credentials (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), student_id uuid not null references public.students(id), token_hash text not null unique, version integer not null default 1, status text not null default 'active' check(status in ('active','revoked','expired')), issued_at timestamptz not null default now(), revoked_at timestamptz, revocation_reason text
);
create table public.checkins (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), branch_id uuid references public.branches(id), student_id uuid references public.students(id), class_session_id uuid references public.class_sessions(id), qr_credential_id uuid references public.qr_credentials(id),
  result text not null check(result in ('authorized','warning','denied')), reason_code text not null, reason text not null, override_by uuid references public.profiles(id), override_reason text, device_hash text, request_id text, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create unique index one_successful_checkin on public.checkins(student_id,class_session_id) where result in ('authorized','warning') and class_session_id is not null;

create table public.charges (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), enrollment_id uuid references public.enrollments(id), cohort_id uuid references public.cohorts(id), student_id uuid not null references public.students(id),
  type text not null check(type in ('installment','deposit','registration','adjustment','other')), installment_number integer, description text not null, original_cents bigint not null check(original_cents>=0), discount_cents bigint not null default 0 check(discount_cents>=0), surcharge_cents bigint not null default 0 check(surcharge_cents>=0), final_cents bigint generated always as (original_cents-discount_cents+surcharge_cents) stored,
  due_date date not null, status text not null default 'pending' check(status in ('pending','partial','paid','overdue','cancelled','waived','under_review')), service_period daterange, commissionable boolean not null default true, cancelled_at timestamptz, cancellation_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(discount_cents<=original_cents), unique(enrollment_id,type,installment_number)
);
create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), branch_id uuid not null references public.branches(id), opened_by uuid not null references public.profiles(id), opened_at timestamptz not null default now(), opening_cents bigint not null default 0 check(opening_cents>=0), status text not null default 'open' check(status in ('open','closed')), closed_at timestamptz, counted_cents bigint check(counted_cents>=0), expected_cents bigint, difference_cents bigint, note text, updated_at timestamptz not null default now()
);
create unique index one_open_cash_per_user_branch on public.cash_sessions(branch_id,opened_by) where status='open';
create table public.payments (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), branch_id uuid not null references public.branches(id), student_id uuid not null references public.students(id), effective_at timestamptz not null, registered_at timestamptz not null default now(), amount_cents bigint not null check(amount_cents>0), currency char(3) not null default 'ARS', method text not null check(method in ('cash','bank_transfer','mercado_pago','debit_card','credit_card','other')), status text not null check(status in ('pending_validation','confirmed','rejected','reversed','refunded')), receiving_account text, reference text, proof_object_key text, received_by uuid not null references public.profiles(id), cash_session_id uuid references public.cash_sessions(id), notes text, idempotency_key text not null, confirmed_at timestamptz, reversed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);
create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), payment_id uuid not null references public.payments(id), charge_id uuid not null references public.charges(id), amount_cents bigint not null check(amount_cents>0), commissionable boolean not null default true, created_at timestamptz not null default now(), unique(payment_id,charge_id)
);
create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), payment_id uuid not null references public.payments(id), receipt_number bigint not null, verification_code text not null unique, file_object_key text, content_hash text, issued_at timestamptz not null default now(), voided_at timestamptz, unique(academy_id,receipt_number)
);
create table public.payment_reversals (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), payment_id uuid not null references public.payments(id), reason text not null, reversed_by uuid not null references public.profiles(id), idempotency_key text not null, created_at timestamptz not null default now(), unique(workspace_id,idempotency_key), unique(payment_id)
);
create table public.cash_movements (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), cash_session_id uuid not null references public.cash_sessions(id), payment_id uuid references public.payments(id), type text not null check(type in ('opening','payment','reversal','adjustment','closing')), amount_cents bigint not null, note text, created_at timestamptz not null default now()
);

create table public.commission_rules (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), instructor_user_id uuid references public.profiles(id), cohort_id uuid references public.cohorts(id), active boolean not null default true, created_at timestamptz not null default now()
);
create table public.commission_rule_versions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), rule_id uuid not null references public.commission_rules(id), commission_bps integer not null check(commission_bps between 0 and 10000), valid_from date not null, valid_to date, reason text not null, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), check(valid_to is null or valid_to>=valid_from)
);
create table public.settlement_periods (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), period_start date not null, period_end date not null, status text not null default 'open' check(status in ('open','under_review','closed','reopened','cancelled')), closed_at timestamptz, closed_by uuid references public.profiles(id), created_at timestamptz not null default now(), check(period_end>=period_start), unique(academy_id,period_start,period_end)
);
create table public.instructor_settlements (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid not null references public.academies(id), settlement_period_id uuid not null references public.settlement_periods(id), cohort_id uuid not null references public.cohorts(id), instructor_user_id uuid not null references public.profiles(id), status text not null default 'open' check(status in ('open','under_review','closed','partially_paid','paid','reopened','cancelled')), base_cents bigint not null default 0 check(base_cents>=0), commission_bps integer not null check(commission_bps between 0 and 10000), instructor_cents bigint not null default 0 check(instructor_cents>=0), academy_cents bigint not null default 0 check(academy_cents>=0), snapshot jsonb, snapshot_hash text, closed_at timestamptz, closed_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(settlement_period_id,cohort_id,instructor_user_id)
);
create table public.settlement_items (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), settlement_id uuid not null references public.instructor_settlements(id), payment_allocation_id uuid not null references public.payment_allocations(id), base_cents bigint not null check(base_cents>=0), instructor_cents bigint not null check(instructor_cents>=0), included boolean not null, exclusion_reason text, snapshot jsonb not null default '{}', unique(settlement_id,payment_allocation_id)
);
create table public.settlement_adjustments (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), settlement_id uuid not null references public.instructor_settlements(id), amount_cents bigint not null, reason text not null, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.instructor_payouts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), settlement_id uuid not null references public.instructor_settlements(id), amount_cents bigint not null check(amount_cents>0), paid_at timestamptz not null, method text not null, reference text, proof_object_key text, registered_by uuid not null references public.profiles(id), idempotency_key text not null, created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid references public.academies(id), branch_id uuid references public.branches(id), requester_id uuid not null references public.profiles(id), type text not null check(type in ('capacity_override','attendance_correction','discount_approval','payment_reversal','payment_confirmation','enrollment_cancellation','student_status_change','settlement_reopen','qr_access_override','other')), entity_type text, entity_id uuid, previous_value jsonb, proposed_value jsonb, reason text not null, priority text not null default 'normal', status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled','expired')), resolved_by uuid references public.profiles(id), resolution text, resolution_comment text, resolved_at timestamptz, created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), recipient_id uuid not null references public.profiles(id), type text not null, title text not null, body text not null, link text, severity text not null default 'info' check(severity in ('info','low','medium','high','critical')), read_at timestamptz, created_at timestamptz not null default now()
);
create table public.notification_templates (
  id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id), academy_id uuid references public.academies(id), channel text not null check(channel in ('email','in_app','whatsapp')), event text not null, subject_template text, body_template text not null, active boolean not null default true, updated_at timestamptz not null default now(), unique(workspace_id,academy_id,channel,event)
);
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), channel text not null check(channel in ('email','in_app','whatsapp')), recipient text not null, template_id uuid references public.notification_templates(id), payload jsonb not null default '{}', status text not null default 'pending' check(status in ('pending','processing','delivered','failed','cancelled')), attempts integer not null default 0, next_attempt_at timestamptz not null default now(), idempotency_key text not null, last_error_code text, delivered_at timestamptz, created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);
create table public.notification_attempts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), outbox_id uuid not null references public.notification_outbox(id), provider text not null, status text not null, error_code text, duration_ms integer, created_at timestamptz not null default now()
);
create table public.whatsapp_consents (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), student_id uuid references public.students(id), phone text not null, granted boolean not null, source text not null, recorded_at timestamptz not null default now()
);
create table public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), name text not null, body text not null, active boolean not null default false, created_at timestamptz not null default now(), unique(workspace_id,name)
);
create table public.whatsapp_outbox (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), consent_id uuid not null references public.whatsapp_consents(id), template_id uuid not null references public.whatsapp_templates(id), payload jsonb not null, status text not null default 'disabled', created_at timestamptz not null default now()
);
create table public.whatsapp_attempts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), outbox_id uuid not null references public.whatsapp_outbox(id), status text not null, provider_response_code text, created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid references public.academies(id), branch_id uuid references public.branches(id), severity text not null check(severity in ('info','low','medium','high','critical')), type text not null, title text not null, detail text not null, entity_type text, entity_id uuid, status text not null default 'new' check(status in ('new','under_review','resolved','dismissed')), assigned_to uuid references public.profiles(id), resolved_at timestamptz, resolution text, created_at timestamptz not null default now()
);
create table public.incidents (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid references public.academies(id), branch_id uuid references public.branches(id), type text not null check(type in ('external_payment','unauthorized_person','branch_misuse','attendance_irregularity','payment_irregularity','other')), description text not null, involved jsonb not null default '[]', evidence_object_key text, status text not null default 'open' check(status in ('open','under_review','resolved','dismissed')), responsible_id uuid references public.profiles(id), resolution text, reported_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key, workspace_id uuid references public.workspaces(id), academy_id uuid references public.academies(id), branch_id uuid references public.branches(id), actor_id uuid references public.profiles(id), actor_role text, action text not null, entity_type text not null, entity_id text, previous_value jsonb, next_value jsonb, metadata jsonb not null default '{}', reason text, request_id text, correlation_id text, origin text not null default 'web' check(origin in ('web','rpc','job','import','support','trigger')), ip_hash text, user_agent_family text, created_at timestamptz not null default now()
);

create table public.report_runs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid references public.academies(id), type text not null, period_start date, period_end date, version integer not null default 1, filters jsonb not null default '{}', status text not null default 'queued' check(status in ('queued','processing','ready','failed')), generated_by uuid references public.profiles(id), generated_at timestamptz, replaced_run_id uuid references public.report_runs(id), created_at timestamptz not null default now()
);
create table public.report_files (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), report_run_id uuid not null references public.report_runs(id), format text not null check(format in ('csv','xlsx','pdf')), object_key text not null, content_hash text not null, row_count integer, expires_at timestamptz, created_at timestamptz not null default now()
);
create table public.import_batches (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), academy_id uuid references public.academies(id), type text not null check(type in ('students','courses','cohorts','enrollments','opening_charges')), file_name text not null, object_key text, status text not null default 'preview' check(status in ('preview','validated','processing','completed','failed','reverted')), total_rows integer not null default 0, valid_rows integer not null default 0, error_rows integer not null default 0, created_by uuid not null references public.profiles(id), confirmed_at timestamptz, completed_at timestamptz, reverted_at timestamptz, created_at timestamptz not null default now()
);
create table public.import_rows (
  id bigint generated always as identity primary key, workspace_id uuid not null references public.workspaces(id), import_batch_id uuid not null references public.import_batches(id), row_number integer not null, raw_data jsonb not null, normalized_data jsonb, status text not null check(status in ('valid','invalid','imported','skipped','reverted')), errors jsonb not null default '[]', created_entity_type text, created_entity_id uuid, unique(import_batch_id,row_number)
);
create table public.feature_flags (
  id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id), academy_id uuid references public.academies(id), key text not null, enabled boolean not null default false, config jsonb not null default '{}', updated_by uuid references public.profiles(id), updated_at timestamptz not null default now(), unique(workspace_id,academy_id,key)
);
create table public.job_runs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id), job text not null, status text not null check(status in ('running','completed','failed')), result jsonb, error_code text, started_at timestamptz not null default now(), finished_at timestamptz
);

create index students_workspace_status_idx on public.students(workspace_id,status,last_name,first_name);
create index students_workspace_dni_idx on public.students(workspace_id,dni_normalized);
create index cohorts_workspace_status_idx on public.cohorts(workspace_id,status,start_date);
create index enrollments_workspace_student_idx on public.enrollments(workspace_id,student_id,status);
create index class_sessions_branch_date_idx on public.class_sessions(branch_id,session_date,starts_at);
create index charges_workspace_due_idx on public.charges(workspace_id,status,due_date);
create index payments_workspace_date_idx on public.payments(workspace_id,status,effective_at desc);
create index allocations_charge_idx on public.payment_allocations(charge_id);
create index checkins_workspace_created_idx on public.checkins(workspace_id,created_at desc);
create index audit_workspace_created_idx on public.audit_logs(workspace_id,created_at desc);
create index alerts_workspace_status_idx on public.alerts(workspace_id,status,severity,created_at desc);
create index outbox_pending_idx on public.notification_outbox(status,next_attempt_at) where status in ('pending','failed');
create index reports_workspace_period_idx on public.report_runs(workspace_id,period_start,period_end);

do $$ declare t text; begin
  foreach t in array array['profiles','workspaces','workspace_memberships','academies','academy_settings','academy_branding','branches','students','student_guardians','courses','cohorts','enrollments','class_sessions','attendance_records','charges','payments','cash_sessions','incidents'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

commit;
