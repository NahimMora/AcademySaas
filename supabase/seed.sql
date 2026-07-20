-- Seed local idempotente. Contraseña exclusiva de demo: Demo-3300!
-- confirmation_token/recovery_token/email_change_token_new/email_change_token_current/email_change
-- se fijan en '' (no NULL): GoTrue escanea esas columnas como string y falla el login
-- ("converting NULL to string is unsupported") si quedan NULL.
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change_token_current,email_change)
values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','superadmin@demo.local',crypt('Demo-3300!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Admin Plataforma"}',now(),now(),'','','','',''),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner@demo.local',crypt('Demo-3300!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Martina Ríos"}',now(),now(),'','','','',''),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','recepcion@demo.local',crypt('Demo-3300!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Carla Méndez"}',now(),now(),'','','','',''),
('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','profesor@demo.local',crypt('Demo-3300!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Tomás Herrera"}',now(),now(),'','','','',''),
('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner2@demo.local',crypt('Demo-3300!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Nora Quiroga"}',now(),now(),'','','','','')
on conflict(id) do nothing;
insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select gen_random_uuid(),u.id,u.id::text,jsonb_build_object('sub',u.id::text,'email',u.email),'email',now(),now(),now()
from auth.users u
where u.id in ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001')
on conflict do nothing;
insert into public.profiles(id,full_name) values
('10000000-0000-0000-0000-000000000001','Admin Plataforma'),('10000000-0000-0000-0000-000000000002','Martina Ríos'),('10000000-0000-0000-0000-000000000003','Carla Méndez'),('10000000-0000-0000-0000-000000000004','Tomás Herrera'),('20000000-0000-0000-0000-000000000001','Nora Quiroga') on conflict(id) do nothing;
insert into public.platform_admins(user_id) values('10000000-0000-0000-0000-000000000001') on conflict do nothing;
insert into public.workspaces(id,public_code,name,status,plan,created_by) values
('a0000000-0000-0000-0000-000000000001','GRUPO-FUSION','Grupo Fusión','active','professional','10000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000001','ACADEMIA-NORTE','Academia Norte','active','initial','10000000-0000-0000-0000-000000000001') on conflict(id) do nothing;
insert into public.workspace_service_status(workspace_id,status) values('a0000000-0000-0000-0000-000000000001','active'),('b0000000-0000-0000-0000-000000000001','active') on conflict do nothing;
insert into public.workspace_memberships(workspace_id,user_id,role,status,is_primary_owner) values
('a0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','owner','active',true),
('a0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','receptionist','active',false),
('a0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','instructor','active',false),
('b0000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','owner','active',true) on conflict(workspace_id,user_id) do nothing;
insert into public.academies(id,workspace_id,public_code,name,created_by) values
('a1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','FUSION','Academia Fusión','10000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','IMPERIO','Academia Imperio','10000000-0000-0000-0000-000000000002'),
('b1000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','NORTE','Academia Norte','20000000-0000-0000-0000-000000000001') on conflict(id) do nothing;
insert into public.academy_settings(academy_id,workspace_id) values
('a1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001'),('a1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001'),('b1000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001') on conflict do nothing;
insert into public.branches(id,workspace_id,academy_id,code,name,city,province) values
('a2000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','CENTRO','Sede Centro','CABA','Buenos Aires'),
('a2000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','NORTE','Sede Norte','San Isidro','Buenos Aires'),
('a2000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','PRINCIPAL','Sede Principal','Córdoba','Córdoba'),
('b2000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','SALTA','Sede Salta','Salta','Salta') on conflict(id) do nothing;
insert into public.academy_memberships(workspace_id,academy_id,user_id) values
('a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003'),('a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004') on conflict do nothing;
insert into public.branch_memberships(workspace_id,branch_id,user_id) values
('a0000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003'),('a0000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004') on conflict do nothing;
insert into public.students(workspace_id,academy_id,public_code,first_name,last_name,dni_normalized,birth_date,phone,email,created_by)
select 'a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','ALU-'||lpad(g::text,4,'0'),(array['Valentina','Mateo','Sofía','Benjamín','Camila','Lautaro'])[1+(g%6)],(array['Gómez','Fernández','López','Martínez','Romero'])[1+(g%5)],(35100000+g*12371)::text,date '1995-01-01'+(g||' days')::interval,'+54 9 11 5555-'||lpad(g::text,4,'0'),'alumno'||g||'@demo.local','10000000-0000-0000-0000-000000000002'
from generate_series(1,30) g on conflict(workspace_id,dni_normalized) do nothing;
insert into public.students(id,workspace_id,academy_id,public_code,first_name,last_name,dni_normalized,birth_date,phone,created_by)
values('a3000000-0000-0000-0000-000000000099','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','IMP-0001','Alumno','Imperio','38999999','1999-01-01','+54 9 351 555-0099','10000000-0000-0000-0000-000000000002') on conflict(workspace_id,dni_normalized) do nothing;
insert into public.students(workspace_id,academy_id,public_code,first_name,last_name,dni_normalized,birth_date,phone,created_by)
select 'b0000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','NOR-'||lpad(g::text,4,'0'),'Alumno','Norte '||g,(40100000+g)::text,date '2000-01-01','+54 9 387 555-000'||g,'20000000-0000-0000-0000-000000000001' from generate_series(1,4)g on conflict(workspace_id,dni_normalized) do nothing;

insert into public.instructor_profiles(workspace_id,academy_id,user_id,default_commission_bps) values('a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004',4000) on conflict do nothing;
insert into public.courses(id,workspace_id,academy_id,code,name,default_installments,suggested_price_cents,suggested_capacity) values
('c1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','BAR','Barbería profesional',6,42000000,8),
('c1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','COL','Colorimetría aplicada',4,34000000,12),
('c1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','GES','Gestión de salón',3,22000000,16),
('c1000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','IMP','Corte avanzado',6,50000000,8) on conflict(id) do nothing;
insert into public.cohorts(id,workspace_id,academy_id,branch_id,course_id,instructor_user_id,code,name,weekday,starts_at,ends_at,start_date,estimated_end_date,capacity,installment_count,installment_cents,due_day,commission_bps,status) values
('c2000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','BAR-26-A','Barbería Inicial A',1,'18:00','20:00','2026-03-01','2026-09-01',8,6,7000000,10,4000,'active'),
('c2000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','COL-26-B','Colorimetría B',2,'10:00','12:00','2026-04-01','2026-08-01',12,4,8500000,10,3500,'active'),
('c2000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004','GES-26-C','Gestión C',4,'19:00','21:00','2026-05-01','2026-08-01',16,3,7300000,10,3000,'active'),
('c2000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','BAR-26-D','Barbería Tarde',5,'16:00','18:00','2026-06-01','2026-12-01',8,6,7000000,10,4000,'scheduled'),
('c2000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','COL-26-E','Colorimetría E',6,'09:00','11:00','2026-05-01','2026-09-01',10,4,8500000,10,3500,'active'),
('c2000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','IMP-26-F','Corte Avanzado F',6,'14:00','16:00','2026-05-01','2026-11-01',8,6,8333333,10,4200,'active') on conflict(id) do nothing;
with ranked as(select s.*,row_number() over(order by public_code) n from public.students s where workspace_id='a0000000-0000-0000-0000-000000000001' and academy_id='a1000000-0000-0000-0000-000000000001' limit 24)
insert into public.enrollments(workspace_id,academy_id,branch_id,student_id,cohort_id,code,effective_start,status,agreed_price_cents,installment_count,created_by)
select workspace_id,academy_id,case when n%3=0 then 'a2000000-0000-0000-0000-000000000002'::uuid else 'a2000000-0000-0000-0000-000000000001'::uuid end,id,(array['c2000000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000002','c2000000-0000-0000-0000-000000000003','c2000000-0000-0000-0000-000000000004','c2000000-0000-0000-0000-000000000005'])[1+((n-1)%5)]::uuid,'ENR-'||public_code,'2026-03-01',case when n=12 then 'dropped_out' else 'attending' end,42000000,6,'10000000-0000-0000-0000-000000000002' from ranked on conflict do nothing;
insert into public.charges(workspace_id,academy_id,enrollment_id,cohort_id,student_id,type,installment_number,description,original_cents,due_date,status,commissionable)
select e.workspace_id,e.academy_id,e.id,e.cohort_id,e.student_id,'installment',g,'Cuota '||g||'/6',7000000,(date '2026-04-10'+((g-1)||' months')::interval)::date,case when g=1 then 'paid' when g=2 and e.status<>'dropped_out' then 'overdue' when e.status='dropped_out' then 'cancelled' else 'pending' end,true from public.enrollments e cross join generate_series(1,3)g on conflict do nothing;
insert into public.cash_sessions(id,workspace_id,academy_id,branch_id,opened_by,opening_cents,status) values('c4000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',2000000,'open') on conflict do nothing;
with selected as(select ch.*,row_number() over(order by ch.id)n from public.charges ch where ch.status='paid' limit 12)
insert into public.payments(workspace_id,academy_id,branch_id,student_id,effective_at,amount_cents,method,status,reference,received_by,cash_session_id,idempotency_key,confirmed_at)
select workspace_id,academy_id,'a2000000-0000-0000-0000-000000000001',student_id,now()-((n||' days')::interval),final_cents,case when n%3=0 then 'bank_transfer' else 'cash' end,case when n=11 then 'reversed' else 'confirmed' end,'REC-2026-'||lpad(n::text,5,'0'),'10000000-0000-0000-0000-000000000003',case when n%3<>0 then 'c4000000-0000-0000-0000-000000000001'::uuid end,'seed-payment-'||n,now() from selected on conflict do nothing;
insert into public.payment_allocations(workspace_id,payment_id,charge_id,amount_cents,commissionable)
select p.workspace_id,p.id,ch.id,p.amount_cents,true from public.payments p join public.charges ch on ch.student_id=p.student_id and ch.installment_number=1 where p.idempotency_key like 'seed-payment-%' on conflict do nothing;
insert into public.payments(workspace_id,academy_id,branch_id,student_id,effective_at,amount_cents,method,status,reference,received_by,idempotency_key)
select s.workspace_id,s.academy_id,'a2000000-0000-0000-0000-000000000001',s.id,now(),2500000,'bank_transfer','pending_validation','TR-PEND-001','10000000-0000-0000-0000-000000000003','seed-pending-transfer' from public.students s where s.workspace_id='a0000000-0000-0000-0000-000000000001' limit 1 on conflict do nothing;
insert into public.class_sessions(id,workspace_id,academy_id,branch_id,cohort_id,session_date,starts_at,ends_at,planned_instructor_id,status,attendance_open) values
('c3000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000001',current_date,'18:00','20:00','10000000-0000-0000-0000-000000000004','open',true),
('c3000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002','c2000000-0000-0000-0000-000000000002',current_date,'10:00','12:00','10000000-0000-0000-0000-000000000004','completed',false) on conflict do nothing;
insert into public.qr_credentials(workspace_id,academy_id,student_id,token_hash) select workspace_id,academy_id,id,encode(digest('demo-qr-'||public_code,'sha256'),'hex') from public.students on conflict(token_hash) do nothing;
insert into public.approval_requests(id,workspace_id,academy_id,branch_id,requester_id,type,entity_type,entity_id,reason) values('c7000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','capacity_override','cohort','c2000000-0000-0000-0000-000000000001','Traslado excepcional con comisión completa') on conflict(id) do nothing;
insert into public.alerts(id,workspace_id,academy_id,branch_id,severity,type,title,detail) values('c8000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','high','checkin_denied','Acceso sin inscripción','Credencial presentada sin inscripción compatible') on conflict(id) do nothing;
insert into public.settlement_periods(id,workspace_id,academy_id,period_start,period_end,status) values('c5000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','2026-07-01','2026-07-31','open') on conflict do nothing;
insert into public.instructor_settlements(id,workspace_id,academy_id,settlement_period_id,cohort_id,instructor_user_id,status,commission_bps) values('c6000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','c5000000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','open',4000) on conflict do nothing;

-- Rebrand: Grupo Fusión / Academia Fusión → Fusión Barber, y alta de Federico Borja como nuevo owner real.
-- Contraseña de Federico: FusionBarber-2026!
-- Solo local por ahora: si esto se despliega a un Supabase hosteado real, este bloque
-- NO debe correr vía `db reset` (borra todo) — ahí conviene un insert manual puntual o
-- una migración de datos aparte, no seed.sql.
update public.workspaces set name='Fusión Barber' where id='a0000000-0000-0000-0000-000000000001';
update public.academies set name='Fusión Barber' where id='a1000000-0000-0000-0000-000000000001';

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change_token_current,email_change)
values('f0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','federico@fusionbarber.com',crypt('FusionBarber-2026!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Federico Borja"}',now(),now(),'','','','','')
on conflict(id) do nothing;

insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select gen_random_uuid(),u.id,u.id::text,jsonb_build_object('sub',u.id::text,'email',u.email),'email',now(),now(),now()
from auth.users u where u.id='f0000000-0000-0000-0000-000000000001'
on conflict do nothing;

insert into public.profiles(id,full_name) values('f0000000-0000-0000-0000-000000000001','Federico Borja')
on conflict(id) do nothing;

-- Degradar a Martina antes de insertar a Federico como primary owner: el índice único parcial
-- one_primary_owner_per_workspace solo admite un is_primary_owner=true activo por workspace.
update public.workspace_memberships set is_primary_owner=false
where workspace_id='a0000000-0000-0000-0000-000000000001' and user_id='10000000-0000-0000-0000-000000000002';

insert into public.workspace_memberships(workspace_id,user_id,role,status,is_primary_owner)
values('a0000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','owner','active',true)
on conflict(workspace_id,user_id) do nothing;
