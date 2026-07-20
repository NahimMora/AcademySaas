import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/http/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function POST(request:Request){if(!isSameOrigin(request))return NextResponse.json({error:"Origen no permitido"},{status:403});const data=await request.json().catch(()=>null);const parsed=z.object({email:z.email()}).safeParse(data);if(!parsed.success)return NextResponse.json({error:"Correo inválido"},{status:400});try{const supabase=await createSupabaseServerClient();await supabase.auth.resetPasswordForEmail(parsed.data.email,{redirectTo:`${process.env.NEXT_PUBLIC_APP_URL}/reset-password`});}catch{/* respuesta no enumerable */}return NextResponse.json({ok:true,message:"Si la cuenta existe, recibirá un enlace."});}
