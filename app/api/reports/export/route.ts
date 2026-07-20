import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { z } from "zod";
import { readSession } from "@/lib/auth/session";
import { initialDemoState } from "@/lib/demo/seed";
import { formatMoney } from "@/lib/domain/money";

const querySchema = z.object({ format: z.enum(["csv", "xlsx", "pdf"]), report: z.enum(["students", "payments", "audit"]) });
const clean = (value: unknown) => String(value ?? "").replace(/^[=+\-@]/, "'").replace(/[\r\n]+/g, " ");

export async function GET(request: Request) {
  const user = await readSession(); if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const query = Object.fromEntries(new URL(request.url).searchParams); const parsed = querySchema.safeParse(query); if (!parsed.success) return NextResponse.json({ error: "Formato o informe inválido" }, { status: 400 });
  const workspaceId = user.workspaceId ?? "ws-fusion";
  let headers: string[]; let rows: string[][];
  if (parsed.data.report === "students") { headers = ["Código", "Apellido", "Nombre", "DNI enmascarado", "Estado"]; rows = initialDemoState.students.filter(s => s.workspaceId === workspaceId).map(s => [s.publicCode, s.lastName, s.firstName, `••.${s.dni.slice(-3)}`, s.status]); }
  else if (parsed.data.report === "audit") { headers = ["Fecha", "Actor", "Acción", "Entidad", "Detalle"]; rows = initialDemoState.audit.filter(a => user.role === "platform_superadmin" || a.workspaceId === workspaceId).map(a => [a.createdAt, a.actor, a.action, a.entity, a.detail]); }
  else { headers = ["Comprobante", "Fecha", "Medio", "Importe", "Estado"]; rows = initialDemoState.payments.filter(p => p.workspaceId === workspaceId).map(p => [p.reference, p.registeredAt, p.method, formatMoney(p.amountCents), p.status]); }
  rows = rows.map(row => row.map(clean));
  const filename = `${parsed.data.report}-2026-07`;
  if (parsed.data.format === "csv") { const csv = [headers, ...rows].map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n"); return new NextResponse(`\uFEFF${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}.csv"`, "cache-control": "no-store" } }); }
  if (parsed.data.format === "xlsx") { const workbook = new ExcelJS.Workbook(); workbook.creator = "Academia SaaS"; const sheet = workbook.addWorksheet("Informe"); sheet.addRow(headers); rows.forEach(row => sheet.addRow(row)); sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0C694E" } }; sheet.columns.forEach(column => { column.width = 22; }); const buffer = await workbook.xlsx.writeBuffer(); return new NextResponse(new Uint8Array(buffer), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="${filename}.xlsx"`, "cache-control": "no-store" } }); }
  const pdf = new jsPDF(); pdf.setFillColor(12, 105, 78); pdf.rect(0, 0, 210, 35, "F"); pdf.setTextColor(255, 255, 255); pdf.setFontSize(20); pdf.text("Academia SaaS", 15, 18); pdf.setFontSize(11); pdf.text(`Informe: ${parsed.data.report} · Julio 2026`, 15, 27); pdf.setTextColor(30, 40, 35); let y = 47; pdf.setFontSize(8); pdf.text(headers.join("   |   "), 15, y); y += 7; rows.slice(0, 30).forEach(row => { pdf.text(row.join("   |   ").slice(0, 120), 15, y); y += 6; if (y > 280) { pdf.addPage(); y = 20; } }); pdf.setFontSize(8); pdf.text("Documento interno. No reemplaza documentación fiscal.", 15, 290); return new NextResponse(new Uint8Array(pdf.output("arraybuffer")), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${filename}.pdf"`, "cache-control": "no-store" } });
}
