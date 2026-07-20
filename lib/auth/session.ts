import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/lib/domain/types";

const cookieName = "academia_session";
const secret = new TextEncoder().encode(process.env.APP_ENCRYPTION_KEY || "local-development-key-change-me-32");

export async function issueSession(user: SessionUser) {
  return new SignJWT({ user }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret);
}

export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (token) try {
    const { payload } = await jwtVerify(token, secret);
    return payload.user as SessionUser;
  } catch { /* intentar sesión Supabase */ }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server"); const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;
    const [{data:profile},{data:admin},{data:membership}]=await Promise.all([supabase.from("profiles").select("full_name").eq("id",user.id).maybeSingle(),supabase.from("platform_admins").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle(),supabase.from("workspace_memberships").select("workspace_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle()]);
    if(admin)return{id:user.id,name:profile?.full_name??user.email??"Administrador",email:user.email??"",role:"platform_superadmin"};if(!membership)return null;return{id:user.id,name:profile?.full_name??user.email??"Usuario",email:user.email??"",role:membership.role as SessionUser["role"],workspaceId:membership.workspace_id};
  }catch{return null;}
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(cookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
}

export async function clearSessionCookie() { (await cookies()).delete(cookieName); }
