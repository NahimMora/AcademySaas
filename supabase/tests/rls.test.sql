begin;
select plan(22);
select has_function('public','has_workspace_access',array['uuid'],'existe autorización de workspace');
select has_function('public','can_manage_payments',array['uuid'],'existe autorización financiera');
select has_function('public','perform_checkin',array['uuid','uuid','uuid','text','text','text'],'check-in es RPC');
select ok((select relrowsecurity from pg_class where oid='public.students'::regclass),'RLS activa en alumnos');
select ok((select relrowsecurity from pg_class where oid='public.payments'::regclass),'RLS activa en pagos');
select ok((select relrowsecurity from pg_class where oid='public.audit_logs'::regclass),'RLS activa en auditoría');
select is((select count(*) from pg_policies where schemaname='public' and tablename='audit_logs'),1::bigint,'auditoría solo tiene política de lectura');
select is((select count(*) from pg_policies where schemaname='public' and tablename='payments' and cmd='DELETE'),0::bigint,'pagos no se borran');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select is((select count(*) from public.workspaces),1::bigint,'owner solo enumera su workspace');
select is((select count(*) from public.students),31::bigint,'owner ve las dos academias propias');

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.academies),1::bigint,'recepción solo ve academia asignada');
select is((select count(*) from public.branches),1::bigint,'recepción solo ve sede asignada');
select is((select count(*) from public.students where academy_id='a1000000-0000-0000-0000-000000000002'),0::bigint,'recepción no ve alumnos de otra academia');

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
select is((select count(*) from public.payments),0::bigint,'profesor no puede leer pagos');
select is((select count(*) from public.students where academy_id='a1000000-0000-0000-0000-000000000002'),0::bigint,'profesor no ve alumnos fuera de su nómina');
select throws_ok($$insert into public.students(workspace_id,academy_id,public_code,first_name,last_name,dni_normalized,birth_date,phone) values('a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','HACK','X','Y','45000001','2000-01-01','x')$$,'42501',null,'profesor no puede crear alumno');
select throws_ok($$insert into public.payments(workspace_id,academy_id,branch_id,student_id,effective_at,amount_cents,method,status,received_by,idempotency_key) values('a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000099',now(),100,'cash','confirmed','10000000-0000-0000-0000-000000000004','hack')$$,'42501',null,'profesor no puede registrar pago');

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select is((select count(*) from public.workspaces),2::bigint,'superadmin ve todos los clientes');
select ok(public.write_audit('b0000000-0000-0000-0000-000000000001','support.read','workspace','b0000000-0000-0000-0000-000000000001')>0,'soporte legítimo queda auditado');

reset role;
update public.workspaces set status='suspended' where id='a0000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select is(public.has_workspace_access('a0000000-0000-0000-0000-000000000001'),false,'usuario suspendido no puede operar');
select throws_ok($$update public.audit_logs set action='tampered'$$,'42501',null,'nadie actualiza auditoría');
select throws_ok($$delete from public.audit_logs$$,'42501',null,'nadie elimina auditoría');
reset role;
select * from finish();
rollback;
