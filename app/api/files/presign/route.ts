import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createPrivateUpload, uploadRequestSchema } from "@/lib/storage/r2";
import { isSameOrigin } from "@/lib/http/request";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const user = await readSession(); if (!user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Archivo inválido", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.workspaceId !== user.workspaceId || (user.academyId && parsed.data.academyId !== user.academyId && user.role !== "owner")) return NextResponse.json({ error: "Alcance inválido" }, { status: 403 });
  try { return NextResponse.json(await createPrivateUpload(parsed.data)); } catch { return NextResponse.json({ error: "Almacenamiento privado no configurado" }, { status: 503 }); }
}
