begin;

-- El anti-join vía PostgREST embedded filter (payment_allocations!left(payment_id) + .is(...,null))
-- no funciona como filtro de fila para esta relación uno-a-muchos: devuelve todos los pagos, no
-- solo los sin asignar (confirmado contra datos reales: 99 de 100 filas tenían asignación). Se
-- reemplaza por una vista con la misma lógica resuelta en SQL puro. security_invoker=true para que
-- la vista respete RLS como el usuario que consulta, no como el dueño de la vista.
create view public.payments_unassigned with (security_invoker = true) as
select p.* from public.payments p
where not exists (select 1 from public.payment_allocations a where a.payment_id = p.id);

grant select on public.payments_unassigned to authenticated;

commit;
