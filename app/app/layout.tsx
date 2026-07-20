import { SecuredLayout } from "@/components/app/secured-layout";
export default function Layout({ children }: { children: React.ReactNode }) { return <SecuredLayout area="app">{children}</SecuredLayout>; }
