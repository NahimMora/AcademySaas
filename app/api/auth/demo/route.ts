import { NextResponse } from "next/server";
import { z } from "zod";
import { demoUsers, homeForRole } from "@/lib/auth/demo-users";
import { issueSession, setSessionCookie } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/http/request";

const schema = z.object({ email: z.email(), password: z.string().min(8) });
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return NextResponse.json({ error: "Modo demo deshabilitado" }, { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const current = attempts.get(ip);
  if (current && current.resetAt > Date.now() && current.count >= 8) return NextResponse.json({ error: "Demasiados intentos. Esperá unos minutos." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá el correo y la contraseña." }, { status: 400 });
  const user = demoUsers.find((candidate) => candidate.email === parsed.data.email.toLowerCase());
  const password = process.env.DEMO_PASSWORD || "Demo-3300!";
  if (!user || parsed.data.password !== password) {
    attempts.set(ip, { count: (current?.count ?? 0) + 1, resetAt: Date.now() + 10 * 60_000 });
    return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
  }
  attempts.delete(ip);
  await setSessionCookie(await issueSession(user));
  return NextResponse.json({ ok: true, redirect: homeForRole(user.role) });
}
