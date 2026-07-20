import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() { return NextResponse.json({ status: "ok", service: "academia-saas", version: process.env.RENDER_GIT_COMMIT?.slice(0, 8) ?? "local", timestamp: new Date().toISOString() }, { headers: { "cache-control": "no-store" } }); }
