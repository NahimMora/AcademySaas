import { ModulePage } from "@/components/app/module-page";
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) { const {slug}=await params; return <ModulePage area="platform" slug={slug}/>; }
