import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/demo-users";
const schema=z.object({email:z.email(),password:z.string().min(8)});
export async function POST(request:Request){if(!isSameOrigin(request))return NextResponse.json({error:"Origen no permitido"},{status:403});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Revisá el correo y la contraseña."},{status:400});try{const supabase=await createSupabaseServerClient();const{error}=await supabase.auth.signInWithPassword(parsed.data);if(error)return NextResponse.json({error:"Credenciales incorrectas."},{status:401});const session=await readSession();if(!session){await supabase.auth.signOut();return NextResponse.json({error:"La cuenta no tiene una membresía activa."},{status:403});}return NextResponse.json({ok:true,redirect:homeForRole(session.role)});}catch{return NextResponse.json({error:"El servicio de autenticación no está disponible."},{status:503});}}
