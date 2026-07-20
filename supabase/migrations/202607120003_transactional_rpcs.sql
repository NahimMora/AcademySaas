begin;

create or replace function public.refresh_charge_status(p_charge_id uuid) returns void
language plpgsql volatile security definer set search_path=public,auth as $$
declare v_charge public.charges%rowtype; v_paid bigint; v_status text; begin
  select * into v_charge from public.charges where id=p_charge_id for update;
  select coalesce(sum(a.amount_cents),0) into v_paid from public.payment_allocations a join public.payments p on p.id=a.payment_id where a.charge_id=p_charge_id and p.status='confirmed';
  v_status := case when v_charge.status in ('cancelled','waived') then v_charge.status when v_paid>=v_charge.final_cents then 'paid' when v_paid>0 then 'partial' when v_charge.due_date<current_date then 'overdue' else 'pending' end;
  update public.charges set status=v_status,updated_at=now() where id=p_charge_id;
end $$;

create or replace function public.create_enrollment_with_charges(
  p_workspace_id uuid, p_student_id uuid, p_cohort_id uuid, p_agreed_price_cents bigint,
  p_installment_count integer, p_effective_start date, p_idempotency_key text
) returns jsonb language plpgsql volatile security definer set search_path=public,auth as $$
declare c public.cohorts%rowtype; s public.students%rowtype; e_id uuid; v_active integer; v_base bigint; v_remainder bigint; i integer; begin
  if p_agreed_price_cents<0 or p_installment_count<1 then raise exception 'INVALID_ENROLLMENT_VALUES'; end if;
  select * into c from public.cohorts where id=p_cohort_id and workspace_id=p_workspace_id for update;
  if not found or not public.can_manage_students(c.academy_id) then raise exception 'ENROLLMENT_ACCESS_DENIED' using errcode='42501'; end if;
  select * into s from public.students where id=p_student_id and workspace_id=p_workspace_id and academy_id=c.academy_id and status='active';
  if not found then raise exception 'STUDENT_NOT_ELIGIBLE'; end if;
  select count(*) into v_active from public.enrollments where cohort_id=c.id and status in ('pre_enrolled','pending_payment','confirmed','attending','suspended','overdue');
  if v_active>=c.capacity then raise exception 'COHORT_CAPACITY_REACHED'; end if;
  select id into e_id from public.enrollments where workspace_id=p_workspace_id and code='IDEM-'||left(p_idempotency_key,24);
  if found then return jsonb_build_object('enrollment_id',e_id,'idempotent',true); end if;
  insert into public.enrollments(workspace_id,academy_id,branch_id,student_id,cohort_id,code,effective_start,status,agreed_price_cents,installment_count,created_by)
  values(p_workspace_id,c.academy_id,c.branch_id,s.id,c.id,'IDEM-'||left(p_idempotency_key,24),p_effective_start,'confirmed',p_agreed_price_cents,p_installment_count,auth.uid()) returning id into e_id;
  v_base := p_agreed_price_cents/p_installment_count; v_remainder := p_agreed_price_cents%p_installment_count;
  for i in 1..p_installment_count loop
    insert into public.charges(workspace_id,academy_id,enrollment_id,cohort_id,student_id,type,installment_number,description,original_cents,due_date,service_period,commissionable)
    values(p_workspace_id,c.academy_id,e_id,c.id,s.id,'installment',i,'Cuota '||i||'/'||p_installment_count,v_base+(case when i<=v_remainder then 1 else 0 end),(date_trunc('month',p_effective_start)+(i-1||' months')::interval+(coalesce(c.due_day,10)-1||' days')::interval)::date,daterange((date_trunc('month',p_effective_start)+(i-1||' months')::interval)::date,(date_trunc('month',p_effective_start)+(i||' months')::interval)::date,'[)'),true);
  end loop;
  perform public.write_audit(p_workspace_id,'enrollment.created','enrollment',e_id::text,null,jsonb_build_object('student_id',s.id,'cohort_id',c.id,'installments',p_installment_count),jsonb_build_object('idempotency_key',p_idempotency_key));
  return jsonb_build_object('enrollment_id',e_id,'charges_created',p_installment_count,'idempotent',false);
