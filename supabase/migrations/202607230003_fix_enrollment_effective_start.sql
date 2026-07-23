begin;

-- Bug: create_enrollment_with_charges tomaba p_effective_start (siempre "hoy", ver app/api/enrollments/route.ts)
-- sin validarlo contra cohorts.start_date. Inscribir hoy a una comisión que arranca en el futuro generaba
-- cuotas con vencimiento antes de que la comisión siquiera empezara. Fix: la facturación de una comisión
-- nunca puede empezar antes de que la comisión misma empiece, y el primer vencimiento nunca puede caer
-- antes de esa fecha de inicio efectiva (si el due_day configurado ya pasó en ese mes, se corre al mes
-- siguiente en vez de vencer "en el pasado").
create or replace function public.create_enrollment_with_charges(
  p_workspace_id uuid, p_student_id uuid, p_cohort_id uuid, p_agreed_price_cents bigint,
  p_installment_count integer, p_effective_start date, p_idempotency_key text
) returns jsonb language plpgsql volatile security definer set search_path=public,auth as $$
declare
  c public.cohorts%rowtype; s public.students%rowtype; e_id uuid; v_active integer;
  v_base bigint; v_remainder bigint; i integer; v_start date; v_first_due date;
begin
  if p_agreed_price_cents<0 or p_installment_count<1 then raise exception 'INVALID_ENROLLMENT_VALUES'; end if;
  select * into c from public.cohorts where id=p_cohort_id and workspace_id=p_workspace_id for update;
  if not found or not public.can_manage_students(c.academy_id) then raise exception 'ENROLLMENT_ACCESS_DENIED' using errcode='42501'; end if;
  select * into s from public.students where id=p_student_id and workspace_id=p_workspace_id and academy_id=c.academy_id and status='active';
  if not found then raise exception 'STUDENT_NOT_ELIGIBLE'; end if;
  select count(*) into v_active from public.enrollments where cohort_id=c.id and status in ('pre_enrolled','pending_payment','confirmed','attending','suspended','overdue');
  if v_active>=c.capacity then raise exception 'COHORT_CAPACITY_REACHED'; end if;
  select id into e_id from public.enrollments where workspace_id=p_workspace_id and code='IDEM-'||left(p_idempotency_key,24);
  if found then return jsonb_build_object('enrollment_id',e_id,'idempotent',true); end if;

  v_start := greatest(p_effective_start, c.start_date);
  v_first_due := (date_trunc('month', v_start) + (coalesce(c.due_day,10)-1 || ' days')::interval)::date;
  if v_first_due < v_start then v_first_due := v_first_due + interval '1 month'; end if;

  insert into public.enrollments(workspace_id,academy_id,branch_id,student_id,cohort_id,code,effective_start,status,agreed_price_cents,installment_count,created_by)
  values(p_workspace_id,c.academy_id,c.branch_id,s.id,c.id,'IDEM-'||left(p_idempotency_key,24),v_start,'confirmed',p_agreed_price_cents,p_installment_count,auth.uid()) returning id into e_id;
  v_base := p_agreed_price_cents/p_installment_count; v_remainder := p_agreed_price_cents%p_installment_count;
  for i in 1..p_installment_count loop
    insert into public.charges(workspace_id,academy_id,enrollment_id,cohort_id,student_id,type,installment_number,description,original_cents,due_date,service_period,commissionable)
    values(p_workspace_id,c.academy_id,e_id,c.id,s.id,'installment',i,'Cuota '||i||'/'||p_installment_count,v_base+(case when i<=v_remainder then 1 else 0 end),
      (v_first_due+(i-1||' months')::interval)::date,
      daterange((date_trunc('month',v_start)+(i-1||' months')::interval)::date,(date_trunc('month',v_start)+(i||' months')::interval)::date,'[)'),true);
  end loop;
  perform public.write_audit(p_workspace_id,'enrollment.created','enrollment',e_id::text,null,jsonb_build_object('student_id',s.id,'cohort_id',c.id,'installments',p_installment_count),jsonb_build_object('idempotency_key',p_idempotency_key));
  return jsonb_build_object('enrollment_id',e_id,'charges_created',p_installment_count,'idempotent',false);
exception when unique_violation then raise exception 'ENROLLMENT_ALREADY_EXISTS'; end $$;

commit;
