begin;

-- Agregado server-side para las tarjetas de "Cargos": antes se sumaban en el
-- cliente sobre el array ya paginado, lo que subestima el total apenas hay
-- más cuotas que una página. Misma lógica de "pagado" que refresh_charge_status
-- (solo asignaciones de pagos confirmados cuentan).
create or replace function public.charges_summary(
  p_workspace_id uuid, p_academy_id uuid, p_status text default null, p_student_ids uuid[] default null
) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
declare v_debt bigint; v_overdue bigint; v_pending bigint; begin
  if not public.can_manage_payments(p_academy_id) then raise exception 'CHARGES_SUMMARY_ACCESS_DENIED' using errcode='42501'; end if;

  select coalesce(sum(greatest(0, s.final_cents - coalesce(pd.paid_cents, 0))), 0), coalesce(sum((s.status = 'overdue')::int), 0)
    into v_debt, v_overdue
  from (
    select c.id, c.final_cents, c.status from public.charges c
    where c.workspace_id = p_workspace_id and c.academy_id = p_academy_id
      and (p_status is null or c.status = p_status)
      and (p_student_ids is null or c.student_id = any(p_student_ids))
  ) s
  left join (
    select a.charge_id, sum(a.amount_cents) paid_cents from public.payment_allocations a
    join public.payments p on p.id = a.payment_id and p.status = 'confirmed'
    group by a.charge_id
  ) pd on pd.charge_id = s.id;

  select coalesce(count(distinct a.charge_id), 0) into v_pending
  from public.payment_allocations a
  join public.payments p on p.id = a.payment_id and p.status = 'pending_validation'
  join public.charges c on c.id = a.charge_id
  where c.workspace_id = p_workspace_id and c.academy_id = p_academy_id;

  return jsonb_build_object('debtCents', v_debt, 'overdueCount', v_overdue, 'pendingValidationCount', v_pending);
end $$;

grant execute on function public.charges_summary(uuid, uuid, text, uuid[]) to authenticated;

commit;
