import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;
const fullName = process.env.SUPERADMIN_NAME || "Superadmin";

if (!url || !serviceKey) throw new Error("Definí NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (proyecto hosted, no local).");
if (!email || !password) throw new Error("Definí SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD como variables de entorno antes de ejecutar.");

const admin = createClient<Database>(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true
});
if (createError) throw createError;
const userId = created.user.id;

const { error: profileError } = await admin.from("profiles").insert({ id: userId, full_name: fullName });
if (profileError) throw profileError;

const { error: adminError } = await admin.from("platform_admins").insert({ user_id: userId });
if (adminError) throw adminError;

console.log(`Superadmin creado: ${email} (${userId})`);
