import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) { try { const { createSupabaseServerClient }=await import("@/lib/supabase/server");await (await createSupabaseServerClient()).auth.signOut(); } catch { /* cerrar cookie local igualmente */ } }
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
