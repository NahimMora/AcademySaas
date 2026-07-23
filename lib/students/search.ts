import type { SupabaseClient } from "@supabase/supabase-js";

// Espeja normalize_search_text() del lado SQL (202607230004_accent_insensitive_student_search.sql):
// minúsculas + NFD + strip de marcas diacríticas, para que el término de búsqueda calce contra las
// columnas generadas first_name_search/last_name_search sin importar acentos ni mayúsculas.
export function normalizeSearchText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Resuelve un término de búsqueda libre a ids de alumno para poder filtrar
// tablas que no tienen columnas de nombre/DNI propias (cuotas, pagos, inscripciones).
// Devuelve null si no hay término (sin filtrar), o el array de ids que matchean (posiblemente vacío).
export async function resolveMatchingStudentIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>, workspaceId: string, academyId: string, q: string | undefined
): Promise<string[] | null> {
  if (!q) return null;
  const term = q.replace(/[%,]/g, "").trim();
  if (!term) return null;
  const normalized = normalizeSearchText(term);
  const { data } = await supabase.from("students").select("id")
    .eq("workspace_id", workspaceId).eq("academy_id", academyId)
    .or(`first_name_search.ilike.%${normalized}%,last_name_search.ilike.%${normalized}%,dni_normalized.ilike.%${term}%,public_code.ilike.%${term}%`);
  return (data ?? []).map((row) => row.id);
}