exception when unique_violation then raise exception 'ENROLLMENT_ALREADY_EXISTS'; end $$;

create or replace function public.register_payment(
  p_workspace_id uuid,p_academy_id uuid,p_branch_id uuid,p_student_id uuid,p_amount_cents bigint,p_method text,
  p_effective_at timestamptz,p_reference text,p_charge_id uuid,p_allocation_cents bigint,p_cash_session_id uuid,p_idempotency_key text
) returns jsonb language plpgsql volatile security definer set search_path=public,auth as $$
declare v_id uuid; v_status text; v_charge public.charges%rowtype; v_allocated bigint; begin
  if not public.can_manage_payments(p_academy_id) then raise exception 'PAYMENT_ACCESS_DENIED' using errcode='42501'; end if;
  if p_amount_cents<=0 or p_allocation_cents<0 or p_allocation_cents>p_amount_cents then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;
  select id,status into v_id,v_status from public.payments where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('payment_id',v_id,'status',v_status,'idempotent',true); end if;
  if not exists(select 1 from public.students where id=p_student_id and workspace_id=p_workspace_id and academy_id=p_academy_id) then raise exception 'STUDENT_TENANT_MISMATCH'; end if;
  v_status := case when p_method='cash' then 'confirmed' else 'pending_validation' end;
  if p_method='cash' and not exists(select 1 from public.cash_sessions where id=p_cash_session_id and workspace_id=p_workspace_id and branch_id=p_branch_id and status='open') then raise exception 'OPEN_CASH_REQUIRED'; end if;
  if p_charge_id is not null then
    select * into v_charge from public.charges where id=p_charge_id and workspace_id=p_workspace_id and student_id=p_student_id for update;
    if not found or v_charge.status in ('cancelled','waived','paid') then raise exception 'CHARGE_NOT_PAYABLE'; end if;
    select coalesce(sum(a.amount_cents),0) into v_allocated from public.payment_allocations a join public.payments p on p.id=a.payment_id where a.charge_id=p_charge_id and p.status not in ('rejected','reversed','refunded');
    if v_allocated+p_allocation_cents>v_charge.final_cents then raise exception 'ALLOCATION_EXCEEDS_BALANCE'; end if;
  end if;
  insert into public.payments(workspace_id,academy_id,branch_id,student_id,effective_at,amount_cents,method,status,reference,received_by,cash_session_id,idempotency_key,confirmed_at)
  values(p_workspace_id,p_academy_id,p_branch_id,p_student_id,p_effective_at,p_amount_cents,p_method,v_status,p_reference,auth.uid(),p_cash_session_id,p_idempotency_key,case when v_status='confirmed' then now() end) returning id into v_id;
  if p_charge_id is not null and p_allocation_cents>0 then insert into public.payment_allocations(workspace_id,payment_id,charge_id,amount_cents,commissionable) values(p_workspace_id,v_id,p_charge_id,p_allocation_cents,v_charge.commissionable); end if;
  if p_method='cash' then insert into public.cash_movements(workspace_id,cash_session_id,payment_id,type,amount_cents) values(p_workspace_id,p_cash_session_id,v_id,'payment',p_amount_cents); end if;
  if p_charge_id is not null then perform public.refresh_charge_status(p_charge_id); end if;
  insert into public.notification_outbox(workspace_id,channel,recipient,payload,idempotency_key) values(p_workspace_id,'email','student:'||p_student_id,jsonb_build_object('event','payment_registered','payment_id',v_id),'payment-email-'||v_id);
  perform public.write_audit(p_workspace_id,'payment.created','payment',v_id::text,null,jsonb_build_object('amount_cents',p_amount_cents,'status',v_status),jsonb_build_object('idempotency_key',p_idempotency_key));
  return jsonb_build_object('payment_id',v_id,'status',v_status,'idempotent',false);
end $$;

