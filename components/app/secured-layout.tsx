import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AppShell } from "@/components/app/app-shell";

export async function SecuredLayout({ area, children }: { area: "app" | "platform" | "instructor"; children: React.ReactNode }) {
  const user = await readSession();
  if (!user) redirect("/login");
  if (area === "platform" && user.role !== "platform_superadmin") redirect("/access-denied");
  if (area === "instructor" && user.role !== "instructor") redirect("/access-denied");
  if (area === "app" && !["owner", "receptionist"].includes(user.role)) redirect("/access-denied");
  return <AppShell user={user} area={area}>{children}</AppShell>;
}
