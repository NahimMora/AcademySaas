import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/demo-users";
export default async function SelectContext() { const user = await readSession(); if (!user) redirect("/login"); redirect(homeForRole(user.role)); }
