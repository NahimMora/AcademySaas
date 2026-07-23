begin;

create table public.cohort_schedule_days (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  academy_id uuid not null references public.academies(id), branch_id uuid not null references public.branches(id),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), starts_at time not null, ends_at time not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_at > starts_at), unique (cohort_id, weekday)
);
create index cohort_schedule_days_cohort_idx on public.cohort_schedule_days(cohort_id);
create trigger cohort_schedule_days_updated_at before update on public.cohort_schedule_days for each row execute function public.set_updated_at();

-- Integridad tenant: ninguna otra tabla del esquema usa FKs compuestas (verificado contra las ~30 tablas
-- de 202607120001), así que en vez de introducir un patrón nuevo e inconsistente con el resto del esquema,
-- se usa un trigger dedicado que valida que workspace_id/academy_id/branch_id coincidan con los de la
-- comisión referenciada. Es necesario específicamente acá (y no en charges/payments) porque esas tablas
-- están además protegidas por revoke + único-camino-RPC ya validado; cohort_schedule_days, si no se
-- defiende a sí misma, quedaría insertable directo por un owner con datos de tenant inconsistentes.
create or replace function public.enforce_cohort_schedule_tenant() returns trigger
language plpgsql security definer set search_path=public,auth as $$
begin
  if not exists (select 1 from public.cohorts c where c.id=new.cohort_id and c.workspace_id=new.workspace_id and c.academy_id=new.academy_id and c.branch_id=new.branch_id) then
    raise exception 'COHORT_SCHEDULE_TENANT_MISMATCH';
  end if;
  return new;
end $$;
create trigger cohort_schedule_days_tenant_check before insert or update on public.cohort_schedule_days for each row execute function public.enforce_cohort_schedule_tenant();

-- Backfill desde las columnas viejas de cohorts (cubre las comisiones ya existentes, sin cantidad fija asumida)
insert into public.cohort_schedule_days (workspace_id, academy_id, branch_id, cohort_id, weekday, starts_at, ends_at)
select workspace_id, academy_id, branch_id, id, weekday, starts_at, ends_at from public.cohorts where weekday is not null
on conflict (cohort_id, weekday) do nothing;

-- Expand-migrate-contract: NO se eliminan cohorts.weekday/starts_at/ends_at en esta migración.
-- Se eliminarán en una migración de "contract" separada y posterior, después de confirmar en producción
-- que no hay consumidores (código de aplicación, portal de instructor, reportes).
-- Sí se relaja su NOT NULL: el nuevo camino de escritura (create_cohort_with_classes) no las completa
-- porque dejan de tener un valor único con significado una vez que una comisión admite varios días por
-- semana; las filas ya existentes conservan sus valores (backfillados arriba en cohort_schedule_days).
alter table public.cohorts alter column weekday drop not null;
alter table public.cohorts alter column starts_at drop not null;
alter table public.cohorts alter column ends_at drop not null;

alter table public.cohorts add column if not exists idempotency_key text;
alter table public.cohorts add column if not exists request_hash text;
create unique index if not exists cohorts_workspace_idempotency_idx on public.cohorts(workspace_id, idempotency_key) where idempotency_key is not null;

-- RLS: el loop genérico de 202607120002_security_rls.sql corrió una sola vez, sobre las tablas que
-- existían en ese momento — no ve tablas creadas después. Se escriben las políticas a mano, replicando
-- el shape que ese loop generaría para una tabla con branch_id + academy_id.
alter table public.cohort_schedule_days enable row level security;
create policy workspace_read on public.cohort_schedule_days for select
  using (public.can_read_workspace(workspace_id,'cohort_schedule_days') and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id)));
create policy workspace_insert on public.cohort_schedule_days for insert
  with check (public.can_mutate_workspace(workspace_id,'cohort_schedule_days') and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id)));
create policy workspace_update on public.cohort_schedule_days for update
  using (public.can_mutate_workspace(workspace_id,'cohort_schedule_days') and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id)))
  with check (public.can_mutate_workspace(workspace_id,'cohort_schedule_days') and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id)));
create policy instructor_cohort_schedule_days on public.cohort_schedule_days for select
  using (exists(select 1 from public.cohorts c where c.id=cohort_schedule_days.cohort_id and c.instructor_user_id=auth.uid()));

-- Grant explícito: el grant masivo de 202607120002 ("grant ... on all tables in schema public") también
-- corrió una sola vez y no cubre tablas creadas después — sin este grant, RLS no importa porque el rol
-- ni siquiera tiene el privilegio base sobre la tabla.
grant select,insert,update on public.cohort_schedule_days to authenticated;

-- Camino único de escritura: igual que enrollments/charges/payments/attendance_records (ya revocados en
-- 202607120002), se revoca el insert/update directo sobre las tablas que create_cohort_with_classes va a
-- escribir, para que ese RPC sea el ÚNICO camino real de alta — RLS deja de ser la única defensa.
revoke insert,update on public.cohorts, public.cohort_schedule_days, public.class_sessions from authenticated,anon;

-- La whitelist de can_read_workspace para receptionist es un array hardcodeado; se agrega la tabla nueva.
create or replace function public.can_read_workspace(p_workspace_id uuid,p_table text) returns boolean
language plpgsql stable security definer set search_path=public,auth as $$
declare r text;begin
  if public.is_workspace_owner(p_workspace_id) then return true;end if;
  if not public.has_workspace_access(p_workspace_id) then return false;end if;
  r:=public.current_workspace_role(p_workspace_id);
  if r='receptionist' then return p_table=any(array['academy_settings','academy_branding','students','courses','cohorts','cohort_schedule_days','enrollments','class_sessions','charges','payments','cash_sessions','payment_receipts','qr_credentials','checkins','approval_requests','alerts','incidents','report_runs','report_files','import_batches']);end if;
  return false;
end $$;

-- Backfill idempotente de class_sessions para comisiones que ya existen (no asume una cantidad fija de
-- comisiones ni de sesiones; corre después del backfill de cohort_schedule_days de arriba, en la misma
-- transacción). Repetible sin duplicar gracias al unique(cohort_id,session_date,starts_at) ya existente.
insert into public.class_sessions (workspace_id, academy_id, branch_id, cohort_id, session_date, starts_at, ends_at, planned_instructor_id, status)
select c.workspace_id, c.academy_id, c.branch_id, c.id, d.session_date, sd.starts_at, sd.ends_at, c.instructor_user_id, 'scheduled'
from public.cohorts c
join public.cohort_schedule_days sd on sd.cohort_id = c.id
join lateral generate_series(c.start_date, c.estimated_end_date, interval '1 day') as d(session_date) on true
where extract(dow from d.session_date)::smallint = sd.weekday
on conflict (cohort_id, session_date, starts_at) do nothing;

commit;
