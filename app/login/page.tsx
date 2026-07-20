import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/demo-users";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await readSession();
  if (user) redirect(homeForRole(user.role));
  return <LoginForm />;
}
