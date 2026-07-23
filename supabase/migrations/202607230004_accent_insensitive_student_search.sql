begin;

-- Búsqueda de nombre/apellido sin distinguir may/min ni acentos (ilike ya cubre may/min; faltaban acentos).
-- normalize() NFD + strip de marcas diacríticas evita depender de la extensión unaccent (no confirmada
-- como preinstalada en el proyecto Supabase). El rango de marcas se pasa como caracteres literales, no
-- como escape \u en el patrón: la sintaxis de regex avanzada de Postgres no soporta \uXXXX dentro de una
-- clase de caracteres (probado localmente, ERROR: invalid escape \ sequence).
create or replace function public.normalize_search_text(txt text) returns text
language sql immutable as $$
  select lower(regexp_replace(normalize(coalesce(txt,''), NFD), '[̀-ͯ]', '', 'g'))
$$;

alter table public.students add column if not exists first_name_search text generated always as (public.normalize_search_text(first_name)) stored;
alter table public.students add column if not exists last_name_search text generated always as (public.normalize_search_text(last_name)) stored;

commit;
