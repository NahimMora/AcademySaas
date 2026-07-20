begin;

create or replace function public.perform_checkin(
  p_workspace_id uuid,p_academy_id uuid,p_branch_id uuid,p_token_hash text,p_device_hash text,p_request_id text
) returns jsonb language plpgsql volatile security definer set search_path=public,auth as $$
declare q public.qr_credentials%rowtype; s public.students%rowtype; e public.enrollments%rowtype; c public.cohorts%rowtype; cs public.class_sessions%rowtype; v_result text:='denied'; v_code text:='invalid_qr'; v_reason text:='QR inválido o revocado'; v_overdue boolean:=false; v_previous uuid; v_id uuid; begin
  if not public.has_branch_access(p_branch_id) then raise exception 'CHECKIN_ACCESS_DENIED' using errcode='42501'; end if;
  select * into q from public.qr_credentials where workspace_id=p_workspace_id and academy_id=p_academy_id and token_hash=p_token_hash and status='active';
  if found then select * into s from public.students where id=q.student_id and workspace_id=p_workspace_id;
    if s.status<>'active' then v_code:='student_'||s.status; v_reason:='Alumno inactivo o bloqueado';
    else
      select * into cs from public.class_sessions where workspace_id=p_workspace_id and academy_id=p_academy_id and branch_id=p_branch_id and status in ('scheduled','open') and session_date=(now() at time zone 'America/Argentina/Buenos_Aires')::date and (now() at time zone 'America/Argentina/Buenos_Aires')::time between starts_at-interval '30 minutes' and ends_at+interval '6 hours' order by abs(extract(epoch from ((now() at time zone 'America/Argentina/Buenos_Aires')::time-starts_at))) limit 1;
      if not found then v_code:='outside_class_window'; v_reason:='No hay una clase compatible en esta ventana';
      else select * into e from public.enrollments where student_id=s.id and cohort_id=cs.cohort_id and status in ('confirmed','attending','overdue') limit 1;
        if not found then v_code:='no_enrollment'; v_reason:='Sin inscripción oficial vigente';
        else select * into c from public.cohorts where id=e.cohort_id; select exists(select 1 from public.charges where enrollment_id=e.id and status='overdue') into v_overdue;
          if c.debt_policy='block_if_overdue' and v_overdue then v_code:='overdue_blocked'; v_reason:='Acceso bloqueado por deuda vencida';
          elsif c.debt_policy='block_if_no_confirmed_payment' and not exists(select 1 from public.payment_allocations a join public.payments p on p.id=a.payment_id join public.charges ch on ch.id=a.charge_id where ch.enrollment_id=e.id and p.status='confirmed') then v_code:='no_confirmed_payment'; v_reason:='No existe un pago confirmado';
          elsif c.debt_policy='manual_review' then v_result:='warning';v_code:='manual_review';v_reason:='Requiere autorización manual';
          elsif v_overdue then v_result:='warning';v_code:='overdue_warning';v_reason:='Autorizado con deuda pendiente';
          else v_result:='authorized';v_code:='eligible';v_reason:='Inscripción y acceso vigentes'; end if;
        end if;
      end if;
    end if;
  end if;
  if v_result in ('authorized','warning') then select id into v_previous from public.checkins where student_id=s.id and class_session_id=cs.id and result in ('authorized','warning'); if found then return jsonb_build_object('checkin_id',v_previous,'result',v_result,'reason','Check-in ya registrado','duplicate',true); end if; end if;
  insert into public.checkins(workspace_id,academy_id,branch_id,student_id,class_session_id,qr_credential_id,result,reason_code,reason,device_hash,request_id,created_by)
  values(p_workspace_id,p_academy_id,p_branch_id,s.id,cs.id,q.id,v_result,v_code,v_reason,p_device_hash,p_request_id,auth.uid()) returning id into v_id;
  if v_result='denied' then insert into public.alerts(workspace_id,academy_id,branch_id,severity,type,title,detail,entity_type,entity_id) values(p_workspace_id,p_academy_id,p_branch_id,case when v_code in ('no_enrollment','student_blocked') then 'high' else 'medium' end,'checkin_denied','Acceso QR denegado',v_reason,'checkin',v_id); end if;
  perform public.write_audit(p_workspace_id,'checkin.'||v_result,'checkin',v_id::text,null,jsonb_build_object('reason_code',v_code,'student_id',s.id),jsonb_build_object('request_id',p_request_id));
  return jsonb_build_object('checkin_id',v_id,'result',v_result,'reason',v_reason,'reason_code',v_code,'student_id',s.id,'class_session_id',cs.id,'duplicate',false);
