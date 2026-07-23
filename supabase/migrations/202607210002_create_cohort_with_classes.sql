begin;

-- Genera COH-0001, COH-0002... por academia, mismo patrón que nextPublicCode() en
-- app/api/students/route.ts pero resuelto server-side dentro del RPC de creación.
create or replace function public.next_cohort_code(p_workspace_id uuid, p_academy_id uuid) returns text
language plpgsql stable security definer set search_path=public,auth as $$
declare v_last text; v_next integer; begin
  select code into v_last from public.cohorts where workspace_id=p_workspace_id and academy_id=p_academy_id and code like 'COH-%'
    order by code desc limit 1;
  v_next := coalesce(nullif(regexp_replace(coalesce(v_last,''), '\D', '', 'g'), '')::integer, 0) + 1;
  return 'COH-' || lpad(v_next::text, 4, '0');
end $$;

create or replace function public.create_cohort_with_classes(
  p_workspace_id uuid, p_academy_id uuid, p_branch_id uuid, p_course_id uuid,
  p_name text, p_instructor_user_id uuid,
  p_start_date date, p_estimated_end_date date, p_capacity integer,
  p_installment_count integer, p_installment_cents bigint, p_due_day smallint,
  p_commission_bps integer, p_debt_policy text,
  p_schedule_days jsonb, -- [{"weekday":1,"startsAt":"18:00","endsAt":"20:00"}, ...]
  p_idempotency_key text
) returns jsonb language plpgsql volatile security definer set search_path=public,auth,extensions as $$
-- Nota: digest() (pgcrypto) vive en el esquema "extensions" en esta instancia, no en public/auth.
-- close_instructor_settlement (202607120003) usa digest() con search_path=public,auth únicamente,
-- lo cual falla en tiempo de ejecución con "function digest(text, unknown) does not exist" — bug
-- preexistente, no tocado acá (Liquidaciones está fuera de alcance), mismo síntoma verificado localmente.
declare
  v_cohort_id uuid; v_code text; v_existing record; v_day jsonb; v_weekday smallint; v_starts time; v_ends time;
  v_sessions integer; v_payload jsonb; v_hash text; v_constraint text;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='28000'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))=0 then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'COHORT_ACCESS_DENIED' using errcode='42501'; end if;
  if p_estimated_end_date < p_start_date then raise exception 'INVALID_COHORT_DATES'; end if;
  if p_estimated_end_date - p_start_date > 1095 then raise exception 'COHORT_DURATION_TOO_LONG'; end if;
  if jsonb_typeof(p_schedule_days) is distinct from 'array' or jsonb_array_length(p_schedule_days) = 0 then raise exception 'SCHEDULE_DAYS_REQUIRED'; end if;
  if jsonb_array_length(p_schedule_days) > 7 then raise exception 'TOO_MANY_SCHEDULE_DAYS'; end if;
  if length(trim(coalesce(p_name,'')))=0 then raise exception 'COHORT_NAME_REQUIRED'; end if;
  if not exists(select 1 from public.branches where id=p_branch_id and academy_id=p_academy_id and workspace_id=p_workspace_id) then raise exception 'BRANCH_TENANT_MISMATCH'; end if;
  if not exists(select 1 from public.courses where id=p_course_id and academy_id=p_academy_id and workspace_id=p_workspace_id) then raise exception 'COURSE_TENANT_MISMATCH'; end if;
  if p_instructor_user_id is not null and not exists(select 1 from public.instructor_profiles where user_id=p_instructor_user_id and academy_id=p_academy_id and active) then raise exception 'INSTRUCTOR_NOT_ELIGIBLE'; end if;

  -- Hash del payload normalizado: distingue "reintento legítimo" (misma clave, mismos datos) de
  -- "clave reutilizada con datos distintos" (bug de cliente), en vez de confiar ciegamente en la clave.
  v_payload := jsonb_build_object('academyId',p_academy_id,'branchId',p_branch_id,'courseId',p_course_id,'name',p_name,
    'instructorUserId',p_instructor_user_id,'startDate',p_start_date,'estimatedEndDate',p_estimated_end_date,'capacity',p_capacity,
    'installmentCount',p_installment_count,'installmentCents',p_installment_cents,'dueDay',p_due_day,'commissionBps',p_commission_bps,
    'debtPolicy',p_debt_policy,'scheduleDays',p_schedule_days);
  v_hash := encode(digest(v_payload::text,'sha256'),'hex');

  v_code := public.next_cohort_code(p_workspace_id, p_academy_id);

  begin
    insert into public.cohorts(workspace_id,academy_id,branch_id,course_id,instructor_user_id,code,name,start_date,estimated_end_date,
      capacity,installment_count,installment_cents,due_day,commission_bps,debt_policy,status,idempotency_key,request_hash,created_by)
    values(p_workspace_id,p_academy_id,p_branch_id,p_course_id,p_instructor_user_id,v_code,p_name,p_start_date,p_estimated_end_date,
      p_capacity,p_installment_count,p_installment_cents,p_due_day,p_commission_bps,coalesce(p_debt_policy,'allow_with_warning'),
      'scheduled',p_idempotency_key,v_hash,auth.uid())
    returning id into v_cohort_id;
  exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'cohorts_workspace_idempotency_idx' then
      select id, request_hash into v_existing from public.cohorts where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key;
      if v_existing.request_hash is distinct from v_hash then raise exception 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'; end if;
      return jsonb_build_object('cohort_id', v_existing.id, 'idempotent', true);
    elsif v_constraint = 'cohorts_academy_id_code_key' then raise exception 'COHORT_CODE_ALREADY_EXISTS';
    else raise exception 'COHORT_CREATE_CONFLICT';
    end if;
  end;

  for v_day in select * from jsonb_array_elements(p_schedule_days) loop
    begin
      v_weekday := (v_day->>'weekday')::smallint; v_starts := (v_day->>'startsAt')::time; v_ends := (v_day->>'endsAt')::time;
    exception when others then raise exception 'INVALID_SCHEDULE_DAY';
    end;
    if v_weekday is null or v_weekday not between 0 and 6 or v_starts is null or v_ends is null or v_ends <= v_starts then raise exception 'INVALID_SCHEDULE_DAY'; end if;
    begin
      insert into public.cohort_schedule_days(workspace_id,academy_id,branch_id,cohort_id,weekday,starts_at,ends_at)
      values(p_workspace_id,p_academy_id,p_branch_id,v_cohort_id,v_weekday,v_starts,v_ends);
    exception when unique_violation then raise exception 'DUPLICATE_SCHEDULE_WEEKDAY';
    end;
  end loop;

  insert into public.class_sessions(workspace_id,academy_id,branch_id,cohort_id,session_date,starts_at,ends_at,planned_instructor_id,status)
  select p_workspace_id,p_academy_id,p_branch_id,v_cohort_id,d.session_date,sd.starts_at,sd.ends_at,p_instructor_user_id,'scheduled'
  from generate_series(p_start_date,p_estimated_end_date,interval '1 day') as d(session_date)
  join public.cohort_schedule_days sd on sd.cohort_id=v_cohort_id and sd.weekday = extract(dow from d.session_date)::smallint
  on conflict (cohort_id,session_date,starts_at) do nothing;
  get diagnostics v_sessions = row_count;

  perform public.write_audit(p_workspace_id,'cohort.created','cohort',v_cohort_id::text,null,
    jsonb_build_object('course_id',p_course_id,'start_date',p_start_date,'estimated_end_date',p_estimated_end_date,'schedule_days',p_schedule_days,'sessions_created',v_sessions),
    jsonb_build_object('idempotency_key',p_idempotency_key));
  return jsonb_build_object('cohort_id', v_cohort_id, 'sessions_created', v_sessions, 'idempotent', false);
