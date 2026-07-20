import { NextResponse } from "next/server";
import { timingSafeEqualText } from "@/lib/http/request";
import { log } from "@/lib/observability/logger";

const jobs = new Set(["mark-overdue", "process-outbox", "generate-alerts", "monthly-report", "consistency"]);
export async function POST(request: Request, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params; const secret = process.env.CRON_SECRET ?? ""; const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !timingSafeEqualText(secret, provided)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!jobs.has(job)) return NextResponse.json({ error: "Job inexistente" }, { status: 404 });
  const runId = crypto.randomUUID(); log("info", "job.started", { job, runId });
  return NextResponse.json({ ok: true, job, runId, mode: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "dry-run" : "queued", startedAt: new Date().toISOString() });
}