create or replace function public.confirm_payment(p_payment_id uuid,p_idempotency_key text) returns jsonb
language plpgsql volatile security definer set search_path=public,auth as $$
declare p public.payments%rowtype; a record; begin
  select * into p from public.payments where id=p_payment_id for update;
  if not found or not public.can_manage_payments(p.academy_id) then raise exception 'PAYMENT_ACCESS_DENIED' using errcode='42501'; end if;
  if p.status='confirmed' then return jsonb_build_object('payment_id',p.id,'status','confirmed','idempotent',true); end if;
  if p.status<>'pending_validation' then raise exception 'PAYMENT_NOT_CONFIRMABLE'; end if;
  update public.payments set status='confirmed',confirmed_at=now(),updated_at=now() where id=p.id;
  for a in select charge_id from public.payment_allocations where payment_id=p.id loop perform public.refresh_charge_status(a.charge_id); end loop;
  perform public.write_audit(p.workspace_id,'payment.confirmed','payment',p.id::text,jsonb_build_object('status',p.status),jsonb_build_object('status','confirmed'),jsonb_build_object('idempotency_key',p_idempotency_key));
  return jsonb_build_object('payment_id',p.id,'status','confirmed','idempotent',false);
end $$;

create or replace function public.reverse_payment(p_payment_id uuid,p_reason text,p_idempotency_key text) returns jsonb
language plpgsql volatile security definer set search_path=public,auth as $$
declare p public.payments%rowtype; a record; begin
  select * into p from public.payments where id=p_payment_id for update;
  if not found or not public.can_manage_payments(p.academy_id) then raise exception 'PAYMENT_ACCESS_DENIED' using errcode='42501'; end if;
  if p.status='reversed' then return jsonb_build_object('payment_id',p.id,'status','reversed','idempotent',true); end if;
  if p.status<>'confirmed' then raise exception 'ONLY_CONFIRMED_PAYMENT_CAN_BE_REVERSED'; end if;
  insert into public.payment_reversals(workspace_id,payment_id,reason,reversed_by,idempotency_key) values(p.workspace_id,p.id,p_reason,auth.uid(),p_idempotency_key);
  update public.payments set status='reversed',reversed_at=now(),updated_at=now() where id=p.id;
  if p.cash_session_id is not null then insert into public.cash_movements(workspace_id,cash_session_id,payment_id,type,amount_cents,note) values(p.workspace_id,p.cash_session_id,p.id,'reversal',-p.amount_cents,p_reason); end if;
  for a in select charge_id from public.payment_allocations where payment_id=p.id loop perform public.refresh_charge_status(a.charge_id); end loop;
  perform public.write_audit(p.workspace_id,'payment.reversed','payment',p.id::text,jsonb_build_object('status','confirmed'),jsonb_build_object('status','reversed'),jsonb_build_object('idempotency_key',p_idempotency_key),p_reason);
  return jsonb_build_object('payment_id',p.id,'status','reversed','idempotent',false);
end $$;

create or replace function public.open_cash_session(p_workspace_id uuid,p_academy_id uuid,p_branch_id uuid,p_opening_cents bigint) returns uuid
language plpgsql volatile security definer set search_path=public,auth as $$
declare v_id uuid; begin
  if not public.can_manage_payments(p_academy_id) or not public.has_branch_access(p_branch_id) then raise exception 'CASH_ACCESS_DENIED' using errcode='42501'; end if;
  insert into public.cash_sessions(workspace_id,academy_id,branch_id,opened_by,opening_cents) values(p_workspace_id,p_academy_id,p_branch_id,auth.uid(),p_opening_cents) returning id into v_id;
  insert into public.cash_movements(workspace_id,cash_session_id,type,amount_cents) values(p_workspace_id,v_id,'opening',p_opening_cents);
  perform public.write_audit(p_workspace_id,'cash.opened','cash_session',v_id::text,null,jsonb_build_object('opening_cents',p_opening_cents)); return v_id;
exception when unique_violation then raise exception 'CASH_ALREADY_OPEN'; end $$;