end $$;

revoke all on function public.create_cohort_with_classes(uuid,uuid,uuid,uuid,text,uuid,date,date,integer,integer,bigint,smallint,integer,text,jsonb,text) from public;
grant execute on function public.create_cohort_with_classes(uuid,uuid,uuid,uuid,text,uuid,date,date,integer,integer,bigint,smallint,integer,text,jsonb,text) to authenticated;
grant execute on function public.next_cohort_code(uuid,uuid) to authenticated;

-- Resumen agregado para la pestaña "Vencimientos": un solo query con los 4 buckets, en vez de 4
-- llamadas de resumen separadas. Ventana rodante (no semana calendario) para evitar la ambigüedad
-- lunes-vs-domingo; "vence hoy" cae en next7Days, no en overdue. Zona horaria hardcodeada igual que
-- perform_checkin (deuda técnica heredada, documentada, no nueva).
create or replace function public.charges_vencimientos_summary(p_workspace_id uuid, p_academy_id uuid) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
declare v_today date; v_result jsonb; begin
  if not public.can_manage_payments(p_academy_id) then raise exception 'CHARGES_SUMMARY_ACCESS_DENIED' using errcode='42501'; end if;
  v_today := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  select jsonb_build_object(
    'overdue', jsonb_build_object('count', count(*) filter (where due_date < v_today), 'cents', coalesce(sum(final_cents) filter (where due_date < v_today),0)),
    'next7Days', jsonb_build_object('count', count(*) filter (where due_date >= v_today and due_date < v_today+7), 'cents', coalesce(sum(final_cents) filter (where due_date >= v_today and due_date < v_today+7),0)),
    'next2Weeks', jsonb_build_object('count', count(*) filter (where due_date >= v_today+7 and due_date < v_today+21), 'cents', coalesce(sum(final_cents) filter (where due_date >= v_today+7 and due_date < v_today+21),0)),
    'later', jsonb_build_object('count', count(*) filter (where due_date >= v_today+21), 'cents', coalesce(sum(final_cents) filter (where due_date >= v_today+21),0))
  ) into v_result
  from public.charges where workspace_id=p_workspace_id and academy_id=p_academy_id and status not in ('paid','cancelled','waived');
  return v_result;
end $$;
grant execute on function public.charges_vencimientos_summary(uuid,uuid) to authenticated;

commit;
