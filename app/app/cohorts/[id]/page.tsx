import { CohortDetail } from "@/components/app/cohort-detail";

export default async function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CohortDetail id={id} />;
}
