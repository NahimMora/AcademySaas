import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/request";
import { verifyPrivateUpload } from "@/lib/storage/r2";
const schema=z.object({key:z.string().min(20).max(500),mime:z.enum(["image/jpeg","image/png","application/pdf"])});
export async function POST(request:Request){if(!isSameOrigin(request))return NextResponse.json({error:"Origen no permitido"},{status:403});const user=await readSession();if(!user?.workspaceId)return NextResponse.json({error:"No autorizado"},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Solicitud inválida"},{status:400});try{return NextResponse.json(await verifyPrivateUpload(parsed.data.key,parsed.data.mime,user.workspaceId));}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo verificar el archivo"},{status:422});}}