end $$;

create or replace function public.save_attendance(p_class_session_id uuid,p_enrollment_id uuid,p_status text,p_notes text) returns uuid
language plpgsql volatile security definer set search_path=public,auth as $$
declare cs public.class_sessions%rowtype;e public.enrollments%rowtype;v_id uuid;begin
  select * into cs from public.class_sessions where id=p_class_session_id for update;if not found or cs.attendance_closed_at is not null or not public.can_manage_attendance(cs.cohort_id) then raise exception 'ATTENDANCE_NOT_EDITABLE';end if;
  select * into e from public.enrollments where id=p_enrollment_id and cohort_id=cs.cohort_id and status in ('confirmed','attending','overdue');if not found then raise exception 'ENROLLMENT_NOT_ELIGIBLE';end if;
  insert into public.attendance_records(workspace_id,class_session_id,enrollment_id,student_id,status,edited_by,notes) values(cs.workspace_id,cs.id,e.id,e.student_id,p_status,auth.uid(),p_notes)
  on conflict(class_session_id,enrollment_id) do update set status=excluded.status,edited_by=auth.uid(),notes=excluded.notes,updated_at=now() returning id into v_id;
  return v_id;
end $$;
create or replace function public.close_attendance(p_class_session_id uuid) returns void language plpgsql volatile security definer set search_path=public,auth as $$
declare cs public.class_sessions%rowtype;begin select * into cs from public.class_sessions where id=p_class_session_id for update;if not found or not public.can_manage_attendance(cs.cohort_id) then raise exception 'ATTENDANCE_ACCESS_DENIED';end if;
  insert into public.attendance_records(workspace_id,class_session_id,enrollment_id,student_id,status,edited_by)
  select cs.workspace_id,cs.id,e.id,e.student_id,'absent',auth.uid() from public.enrollments e where e.cohort_id=cs.cohort_id and e.status in ('confirmed','attending','overdue') on conflict(class_session_id,enrollment_id) do nothing;
  update public.attendance_records set closed_at=now() where class_session_id=cs.id;update public.class_sessions set attendance_closed_at=now(),attendance_open=false,status='completed',updated_at=now() where id=cs.id;
  perform public.write_audit(cs.workspace_id,'attendance.closed','class_session',cs.id::text,null,jsonb_build_object('closed_at',now()));end $$;

create or replace function public.drop_enrollment(p_enrollment_id uuid,p_effective_date date,p_reason text) returns jsonb language plpgsql volatile security definer set search_path=public,auth as $$
declare e public.enrollments%rowtype;v_cancelled integer;begin select * into e from public.enrollments where id=p_enrollment_id for update;if not found or not public.can_manage_students(e.academy_id) then raise exception 'ENROLLMENT_ACCESS_DENIED';end if;
  update public.enrollments set status='dropped_out',dropped_out_at=p_effective_date,drop_reason=p_reason,future_charge_policy='cancel_after_effective_date',updated_at=now() where id=e.id;
  update public.charges set status='cancelled',cancelled_at=now(),cancellation_reason='Abandono efectivo: '||p_effective_date,updated_at=now() where enrollment_id=e.id and due_date>p_effective_date and status in ('pending','under_review');get diagnostics v_cancelled=row_count;
  perform public.write_audit(e.workspace_id,'enrollment.dropped_out','enrollment',e.id::text,jsonb_build_object('status',e.status),jsonb_build_object('status','dropped_out','cancelled_future_charges',v_cancelled),null,p_reason);
  return jsonb_build_object('enrollment_id',e.id,'cancelled_future_charges',v_cancelled);
end $$;