create or replace function public.close_cash_session(p_cash_session_id uuid,p_counted_cents bigint,p_note text) returns jsonb
language plpgsql volatile security definer set search_path=public,auth as $$
declare c public.cash_sessions%rowtype; v_expected bigint; begin
  select * into c from public.cash_sessions where id=p_cash_session_id for update;
  if not found or c.status<>'open' or (c.opened_by<>auth.uid() and not public.is_workspace_owner(c.workspace_id)) then raise exception 'CASH_NOT_CLOSABLE'; end if;
  select c.opening_cents+coalesce(sum(amount_cents) filter(where type in ('payment','reversal','adjustment')),0) into v_expected from public.cash_movements where cash_session_id=c.id;
  update public.cash_sessions set status='closed',closed_at=now(),counted_cents=p_counted_cents,expected_cents=v_expected,difference_cents=p_counted_cents-v_expected,note=p_note,updated_at=now() where id=c.id;
  insert into public.cash_movements(workspace_id,cash_session_id,type,amount_cents,note) values(c.workspace_id,c.id,'closing',p_counted_cents,p_note);
  perform public.write_audit(c.workspace_id,'cash.closed','cash_session',c.id::text,null,jsonb_build_object('expected_cents',v_expected,'counted_cents',p_counted_cents,'difference_cents',p_counted_cents-v_expected));
  return jsonb_build_object('cash_session_id',c.id,'expected_cents',v_expected,'difference_cents',p_counted_cents-v_expected);
end $$;

create or replace function public.calculate_commission_estimate(p_workspace_id uuid,p_cohort_id uuid,p_period_start date,p_period_end date) returns jsonb
language sql stable security definer set search_path=public,auth as $$
  with c as (select * from public.cohorts where id=p_cohort_id and workspace_id=p_workspace_id and public.has_workspace_access(workspace_id)), eligible as (
    select coalesce(sum(a.amount_cents),0)::bigint base from public.payment_allocations a join public.payments p on p.id=a.payment_id join public.charges ch on ch.id=a.charge_id join c on c.id=ch.cohort_id
    where p.status='confirmed' and a.commissionable and ch.commissionable and ch.status<>'cancelled' and p.effective_at::date between p_period_start and p_period_end
  ) select jsonb_build_object('base_cents',base,'commission_bps',coalesce(c.commission_bps,4000),'instructor_cents',round(base*coalesce(c.commission_bps,4000)/10000.0)::bigint,'disclaimer','Estimación sujeta a confirmaciones, reversiones y cierre.') from eligible,c
$$;

create or replace function public.resolve_approval_request(p_request_id uuid,p_approve boolean,p_comment text) returns jsonb
language plpgsql volatile security definer set search_path=public,auth as $$
declare r public.approval_requests%rowtype; v_status text; begin select * into r from public.approval_requests where id=p_request_id for update;
  if not found or r.status<>'pending' or not public.is_workspace_owner(r.workspace_id) or r.requester_id=auth.uid() then raise exception 'REQUEST_NOT_RESOLVABLE'; end if;
  v_status:=case when p_approve then 'approved' else 'rejected' end;
  update public.approval_requests set status=v_status,resolved_by=auth.uid(),resolution=v_status,resolution_comment=p_comment,resolved_at=now() where id=r.id;
  perform public.write_audit(r.workspace_id,'request.'||v_status,'approval_request',r.id::text,jsonb_build_object('status','pending'),jsonb_build_object('status',v_status),null,p_comment);
  return jsonb_build_object('request_id',r.id,'status',v_status);
end $$;

grant execute on function public.create_enrollment_with_charges(uuid,uuid,uuid,bigint,integer,date,text) to authenticated;
grant execute on function public.register_payment(uuid,uuid,uuid,uuid,bigint,text,timestamptz,text,uuid,bigint,uuid,text) to authenticated;
grant execute on function public.confirm_payment(uuid,text), public.reverse_payment(uuid,text,text), public.open_cash_session(uuid,uuid,uuid,bigint), public.close_cash_session(uuid,bigint,text), public.calculate_commission_estimate(uuid,uuid,date,date), public.resolve_approval_request(uuid,boolean,text) to authenticated;

commit;
