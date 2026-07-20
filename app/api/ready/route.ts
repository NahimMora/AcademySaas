import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV !== "production";
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const ready = demo || configured;
  return NextResponse.json({ status: ready ? "ready" : "not_ready", persistence: demo ? "demo" : configured ? "supabase" : "missing" }, { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } });
}
