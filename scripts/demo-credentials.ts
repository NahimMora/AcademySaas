const password = process.env.DEMO_PASSWORD || "Demo-3300!";
console.log("Cuentas demo locales (no usar en producción):");
for (const [role, email] of [["Superadmin", "superadmin@demo.local"], ["Propietaria", "owner@demo.local"], ["Recepción", "recepcion@demo.local"], ["Profesor", "profesor@demo.local"]] as const) console.log(`${role.padEnd(12)} ${email.padEnd(28)} ${password}`);
