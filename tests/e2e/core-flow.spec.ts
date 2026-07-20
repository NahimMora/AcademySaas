import { test, expect } from "@playwright/test";

test("owner recorre alumno, pago, QR y liquidación", async ({ page }) => {
  await page.goto("/login"); await page.getByLabel("Correo electrónico").fill("owner@demo.local"); await page.getByLabel("Contraseña").fill("Demo-3300!"); await page.getByRole("button", { name: /Ingresar/ }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/); await expect(page.getByRole("heading", { name: /Resumen de Academia Fusión/ })).toBeVisible();
  await page.goto("/app/students"); await page.getByRole("button", { name: "Nuevo alumno" }).click(); await page.getByLabel("Nombre").fill("Ada"); await page.getByLabel("Apellido").fill("Lovelace"); await page.getByLabel("DNI").fill("45123456"); await page.getByLabel("Fecha de nacimiento").fill("2000-01-01"); await page.getByLabel("Teléfono").fill("+54 9 11 5555-0000"); await page.getByRole("button", { name: "Crear legajo" }).click(); await expect(page.getByText(/Ada fue dado de alta/)).toBeVisible();
  await page.goto("/app/payments"); await page.getByRole("button", { name: "Registrar pago" }).click(); await page.getByLabel("Importe ARS").fill("10000"); await page.getByRole("button", { name: "Registrar", exact: true }).click(); await expect(page.getByText(/registrado y confirmado/)).toBeVisible();
  await page.goto("/app/check-in"); await page.getByRole("button", { name: "Probar verde" }).click(); await page.getByRole("button", { name: "Validar" }).click(); await expect(page.getByText("Acceso autorizado")).toBeVisible();
  await page.goto("/app/settlements"); await expect(page.getByText("Base comisionable")).toBeVisible();
  const report = await page.request.get("/api/reports/export?format=xlsx&report=payments"); expect(report.ok()).toBeTruthy(); expect(report.headers()["content-type"]).toContain("spreadsheetml"); expect((await report.body()).byteLength).toBeGreaterThan(1000);
});

test("profesor no ve módulos financieros de owner", async ({ page }) => {
  await page.goto("/login"); await page.getByLabel("Correo electrónico").fill("profesor@demo.local"); await page.getByLabel("Contraseña").fill("Demo-3300!"); await page.getByRole("button", { name: /Ingresar/ }).click(); await expect(page).toHaveURL(/\/instructor\/dashboard/); await page.goto("/app/payments"); await expect(page).toHaveURL(/access-denied/);
});