create or replace function public.close_instructor_settlement(p_settlement_id uuid,p_reason text) returns jsonb language plpgsql volatile security definer set search_path=public,auth as $$
declare st public.instructor_settlements%rowtype;sp public.settlement_periods%rowtype;c public.cohorts%rowtype;v_base bigint;v_teacher bigint;v_snapshot jsonb;begin
  select * into st from public.instructor_settlements where id=p_settlement_id for update;if not found or not public.can_manage_settlements(st.academy_id) or st.status not in ('open','under_review','reopened') then raise exception 'SETTLEMENT_NOT_CLOSABLE';end if;
  select * into sp from public.settlement_periods where id=st.settlement_period_id;select * into c from public.cohorts where id=st.cohort_id;
  delete from public.settlement_items where settlement_id=st.id and st.status<>'reopened';
  insert into public.settlement_items(workspace_id,settlement_id,payment_allocation_id,base_cents,instructor_cents,included,exclusion_reason,snapshot)
  select st.workspace_id,st.id,a.id,a.amount_cents,round(a.amount_cents*st.commission_bps/10000.0)::bigint,true,null,jsonb_build_object('payment_id',p.id,'charge_id',ch.id,'student_id',ch.student_id,'effective_at',p.effective_at)
  from public.payment_allocations a join public.payments p on p.id=a.payment_id join public.charges ch on ch.id=a.charge_id where ch.cohort_id=st.cohort_id and p.status='confirmed' and a.commissionable and ch.commissionable and ch.status<>'cancelled' and p.effective_at::date between sp.period_start and sp.period_end on conflict(settlement_id,payment_allocation_id) do nothing;
  select coalesce(sum(base_cents),0),coalesce(sum(instructor_cents),0) into v_base,v_teacher from public.settlement_items where settlement_id=st.id and included;
  v_snapshot:=jsonb_build_object('version',1,'professor_id',st.instructor_user_id,'cohort_id',st.cohort_id,'period_start',sp.period_start,'period_end',sp.period_end,'commission_bps',st.commission_bps,'base_cents',v_base,'instructor_cents',v_teacher,'closed_at',now(),'closed_by',auth.uid());
  update public.instructor_settlements set status='closed',base_cents=v_base,instructor_cents=v_teacher,academy_cents=v_base-v_teacher,snapshot=v_snapshot,snapshot_hash=encode(digest(v_snapshot::text,'sha256'),'hex'),closed_at=now(),closed_by=auth.uid() where id=st.id;
  update public.settlement_periods set status='closed',closed_at=now(),closed_by=auth.uid() where id=sp.id;
  perform public.write_audit(st.workspace_id,'settlement.closed','instructor_settlement',st.id::text,null,v_snapshot,null,p_reason);
  return jsonb_build_object('settlement_id',st.id,'base_cents',v_base,'instructor_cents',v_teacher,'snapshot_hash',encode(digest(v_snapshot::text,'sha256'),'hex'));
end $$;

create or replace function public.register_instructor_payout(p_settlement_id uuid,p_amount_cents bigint,p_paid_at timestamptz,p_method text,p_reference text,p_idempotency_key text) returns jsonb language plpgsql volatile security definer set search_path=public,auth as $$
declare st public.instructor_settlements%rowtype;v_paid bigint;v_id uuid;v_status text;begin select * into st from public.instructor_settlements where id=p_settlement_id for update;
  if not found or not public.can_manage_settlements(st.academy_id) or st.status not in ('closed','partially_paid') then raise exception 'PAYOUT_NOT_ALLOWED';end if;
  select id into v_id from public.instructor_payouts where workspace_id=st.workspace_id and idempotency_key=p_idempotency_key;if found then return jsonb_build_object('payout_id',v_id,'idempotent',true);end if;
  select coalesce(sum(amount_cents),0) into v_paid from public.instructor_payouts where settlement_id=st.id;if p_amount_cents<=0 or v_paid+p_amount_cents>st.instructor_cents then raise exception 'PAYOUT_EXCEEDS_BALANCE';end if;
  insert into public.instructor_payouts(workspace_id,settlement_id,amount_cents,paid_at,method,reference,registered_by,idempotency_key) values(st.workspace_id,st.id,p_amount_cents,p_paid_at,p_method,p_reference,auth.uid(),p_idempotency_key) returning id into v_id;
  v_status:=case when v_paid+p_amount_cents=st.instructor_cents then 'paid' else 'partially_paid' end;update public.instructor_settlements set status=v_status where id=st.id;
  perform public.write_audit(st.workspace_id,'instructor_payout.created','instructor_payout',v_id::text,null,jsonb_build_object('amount_cents',p_amount_cents,'settlement_status',v_status));
  return jsonb_build_object('payout_id',v_id,'status',v_status,'remaining_cents',st.instructor_cents-v_paid-p_amount_cents,'idempotent',false);
end $$;

grant execute on function public.perform_checkin(uuid,uuid,uuid,text,text,text),public.save_attendance(uuid,uuid,text,text),public.close_attendance(uuid),public.drop_enrollment(uuid,date,text),public.close_instructor_settlement(uuid,text),public.register_instructor_payout(uuid,bigint,timestamptz,text,text,text) to authenticated;
commit;
