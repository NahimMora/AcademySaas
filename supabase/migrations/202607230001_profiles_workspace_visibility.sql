begin;

-- profiles_self_select (202607120002) solo permite leer la propia fila (id=auth.uid()). Eso rompe
-- silenciosamente cualquier lookup de nombre de OTRO usuario del mismo workspace (profesor en
-- Comisiones/Clases/Profesores, receptionist/owner en otras vistas): RLS no da error, simplemente
-- devuelve cero filas para esos ids, y el nombre queda vacío en la UI. Se agrega una política SELECT
-- adicional (las políticas del mismo comando se combinan con OR) que permite leer el perfil de
-- cualquier usuario con membresía activa en un workspace donde el que consulta también la tiene.
create policy profiles_workspace_select on public.profiles for select
  using (
    exists (
      select 1 from public.workspace_memberships m1
      join public.workspace_memberships m2 on m2.workspace_id = m1.workspace_id
      where m1.user_id = auth.uid() and m1.status = 'active' and m2.user_id = profiles.id and m2.status = 'active'
    )
  );

commit;
