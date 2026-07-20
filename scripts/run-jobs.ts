const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3300";
export {};
const secret = process.env.CRON_SECRET;
if (!secret) throw new Error("Definí CRON_SECRET antes de ejecutar jobs.");
for (const job of ["mark-overdue", "process-outbox", "generate-alerts", "consistency"]) {
  const response = await fetch(`${base}/api/cron/${job}`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
  console.log(job, response.status, await response.text());
}
