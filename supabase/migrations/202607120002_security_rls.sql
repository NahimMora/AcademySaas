begin;

create or replace function public.is_platform_superadmin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists(select 1 from public.platform_admins where user_id=auth.uid() and active)
$$;

create or replace function public.current_workspace_role(p_workspace_id uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select role from public.workspace_memberships where workspace_id=p_workspace_id and user_id=auth.uid() and status='active' limit 1
$$;

create or replace function public.has_workspace_access(p_workspace_id uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select public.is_platform_superadmin() or exists(
    select 1 from public.workspace_memberships m join public.workspaces w on w.id=m.workspace_id
    where m.workspace_id=p_workspace_id and m.user_id=auth.uid() and m.status='active' and w.status in ('trial','active','past_due')
  ) or exists(
    select 1 from public.support_sessions s where s.workspace_id=p_workspace_id and s.admin_user_id=auth.uid() and s.ended_at is null and s.expires_at>now()
  )
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select public.is_platform_superadmin() or exists(select 1 from public.workspace_memberships where workspace_id=p_workspace_id and user_id=auth.uid() and role='owner' and status='active')
$$;

create or replace function public.has_academy_access(p_academy_id uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists(select 1 from public.academies a where a.id=p_academy_id and public.has_workspace_access(a.workspace_id) and (
    public.is_workspace_owner(a.workspace_id) or exists(select 1 from public.academy_memberships am where am.academy_id=a.id and am.user_id=auth.uid() and am.active)
  ))
$$;

create or replace function public.has_branch_access(p_branch_id uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists(select 1 from public.branches b where b.id=p_branch_id and public.has_academy_access(b.academy_id) and (
    public.is_workspace_owner(b.workspace_id) or exists(select 1 from public.branch_memberships bm where bm.branch_id=b.id and bm.user_id=auth.uid() and bm.active)
  ))
$$;

create or replace function public.can_manage_students(p_academy_id uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select public.has_academy_access(p_academy_id) and exists(
    select 1 from public.academies a left join public.workspace_memberships m on m.workspace_id=a.workspace_id and m.user_id=auth.uid() and m.status='active'
    where a.id=p_academy_id and (public.is_platform_superadmin() or m.role in ('owner','receptionist'))
  )
$$;
create or replace function public.can_manage_payments(p_academy_id uuid) returns boolean language sql stable security definer set search_path=public,auth as $$ select public.can_manage_students(p_academy_id) $$;
create or replace function public.can_manage_settlements(p_academy_id uuid) returns boolean language sql stable security definer set search_path=public,auth as $$
  select public.has_academy_access(p_academy_id) and exists(select 1 from public.academies a where a.id=p_academy_id and public.is_workspace_owner(a.workspace_id))
$$;
create or replace function public.can_manage_attendance(p_cohort_id uuid) returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists(select 1 from public.cohorts c where c.id=p_cohort_id and public.has_academy_access(c.academy_id) and (public.is_workspace_owner(c.workspace_id) or c.instructor_user_id=auth.uid() or public.current_workspace_role(c.workspace_id)='receptionist'))
$$;

create or replace function public.can_mutate_workspace(p_workspace_id uuid, p_table text) returns boolean
language plpgsql stable security definer set search_path=public,auth as $$
declare r text; begin
  if public.is_platform_superadmin() then return true; end if;
  if not public.has_workspace_access(p_workspace_id) then return false; end if;
  r := public.current_workspace_role(p_workspace_id);
  if r='owner' then return true; end if;
  if r='receptionist' then return p_table = any(array['students','student_guardians','approval_requests','notifications','incidents']); end if;
  if r='instructor' then return p_table = any(array['approval_requests','notifications','incidents']); end if;
  return false;
end $$;

create or replace function public.can_read_workspace(p_workspace_id uuid,p_table text) returns boolean
language plpgsql stable security definer set search_path=public,auth as $$
declare r text;begin
  if public.is_workspace_owner(p_workspace_id) then return true;end if;
  if not public.has_workspace_access(p_workspace_id) then return false;end if;
  r:=public.current_workspace_role(p_workspace_id);
  if r='receptionist' then return p_table=any(array['academy_settings','academy_branding','students','courses','cohorts','enrollments','class_sessions','charges','payments','cash_sessions','payment_receipts','qr_credentials','checkins','approval_requests','alerts','incidents','report_runs','report_files','import_batches']);end if;
  return false;
end $$;

create or replace function public.write_audit(
  p_workspace_id uuid, p_action text, p_entity_type text, p_entity_id text,
  p_previous jsonb default null, p_next jsonb default null, p_metadata jsonb default '{}', p_reason text default null, p_origin text default 'rpc'
) returns bigint language plpgsql volatile security definer set search_path=public,auth as $$
declare v_id bigint; begin
  if p_workspace_id is not null and not public.has_workspace_access(p_workspace_id) then raise exception 'WORKSPACE_ACCESS_DENIED' using errcode='42501'; end if;
  insert into public.audit_logs(workspace_id,actor_id,actor_role,action,entity_type,entity_id,previous_value,next_value,metadata,reason,origin)
  values(p_workspace_id,auth.uid(),public.current_workspace_role(p_workspace_id),p_action,p_entity_type,p_entity_id,p_previous,p_next,coalesce(p_metadata,'{}'),p_reason,p_origin) returning id into v_id;
  return v_id;
end $$;

do $$ declare r record; begin
  for r in select tablename from pg_tables where schemaname='public' loop execute format('alter table public.%I enable row level security',r.tablename); end loop;
end $$;

create policy profiles_self_select on public.profiles for select using(id=auth.uid() or public.is_platform_superadmin());
create policy profiles_self_update on public.profiles for update using(id=auth.uid() or public.is_platform_superadmin()) with check(id=auth.uid() or public.is_platform_superadmin());
create policy platform_admins_admin_select on public.platform_admins for select using(public.is_platform_superadmin());
create policy workspaces_select on public.workspaces for select using(public.has_workspace_access(id));
create policy workspaces_admin_insert on public.workspaces for insert with check(public.is_platform_superadmin());
create policy workspaces_admin_update on public.workspaces for update using(public.is_platform_superadmin()) with check(public.is_platform_superadmin());
create policy service_status_select on public.workspace_service_status for select using(public.has_workspace_access(workspace_id));
create policy service_status_admin on public.workspace_service_status for all using(public.is_platform_superadmin()) with check(public.is_platform_superadmin());
create policy memberships_select on public.workspace_memberships for select using(public.has_workspace_access(workspace_id));
create policy memberships_manage on public.workspace_memberships for all using(public.is_workspace_owner(workspace_id)) with check(public.is_workspace_owner(workspace_id));
create policy support_admin on public.support_sessions for all using(public.is_platform_superadmin()) with check(public.is_platform_superadmin());
create policy audit_select on public.audit_logs for select using(public.is_platform_superadmin() or (workspace_id is not null and public.is_workspace_owner(workspace_id)) or actor_id=auth.uid());

do $$ declare r record; begin
  for r in
    select c.table_name from information_schema.columns c
    where c.table_schema='public' and c.column_name='workspace_id'
      and c.table_name not in ('workspaces','workspace_service_status','workspace_memberships','support_sessions','audit_logs')
  loop
    if exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=r.table_name and c.column_name='branch_id') and exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=r.table_name and c.column_name='academy_id') then
      execute format('create policy workspace_read on public.%I for select using (public.can_read_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (branch_id is not null and public.has_branch_access(branch_id)) or (branch_id is null and academy_id is not null and public.has_academy_access(academy_id))))',r.table_name,r.table_name);
      execute format('create policy workspace_insert on public.%I for insert with check (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (branch_id is not null and public.has_branch_access(branch_id))))',r.table_name,r.table_name);
      execute format('create policy workspace_update on public.%I for update using (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (branch_id is not null and public.has_branch_access(branch_id)))) with check (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (branch_id is not null and public.has_branch_access(branch_id))))',r.table_name,r.table_name,r.table_name);
    elsif exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=r.table_name and c.column_name='branch_id') then
      execute format('create policy workspace_read on public.%I for select using (public.can_read_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id)))',r.table_name,r.table_name);
      execute format('create policy workspace_insert on public.%I for insert with check (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id)))',r.table_name,r.table_name);
      execute format('create policy workspace_update on public.%I for update using (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id))) with check (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or public.has_branch_access(branch_id)))',r.table_name,r.table_name,r.table_name);
    elsif exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=r.table_name and c.column_name='academy_id') then
      execute format('create policy workspace_read on public.%I for select using (public.can_read_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (academy_id is not null and public.has_academy_access(academy_id))))',r.table_name,r.table_name);
      execute format('create policy workspace_insert on public.%I for insert with check (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (academy_id is not null and public.has_academy_access(academy_id))))',r.table_name,r.table_name);
      execute format('create policy workspace_update on public.%I for update using (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (academy_id is not null and public.has_academy_access(academy_id)))) with check (public.can_mutate_workspace(workspace_id,%L) and (public.is_workspace_owner(workspace_id) or (academy_id is not null and public.has_academy_access(academy_id))))',r.table_name,r.table_name,r.table_name);
    else
      execute format('create policy workspace_read on public.%I for select using (public.can_read_workspace(workspace_id,%L))',r.table_name,r.table_name);
      execute format('create policy workspace_insert on public.%I for insert with check (public.can_mutate_workspace(workspace_id,%L))',r.table_name,r.table_name);
      execute format('create policy workspace_update on public.%I for update using (public.can_mutate_workspace(workspace_id,%L)) with check (public.can_mutate_workspace(workspace_id,%L))',r.table_name,r.table_name,r.table_name);
    end if;
  end loop;
end $$;

-- Filas de alcance docente. Las políticas genéricas anteriores devuelven false para instructor.
create policy instructor_cohorts on public.cohorts for select using(instructor_user_id=auth.uid() and public.has_workspace_access(workspace_id));
create policy instructor_enrollments on public.enrollments for select using(exists(select 1 from public.cohorts c where c.id=enrollments.cohort_id and c.instructor_user_id=auth.uid()));
create policy instructor_classes on public.class_sessions for select using(exists(select 1 from public.cohorts c where c.id=class_sessions.cohort_id and c.instructor_user_id=auth.uid()));
create policy instructor_attendance on public.attendance_records for select using(exists(select 1 from public.class_sessions cs join public.cohorts c on c.id=cs.cohort_id where cs.id=attendance_records.class_session_id and c.instructor_user_id=auth.uid()));
create policy instructor_students on public.students for select using(exists(select 1 from public.enrollments e join public.cohorts c on c.id=e.cohort_id where e.student_id=students.id and c.instructor_user_id=auth.uid() and e.status in ('confirmed','attending','overdue')));
create policy instructor_settlements on public.instructor_settlements for select using(instructor_user_id=auth.uid());
create policy instructor_settlement_items on public.settlement_items for select using(exists(select 1 from public.instructor_settlements s where s.id=settlement_items.settlement_id and s.instructor_user_id=auth.uid()));
create policy instructor_payouts on public.instructor_payouts for select using(exists(select 1 from public.instructor_settlements s where s.id=instructor_payouts.settlement_id and s.instructor_user_id=auth.uid()));
create policy own_notifications on public.notifications for select using(recipient_id=auth.uid());
create policy own_requests on public.approval_requests for select using(requester_id=auth.uid());
create policy own_incidents on public.incidents for select using(reported_by=auth.uid() or responsible_id=auth.uid());

-- Recepción ve tablas hijas únicamente a través de una entidad padre dentro de su alcance.
create policy reception_guardians on public.student_guardians for select using(exists(select 1 from public.students s where s.id=student_guardians.student_id and public.can_manage_students(s.academy_id)));
create policy scoped_academies on public.academies for select using(public.has_academy_access(id));
create policy scoped_branches on public.branches for select using(public.has_branch_access(id));
create policy reception_allocations on public.payment_allocations for select using(exists(select 1 from public.payments p where p.id=payment_allocations.payment_id and public.can_manage_payments(p.academy_id)));
create policy reception_cash_movements on public.cash_movements for select using(exists(select 1 from public.cash_sessions c where c.id=cash_movements.cash_session_id and public.has_branch_access(c.branch_id)));

grant usage on schema public to authenticated;
grant select,insert,update on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;
revoke insert,update,delete on public.audit_logs from authenticated,anon;
revoke delete on all tables in schema public from authenticated,anon;
revoke insert,update on public.enrollments,public.charges,public.payments,public.payment_allocations,public.payment_receipts,public.payment_reversals,public.cash_sessions,public.cash_movements,public.checkins,public.attendance_records,public.settlement_periods,public.instructor_settlements,public.settlement_items,public.settlement_adjustments,public.instructor_payouts from authenticated,anon;
grant execute on function public.write_audit(uuid,text,text,text,jsonb,jsonb,jsonb,text,text) to authenticated;

commit;
